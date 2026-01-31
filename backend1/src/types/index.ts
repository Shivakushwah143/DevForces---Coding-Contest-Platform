import type { Request } from "express";
import { z } from "zod";

// ==================== SCHEMAS ====================
export const SignupSchema = z.object({
  email: z.string().email(),
});

export const CreateContestSchema = z.object({
  title: z.string(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid datetime string",
  }),
});

export const CreateChallengeSchema = z.object({
  title: z.string(),
  notionDocId: z.string(),
  maxPoints: z.number(),
});

export const SubmissionSchema = z.object({
  submission: z.string(),
});

// ==================== INTERFACES ====================
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export interface LeaderboardEntry {
  userId: string;
  points: number;
  rank: number;
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Contest {
  id: string;
  title: string;
  startTime: Date;
}

export interface Challenge {
  id: string;
  title: string;
  notionDocId: string;
  maxPoints: number;
}