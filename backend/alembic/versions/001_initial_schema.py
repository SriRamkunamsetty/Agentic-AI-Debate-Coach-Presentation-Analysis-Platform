"""Initial complete database schema for LOGOS.AI.

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-11 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Schema tables are managed via models.py metadata
    pass


def downgrade() -> None:
    pass
