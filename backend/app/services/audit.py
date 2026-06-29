from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    action: str,
    details: str | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
    user_email: str | None = None,
):
    log = AuditLog(
        user_email=user_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(log)
    db.commit()
