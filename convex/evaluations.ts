import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store or update an evaluation
export const saveEvaluation = mutation({
  args: {
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
    credits_consumed: v.number(),
    scan_type: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if evaluation already exists for this user and URL
    const existing = await ctx.db
      .query("evaluations")
      .withIndex("by_user_url", (q) => q.eq("userId", args.userId).eq("url", args.url))
      .first();

    if (existing) {
      // Update existing evaluation
      await ctx.db.patch(existing._id, {
        ...args,
        updated_at: now,
      });
      return existing._id;
    } else {
      // Create new evaluation
      return await ctx.db.insert("evaluations", {
        ...args,
        created_at: now,
        updated_at: now,
      });
    }
  },
});

// Get evaluation by user and URL
export const getEvaluation = query({
  args: { userId: v.string(), url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evaluations")
      .withIndex("by_user_url", (q) => q.eq("userId", args.userId).eq("url", args.url))
      .first();
  },
});

// Get evaluations by user
export const getEvaluationsByUser = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("evaluations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get evaluations by domain
export const getEvaluationsByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evaluations")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .collect();
  },
});

// Get recent evaluations (for admin purposes)
export const getRecentEvaluations = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("evaluations")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
  },
});

// Get evaluations by score range
export const getEvaluationsByScore = query({
  args: {
    minScore: v.optional(v.number()),
    maxScore: v.optional(v.number()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const minScore = args.minScore || 0;
    const maxScore = args.maxScore || 10;
    const limit = args.limit || 50;

    return await ctx.db
      .query("evaluations")
      .filter((q) =>
        q.and(
          q.gte(q.field("overall_score"), minScore),
          q.lte(q.field("overall_score"), maxScore)
        )
      )
      .order("desc")
      .take(limit);
  },
});

// Get evaluations by user grouped by domain
export const getEvaluationsByUserGroupedByDomain = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Group by domain and sort by creation date
    const grouped: { [domain: string]: any[] } = {};
    
    for (const evaluation of evaluations) {
      if (!grouped[evaluation.domain]) {
        grouped[evaluation.domain] = [];
      }
      grouped[evaluation.domain].push(evaluation);
    }

    // Sort each domain's evaluations by creation date (newest first)
    for (const domain in grouped) {
      grouped[domain].sort((a, b) => b.created_at - a.created_at);
    }

    return grouped;
  },
});

// Get domain statistics for a user
export const getDomainStats = query({
  args: { userId: v.string(), domain: v.string() },
  handler: async (ctx, args) => {
    const evaluations = await ctx.db
      .query("evaluations")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("domain"), args.domain)
        )
      )
      .order("desc")
      .collect();

    if (evaluations.length === 0) {
      return null;
    }

    const latest = evaluations[0];
    const oldest = evaluations[evaluations.length - 1];
    
    const avgScore = evaluations.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / evaluations.length;
    const improvement = evaluations.length > 1 ? latest.overall_score - oldest.overall_score : 0;

    return {
      domain: args.domain,
      totalEvaluations: evaluations.length,
      latestScore: latest.overall_score,
      averageScore: Math.round(avgScore * 10) / 10,
      improvement: Math.round(improvement * 10) / 10,
      firstEvaluated: oldest.created_at,
      lastEvaluated: latest.created_at,
      evaluations: evaluations.slice(0, 5), // Return only the 5 most recent
    };
  },
});