import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);

// ✅ IMPORTANT: default should be false (587)
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false") === "true";

const SMTP_USER = process.env.SMTP_USER || "";
// ✅ remove spaces just in case
const SMTP_PASS = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

const ENQUIRY_TO_EMAIL = process.env.ENQUIRY_TO_EMAIL || SMTP_USER;

// ✅ allow using env SMTP_FROM if provider permits; else fallback to gmail user
const SMTP_FROM = process.env.SMTP_FROM || `${SMTP_USER}`;

if (!SMTP_USER || !SMTP_PASS) {
  console.warn("[mailer] Missing SMTP_USER/SMTP_PASS. Emails will fail.");
}

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,

  // 465 => true, 587 => false
  secure: SMTP_SECURE,

  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },

  // ✅ for 587 STARTTLS
  requireTLS: !SMTP_SECURE,

  tls: {
    minVersion: "TLSv1.2",
  },
});

// ✅ optional but recommended: call on boot
export async function verifyMailer() {
  await transporter.verify();
  console.log("[mailer] SMTP verified:", SMTP_HOST, SMTP_PORT, "secure=", SMTP_SECURE);
}

export async function sendEnquiryMail(args: {
  subject: string;
  html: string;
  replyTo?: string;
  text?: string;
  to?: string; // optional
}) {
  return transporter.sendMail({
    from: SMTP_FROM, // ⚠️ Gmail may override if not same as SMTP_USER
    to: args.to || ENQUIRY_TO_EMAIL,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
  });
}
