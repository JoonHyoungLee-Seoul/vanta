"""
데이터베이스에 status 컬럼 추가
"""
import asyncio
from sqlalchemy import text
from database import engine

async def add_status_column():
    """Add status column to Enrollment table"""
    async with engine.begin() as conn:
        print("Checking if 'status' column exists...")

        # Check if column exists
        check_query = text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='Enrollment' AND column_name='status'
        """)
        result = await conn.execute(check_query)
        exists = result.fetchone()

        if not exists:
            print("Adding 'status' column to Enrollment table...")

            # Add status column
            add_column_query = text("""
                ALTER TABLE "Enrollment"
                ADD COLUMN status VARCHAR NOT NULL DEFAULT 'pending'
            """)
            await conn.execute(add_column_query)
            print("✓ 'status' column added successfully")

            # Update existing records to 'approved'
            update_query = text("""
                UPDATE "Enrollment"
                SET status = 'approved'
                WHERE enrolled = true
            """)
            await conn.execute(update_query)
            print("✓ Updated existing enrollments to 'approved'")
        else:
            print("'status' column already exists")

            # Check and update any NULL values
            update_nulls = text("""
                UPDATE "Enrollment"
                SET status = 'approved'
                WHERE status IS NULL AND enrolled = true
            """)
            await conn.execute(update_nulls)
            print("✓ Updated any NULL status values")

async def main():
    try:
        await add_status_column()
        print("\n✅ Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
