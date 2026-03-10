from sqlalchemy import Column, String, DateTime, Text, Index
from sqlalchemy.sql import func
from app.database import Base


class WorknetJob(Base):
    """워크넷 OpenAPI에서 수집한 채용공고."""

    __tablename__ = "worknet_jobs"

    # 워크넷 공고번호 — upsert 기준 고유키
    wanted_auth_no = Column(String(50), primary_key=True)

    # 공고 기본 정보
    company_name = Column(String(200), nullable=False, index=True)
    title = Column(String(500), nullable=False, index=True)
    job_category = Column(String(200), index=True)    # 직종명
    employment_type = Column(String(100))              # 고용형태 (정규직/계약직 …)
    location = Column(String(200), index=True)         # 근무지역
    salary = Column(String(200))                       # 급여조건
    education = Column(String(100))                    # 학력
    career = Column(String(100))                       # 경력
    deadline = Column(String(20), index=True)          # 마감일 (YYYYMMDD)
    reg_date = Column(String(20))                      # 워크넷 등록일

    # 원본 링크
    source_url = Column(Text)

    # 우리 DB 적재 시각 (upsert 때마다 갱신)
    synced_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # 복합 인덱스: 지역 + 직종 필터링 쿼리 최적화
    __table_args__ = (
        Index("ix_worknet_location_category", "location", "job_category"),
    )
