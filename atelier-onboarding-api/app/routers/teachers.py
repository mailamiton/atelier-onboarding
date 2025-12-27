from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import Teacher
from ..schemas import TeacherCreate, TeacherResponse, TeacherUpdate, MessageResponse
from ..auth import require_admin

router = APIRouter()


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    teacher: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new teacher (Admin only)"""
    
    # Check if email already exists
    existing = db.query(Teacher).filter(Teacher.email == teacher.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Teacher with this email already exists")
    
    db_teacher = Teacher(
        id=str(uuid.uuid4()),
        name=teacher.name,
        email=teacher.email,
        phone=teacher.phone,
        specialization=teacher.specialization,
        bio=teacher.bio,
        experience_years=teacher.experience_years,
        availability=teacher.availability
    )
    
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    
    return MessageResponse(
        message="Teacher created successfully",
        id=db_teacher.id
    )


@router.get("", response_model=List[TeacherResponse])
async def get_teachers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all teachers"""
    
    teachers = db.query(Teacher).offset(skip).limit(limit).all()
    return teachers


@router.get("/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(
    teacher_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific teacher by ID"""
    
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    return teacher


@router.put("/{teacher_id}", response_model=MessageResponse)
async def update_teacher(
    teacher_id: str,
    teacher_update: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Update a teacher (Admin only)"""
    
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    update_data = teacher_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_teacher, field, value)
    
    db.commit()
    
    return MessageResponse(message="Teacher updated successfully", id=teacher_id)


@router.delete("/{teacher_id}", response_model=MessageResponse)
async def delete_teacher(
    teacher_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Delete a teacher (Admin only)"""
    
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    db.delete(db_teacher)
    db.commit()
    
    return MessageResponse(message="Teacher deleted successfully", id=teacher_id)
