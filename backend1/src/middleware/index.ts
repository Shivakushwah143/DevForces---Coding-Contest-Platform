import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../types/index.js";
import { CONFIG } from "../config/index.js";

export function userMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  console.log(' User middleware triggered for:', req.path);
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    console.log(' No token provided');
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    console.log(' Verifying JWT token...');
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    console.log(' Token verified - User ID:', decoded.userId, 'Role:', decoded.role);
    next();
  } catch (e) {
    console.log(' Invalid token:', e);
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  console.log(' Admin middleware triggered for:', req.path);
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    console.log(' No token provided for admin route');
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    console.log(' Verifying admin JWT token...');
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as { userId: string; role: string };
    
    if (decoded.role !== "Admin") {
      console.log('Admin access denied for user:', decoded.userId, 'with role:', decoded.role);
      return res.status(403).json({ error: "Admin access required" });
    }
    
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    console.log(' Admin access granted for user:', decoded.userId);
    next();
  } catch (e) {
    console.log(' Invalid admin token:', e);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Request logging middleware
export function requestLogger(req: any, res: Response, next: NextFunction) {
  console.log(` ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
}