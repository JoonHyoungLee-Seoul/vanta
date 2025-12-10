import asyncio
from database import engine
from sqlalchemy import text


async def add_coupon_field():
    """Add couponUsed field to Enrollment table"""
    async with engine.begin() as conn:
        # Add couponUsed column (default False)
        await conn.execute(text(
            'ALTER TABLE "Enrollment" ADD COLUMN "couponUsed" BOOLEAN DEFAULT FALSE NOT NULL'
        ))
        print("✓ Added couponUsed column to Enrollment table")


if __name__ == "__main__":
    print("Starting migration: Add couponUsed to Enrollment")
    asyncio.run(add_coupon_field())
    print("Migration completed successfully!")
