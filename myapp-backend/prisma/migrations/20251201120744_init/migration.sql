-- CreateTable
CREATE TABLE "Invitation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_by" INTEGER,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegisterSession" (
    "sessionId" TEXT NOT NULL,
    "invitationId" INTEGER NOT NULL,
    "name" TEXT,
    "birthday" TEXT,
    "phone" TEXT,

    CONSTRAINT "RegisterSession_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "birthday" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "invitationId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_code_key" ON "Invitation"("code");
