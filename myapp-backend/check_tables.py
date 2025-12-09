import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check_tables():
    DATABASE_URL = os.getenv("DATABASE_URL")

    # Connect directly with asyncpg
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # Query to get all table names
        tables = await conn.fetch("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)

        print("Tables in database:")
        for table in tables:
            print(f"  - {table['table_name']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_tables())
