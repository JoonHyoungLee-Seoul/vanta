import asyncio
from database import engine
from sqlalchemy import text

async def add_userid_columns():
    async with engine.begin() as conn:
        # Add userId to RegisterSession table (nullable)
        try:
            await conn.execute(text(
                'ALTER TABLE "RegisterSession" ADD COLUMN "userId" VARCHAR'
            ))
            print("Added userId column to RegisterSession table")
        except Exception as e:
            print(f"RegisterSession userId column may already exist: {e}")

        # Add userId to User table (unique, not null)
        # First add as nullable, then we can make it not null after data migration if needed
        try:
            await conn.execute(text(
                'ALTER TABLE "User" ADD COLUMN "userId" VARCHAR UNIQUE'
            ))
            print("Added userId column to User table")
        except Exception as e:
            print(f"User userId column may already exist: {e}")

    print("Migration completed!")

if __name__ == "__main__":
    asyncio.run(add_userid_columns())
