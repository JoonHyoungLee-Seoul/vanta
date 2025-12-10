# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **hybrid FastAPI + Prisma** backend that uses:
- **FastAPI** (Python) for the HTTP server and business logic
- **Prisma** (Node.js tooling) for database schema management and migrations
- **Prisma Client Python** for database access from Python code
- **PostgreSQL** (via Supabase) as the database

### Key Architectural Pattern

The project uses an unusual but functional stack: Prisma's Node.js CLI tools manage the database schema (`schema.prisma`) and migrations, while the actual runtime uses `prisma-client-py` to interact with the database from FastAPI Python code.

### Database Models

Three main models handle a multi-step user registration flow:

1. **Invitation**: Tracks invitation codes and their usage status
2. **RegisterSession**: Temporary session storage for multi-step registration (stores sessionId, invitationId, name, birthday, phone, password)
3. **User**: Final user record created after completing all registration steps

### Registration Flow

The registration process is a 5-step API flow:
1. `POST /auth/invitation/verify` - Validate invitation code, create RegisterSession, return sessionId
2. `PUT /auth/register/name` - Store user's name in RegisterSession
3. `PUT /auth/register/birthday` - Store user's birthday in RegisterSession
4. `PUT /auth/register/phone` - Store phone in RegisterSession
5. `PUT /auth/register/password` - Store hashed password and create final User record, mark Invitation as used

Each step validates the sessionId before proceeding.

## Development Commands

### Database Management

```bash
# Generate Prisma Python client after schema changes
prisma generate

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Apply migrations to production
npx prisma migrate deploy

# View database in Prisma Studio
npx prisma studio
```

### Python Environment

```bash
# Activate virtual environment
source venv/bin/activate  # On macOS/Linux

# Install Prisma Client Python (after schema changes)
pip install prisma

# Run FastAPI development server
uvicorn main:app --reload

# Run FastAPI with specific host/port
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Important Notes

### Prisma Client Generation

After modifying `prisma/schema.prisma`, you must run BOTH:
1. `npx prisma migrate dev` (to update the database)
2. `prisma generate` (to regenerate the Python client)

The Python code imports from `prisma` package, which is generated code based on your schema.

### Naming Conventions

The codebase follows these naming conventions:
- **Prisma schema models**: PascalCase (`RegisterSession`, `User`, `Invitation`)
- **Prisma client access**: All lowercase (`db.registersession`, `db.user`, `db.invitation`)
- **API request fields**: snake_case (`session_id`, `invitation_code`, `birthday`, etc.)
- **Pydantic models**: PascalCase (`InvitationReq`, `NameReq`, `BirthReq`, `PhoneReq`)

### Session Management

RegisterSession records are never cleaned up or deleted after user creation. Consider implementing:
- Expiration timestamps
- Cleanup jobs for old sessions
- Session deletion after successful user creation

### Database Configuration

Database connection is configured via `DATABASE_URL` environment variable in `.env` file, currently pointing to a Supabase PostgreSQL instance.
