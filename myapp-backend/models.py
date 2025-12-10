from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class Invitation(Base):
    __tablename__ = "Invitation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class RegisterSession(Base):
    __tablename__ = "RegisterSession"

    sessionId = Column(String, primary_key=True)
    invitationId = Column(Integer, nullable=False)
    name = Column(String, nullable=True)
    password = Column(String, nullable=True)
    birthday = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    userId = Column(String, nullable=True)


class User(Base):
    __tablename__ = "User"

    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    birthday = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    invitationId = Column(Integer, nullable=False)

    # Relationship with Enrollment
    enrollments = relationship("Enrollment", back_populates="user")


class Enrollment(Base):
    __tablename__ = "Enrollment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(Integer, ForeignKey("User.id"), nullable=False)
    partyId = Column(Integer, nullable=False)
    enrolled = Column(Boolean, default=True, nullable=False)
    status = Column(String, default="pending", nullable=False)  # pending, approved, rejected
    couponUsed = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=False)

    # Relationship with User
    user = relationship("User", back_populates="enrollments")

    __table_args__ = (
        # Unique constraint on userId and partyId
        {"schema": None},
    )
