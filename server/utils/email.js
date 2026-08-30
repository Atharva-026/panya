import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOrderConfirmationEmail(to, order) {
  const itemsList = order.items.map((i) => `${i.name} x${i.qty} — ₹${i.price * i.qty}`).join("\n");

  const mailOptions = {
    from: `"Panya" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your Panya order is confirmed",
    text: `Hi,

Your order has been confirmed.

${itemsList}

Total: ₹${order.amount}
Order ID: ${order.razorpayOrderId}

Thank you for shopping with Panya.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${to}`);
  } catch (err) {
    console.error("Email sending failed:", err.message);
  }
}

export async function sendSpikeAlertEmail(to, message) {
  const mailOptions = {
    from: `"Panya" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Order volume alert — Panya",
    text: `Heads up:\n\n${message}\n\nCheck your merchant dashboard for details.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Spike alert email sent to ${to}`);
  } catch (err) {
    console.error("Spike alert email failed:", err.message);
  }
}

export async function sendMerchantDigestEmail(to, narrative) {
  const bullets = narrative.map((line) => `- ${line}`).join("\n");

  const mailOptions = {
    from: `"Panya" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your weekly Panya insights",
    text: `Here's what's happening in your store this week:\n\n${bullets}\n\nFull details on your merchant dashboard.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Weekly digest email sent to ${to}`);
  } catch (err) {
    console.error("Weekly digest email failed:", err.message);
  }
}