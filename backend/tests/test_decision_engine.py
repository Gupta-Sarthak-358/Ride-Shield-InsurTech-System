"""
Tests for Sprint 2 decision engine.
"""

from backend.core.decision_engine import decision_engine


def test_high_score_is_approved():
    result = decision_engine.decide(
        disruption_score=0.9,
        event_confidence=0.9,
        fraud_result={"adjusted_fraud_score": 0.1, "raw_fraud_score": 0.1, "flags": [], "is_suspicious": False, "is_high_risk": False},
        trust_score=0.8,
    )
    assert result["decision"] == "approved"


def test_mid_score_is_delayed():
    result = decision_engine.decide(
        disruption_score=0.5,
        event_confidence=0.6,
        fraud_result={"adjusted_fraud_score": 0.35, "raw_fraud_score": 0.45, "flags": ["movement"], "is_suspicious": True, "is_high_risk": False},
        trust_score=0.2,
    )
    assert result["decision"] == "delayed"


def test_trusted_low_fraud_profile_is_approved_even_below_primary_score_threshold():
    result = decision_engine.decide(
        disruption_score=0.374,
        event_confidence=0.773,
        fraud_result={
            "adjusted_fraud_score": 0.138,
            "raw_fraud_score": 0.304,
            "flags": ["movement", "pre_activity"],
            "is_suspicious": False,
            "is_high_risk": False,
        },
        trust_score=0.83,
    )
    assert result["decision"] == "approved"
    assert result["inputs"]["trusted_low_risk_approve"] is True


def test_low_trust_profile_with_same_band_stays_manual_review():
    result = decision_engine.decide(
        disruption_score=0.374,
        event_confidence=0.773,
        fraud_result={
            "adjusted_fraud_score": 0.138,
            "raw_fraud_score": 0.304,
            "flags": ["movement", "pre_activity"],
            "is_suspicious": False,
            "is_high_risk": False,
        },
        trust_score=0.15,
    )
    assert result["decision"] == "delayed"
    assert result["inputs"]["trusted_low_risk_approve"] is False


def test_hard_review_flags_do_not_use_trusted_low_risk_fast_path():
    result = decision_engine.decide(
        disruption_score=0.45,
        event_confidence=0.78,
        fraud_result={
            "adjusted_fraud_score": 0.17,
            "raw_fraud_score": 0.28,
            "flags": ["movement", "timing"],
            "is_suspicious": False,
            "is_high_risk": False,
        },
        trust_score=0.82,
    )
    assert result["decision"] == "delayed"
    assert result["inputs"]["trusted_low_risk_approve"] is False


def test_low_score_is_rejected():
    result = decision_engine.decide(
        disruption_score=0.2,
        event_confidence=0.4,
        fraud_result={"adjusted_fraud_score": 0.8, "raw_fraud_score": 0.9, "flags": ["cluster"], "is_suspicious": True, "is_high_risk": True},
        trust_score=0.1,
    )
    assert result["decision"] == "rejected"
