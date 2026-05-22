"""Create initial Toon2Film schema.

Revision ID: 20260517_0001
Revises:
Create Date: 2026-05-17
"""

from __future__ import annotations

from alembic import op

from app.db.base import Base
from app.models import *  # noqa: F401,F403

revision = "20260517_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
