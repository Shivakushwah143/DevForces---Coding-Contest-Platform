-- CreateEnum
CREATE TYPE "Role" AS ENUM ('User', 'Admin');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_to_challenge_mappings" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "contest_to_challenge_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notionDocId" TEXT NOT NULL,
    "maxPoints" INTEGER NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_submissions" (
    "id" TEXT NOT NULL,
    "submission" TEXT NOT NULL,
    "contestToChallengeMappingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "submission" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboards" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contest_to_challenge_mappings_contestId_challengeId_key" ON "contest_to_challenge_mappings"("contestId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboards_contestId_rank_key" ON "leaderboards"("contestId", "rank");

-- AddForeignKey
ALTER TABLE "contest_to_challenge_mappings" ADD CONSTRAINT "contest_to_challenge_mappings_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_to_challenge_mappings" ADD CONSTRAINT "contest_to_challenge_mappings_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_submissions" ADD CONSTRAINT "contest_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_submissions" ADD CONSTRAINT "contest_submissions_contestToChallengeMappingId_fkey" FOREIGN KEY ("contestToChallengeMappingId") REFERENCES "contest_to_challenge_mappings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
