from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ExperienceLevelEnum(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class RegistrationStatusEnum(str, Enum):
    pending = "pending"
    teacher_assigned = "teacher_assigned"
    link_sent = "link_sent"
    completed = "completed"


class RegistrationCreate(BaseModel):
    student_name: str = Field(..., min_length=2, max_length=100)
    student_age: int = Field(..., ge=4, le=18)
    grade: str = Field(..., min_length=1, max_length=20)
    parent_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    preferred_time: Optional[str] = None
    experience_level: Optional[ExperienceLevelEnum] = None
    interests: Optional[List[str]] = []
    additional_notes: Optional[str] = None


class RegistrationUpdate(BaseModel):
    student_name: Optional[str] = None
    student_age: Optional[int] = None
    grade: Optional[str] = None
    parent_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    preferred_time: Optional[str] = None
    experience_level: Optional[ExperienceLevelEnum] = None
    interests: Optional[List[str]] = None
    additional_notes: Optional[str] = None
    status: Optional[RegistrationStatusEnum] = None


class RegistrationResponse(BaseModel):
    id: str
    student_name: str
    student_age: int
    grade: str
    parent_name: str
    email: str
    phone: str
    preferred_time: Optional[str]
    experience_level: Optional[str]
    interests: Optional[List[str]]
    additional_notes: Optional[str]
    status: str
    teacher_id: Optional[str]
    teacher_name: Optional[str]
    demo_link: Optional[str]
    demo_scheduled_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TeacherCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    availability: Optional[str] = None


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    availability: Optional[str] = None


class TeacherResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    specialization: Optional[str]
    bio: Optional[str]
    experience_years: Optional[int]
    availability: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AssignTeacherRequest(BaseModel):
    teacher_id: str


class StatsResponse(BaseModel):
    total_registrations: int
    pending_assignments: int
    teachers_assigned: int
    completed_demos: int


class MessageResponse(BaseModel):
    message: str
    id: Optional[str] = None
