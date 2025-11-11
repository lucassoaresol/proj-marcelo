import nodemailer from "nodemailer";

import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

export default transporter;
