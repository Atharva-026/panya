import cron from "node-cron";
import { generateMerchantInsight } from "../utils/insightGenerator.js";
import { getOrderSpike } from "../utils/analytics.js";
import { sendSpikeAlertEmail, sendMerchantDigestEmail } from "../utils/email.js";

export function startInsightScheduler() {
  // Full narrative regeneration — weekly, Monday 8am
  cron.schedule("0 8 * * 1", async () => {
    try {
      const insight = await generateMerchantInsight();
      if (process.env.MERCHANT_ALERT_EMAIL) {
        await sendMerchantDigestEmail(process.env.MERCHANT_ALERT_EMAIL, insight.narrative);
      }
    } catch (err) {
      console.error("Weekly insight generation failed:", err);
    }
  });

  // Lightweight spike check — hourly, independent of the weekly narrative
  cron.schedule("0 * * * *", async () => {
    try {
      const spike = await getOrderSpike();
      if (spike.triggered && process.env.MERCHANT_ALERT_EMAIL) {
        await sendSpikeAlertEmail(
          process.env.MERCHANT_ALERT_EMAIL,
          `Order volume in the last hour (${spike.lastHourCount}) is well above the recent average (${spike.avgPerHour}/hr) — worth a quick look.`
        );
      }
    } catch (err) {
      console.error("Hourly spike check failed:", err);
    }
  });

  console.log("Insight scheduler started: weekly narrative digest, hourly spike check");
}