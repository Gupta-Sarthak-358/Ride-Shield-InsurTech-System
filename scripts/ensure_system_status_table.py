"""Ensure the system_status table exists for Railway deployments.

This script is intentionally idempotent so it can be used as a deploy hook
when the target database schema has drifted from the repo's Alembic lineage.
"""

from __future__ import annotations

import os

from sqlalchemy import create_engine, text


def resolve_database_url() -> str:
    sync_url = os.getenv("DATABASE_URL_SYNC")
    if sync_url:
        return sync_url

    async_url = os.getenv("DATABASE_URL")
    if not async_url:
        raise RuntimeError("DATABASE_URL_SYNC or DATABASE_URL must be set.")

    return (
        async_url.replace("postgresql+asyncpg://", "postgresql://")
        .replace("postgres+asyncpg://", "postgresql://")
    )


def main() -> None:
    engine = create_engine(resolve_database_url(), future=True)

    create_table_sql = text(
        """
        CREATE TABLE IF NOT EXISTS system_status (
            key VARCHAR(100) PRIMARY KEY,
            value JSONB NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        """
    )
    create_index_sql = text(
        """
        CREATE INDEX IF NOT EXISTS idx_system_status_updated_at
        ON system_status (updated_at);
        """
    )
    seed_row_sql = text(
        """
        INSERT INTO system_status (key, value, updated_at)
        VALUES (
            'scheduler_state',
            '{"enabled": false, "running": false, "run_count": 0, "last_started_at": null, "last_finished_at": null, "next_scheduled_at": null, "last_result": null, "last_error": null, "interval_seconds": null, "configured_interval_seconds": null, "status": "unknown", "duration_ms": null, "error": null}'::jsonb,
            NOW()
        )
        ON CONFLICT (key) DO NOTHING;
        """
    )

    with engine.begin() as connection:
        connection.execute(create_table_sql)
        connection.execute(create_index_sql)
        connection.execute(seed_row_sql)

    print("system_status ensured")


if __name__ == "__main__":
    main()
