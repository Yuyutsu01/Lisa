"""add google oauth columns to users table

Revision ID: b2c4e6a8d0f1
Revises: a4c32a583bcf
Create Date: 2026-09-15 23:55:00.000000

NOTE ON DOWNGRADE:
The downgrade step restores NOT NULL on users.password_hash.
If any OAuth-only users (with NULL password_hash) exist at downgrade time,
the downgrade will fail unless those rows are removed or assigned a password hash.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c4e6a8d0f1"
down_revision: Union[str, None] = "a4c32a583bcf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to support OAuth-only accounts and Google identifiers."""
    # 1. Make password_hash nullable for OAuth-only users
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=True,
    )

    # 2. Add google_id column
    op.add_column(
        "users",
        sa.Column("google_id", sa.String(length=255), nullable=True),
    )

    # 3. Add auth_provider column with server default 'local' for existing users
    op.add_column(
        "users",
        sa.Column(
            "auth_provider",
            sa.String(length=50),
            nullable=False,
            server_default="local",
        ),
    )

    # 4. Create unique constraint and index on google_id
    op.create_unique_constraint("uq_users_google_id", "users", ["google_id"])
    op.create_index("ix_users_google_id", "users", ["google_id"])


def downgrade() -> None:
    """Revert OAuth schema additions."""
    # 1. Drop index and unique constraint
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_constraint("uq_users_google_id", table_name="users", type_="unique")

    # 2. Drop added columns
    op.drop_column("users", "auth_provider")
    op.drop_column("users", "google_id")

    # 3. Restore NOT NULL on password_hash
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=False,
    )
