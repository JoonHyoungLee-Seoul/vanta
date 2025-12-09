import asyncio
from database import AsyncSessionLocal
from models import Invitation

async def seed_invitations():
    async with AsyncSessionLocal() as session:
        # Check if TEST001 already exists
        from sqlalchemy import select
        result = await session.execute(
            select(Invitation).where(Invitation.code == "TEST001")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("TEST001 already exists!")
        else:
            # Create TEST001 invitation
            invitation = Invitation(code="TEST001", is_active=True)
            session.add(invitation)
            await session.commit()
            print("TEST001 invitation code created successfully!")

if __name__ == "__main__":
    asyncio.run(seed_invitations())
