const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_USER) {
    console.log(`[Email skipped - no SMTP configured] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || "Anmool Dairy <noreply@anmool.com>",
    to,
    subject,
    html,
  });
  return info;
}

function orderCancelledEmail(userName, orderId, reason) {
  const subject = `Order #${orderId.slice(-8).toUpperCase()} Cancelled — Anmool Dairy`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a3567, #0d1f3c); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Anmool Dairy</h1>
        <p style="color: rgba(255,255,255,0.6); margin: 5px 0 0;">Farm Fresh Since 1965</p>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 60px; height: 60px; background: #fef2f2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px;">❌</span>
          </div>
        </div>
        <h2 style="color: #1a3567; text-align: center; margin: 0 0 10px;">Order Cancelled</h2>
        <p style="color: #6b7280; text-align: center; margin: 0 0 20px;">Hi ${userName}, your order has been cancelled by the admin.</p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; color: #374151;"><strong>Order ID:</strong> #${orderId.slice(-8).toUpperCase()}</p>
          <p style="margin: 0; color: #dc2626;"><strong>Reason:</strong> ${reason || "No reason provided"}</p>
        </div>
        <p style="color: #6b7280; text-align: center; font-size: 14px;">If you paid with coins, your balance has been refunded. If you have questions, please contact us.</p>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">© ${new Date().getFullYear()} Anmool Dairy & Farms. All rights reserved.</p>
    </div>
  `;
  return { subject, html };
}

module.exports = { sendMail, orderCancelledEmail };
