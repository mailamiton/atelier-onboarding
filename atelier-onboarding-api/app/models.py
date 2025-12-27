from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from .database import Base


class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    TEACHER_ASSIGNED = "teacher_assigned"
    LINK_SENT = "link_sent"
    COMPLETED = "completed"


class ExperienceLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Teacher(Base):
    __tablename__ = "teachers"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String)
    specialization = Column(String)
    bio = Column(Text)
    experience_years = Column(Integer)
    availability = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    registrations = relationship("Registration", back_populates="teacher")


class Registration(Base):
    __tablename__ = "registrations"
    
    id = Column(String, primary_key=True, index=True)
    student_name = Column(String, nullable=False)
    student_age = Column(Integer, nullable=False)
    grade = Column(String, nullable=False)
    parent_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    preferred_time = Column(String)
    experience_level = Column(SQLEnum(ExperienceLevel), nullable=True)
    interests = Column(ARRAY(String))
    additional_notes = Column(Text)
    status = Column(SQLEnum(RegistrationStatus), default=RegistrationStatus.PENDING, nullable=False)
    teacher_id = Column(String, ForeignKey("teachers.id"), nullable=True)
    demo_link = Column(String)
    demo_scheduled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    teacher = relationship("Teacher", back_populates="registrations")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, index=True)
    registration_id = Column(String, ForeignKey("registrations.id"))
    recipient_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True))
    status = Column(String, default="pending")
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
