"""
Trigger engine for disruption monitoring and affected worker discovery.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, List, Tuple

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.config import settings
from backend.db.models import AuditLog, Event, Worker
from simulations.aqi_mock import aqi_simulator
from simulations.platform_mock import platform_simulator
from simulations.traffic_mock import traffic_simulator
from simulations.weather_mock import weather_simulator


def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class TriggerEngine:
    """Fetches signals, evaluates thresholds, creates events, and finds workers."""

    THRESHOLDS = {
        "rain": {"field": "rainfall_mm_hr", "threshold": settings.RAIN_THRESHOLD_MM, "weight": 0.20, "source": "openweather"},
        "heat": {"field": "temperature_c", "threshold": settings.HEAT_THRESHOLD_C, "weight": 0.15, "source": "openweather"},
        "aqi": {"field": "aqi_value", "threshold": settings.AQI_THRESHOLD, "weight": 0.15, "source": "waqi"},
        "traffic": {"field": "congestion_index", "threshold": settings.TRAFFIC_THRESHOLD, "weight": 0.15, "source": "tomtom"},
        "platform_outage": {"field": "order_density_drop", "threshold": settings.PLATFORM_OUTAGE_THRESHOLD, "weight": 0.20, "source": "platform_sim"},
        "social": {"field": "normalized_inactivity", "threshold": settings.SOCIAL_INACTIVITY_THRESHOLD, "weight": 0.15, "source": "behavioral"},
    }

    async def fetch_all_signals(self, zone: str, city: str = "delhi") -> Dict:
        weather = weather_simulator.get_weather(zone)
        aqi = aqi_simulator.get_aqi(zone, city)
        traffic = traffic_simulator.get_traffic(zone)
        platform = platform_simulator.get_platform_status(zone)
        social_signal = self._calculate_social_signal(weather, traffic, platform)

        return {
            "rain": weather.get("rainfall_mm_hr", 0),
            "heat": weather.get("temperature_c", 0),
            "aqi": aqi.get("aqi_value", 0),
            "traffic": traffic.get("congestion_index", 0),
            "platform_outage": platform.get("order_density_drop", 0),
            "social": social_signal,
            "raw_data": {"weather": weather, "aqi": aqi, "traffic": traffic, "platform": platform},
        }

    def _calculate_social_signal(self, weather: Dict, traffic: Dict, platform: Dict) -> float:
        """
        Approximate a civic-disruption signal from behavioral collapse.
        Phase 2 keeps this rule-based; Phase 3 can replace it with a proper activity baseline.
        """
        platform_drop = float(platform.get("order_density_drop", 0) or 0)
        traffic_congestion = float(traffic.get("congestion_index", 0) or 0)
        weather_scenario = weather.get("scenario")
        platform_scenario = platform.get("scenario")

        if platform_scenario == "platform_outage" and platform_drop >= settings.SOCIAL_INACTIVITY_THRESHOLD:
            return round(min(1.0, platform_drop + (0.1 if traffic_congestion >= settings.TRAFFIC_THRESHOLD else 0.0)), 2)

        if weather_scenario == "monsoon" and platform_drop >= 0.5:
            return round(min(1.0, platform_drop), 2)

        return 0.0

    def evaluate_thresholds(self, signals: Dict) -> List[str]:
        return [
            trigger_type
            for trigger_type, config in self.THRESHOLDS.items()
            if isinstance(signals.get(trigger_type, 0), (int, float))
            and signals.get(trigger_type, 0) >= config["threshold"]
        ]

    def calculate_disruption_score(self, signals: Dict) -> float:
        score = 0.0
        for trigger_type, config in self.THRESHOLDS.items():
            raw = signals.get(trigger_type, 0)
            if not isinstance(raw, (int, float)):
                continue
            threshold = config["threshold"]
            normalized = 0.0 if threshold == 0 else max(0.0, min(1.0, (raw - threshold * 0.5) / threshold))
            score += config["weight"] * normalized
        return round(min(1.0, score), 3)

    def calculate_event_confidence(self, signals: Dict, fired_triggers: List[str], zone: str) -> float:
        api_score = min(1.0, len(fired_triggers) / 3)
        platform_drop = signals.get("platform_outage", 0)
        behavioral_score = min(1.0, platform_drop / 0.5) if platform_drop > 0.2 else 0.3
        return round((0.50 * api_score) + (0.30 * behavioral_score) + (0.20 * 0.7), 3)

    def calculate_severity(self, signals: Dict, fired_triggers: List[str]) -> float:
        if not fired_triggers:
            return 0.0
        severities = []
        for trigger in fired_triggers:
            value = signals.get(trigger, 0)
            threshold = self.THRESHOLDS[trigger]["threshold"]
            if threshold > 0:
                severities.append(min(2.0, value / threshold))
        return round(sum(severities) / len(severities), 3) if severities else 0.0

    async def get_or_create_event(
        self,
        db: AsyncSession,
        zone: str,
        city: str,
        fired_triggers: List[str],
        signals: Dict,
        disruption_score: float,
        event_confidence: float,
    ) -> Tuple[List[Event], int, int]:
        events: List[Event] = []
        created = 0
        extended = 0
        now = utc_now_naive()
        hour_start = now.replace(minute=0, second=0, microsecond=0)

        for trigger_type in fired_triggers:
            config = self.THRESHOLDS[trigger_type]
            raw_value = signals.get(trigger_type, 0)
            severity = self.calculate_severity(signals, [trigger_type])

            existing = (
                await db.execute(
                    select(Event).where(
                        and_(
                            Event.event_type == trigger_type,
                            Event.zone == zone,
                            Event.status == "active",
                            Event.started_at >= hour_start,
                        )
                    )
                )
            ).scalar_one_or_none()

            if existing:
                existing.severity = Decimal(str(max(float(existing.severity or 0), severity)))
                existing.raw_value = Decimal(str(raw_value))
                existing.disruption_score = Decimal(str(disruption_score))
                existing.event_confidence = Decimal(str(event_confidence))
                existing.updated_at = now
                existing.metadata_json = {**(existing.metadata_json or {}), "last_update": now.isoformat()}
                events.append(existing)
                extended += 1
                continue

            event = Event(
                event_type=trigger_type,
                zone=zone,
                city=city,
                started_at=now,
                severity=Decimal(str(severity)),
                raw_value=Decimal(str(raw_value)),
                threshold=Decimal(str(config["threshold"])),
                disruption_score=Decimal(str(disruption_score)),
                event_confidence=Decimal(str(event_confidence)),
                api_source=config["source"],
                status="active",
                metadata_json={
                    "signals_snapshot": {k: v for k, v in signals.items() if k != "raw_data" and isinstance(v, (int, float))},
                    "fired_triggers": fired_triggers,
                    "created_by": "trigger_engine",
                },
            )
            db.add(event)
            await db.flush()
            db.add(
                AuditLog(
                    entity_type="event",
                    entity_id=event.id,
                    action="created",
                    details={
                        "event_type": trigger_type,
                        "zone": zone,
                        "raw_value": raw_value,
                        "threshold": config["threshold"],
                        "disruption_score": disruption_score,
                        "event_confidence": event_confidence,
                    },
                )
            )
            events.append(event)
            created += 1

        return events, created, extended

    async def find_affected_workers(self, db: AsyncSession, zone: str, fired_triggers: List[str]) -> List[Dict]:
        now = utc_now_naive()
        workers = (
            await db.execute(
                select(Worker)
                .options(selectinload(Worker.policies), selectinload(Worker.trust_score), selectinload(Worker.claims))
                .where(and_(Worker.zone == zone, Worker.status == "active"))
            )
        ).scalars().all()

        affected = []
        for worker in workers:
            active_policy = None
            for policy in worker.policies:
                if policy.status == "active" and policy.activates_at <= now <= policy.expires_at:
                    active_policy = policy
                    break
            if not active_policy:
                for policy in worker.policies:
                    if policy.status == "pending" and policy.activates_at <= now <= policy.expires_at:
                        policy.status = "active"
                        active_policy = policy
                        break
            if not active_policy:
                continue
            covered_triggers = [t for t in fired_triggers if t in active_policy.triggers_covered]
            if not covered_triggers:
                continue
            affected.append(
                {
                    "worker": worker,
                    "policy": active_policy,
                    "covered_triggers": covered_triggers,
                    "trust_score": float(worker.trust_score.score) if worker.trust_score else 0.1,
                }
            )
        return affected

    async def end_stale_events(self, db: AsyncSession, max_age_hours: int = 6) -> int:
        cutoff = utc_now_naive() - timedelta(hours=max_age_hours)
        stale_events = (
            await db.execute(select(Event).where(and_(Event.status == "active", Event.updated_at < cutoff)))
        ).scalars().all()
        for event in stale_events:
            event.status = "ended"
            event.ended_at = utc_now_naive()
        return len(stale_events)


trigger_engine = TriggerEngine()
