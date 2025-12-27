from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime

from ..database import get_db
from ..models import Registration, Teacher, RegistrationStatus
from ..schemas import (
    RegistrationCreate,
    RegistrationResponse,
    RegistrationUpdate,
    MessageResponse,
    AssignTeacherRequest
)
from ..services.email_service import email_service

router = APIRouter()


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_registration(
    registration: RegistrationCreate,
    db: Session = Depends(get_db)
):
    """Create a new student registration"""
    
    # Create registration
    db_registration = Registration(
        id=str(uuid.uuid4()),
        student_name=registration.student_name,
        student_age=registration.student_age,
        grade=registration.grade,
        parent_name=registration.parent_name,
        email=registration.email,
        phone=registration.phone,
        preferred_time=registration.preferred_time,
        experience_level=registration.experience_level,
        interests=registration.interests,
        additional_notes=registration.additional_notes,
        status=RegistrationStatus.PENDING
    )
    
    db.add(db_registration)
    db.commit()
    db.refresh(db_registration)
    
    # Send confirmation email
    email_service.send_registration_confirmation(
        to_email=registration.email,
        student_name=registration.student_name,
        parent_name=registration.parent_name
    )
    
    return MessageResponse(
        message="Registration created successfully",
        id=db_registration.id
    )


@router.get("", response_model=List[RegistrationResponse])
async def get_registrations(
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all registrations with optional filters"""
    
    query = db.query(Registration)
    
    if status:
        query = query.filter(Registration.status == status)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Registration.student_name.ilike(search_filter)) |
            (Registration.parent_name.ilike(search_filter)) |
            (Registration.email.ilike(search_filter))
        )
    
    registrations = query.offset(skip).limit(limit).all()
    
    # Add teacher name to response
    result = []
    for reg in registrations:
        reg_dict = {
            "id": reg.id,
            "student_name": reg.student_name,
            "student_age": reg.student_age,
            "grade": reg.grade,
            "parent_name": reg.parent_name,
            "email": reg.email,
            "phone": reg.phone,
            "preferred_time": reg.preferred_time,
            "experience_level": reg.experience_level.value if reg.experience_level else None,
            "interests": reg.interests,
            "additional_notes": reg.additional_notes,
            "status": reg.status.value,
            "teacher_id": reg.teacher_id,
            "teacher_name": reg.teacher.name if reg.teacher else None,
            "demo_link": reg.demo_link,
            "demo_scheduled_at": reg.demo_scheduled_at,
            "created_at": reg.created_at,
            "updated_at": reg.updated_at
        }
        result.append(RegistrationResponse(**reg_dict))
    
    return result


@router.get("/{registration_id}", response_model=RegistrationResponse)
async def get_registration(
    registration_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific registration by ID"""
    
    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return RegistrationResponse(
        id=registration.id,
        student_name=registration.student_name,
        student_age=registration.student_age,
        grade=registration.grade,
        parent_name=registration.parent_name,
        email=registration.email,
        phone=registration.phone,
        preferred_time=registration.preferred_time,
        experience_level=registration.experience_level.value if registration.experience_level else None,
        interests=registration.interests,
        additional_notes=registration.additional_notes,
        status=registration.status.value,
        teacher_id=registration.teacher_id,
        teacher_name=registration.teacher.name if registration.teacher else None,
        demo_link=registration.demo_link,
        demo_scheduled_at=registration.demo_scheduled_at,
        created_at=registration.created_at,
        updated_at=registration.updated_at
    )


@router.put("/{registration_id}", response_model=MessageResponse)
async def update_registration(
    registration_id: str,
    registration_update: RegistrationUpdate,
    db: Session = Depends(get_db)
):
    """Update a registration"""
    
    db_registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not db_registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    update_data = registration_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_registration, field, value)
    
    db.commit()
    
    return MessageResponse(message="Registration updated successfully", id=registration_id)


@router.post("/{registration_id}/assign", response_model=MessageResponse)
async def assign_teacher(
    registration_id: str,
    request: AssignTeacherRequest,
    db: Session = Depends(get_db)
):
    """Assign a teacher to a registration"""
    
    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    teacher = db.query(Teacher).filter(Teacher.id == request.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    registration.teacher_id = request.teacher_id
    registration.status = RegistrationStatus.TEACHER_ASSIGNED
    
    db.commit()
    
    return MessageResponse(
        message="Teacher assigned successfully",
        id=registration_id
    )


@router.post("/{registration_id}/send-link", response_model=MessageResponse)
async def send_demo_link(
    registration_id: str,
    db: Session = Depends(get_db)
):
    """Send demo class link to parent"""
    
    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    if not registration.teacher:
        raise HTTPException(status_code=400, detail="No teacher assigned yet")
    
    # Generate demo link (in production, this would be a real video conference link)
    demo_link = f"https://meet.ashishpatelatelier.com/demo/{registration.id}"
    registration.demo_link = demo_link
    registration.status = RegistrationStatus.LINK_SENT
    registration.demo_scheduled_at = datetime.utcnow()
    
    # Send email with demo link
    email_service.send_teacher_assignment_notification(
        to_email=registration.email,
        student_name=registration.student_name,
        parent_name=registration.parent_name,
        teacher_name=registration.teacher.name,
        demo_link=demo_link
    )
    
    db.commit()
    
    return MessageResponse(
        message="Demo link sent successfully",
        id=registration_id
    )
