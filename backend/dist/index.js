import dotenv from "dotenv";
dotenv.config();
// ==================== DIRECT CONFIG VALUES
const CONFIG = {
    DATABASE_URL: process.env.DATABASE_URL || "",
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
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
// import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import axios from "axios";
import { createClient } from "redis";
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
// ==================== CLIENTS ====================
const prisma = new PrismaClient();
const redisClient = createClient({
    url: CONFIG.REDIS_URL,
});
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
async function evaluateSubmissionWithAI(challengeTitle, submission, maxPoints) {
    try {
        // Truncate submission if it's too long to avoid token limits
        const truncatedSubmission = submission.length > 2000
            ? submission.substring(0, 2000) + "... [truncated]"
            : submission;
        // Use Groq AI
        // Add your Groq API key to CONFIG or environment variables
        const GROQ_API_KEY = CONFIG.GROQ_API_KEY || process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            console.warn("GROQ_API_KEY not found, using fallback scoring");
            return Math.floor(Math.random() * (maxPoints * 0.3));
        }
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.1-8b-instant", // or "mixtral-8x7b-32768", "llama-3.1-8b-instant"
            messages: [
                {
                    role: "system",
                    content: "You are a coding challenge evaluator. Return only a number representing the score.",
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
        }, {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 30000, // 30 second timeout
        });
        const scoreText = response.data.choices[0].message.content.trim();
        console.log("Groq AI response:", scoreText);
        // Extract number from response
        const match = scoreText.match(/\d+/);
        const score = match ? parseInt(match[0]) : 0;
        // Ensure score is within bounds
        const finalScore = Math.min(Math.max(score, 0), maxPoints);
        console.log(`Final score for "${challengeTitle}": ${finalScore}/${maxPoints}`);
        return finalScore;
    }
    catch (error) {
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
async function sendEmail(to, subject, html) {
    if (process.env.NODE_ENV === "production") {
        await transporter.sendMail({
            from: CONFIG.EMAIL_FROM,
            to,
            subject,
            html,
        });
    }
    else {
        console.log(`Email to ${to}: ${subject}`);
        console.log(html);
    }
}
// ==================== MIDDLEWARES ====================
function userMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
function adminMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
        if (decoded.role !== "Admin") {
            return res.status(403).json({ error: "Admin access required" });
        }
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
async function updateContestLeaderboard(contestId, userId, points) {
    const key = `leaderboard:${contestId}`;
    await redisClient.zIncrBy(key, points, userId);
}
async function getContestLeaderboard(contestId, limit = 100) {
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
async function saveLeaderboardToDB(contestId) {
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
app.post("/user/signin", async (req, res) => {
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
    const emailToken = jwt.sign({ userId: user.id, email: user.email }, CONFIG.EMAIL_JWT_SECRET, { expiresIn: "15m" });
    const magicLink = `${CONFIG.FRONTEND_URL}/signin/verify?token=${emailToken}`;
    await sendEmail(email, "DevForces - Sign In", `<h1>Welcome to DevForces!</h1><p>Click the link below to sign in:</p><a href="${magicLink}">Sign In</a>`);
    res.json({ message: "Sign in email sent" });
});
app.get("/user/signin/verify", async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ error: "Token required" });
    }
    try {
        const decoded = jwt.verify(token, CONFIG.EMAIL_JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const authToken = jwt.sign({ userId: user.id, role: user.role }, CONFIG.JWT_SECRET, { expiresIn: "7d" });
        res.json({
            token: authToken,
            user: { id: user.id, email: user.email, role: user.role },
        });
    }
    catch (e) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});
// ==================== CONTEST ROUTES ====================
app.get("/contest/active", async (req, res) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;
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
app.get("/contest/finished", async (req, res) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;
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
app.get("/contest/leaderboard/:contestId", async (req, res) => {
    const { contestId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    if (!contestId) {
        return res.status(400).json({ error: "Contest ID is required" });
    }
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
    });
    if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
    }
    const isFinished = new Date().getTime() - contest.startTime.getTime() > 24 * 60 * 60 * 1000;
    let leaderboard;
    if (isFinished) {
        leaderboard = await prisma.leaderboard.findMany({
            where: { contestId },
            include: { user: true },
            orderBy: { rank: "asc" },
            take: limit,
        });
    }
    else {
        const redisLeaderboard = await getContestLeaderboard(contestId, limit);
        const userIds = redisLeaderboard.map((entry) => entry.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
        });
        leaderboard = redisLeaderboard.map((entry) => ({
            rank: entry.rank,
            user: users.find((u) => u.id === entry.userId),
            points: entry.points,
        }));
    }
    res.json({ leaderboard });
});
// Now put the parameterized routes AFTER specific routes
app.get("/contest/:contestId", userMiddleware, async (req, res) => {
    const { contestId } = req.params;
    if (!contestId) {
        return;
    }
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
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
});
app.get("/contest/:contestId/:challengeId", userMiddleware, async (req, res) => {
    const { contestId, challengeId } = req.params;
    const mapping = await prisma.contestToChallengeMapping.findFirst({
        where: {
            contestId: contestId,
            challengeId: challengeId,
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
});
// Rate limiting map for submissions
const submissionCounts = new Map();
app.post("/contest/submit/:challengeId", userMiddleware, async (req, res) => {
    const { challengeId } = req.params;
    const parsed = SubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid submission" });
    }
    const { submission } = parsed.data;
    const userId = req.userId;
    const rateLimitKey = `${userId}:${challengeId}`;
    const currentCount = submissionCounts.get(rateLimitKey) || 0;
    if (currentCount >= 20) {
        return res
            .status(429)
            .json({ error: "Maximum 20 submissions per challenge" });
    }
    submissionCounts.set(rateLimitKey, currentCount + 1);
    const mapping = await prisma.contestToChallengeMapping.findFirst({
        where: { challengeId: challengeId },
        include: { challenge: true, contest: true },
    });
    if (!mapping) {
        return res.status(404).json({ error: "Challenge not found" });
    }
    const points = await evaluateSubmissionWithAI(mapping.challenge.title, submission, mapping.challenge.maxPoints);
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
});
// ==================== ADMIN ROUTES ====================
app.post("/admin/contest", adminMiddleware, async (req, res) => {
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
});
app.post("/admin/challenge", adminMiddleware, async (req, res) => {
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
});
app.post("/admin/link/:challengeId/:contestId", adminMiddleware, async (req, res) => {
    const { challengeId, contestId } = req.params;
    const { index } = req.body;
    const mapping = await prisma.contestToChallengeMapping.create({
        data: {
            challengeId: challengeId,
            contestId: contestId,
            index: index || 0,
        },
    });
    res.json({ mapping });
});
app.delete("/admin/link/:challengeId/:contestId", adminMiddleware, async (req, res) => {
    const { challengeId, contestId } = req.params;
    await prisma.contestToChallengeMapping.deleteMany({
        where: {
            challengeId: challengeId,
            contestId: contestId,
        },
    });
    res.json({ success: true });
});
// Background job to save leaderboards to DB after contest ends
setInterval(async () => {
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
}, 60 * 60 * 1000);
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
//# sourceMappingURL=index.js.map