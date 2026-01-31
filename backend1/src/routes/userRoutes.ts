import { Router } from "express";
import jwt from "jsonwebtoken";
import { SignupSchema } from "../types/index.js";
import { sendEmail } from "../services/emailService.js";
import { prisma } from "../services/leaderboardService.js";
import { CONFIG } from "../config/index.js";

const router = Router();

router.post("/signin", async (req, res) => {
  console.log(' User signin request received');
  
  const parsed = SignupSchema.safeParse(req.body);
  
  if (!parsed.success) {
    console.log(' Invalid email format');
    return res.status(400).json({ error: "Invalid email" });
  }

  const { email } = parsed.data;
  console.log(' Processing signin for email:', email);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        role: "User",
      },
    });
    console.log(' User found/created with ID:', user.id);

    const emailToken = jwt.sign(
      { userId: user.id, email: user.email },
      CONFIG.EMAIL_JWT_SECRET,
      { expiresIn: "15m" }
    );

    const magicLink = `${CONFIG.FRONTEND_URL}/signin/verify?token=${emailToken}`;
    console.log(' Generated magic link for user');

    await sendEmail(
      email,
      "DevForces - Sign In",
      `<h1>Welcome to DevForces!</h1><p>Click the link below to sign in:</p><a href="${magicLink}">Sign In</a>`
    );

    console.log(' Signin email processed successfully');
    res.json({ message: "Sign in email sent" });
  } catch (error) {
    console.error(' Error in user signin:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/signin/verify", async (req, res) => {
  console.log(' Email verification request received');
  const { token } = req.query;

  if (!token) {
    console.log(' No token provided for verification');
    return res.status(400).json({ error: "Token required" });
  }

  try {
    console.log(' Verifying email token...');
    const decoded = jwt.verify(token as string, CONFIG.EMAIL_JWT_SECRET) as {
      userId: string;
      email: string;
    };

    console.log(' Email token verified for user:', decoded.userId);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      console.log(' User not found for ID:', decoded.userId);
      return res.status(404).json({ error: "User not found" });
    }

    const authToken = jwt.sign(
      { userId: user.id, role: user.role },
      CONFIG.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(' Authentication successful, sending auth token');
    res.json({ token: authToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    console.log(' Invalid or expired email token:', e);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;