import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Pricing configuration
export const PRICING_PACKAGES = {
  starter: {
    name: "Starter Pack",
    credits: 1,
    price: 500, // USD cents (5.00)
    description: "Perfect for testing our service"
  },
  growth: {
    name: "Growth Pack",
    credits: 5,
    price: 2000, // USD cents (20.00)
    description: "Best value for regular users",
    savings: 500 // Saves $5 compared to buying individually
  },
  pro: {
    name: "Pro Pack",
    credits: 15,
    price: 5000, // USD cents (50.00)
    description: "For power users and agencies",
    savings: 2500 // Saves $25 compared to buying individually
  }
} as const;

export const SCAN_COSTS = {
  basic: 1, // 1 credit per basic scan
  premium: 3 // 3 credits per premium scan (for future features)
} as const;

// Get user's current credit balance
export const getUserCredits = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!userCredits) {
      // Initialize user with 0 credits if not found
      return {
        credits: 0,
        total_purchased: 0,
        total_consumed: 0,
        last_updated: Date.now()
      };
    }

    return userCredits;
  },
});

// Initialize or update user credits
export const initializeUserCredits = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!existing) {
      // Give new users 1 free credit
      const newUserId = await ctx.db.insert("user_credits", {
        userId: args.userId,
        credits: 1, // Start with 1 free credit
        total_purchased: 1, // Count the free credit as "purchased"
        total_consumed: 0,
        last_updated: Date.now(),
      });

      // Record the free credit transaction
      await ctx.db.insert("credit_transactions", {
        userId: args.userId,
        type: "purchase",
        amount: 1,
        credits_before: 0,
        credits_after: 1,
        description: "Welcome bonus - Free credit for new users",
        package_type: "free",
        price_paid: 0,
        created_at: Date.now(),
      });

      return newUserId;
    }

    return existing._id;
  },
});

// Add credits to user account (for purchases)
export const addCredits = mutation({
  args: {
    userId: v.string(),
    credits: v.number(),
    packageType: v.string(),
    pricePaid: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Ensure user credits record exists
    let userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!userCredits) {
      const newId = await ctx.db.insert("user_credits", {
        userId: args.userId,
        credits: 0,
        total_purchased: 0,
        total_consumed: 0,
        last_updated: Date.now(),
      });
      
      userCredits = await ctx.db.get(newId);
      if (!userCredits) {
        throw new Error("Failed to initialize user credits");
      }
    }

    const creditsBefore = userCredits.credits;
    const creditsAfter = creditsBefore + args.credits;

    // Update user credits
    await ctx.db.patch(userCredits._id, {
      credits: creditsAfter,
      total_purchased: userCredits.total_purchased + args.credits,
      last_updated: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("credit_transactions", {
      userId: args.userId,
      type: "purchase",
      amount: args.credits,
      credits_before: creditsBefore,
      credits_after: creditsAfter,
      description: args.description,
      package_type: args.packageType,
      price_paid: args.pricePaid,
      created_at: Date.now(),
    });

    return creditsAfter;
  },
});

// Consume credits for a scan
export const consumeCredits = mutation({
  args: {
    userId: v.string(),
    credits: v.number(),
    scanType: v.string(),
    scanUrl: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current credits
    const userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!userCredits || userCredits.credits < args.credits) {
      throw new Error("Insufficient credits");
    }

    const creditsBefore = userCredits.credits;
    const creditsAfter = creditsBefore - args.credits;

    // Update user credits
    await ctx.db.patch(userCredits._id, {
      credits: creditsAfter,
      total_consumed: userCredits.total_consumed + args.credits,
      last_updated: Date.now(),
    });

    // Record transaction
    await ctx.db.insert("credit_transactions", {
      userId: args.userId,
      type: "consumption",
      amount: args.credits,
      credits_before: creditsBefore,
      credits_after: creditsAfter,
      description: args.description,
      scan_type: args.scanType,
      scan_url: args.scanUrl,
      created_at: Date.now(),
    });

    return creditsAfter;
  },
});

// Check if user has enough credits for a scan
export const checkCreditsForScan = query({
  args: {
    userId: v.string(),
    scanType: v.string(),
  },
  handler: async (ctx, args) => {
    const userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const requiredCredits = args.scanType === "premium" ? SCAN_COSTS.premium : SCAN_COSTS.basic;
    const availableCredits = userCredits?.credits || 0;

    return {
      hasEnoughCredits: availableCredits >= requiredCredits,
      availableCredits,
      requiredCredits,
      shortfall: Math.max(0, requiredCredits - availableCredits),
    };
  },
});

// Get user's transaction history
export const getTransactionHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    let query = ctx.db
      .query("credit_transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.type) {
      query = ctx.db
        .query("credit_transactions")
        .withIndex("by_user_type", (q) => q.eq("userId", args.userId).eq("type", args.type as any));
    }

    return await query
      .order("desc")
      .take(limit);
  },
});

// Get credit usage statistics
export const getCreditStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userCredits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const transactions = await ctx.db
      .query("credit_transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const purchases = transactions.filter(t => t.type === "purchase");
    const consumptions = transactions.filter(t => t.type === "consumption");

    // Calculate stats for last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentConsumptions = consumptions.filter(t => t.created_at > thirtyDaysAgo);

    return {
      current_balance: userCredits?.credits || 0,
      total_purchased: userCredits?.total_purchased || 0,
      total_consumed: userCredits?.total_consumed || 0,
      total_purchases: purchases.length,
      total_scans: consumptions.length,
      recent_scans_30d: recentConsumptions.length,
      average_monthly_usage: recentConsumptions.length,
      last_purchase: purchases.length > 0 ? purchases[0].created_at : null,
      last_scan: consumptions.length > 0 ? consumptions[0].created_at : null,
    };
  },
});