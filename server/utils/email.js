import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function orderConfirmationHtml(order) {
  const firstName = (order.customerName || "there").split(" ")[0];
  const isAuto = order.isAutoOrder;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const rows = order.items.map((item) => `
    <tr>
      <td style="padding:10px 0; font-size:14px; color:#2B2540; border-bottom:1px solid #E8E0C8;">${item.name}</td>
      <td align="center" style="padding:10px 0; font-size:14px; color:#5C5470; border-bottom:1px solid #E8E0C8;">${item.qty}</td>
      <td align="right" style="padding:10px 0; font-size:14px; color:#2B2540; border-bottom:1px solid #E8E0C8;">₹${(item.price * item.qty).toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panya Order Confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF6EA; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF6EA; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#FFFDF6; border:1px solid #E8E0C8; border-radius:16px; overflow:hidden;">

          <tr>
            <td align="center" style="background:linear-gradient(135deg,#FFF6CF,#FFE873); padding:32px 24px 24px;">
              <div style="font-family:Georgia,'Times New Roman',serif; font-size:36px; color:#2B2540; font-weight:700; line-height:1;">पण्य</div>
              ${isAuto ? `<div style="display:inline-block; margin-top:12px; background-color:#8B7FC4; color:#ffffff; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; padding:5px 12px; border-radius:999px;">Auto-Order</div>` : ""}
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px;">
              <div style="font-size:19px; font-weight:700; color:#2B2540; margin-bottom:6px;">
                ${isAuto ? `Your standing order was placed, ${firstName}` : `Order confirmed, ${firstName}`}
              </div>
              <div style="font-size:14px; color:#5C5470; line-height:1.5;">
                ${isAuto
                  ? "This purchase was completed automatically based on the shopping rule you set — reasoned through and placed within your budget and spend limits."
                  : "Thanks for shopping with Panya — here's your receipt."}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px; color:#948C9E;">Order ID</td>
                  <td align="right" style="font-size:12px; color:#948C9E;">Date</td>
                </tr>
                <tr>
                  <td style="font-size:13px; color:#2B2540; font-weight:600;">${order.razorpayOrderId || order._id}</td>
                  <td align="right" style="font-size:13px; color:#2B2540; font-weight:600;">${orderDate}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#948C9E; padding-bottom:8px; border-bottom:2px solid #E8E0C8;">Item</td>
                  <td align="center" style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#948C9E; padding-bottom:8px; border-bottom:2px solid #E8E0C8;">Qty</td>
                  <td align="right" style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#948C9E; padding-bottom:8px; border-bottom:2px solid #E8E0C8;">Amount</td>
                </tr>
                ${rows}
                <tr>
                  <td colspan="2" style="padding:14px 0 0; font-size:15px; font-weight:700; color:#2B2540;">Total</td>
                  <td align="right" style="padding:14px 0 0; font-size:15px; font-weight:700; color:#2B2540;">₹${order.amount.toLocaleString("en-IN")}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:32px 32px 40px;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard" style="display:inline-block; background-color:#8B7FC4; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:12px 26px; border-radius:12px;">
                View Your Orders
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 32px 28px;">
              <div style="font-size:12px; color:#948C9E;">Thank you for shopping with Panya.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(to, order) {
  const transporter = getTransporter();
  const itemsList = order.items.map((i) => `${i.name} x${i.qty} — ₹${i.price * i.qty}`).join("\n");

  const mailOptions = {
    from: `"Panya" <${process.env.GMAIL_USER}>`,
    to,
    subject: order.isAutoOrder ? "Your Panya auto-order was placed" : "Your Panya order is confirmed",
    html: orderConfirmationHtml(order),
    text: `Hi,\n\n${order.isAutoOrder ? "Your standing order was placed automatically." : "Your order has been confirmed."}\n\n${itemsList}\n\nTotal: ₹${order.amount}\nOrder ID: ${order.razorpayOrderId || order._id}\n\nThank you for shopping with Panya.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${to}`);
  } catch (err) {
    console.error("Email sending failed:", err.message);
  }
}

export async function sendSpikeAlertEmail(to, message) {
  const transporter = getTransporter();

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
  const transporter = getTransporter();

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

function welcomeEmailHtml(name) {
  const firstName = name.split(" ")[0];
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Panya</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF6EA; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF6EA; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#FFFDF6; border:1px solid #E8E0C8; border-radius:16px; overflow:hidden;">

          <tr>
            <td align="center" bgcolor="#FFE873" style="background-color:#FFE873; background-image:linear-gradient(135deg,#FFF6CF,#FFE873); padding:40px 24px 32px;">
              <div style="font-family:'Kalam','Segoe Print','Bradley Hand',cursive; font-size:46px; color:#2B2540; font-weight:700; line-height:1; letter-spacing:0.5px; text-shadow:1px 1px 0 rgba(255,255,255,0.6);">पण्य</div>
              <div style="font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#5C5470; margin-top:10px;">PANYA</div>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 8px;">
              <div style="font-size:20px; font-weight:700; color:#2B2540; margin-bottom:14px;">Welcome, ${firstName}</div>
              <div style="font-size:15px; line-height:1.6; color:#5C5470;">
                Panya is an AI shopping assistant that finds what you're looking for, suggests
                genuinely fitting pairings, and completes payment on the spot — by typing, or
                just by talking, in English, Hindi, Marathi, or Kannada.
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 40px;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/chat" style="display:inline-block; background-color:#8B7FC4; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:13px 28px; border-radius:12px;">
                Start Shopping
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 32px 28px;">
              <div style="font-size:12px; color:#948C9E;">You're receiving this because you just signed in to Panya.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(to, name) {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"Panya" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Welcome to Panya",
    html: welcomeEmailHtml(name),
    text: `Welcome to Panya, ${name.split(" ")[0]}!\n\nPanya is an AI shopping assistant that finds what you're looking for, suggests fitting pairings, and completes payment on the spot — by typing or talking, in English, Hindi, Marathi, or Kannada.\n\nStart shopping: ${process.env.FRONTEND_URL || "http://localhost:5173"}/chat`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  } catch (err) {
    console.error("Welcome email failed:", err.message);
  }
}