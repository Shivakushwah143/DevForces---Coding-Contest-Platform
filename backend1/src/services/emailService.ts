import nodemailer from "nodemailer";
import { CONFIG } from "../config/index.js";

const transporter = nodemailer.createTransport({
  host: CONFIG.EMAIL_HOST,
  port: CONFIG.EMAIL_PORT,
  secure: true,
  auth: {
    user: CONFIG.EMAIL_USER,
    pass: CONFIG.EMAIL_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  console.log(' Preparing to send email to:', to);
  console.log(' Subject:', subject);
  
  if (process.env.NODE_ENV === "production") {
    console.log(' Sending actual email in production');
    await transporter.sendMail({
      from: CONFIG.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(' Email sent successfully');
  } else {
    console.log(' Development mode - logging email instead of sending');
    console.log(' Email to:', to);
    console.log(' Subject:', subject);
    console.log(' HTML content length:', html.length);
  }
}