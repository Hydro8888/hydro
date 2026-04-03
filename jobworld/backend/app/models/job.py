from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class JobType(str, enum.Enum):
    fulltime = "정규직"
    contract = "계약직"
    parttime = "파트타임"
    intern = "인턴"
    freelance = "프리랜서"


class JobStatus(str, enum.Enum):
    active = "active"
    closed = "closed"
    draft = "draft"


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False, index=True)
    salary_range = Column(String)
    job_type = Column(String, nullable=False, default="정규직")
    deadline = Column(String)
    requirements = Column(Text)
    preferred = Column(Text)
    status = Column(String, default="active")
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="job_postings")
    applications = relationship("Application", back_populates="job_posting")
