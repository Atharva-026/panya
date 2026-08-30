import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ChatQueryLog from "../models/ChatQueryLog.js";

export async function getRevenueByDay(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await Order.aggregate([
    { $match: { status: "paid", createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((r) => ({ date: r._id, revenue: r.revenue, orders: r.orders }));
}

export async function getTopProducts(days = 30, limit = 5) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await Order.aggregate([
    { $match: { status: "paid", createdAt: { $gte: since } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        unitsSold: { $sum: "$items.qty" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
  ]);

  return rows.map((r) => ({ name: r._id, unitsSold: r.unitsSold, revenue: r.revenue }));
}

export async function getRevenueByCategory(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const paidOrders = await Order.find({ status: "paid", createdAt: { $gte: since } });
  const products = await Product.find();
  const categoryByProductId = new Map(products.map((p) => [p._id.toString(), p.category]));

  const totals = {};
  for (const order of paidOrders) {
    for (const item of order.items) {
      const category = categoryByProductId.get(item.productId?.toString()) || "Other";
      totals[category] = (totals[category] || 0) + item.price * item.qty;
    }
  }

  return Object.entries(totals).map(([category, revenue]) => ({ category, revenue }));
}

export async function getRestockUrgency(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const paidOrders = await Order.find({ status: "paid", createdAt: { $gte: since } });
  const unitsSoldByProduct = {};
  for (const order of paidOrders) {
    for (const item of order.items) {
      const key = item.productId?.toString();
      if (!key) continue;
      unitsSoldByProduct[key] = (unitsSoldByProduct[key] || 0) + item.qty;
    }
  }

  const products = await Product.find();
  const rows = products.map((p) => {
    const unitsSold = unitsSoldByProduct[p._id.toString()] || 0;
    const dailyRate = unitsSold / days;
    const daysOfStockLeft = dailyRate > 0 ? p.stock / dailyRate : null;
    return {
      productId: p._id,
      name: p.name,
      stock: p.stock,
      unitsSold,
      daysOfStockLeft,
    };
  });

  return rows
    .filter((r) => r.daysOfStockLeft !== null)
    .sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft)
    .slice(0, 5);
}

export async function getUpsellStats() {
  const paidOrders = await Order.find({ status: "paid" });
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const upsellRevenue = paidOrders.filter((o) => o.isUpsell).reduce((sum, o) => sum + o.amount, 0);
  return {
    totalRevenue,
    upsellRevenue,
    upsellShare: totalRevenue > 0 ? Math.round((upsellRevenue / totalRevenue) * 100) : 0,
  };
}

export async function getUnmatchedQueries(days = 7, limit = 50) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await ChatQueryLog.find({ matched: false, timestamp: { $gte: since } })
    .sort({ timestamp: -1 })
    .limit(limit);

  return rows.map((r) => r.message);
}

// Simple threshold check, not ML — is this hour's order volume unusual
// compared to the trailing week's hourly average. Cheap and explainable.
export async function getOrderSpike() {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const lastHourCount = await Order.countDocuments({
    status: "paid",
    createdAt: { $gte: hourAgo, $lte: now },
  });

  const pastWeekCount = await Order.countDocuments({
    status: "paid",
    createdAt: { $gte: weekAgo, $lt: hourAgo },
  });

  const hoursInWeek = (hourAgo - weekAgo) / (1000 * 60 * 60);
  const avgPerHour = pastWeekCount / hoursInWeek;

  const triggered = avgPerHour >= 1 && lastHourCount >= avgPerHour * 3;

  return {
    triggered,
    lastHourCount,
    avgPerHour: Math.round(avgPerHour * 10) / 10,
  };
}