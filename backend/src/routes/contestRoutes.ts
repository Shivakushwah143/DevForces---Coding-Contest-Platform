import { Router } from "express";
import { userMiddleware } from "../middleware/index.js";
import { SubmissionSchema } from "../types/index.js";
import { evaluateSubmissionWithAI } from "../services/aiService.js";
import { updateContestLeaderboard, getContestLeaderboard, prisma } from "../services/leaderboardService.js";

const router = Router();

// Rate limiting map for submissions
const submissionCounts = new Map<string, number>();

router.get("/active", async (req, res) => {
  console.log(' Fetching active contests');
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;
  
  console.log(' Query params - offset:', offset, 'limit:', limit);

  try {
    const contests = await prisma.contest.findMany({
      where: {
        startTime: {
          lte: new Date(),
        },
      },
      skip: offset,
      take: limit,
      orderBy: { startTime: "desc" },
    });

    console.log(' Found', contests.length, 'active contests');
    res.json({ contests });
  } catch (error) {
    console.error(' Error fetching active contests:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/finished", async (req, res) => {
  console.log(' Fetching finished contests');
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;
  
  console.log(' Query params - offset:', offset, 'limit:', limit);

  try {
    const contests = await prisma.contest.findMany({
      where: {
        startTime: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      skip: offset,
      take: limit,
      orderBy: { startTime: "desc" },
    });

    console.log(' Found', contests.length, 'finished contests');
    res.json({ contests });
  } catch (error) {
    console.error(' Error fetching finished contests:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboard/:contestId", async (req, res) => {
  console.log(' Leaderboard request for contest:', req.params.contestId);
  const { contestId } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;

  if (!contestId) {
    console.log(' No contest ID provided');
    return res.status(400).json({ error: "Contest ID is required" });
  }

  try {
    console.log(' Looking up contest:', contestId);
    const contest = await prisma.contest.findUnique({ where: { id: contestId } });
    
    if (!contest) {
      console.log(' Contest not found:', contestId);
      return res.status(404).json({ error: "Contest not found" });
    }

    console.log(' Contest found:', contest.title);
    const isFinished = new Date().getTime() - contest.startTime.getTime() > 24 * 60 * 60 * 1000;
    console.log(' Contest finished status:', isFinished);

    let leaderboard;

    if (isFinished) {
      console.log(' Getting finished contest leaderboard from database');
      leaderboard = await prisma.leaderboard.findMany({
        where: { contestId },
        include: { user: true },
        orderBy: { rank: "asc" },
        take: limit,
      });
      console.log(' Database leaderboard entries:', leaderboard.length);
    } else {
      console.log(' Getting active contest leaderboard from Redis');
      const redisLeaderboard = await getContestLeaderboard(contestId, limit);
      const userIds = redisLeaderboard.map((entry: any) => entry.userId);
      console.log(' User IDs in leaderboard:', userIds.length);

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
      });
      console.log(' Found users for leaderboard:', users.length);

      leaderboard = redisLeaderboard.map((entry: any) => ({
        rank: entry.rank,
        user: users.find((u: any ) => u.id === entry.userId),
        points: entry.points,
      }));
      console.log(' Redis leaderboard processed');
    }

    console.log(' Sending leaderboard with', leaderboard.length, 'entries');
    res.json({ leaderboard });
  } catch (error) {
    console.error(' Error fetching leaderboard:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:contestId", userMiddleware, async (req: any, res) => {
  console.log(' Contest detail request for:', req.params.contestId);
  const { contestId } = req.params;

  try {
    console.log(' Fetching contest details with challenges');
    const contest = await prisma.contest.findUnique({
      where: { id: contestId! },
      include: {
        contestToChallengeMapping: {
          include: {
            challenge: true,
          },
          orderBy: { index: "asc" },
        },
      },
    });

    if (!contest) {
      console.log(' Contest not found:', contestId);
      return res.status(404).json({ error: "Contest not found" });
    }

    console.log(' Contest found with', contest.contestToChallengeMapping.length, 'challenges');
    res.json({ contest });
  } catch (error) {
    console.error(' Error fetching contest:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:contestId/:challengeId", userMiddleware, async (req: any, res) => {
  console.log(' Challenge detail request - Contest:', req.params.contestId, 'Challenge:', req.params.challengeId);
  const { contestId, challengeId } = req.params;

  try {
    console.log(' Looking up challenge mapping...');
    const mapping = await prisma.contestToChallengeMapping.findFirst({
      where: {
        contestId: contestId!,
        challengeId: challengeId!,
      },
      include: {
        challenge: true,
        contest: true,
      },
    });

    if (!mapping) {
      console.log(' Challenge not found in contest');
      return res.status(404).json({ error: "Challenge not found in this contest" });
    }

    console.log(' Challenge mapping found');
    res.json({ challenge: mapping.challenge, contest: mapping.contest });
  } catch (error) {
    console.error(' Error fetching challenge:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/submit/:challengeId", userMiddleware, async (req: any, res) => {
  console.log(' Submission request received for challenge:', req.params.challengeId);
  console.log(' User ID:', req.userId);
  
  const { challengeId } = req.params;
  const parsed = SubmissionSchema.safeParse(req.body);

  if (!parsed.success) {
    console.log(' Invalid submission format');
    return res.status(400).json({ error: "Invalid submission" });
  }

  const { submission } = parsed.data;
  const userId = req.userId!;

  console.log(' Submission length:', submission.length);
  console.log(' First 100 chars:', submission.substring(0, 100));

  // Rate limiting
  const rateLimitKey = `${userId}:${challengeId}`;
  const currentCount = submissionCounts.get(rateLimitKey) || 0;

  console.log(' Rate limit check - Current:', currentCount, 'Max: 20');

  if (currentCount >= 20) {
    console.log(' Rate limit exceeded for user:', userId);
    return res.status(429).json({ error: "Maximum 20 submissions per challenge" });
  }

  submissionCounts.set(rateLimitKey, currentCount + 1);
  console.log(' Rate limit updated - New count:', currentCount + 1);

  try {
    console.log(' Looking up challenge mapping...');
    const mapping = await prisma.contestToChallengeMapping.findFirst({
      where: { challengeId: challengeId! },
      include: { challenge: true, contest: true },
    });

    if (!mapping) {
      console.log(' Challenge mapping not found');
      return res.status(404).json({ error: "Challenge not found" });
    }

    console.log(' Challenge found:', mapping.challenge.title);
    console.log(' Max points for challenge:', mapping.challenge.maxPoints);
    console.log(' Contest:', mapping.contest.title);

    console.log(' Starting AI evaluation...');
    const points = await evaluateSubmissionWithAI(
      mapping.challenge.title,
      submission,
      mapping.challenge.maxPoints
    );

    console.log(' AI evaluation complete - Score:', points);

    console.log(' Saving submission to database...');
    const contestSubmission = await prisma.contestSubmission.create({
      data: {
        submission,
        contestToChallengeMappingId: mapping.id,
        userId,
        points,
      },
    });
    console.log(' Submission saved with ID:', contestSubmission.id);

    console.log(' Updating leaderboard...');
    await updateContestLeaderboard(mapping.contestId, userId, points);

    console.log(' Submission process completed successfully');
    res.json({
      success: true,
      points,
      submission: contestSubmission,
    });
  } catch (error) {
    console.error(' Error processing submission:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;