"""
관리자 계정 생성 스크립트
실행: docker compose exec backend python create_admin.py
"""
import asyncio
import sys
from app.database import AsyncSessionLocal, init_db
from app.services.auth import create_user, get_user_by_email, hash_password
from app.models.user import UserType

ADMIN_EMAIL    = "snowpark@daum.net"
ADMIN_PASSWORD = "New1234!"
ADMIN_NAME     = "관리자"


async def main():
    await init_db()
    async with AsyncSessionLocal() as db:
        existing = await get_user_by_email(db, ADMIN_EMAIL)
        if existing:
            # 이미 존재하면 비밀번호 + 권한만 갱신
            existing.password_hash = hash_password(ADMIN_PASSWORD)
            existing.user_type     = UserType.admin
            existing.is_active     = True
            await db.commit()
            print(f"[OK] 기존 계정 업데이트 완료: {ADMIN_EMAIL} → admin")
        else:
            user = await create_user(db, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, "jobseeker")
            user.user_type = UserType.admin
            await db.commit()
            print(f"[OK] 관리자 계정 생성 완료: {ADMIN_EMAIL}")

        print(f"     이메일:   {ADMIN_EMAIL}")
        print(f"     비밀번호: {ADMIN_PASSWORD}")
        print(f"     권한:     admin")


if __name__ == "__main__":
    asyncio.run(main())
