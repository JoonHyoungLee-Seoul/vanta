"""
데이터베이스에 status 컬럼 추가 마이그레이션
"""
import asyncio
from sqlalchemy import text
from database import engine

async def add_status_column():
    async with engine.begin() as conn:
        # status 컬럼이 이미 존재하는지 확인
        check_query = text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='Enrollment' AND column_name='status'
        """)
        result = await conn.execute(check_query)
        exists = result.fetchone()

        if not exists:
            print("Adding 'status' column to Enrollment table...")
            # status 컬럼 추가
            await conn.execute(text("""
                ALTER TABLE "Enrollment"
                ADD COLUMN status VARCHAR NOT NULL DEFAULT 'pending'
            """))
            print("✓ 'status' column added successfully")

            # 기존 레코드를 'approved'로 업데이트 (이미 enrolled된 사용자들)
            await conn.execute(text("""
                UPDATE "Enrollment"
                SET status = 'approved'
                WHERE enrolled = true
            """))
            print("✓ Updated existing enrollments to 'approved'")
        else:
            print("'status' column already exists")

async def main():
    await add_status_column()
    await engine.dispose()
    print("\n✓ Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
