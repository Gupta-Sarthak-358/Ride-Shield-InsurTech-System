"""add system status table

Revision ID: b1e4a9d5c2f1
Revises: 96cb1f518f0f
Create Date: 2026-04-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "b1e4a9d5c2f1"
down_revision = "96cb1f518f0f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "system_status",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("key"),
    )


def downgrade() -> None:
    op.drop_table("system_status")
