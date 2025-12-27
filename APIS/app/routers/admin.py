from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Registration, Teacher, RegistrationStatus
from ..schemas import StatsResponse
from ..auth import require_admin

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Get dashboard statistics (Admin only)"""
    
    total_registrations = db.query(func.count(Registration.id)).scalar()
    
    pending_assignments = db.query(func.count(Registration.id)).filter(
        Registration.status == RegistrationStatus.PENDING
    ).scalar()
    
    # Count registrations that have a teacher assigned (any status after assignment)
    teachers_assigned = db.query(func.count(Registration.id)).filter(
        Registration.teacher_id.isnot(None)
    ).scalar()
    
    completed_demos = db.query(func.count(Registration.id)).filter(
        Registration.status == RegistrationStatus.COMPLETED
    ).scalar()
    
    return StatsResponse(
        total_registrations=total_registrations,
        pending_assignments=pending_assignments,
        teachers_assigned=teachers_assigned,
        completed_demos=completed_demos
    )
