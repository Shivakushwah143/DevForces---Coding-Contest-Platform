DevForces – Coding Contest Platform 
<img width="1907" height="830" alt="Screenshot 2026-01-26 221405" src="https://github.com/user-attachments/assets/64c255fb-d7e0-4554-9b63-30cfb77f9b43" />


DevForces, a coding contest platform with real-time leaderboards, AI-assisted evaluation, email magic-link auth, and Notion-based problem statements.

This service powers contests, challenges, submissions, scoring, and rankings.
<img width="1919" height="800" alt="Screenshot 2026-01-26 215744" src="https://github.com/user-attachments/assets/9ac94fec-2263-40ff-a4d1-e926e07285b6" />



Tech Stack

Node.js + TypeScript

Express

Prisma + PostgreSQL

Redis (Upstash)

JWT Authentication

Email Magic Links (Nodemailer)

Groq AI (LLM-based evaluation)

Zod (Request validation)

Frontend is built with React + Tailwind CSS
Problem statements are managed via Notion


Core Features

Email-based passwordless authentication

Role-based access (User / Admin)

Contest & challenge management

AI-based submission evaluation

Real-time leaderboard using Redis
<img width="1630" height="628" alt="Screenshot 2026-01-26 220250" src="https://github.com/user-attachments/assets/2fdc0259-faf9-44d9-bf97-73884ba71302" />

Persistent leaderboard snapshot after contest ends

Rate-limited submissions

Notion document integration for problem descriptions


Authentication Flow

User enters email

Magic link is sent via email

User verifies link

Backend returns JWT auth token

Token used for all protected routes

API Overview
User

POST /user/signin

GET /user/signin/verify

Contest

GET /contest/active

GET /contest/finished

GET /contest/:contestId

GET /contest/:contestId/:challengeId

POST /contest/submit/:challengeId

GET /contest/leaderboard/:contestId

Admin

POST /admin/contest

POST /admin/challenge

POST /admin/link/:challengeId/:contestId

DELETE /admin/link/:challengeId/:contestId

AI Evaluation Logic

Uses Groq LLM

Submissions are truncated to avoid token overflow

Model returns only a numeric score

Automatic fallback scoring if AI fails

Final score is always clamped within max points

Leaderboard Strategy

Live contests: Redis sorted sets

Finished contests: Persisted to PostgreSQL

Background job runs every hour to finalize leaderboards

Frontend Integration

React + Tailwind

Uses JWT from backend

Contest problems rendered from Notion docs

Leaderboard updates in near real-time

Security Notes

JWT-based auth (no sessions)

Admin-only routes protected

Submission rate limiting (20 per challenge)

No raw secrets exposed to client

CORS enabled intentionally







