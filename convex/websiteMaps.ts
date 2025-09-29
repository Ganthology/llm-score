import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store or update website map
export const saveWebsiteMap = mutation({
  args: {
    userId: v.id("users"),
    url: v.string(),
    domain: v.string(),
    links: v.array(v.object({
      url: v.string(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
    })),
    total_links: v.number(),
    html_pages: v.number(),
    missing_titles: v.number(),
    missing_descriptions: v.number(),
    credits_consumed: v.number(),
    scan_type: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if map already exists for this user and URL
    const existing = await ctx.db
      .query("website_maps")
      .withIndex("by_user_url", (q) => q.eq("userId", args.userId).eq("url", args.url))
      .first();

    if (existing) {
      // Update existing map
      await ctx.db.patch(existing._id, {
        ...args,
        created_at: now,
      });
      return existing._id;
    } else {
      // Create new map
      return await ctx.db.insert("website_maps", {
        ...args,
        created_at: now,
      });
    }
  },
});

// Get website map by user and URL
export const getWebsiteMap = query({
  args: { userId: v.id("users"), url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("website_maps")
      .withIndex("by_user_url", (q) => q.eq("userId", args.userId).eq("url", args.url))
      .first();
  },
});

// Get website maps by user
export const getWebsiteMapsByUser = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("website_maps")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get website maps by domain
export const getWebsiteMapsByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("website_maps")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .collect();
  },
});