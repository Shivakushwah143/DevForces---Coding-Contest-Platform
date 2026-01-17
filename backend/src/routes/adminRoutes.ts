import { Router } from "express";
import { adminMiddleware } from "../middleware/index.js";
import { CreateContestSchema, CreateChallengeSchema } from "../types/index.js";
import { prisma } from "../services/leaderboardService.js";

const router = Router();

router.post("/contest", adminMiddleware, async (req: any, res) => {
  console.log(' Admin creating contest');
  console.log(' Contest data:', req.body);
  
  const parsed = CreateContestSchema.safeParse(req.body);

  if (!parsed.success) {
    console.log(' Invalid contest data:', parsed.error);
    return res.status(400).json({ error: "Invalid contest data" });
  }

  const { title, startTime } = parsed.data;

  try {
    console.log(' Creating new contest...');
    const contest = await prisma.contest.create({
      data: {
        title,
        startTime: new Date(startTime),
      },
    });

    console.log(' Contest created with ID:', contest.id);
    res.json({ contest });
  } catch (error) {
    console.error(' Error creating contest:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/challenge", adminMiddleware, async (req: any, res) => {
  console.log(' Admin creating challenge');
  console.log(' Challenge data:', req.body);
  
  const parsed = CreateChallengeSchema.safeParse(req.body);

  if (!parsed.success) {
    console.log(' Invalid challenge data:', parsed.error);
    return res.status(400).json({ error: "Invalid challenge data" });
  }

  const { title, notionDocId, maxPoints } = parsed.data;

  try {
    console.log(' Creating new challenge...');
    const challenge = await prisma.challenge.create({
      data: {
        title,
        notionDocId,
        maxPoints,
      },
    });

    console.log(' Challenge created with ID:', challenge.id);
    res.json({ challenge });
  } catch (error) {
    console.error(' Error creating challenge:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/link/:challengeId/:contestId", adminMiddleware, async (req: any, res) => {
  console.log(' Admin linking challenge to contest');
  console.log('Challenge ID:', req.params.challengeId, 'Contest ID:', req.params.contestId);
  console.log(' Index:', req.body.index);
  
  const { challengeId, contestId } = req.params;
  const { index } = req.body;

  try {
    console.log(' Creating challenge-contest mapping...');
    const mapping = await prisma.contestToChallengeMapping.create({
      data: {
        challengeId: challengeId!,
        contestId: contestId!,
        index: index || 0,
      },
    });

    console.log(' Challenge linked successfully with mapping ID:', mapping.id);
    res.json({ mapping });
  } catch (error) {
    console.error(' Error linking challenge:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/link/:challengeId/:contestId", adminMiddleware, async (req: any, res) => {
  console.log(' Admin unlinking challenge from contest');
  console.log(' Challenge ID:', req.params.challengeId, 'Contest ID:', req.params.contestId);
  
  const { challengeId, contestId } = req.params;

  try {
    console.log(' Deleting challenge-contest mapping...');
    await prisma.contestToChallengeMapping.deleteMany({
      where: {
        challengeId: challengeId!,
        contestId: contestId!,
      },
    });

    console.log(' Challenge unlinked successfully');
    res.json({ success: true });
  } catch (error) {
    console.error(' Error unlinking challenge:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;