import { Request, Response } from "express";
import { sendEnquiryMail } from "../../utils/enquiryMailer";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export const submitEnquiry = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      mobile,
      email,
      companyName,
      area,
      designation,
      message,
      productTitle,
      productCode,
      productId,
    } = req.body || {};

    // basic validation
    if (!String(firstName || "").trim()) return res.status(400).json({ message: "First name required" });
    if (!String(lastName || "").trim()) return res.status(400).json({ message: "Last name required" });
    if (!String(mobile || "").trim() || String(mobile).trim().length < 10)
      return res.status(400).json({ message: "Valid mobile required" });
    if (!String(email || "").trim() || !isValidEmail(email))
      return res.status(400).json({ message: "Valid email required" });
    if (!String(companyName || "").trim()) return res.status(400).json({ message: "Company name required" });
    if (!String(area || "").trim()) return res.status(400).json({ message: "Area required" });
    if (!String(designation || "").trim()) return res.status(400).json({ message: "Designation required" });

    const to = process.env.ENQUIRY_TO_EMAIL || process.env.SMTP_USER || "";
    if (!to) return res.status(500).json({ message: "Enquiry email receiver not configured" });

    const safe = (v: any) => String(v ?? "").trim();

    const subject = `New Enquiry: ${safe(productTitle) || "Product"}${productCode ? ` (${safe(productCode)})` : ""}`;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 10px">New Product Enquiry</h2>
        <p style="margin:0 0 12px;color:#555">
          Received from website enquiry form.
        </p>

        <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:680px">
          <tr><td style="border:1px solid #eee;font-weight:bold;width:220px">Name</td><td style="border:1px solid #eee">${safe(firstName)} ${safe(lastName)}</td></tr>
          <tr><td style="border:1px solid #eee;font-weight:bold">Mobile</td><td style="border:1px solid #eee">${safe(mobile)}</td></tr>
          <tr><td style="border:1px solid #eee;font-weight:bold">Email</td><td style="border:1px solid #eee">${safe(email)}</td></tr>
          <tr><td style="border:1px solid #eee;font-weight:bold">Company</td><td style="border:1px solid #eee">${safe(companyName)}</td></tr>
          <tr><td style="border:1px solid #eee;font-weight:bold">Area</td><td style="border:1px solid #eee">${safe(area)}</td></tr>
          <tr><td style="border:1px solid #eee;font-weight:bold">Designation</td><td style="border:1px solid #eee">${safe(designation)}</td></tr>
          <tr><td style="border:1px solid #eee;font-weight:bold">Message</td><td style="border:1px solid #eee">${safe(message) || "-"}</td></tr>
          <tr><td style="border:1px solid #eee;font-weight:bold">Product</td><td style="border:1px solid #eee">${safe(productTitle) || "-"} ${productCode ? `(${safe(productCode)})` : ""}</td></tr>
          <tr><td style="border:1px solid #eee;font-weight:bold">Product ID</td><td style="border:1px solid #eee">${safe(productId) || "-"}</td></tr>
        </table>

        <p style="margin:14px 0 0;color:#777;font-size:12px">
          Reply directly to this email to contact the customer (Reply-To set).
        </p>
      </div>
    `;

    const text = `
New Product Enquiry

Name: ${safe(firstName)} ${safe(lastName)}
Mobile: ${safe(mobile)}
Email: ${safe(email)}
Company: ${safe(companyName)}
Area: ${safe(area)}
Designation: ${safe(designation)}
Message: ${safe(message) || "-"}

Product: ${safe(productTitle) || "-"} ${productCode ? `(${safe(productCode)})` : ""}
Product ID: ${safe(productId) || "-"}
    `.trim();

    await sendEnquiryMail({
      to,
      subject,
      html,
      text,
      replyTo: safe(email), // ✅ reply-to customer
    });

    return res.status(200).json({ message: "Enquiry submitted successfully" });
  } catch (err: any) {
    console.error("submitEnquiry error:", err);
    return res.status(500).json({ message: "Failed to send enquiry email" });
  }
};
