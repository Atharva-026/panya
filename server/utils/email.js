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