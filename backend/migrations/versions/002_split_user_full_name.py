"""Split users.full_name into dedicated name fields.

Revision ID: 002_split_user_full_name
Revises: 001_initial
Create Date: 2026-03-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_split_user_full_name"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("middle_name", sa.String(length=100), nullable=True))

    op.execute(
        """
        WITH normalized AS (
          SELECT
            id,
            regexp_replace(trim(full_name), '\\s+', ' ', 'g') AS normalized_full_name
          FROM users
        )
        UPDATE users u
        SET
          last_name = NULLIF(split_part(n.normalized_full_name, ' ', 1), ''),
          first_name = NULLIF(split_part(n.normalized_full_name, ' ', 2), ''),
          middle_name = NULLIF(
            btrim(
              substring(
                n.normalized_full_name
                FROM '^[^ ]+\\s+[^ ]+\\s*(.*)$'
              )
            ),
            ''
          )
        FROM normalized n
        WHERE u.id = n.id;
        """
    )

    # Fallback for records where reliable parsing is impossible
    # (for example, one-word legacy full_name values).
    op.execute(
        """
        UPDATE users
        SET
          last_name = COALESCE(last_name, NULLIF(trim(full_name), ''), 'Unknown'),
          first_name = COALESCE(first_name, 'Unknown')
        WHERE last_name IS NULL OR first_name IS NULL;
        """
    )

    op.alter_column("users", "first_name", existing_type=sa.String(length=100), nullable=False)
    op.alter_column("users", "last_name", existing_type=sa.String(length=100), nullable=False)


def downgrade() -> None:
    op.drop_column("users", "middle_name")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
