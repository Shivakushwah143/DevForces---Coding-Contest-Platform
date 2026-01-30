import dotenv from "dotenv";
dotenv.config();

// ==================== DIRECT CONFIG VALUES
const CONFIG = {
  DATABASE_URL:
    "postgresql://postgres:admin@localhost:5433/devforces?schema=public",
  PORT: 4000,
  EMAIL_USER: "shivakushwah144@gmail.com",
  EMAIL_PASS: "bhhaiphbziefhkbu",
  REDIS_URL: "redis://localhost:6379",
  JWT_SECRET: "your-secret-key",
  JWT_REFRESH_SECRET: "your-refresh-secret",
  EMAIL_JWT_SECRET: "your-email-jwt-secret",
  EMAIL_HOST: "smtp.gmail.com",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  EMAIL_PORT: 587,
  EMAIL_FROM: "shivakushwah144@gmail.com",
  FRONTEND_URL: "https://dev-forces-coding-contest-platform.vercel.app/",
};

console.log("Using direct configuration values");
console.log("DATABASE_URL:", CONFIG.DATABASE_URL);
console.log("PORT:", CONFIG.PORT);

import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { PrismaClient } from "../generated/prisma/client.js";
import { z } from "zod";
import axios from "axios";
import { createClient } from "redis";
import type { RedisClientType } from "redis";

// ==================== TYPES & SCHEMAS ====================
const SignupSchema = z.object({
  email: z.string().email(),
});
const CreateContestSchema = z.object({
  title: z.string(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid datetime string",
  }),
});
const CreateChallengeSchema = z.object({
  title: z.string(),
  notionDocId: z.string(),
  maxPoints: z.number(),
});

const SubmissionSchema = z.object({
  submission: z.string(),
});

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

interface LeaderboardEntry {
  userId: string;
  points: number;
  rank: number;
}

// ==================== CLIENTS ====================
const prisma = new PrismaClient();
const redisClient: RedisClientType = createClient({
  url: CONFIG.REDIS_URL,
}) as RedisClientType;

// Email transporter
const transporter = nodemailer.createTransport({
  host: CONFIG.EMAIL_HOST,
  port: CONFIG.EMAIL_PORT,
  secure: true,
  auth: {
    user: CONFIG.EMAIL_USER,
    pass: CONFIG.EMAIL_PASS,
  },
});

// ==================== REDIS CONNECTION ====================
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.connect();

// ==================== AI SERVICES ====================
async function evaluateSubmissionWithAI(
  challengeTitle: string,
  submission: string,
  maxPoints: number,
): Promise<number> {
  try {
    // Truncate submission if it's too long to avoid token limits
    const truncatedSubmission =
      submission.length > 2000
        ? submission.substring(0, 2000) + "... [truncated]"
        : submission;

    // Use Groq AI
    // Add your Groq API key to CONFIG or environment variables
    const GROQ_API_KEY = CONFIG.GROQ_API_KEY || process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      console.warn("GROQ_API_KEY not found, using fallback scoring");
      return Math.floor(Math.random() * (maxPoints * 0.3));
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant", // or "mixtral-8x7b-32768", "llama-3.1-8b-instant"
        messages: [
          {
            role: "system",
            content:
              "You are a coding challenge evaluator. Return only a number representing the score.",
          },
          {
            role: "user",
            content: `Evaluate this submission for the challenge "${challengeTitle}".

Submission: ${truncatedSubmission}

Maximum Points: ${maxPoints}

Instructions:
1. Evaluate the submission based on correctness, completeness, and quality
2. Return ONLY a single number between 0 and ${maxPoints} (inclusive)
3. The number should represent the score
4. Do not include any explanations, text, or formatting

Score (0-${maxPoints}):`,
          },
        ],
        max_tokens: 20, // Increased from 10
        temperature: 0.1,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      },
    );

    const scoreText = response.data.choices[0].message.content.trim();
    console.log("Groq AI response:", scoreText);

    // Extract number from response
    const match = scoreText.match(/\d+/);
    const score = match ? parseInt(match[0]) : 0;

    // Ensure score is within bounds
    const finalScore = Math.min(Math.max(score, 0), maxPoints);
    console.log(
      `Final score for "${challengeTitle}": ${finalScore}/${maxPoints}`,
    );

    return finalScore;
  } catch (error: any) {
    console.error("Groq AI evaluation error:", error.message);

    if (error.response) {
      console.error("Error details:", error.response.data);
    }

    // Fallback to basic scoring if API fails
    const basicScore = Math.floor(Math.random() * (maxPoints * 0.3)); // 0-30% of max points
    console.log(`Using fallback score: ${basicScore}/${maxPoints}`);
    return basicScore;
  }
}


// ==================== EMAIL SERVICE ====================
async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.NODE_ENV === "production") {
    await transporter.sendMail({
      from: CONFIG.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } else {
    console.log(`Email to ${to}: ${subject}`);
    console.log(html);
  }
}

// ==================== MIDDLEWARES ====================
function userMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as {
      userId: string;
      role: string;
    };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (decoded.role !== "Admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function updateContestLeaderboard(
  contestId: string,
  userId: string,
  points: number,
) {
  const key = `leaderboard:${contestId}`;
  await redisClient.zIncrBy(key, points, userId);
}

async function getContestLeaderboard(
  contestId: string,
  limit = 100,
): Promise<LeaderboardEntry[]> {
  const key = `leaderboard:${contestId}`;
  const results = await redisClient.zRangeWithScores(key, 0, limit - 1, {
    REV: true,
  });

  return results.map((r, index) => ({
    userId: r.value,
    points: r.score,
    rank: index + 1,
  }));
}

async function saveLeaderboardToDB(contestId: string) {
  const leaderboard = await getContestLeaderboard(contestId, 1000);

  // Delete existing leaderboard
  await prisma.leaderboard.deleteMany({ where: { contestId } });

  // Save new leaderboard
  await prisma.leaderboard.createMany({
    data: leaderboard.map((entry) => ({
      contestId,
      userId: entry.userId,
      rank: entry.rank,
    })),
  });
}

// ==================== EXPRESS APP ====================
const app = express();

app.use(cors());
app.use(express.json());

// ==================== USER ROUTES ====================
app.post("/user/signin", async (req: Request, res: Response) => {
  const parsed = SignupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const { email } = parsed.data;

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      role: "User",
    },
  });

  const emailToken = jwt.sign(
    { userId: user.id, email: user.email },
    CONFIG.EMAIL_JWT_SECRET,
    { expiresIn: "15m" },
  );

  const magicLink = `${CONFIG.FRONTEND_URL}/signin/verify?token=${emailToken}`;

  await sendEmail(
    email,
    "DevForces - Sign In",
    `<h1>Welcome to DevForces!</h1><p>Click the link below to sign in:</p><a href="${magicLink}">Sign In</a>`,
  );

  res.json({ message: "Sign in email sent" });
});

app.get("/user/signin/verify", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token required" });
  }

  try {
    const decoded = jwt.verify(token as string, CONFIG.EMAIL_JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const authToken = jwt.sign(
      { userId: user.id, role: user.role },
      CONFIG.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token: authToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ==================== CONTEST ROUTES ====================
app.get("/contest/active", async (req: Request, res: Response) => {
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;

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

  res.json({ contests });
});

app.get("/contest/finished", async (req: Request, res: Response) => {
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;

  const contests = await prisma.contest.findMany({
    where: {
      startTime: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Contests older than 24 hours
      },
    },
    skip: offset,
    take: limit,
    orderBy: { startTime: "desc" },
  });

  res.json({ contests });
});

// ⚠️ IMPORTANT: Put specific routes BEFORE parameterized routes
app.get(
  "/contest/leaderboard/:contestId",
  async (req: Request, res: Response) => {
    const { contestId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!contestId) {
      return res.status(400).json({ error: "Contest ID is required" });
    }

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const isFinished =
      new Date().getTime() - contest.startTime.getTime() > 24 * 60 * 60 * 1000;

    let leaderboard;

    if (isFinished) {
      leaderboard = await prisma.leaderboard.findMany({
        where: { contestId },
        include: { user: true },
        orderBy: { rank: "asc" },
        take: limit,
      });
    } else {
      const redisLeaderboard = await getContestLeaderboard(contestId, limit);
      const userIds = redisLeaderboard.map(
        (entry: LeaderboardEntry) => entry.userId,
      );
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
      });

      leaderboard = redisLeaderboard.map((entry: LeaderboardEntry) => ({
        rank: entry.rank,
        user: users.find((u: any) => u.id === entry.userId),
        points: entry.points,
      }));
    }

    res.json({ leaderboard });
  },
);

// Now put the parameterized routes AFTER specific routes
app.get(
  "/contest/:contestId",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { contestId } = req.params;

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
      return res.status(404).json({ error: "Contest not found" });
    }

    res.json({ contest });
  },
);

app.get(
  "/contest/:contestId/:challengeId",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { contestId, challengeId } = req.params;

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
      return res
        .status(404)
        .json({ error: "Challenge not found in this contest" });
    }

    res.json({ challenge: mapping.challenge, contest: mapping.contest });
  },
);

// Rate limiting map for submissions
const submissionCounts = new Map<string, number>();

app.post(
  "/contest/submit/:challengeId",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { challengeId } = req.params;
    const parsed = SubmissionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid submission" });
    }

    const { submission } = parsed.data;
    const userId = req.userId!;

    const rateLimitKey = `${userId}:${challengeId}`;
    const currentCount = submissionCounts.get(rateLimitKey) || 0;

    if (currentCount >= 20) {
      return res
        .status(429)
        .json({ error: "Maximum 20 submissions per challenge" });
    }

    submissionCounts.set(rateLimitKey, currentCount + 1);

    const mapping = await prisma.contestToChallengeMapping.findFirst({
      where: { challengeId: challengeId! },
      include: { challenge: true, contest: true },
    });

    if (!mapping) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const points = await evaluateSubmissionWithAI(
      mapping.challenge.title,
      submission,
      mapping.challenge.maxPoints,
    );

    const contestSubmission = await prisma.contestSubmission.create({
      data: {
        submission,
        contestToChallengeMappingId: mapping.id,
        userId,
        points,
      },
    });

    await updateContestLeaderboard(mapping.contestId, userId, points);

    res.json({
      success: true,
      points,
      submission: contestSubmission,
    });
  },
);

// ==================== ADMIN ROUTES ====================
app.post(
  "/admin/contest",
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    const parsed = CreateContestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid contest data" });
    }

    const { title, startTime } = parsed.data;

    const contest = await prisma.contest.create({
      data: {
        title,
        startTime: new Date(startTime),
      },
    });

    res.json({ contest });
  },
);

app.post(
  "/admin/challenge",
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    const parsed = CreateChallengeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid challenge data" });
    }

    const { title, notionDocId, maxPoints } = parsed.data;

    const challenge = await prisma.challenge.create({
      data: {
        title,
        notionDocId,
        maxPoints,
      },
    });

    res.json({ challenge });
  },
);

app.post(
  "/admin/link/:challengeId/:contestId",
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { challengeId, contestId } = req.params;
    const { index } = req.body;

    const mapping = await prisma.contestToChallengeMapping.create({
      data: {
        challengeId: challengeId!,
        contestId: contestId!,
        index: index || 0,
      },
    });

    res.json({ mapping });
  },
);

app.delete(
  "/admin/link/:challengeId/:contestId",
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { challengeId, contestId } = req.params;

    await prisma.contestToChallengeMapping.deleteMany({
      where: {
        challengeId: challengeId!,
        contestId: contestId!,
      },
    });

    res.json({ success: true });
  },
);

// Background job to save leaderboards to DB after contest ends
setInterval(
  async () => {
    const finishedContests = await prisma.contest.findMany({
      where: {
        startTime: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const contest of finishedContests) {
      const key = `leaderboard:${contest.id}`;
      const exists = await redisClient.exists(key);

      if (exists) {
        await saveLeaderboardToDB(contest.id);
        await redisClient.del(key);
        console.log(`Saved leaderboard for contest ${contest.id} to DB`);
      }
    }
  },
  60 * 60 * 1000,
);

// ==================== START SERVER ====================
const PORT = CONFIG.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

// import express from "express";
// import cors from "cors";
// import { CONFIG } from "./config/index.js";
// import { requestLogger } from "./middleware/index.js";
// import { startLeaderboardBackgroundJob } from "./services/leaderboardService.js";

// // Import routes
// import userRoutes from "./routes/userRoutes.js";
// import contestRoutes from "./routes/contestRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(requestLogger);

// // Routes
// app.use("/user", userRoutes);
// app.use("/contest", contestRoutes);
// app.use("/admin", adminRoutes);

// // Start background jobs
// startLeaderboardBackgroundJob();

// // Start server
// const PORT = CONFIG.PORT;
// app.listen(PORT, () => {
//   console.log('🚀 Server running on port', PORT);
//   console.log('📊 Environment:', process.env.NODE_ENV || 'development');
//   console.log('🔗 Frontend URL:', CONFIG.FRONTEND_URL);
//   console.log('📧 Email configured for:', CONFIG.EMAIL_USER);
//   console.log('🗄️ Database URL:', CONFIG.DATABASE_URL.split('@')[1]); // Hide password
//   console.log('⚡ Redis URL:', CONFIG.REDIS_URL);
// });

// export default app;
