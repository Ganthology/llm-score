import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store or update AI files check
export const saveAIFiles = mutation({
  args: {
    userId: v.string(),
    url: v.string(),
    domain: v.string(),
    files: v.array(v.object({
      path: v.string(),
      exists: v.boolean(),
      content: v.optional(v.string()),
      error: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if AI files check already exists for this user and URL
    const existing = await ctx.db
      .query("ai_files")
      .withIndex("by_user_url", (q) => q.eq("userId", args.userId).eq("url", args.url))
      .first();

    if (existing) {
      // Update existing AI files check
      await ctx.db.patch(existing._id, {
        ...args,
        created_at: now,
      });
      return existing._id;
    } else {
      // Create new AI files check
      return await ctx.db.insert("ai_files", {
        ...args,
        created_at: now,
      });
    }
  },
});

// Get AI files by user and URL
export const getAIFiles = query({
  args: { userId: v.id("users"), url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ai_files")
      .withIndex("by_user_url", (q) => q.eq("userId", args.userId).eq("url", args.url))
      .first();
  },
});

// Get AI files by user
export const getAIFilesByUser = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("ai_files")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get AI files by domain
export const getAIFilesByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ai_files")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .collect();
  },
});