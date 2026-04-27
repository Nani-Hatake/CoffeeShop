"""Lightweight audit logging — call from any admin/owner router after a mutation.

The log is owner-readable through `/api/owner/audit-logs`.
"""
from typing import Optional

from sqlalchemy.orm import Session

from .models import AuditLog, User


def log_action(
    db: Session,
    actor: Optional[User],
    action: str,
    *,
    target_type: Optional[str] = None,
    target_id: Optional[str | int] = None,
    summary: Optional[str] = None,
) -> None:
    """Append a row to the audit log. Best-effort — never raises."""
    try:
        entry = AuditLog(
            actor_id=actor.id if actor else None,
            actor_email=actor.email if actor else None,
            actor_role=actor.role if actor else None,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            summary=summary,
        )
        db.add(entry)
        # Caller is expected to commit alongside their mutation. Do not commit here.
    except Exception:
        # Logging must never break the surrounding business action.
        pass
