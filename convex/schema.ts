import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Store user credits and balances
  user_credits: defineTable({
    userId: v.string(),
    credits: v.number(),
    total_purchased: v.number(),
    total_consumed: v.number(),
    last_updated: v.number(),
  })
    .index("by_user", ["userId"]),

  // Store credit transactions (purchases and consumption)
  credit_transactions: defineTable({
    userId: v.string(),
    type: v.union(v.literal("purchase"), v.literal("consumption")),
    amount: v.number(),
    credits_before: v.number(),
    credits_after: v.number(),
    description: v.string(),
    scan_type: v.optional(v.string()), // "basic", "premium" (for future)
    scan_url: v.optional(v.string()),
    package_type: v.optional(v.string()), // "starter", "growth", "pro"
    price_paid: v.optional(v.number()), // USD cents
    created_at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_created_at", ["created_at"]),

  // Store website evaluations
  evaluations: defineTable({
    userId: v.string(),
    url: v.string(),
    domain: v.string(),
    overall_score: v.number(),
    search_visibility_score: v.number(),
    content_quality_score: v.number(),
    technical_seo_score: v.number(),
    ai_optimization_score: v.number(),
    search_performance: v.object({
      keywords_analyzed: v.number(),
      keywords: v.array(v.string()),
      keyword_source: v.string(),
      total_searches: v.number(),
      appearance_rate: v.number(),
      top10_appearances: v.number(),
      average_position: v.number(),
      search_insights: v.array(v.string()),
    }),
    recommendations: v.array(v.string()),
    credits_consumed: v.number(), // Track credits used for this scan
    scan_type: v.string(), // "basic", "premium"
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_url", ["userId", "url"])
    .index("by_domain", ["domain"])
    .index("by_score", ["overall_score"])
    .index("by_created_at", ["created_at"]),

  // Store website maps
  website_maps: defineTable({
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
    credits_consumed: v.number(), // Track credits used for this map scan
    scan_type: v.string(), // "basic", "premium"
    created_at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_url", ["userId", "url"])
    .index("by_domain", ["domain"])
    .index("by_created_at", ["created_at"]),

  // Store AI optimization file checks
  ai_files: defineTable({
    userId: v.string(),
    url: v.string(),
    domain: v.string(),
    files: v.array(v.object({
      path: v.string(),
      exists: v.boolean(),
      content: v.optional(v.string()),
      error: v.optional(v.string()),
      statusCode: v.optional(v.number()),
      contentType: v.optional(v.string()),
    })),
    credits_consumed: v.number(), // Track credits used for this file check
    scan_type: v.string(), // "basic", "premium"
    created_at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_url", ["userId", "url"])
    .index("by_domain", ["domain"])
    .index("by_created_at", ["created_at"]),
});