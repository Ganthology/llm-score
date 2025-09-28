import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    created_at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_url", ["userId", "url"])
    .index("by_domain", ["domain"])
    .index("by_created_at", ["created_at"]),
});