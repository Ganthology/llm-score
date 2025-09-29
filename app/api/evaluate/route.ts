import OpenAI from 'openai';
import Firecrawl from 'firecrawl';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { getCurrentUserId } from '@/lib/auth-utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY || '',
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface EvaluationResult {
  overall_score: number;
  search_visibility: {
    score: number;
    reasoning: string;
  };
  content_quality: {
    score: number;
    reasoning: string;
  };
  technical_seo: {
    score: number;
    reasoning: string;
  };
  ai_optimization: {
    score: number;
    reasoning: string;
  };
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    let userId: string;
    try {
      userId = await getCurrentUserId(request);
    } catch {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { url, siteMap, aiFiles } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract domain from URL and prepare processed URL for search queries
    let domain: string;
    let processedUrl: string;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
      processedUrl = url;
      if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        processedUrl = `https://${processedUrl}`;
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // First, scrape the website content to understand what it actually contains
    console.log('Scraping website content for keyword generation...');
    let websiteContent = '';

    try {
      const scrapeResult = await firecrawl.scrape(processedUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
      });

      if (scrapeResult.markdown) {
        websiteContent = scrapeResult.markdown.substring(0, 3000); // Limit content to first 3000 chars for analysis
      }
    } catch (error) {
      console.error('Error scraping website content:', error);
      // Fallback to basic keyword generation if scraping fails
    }

    // Generate keywords based on actual website content
    const keywordPrompt = websiteContent
      ? `Based on the following website content, generate 10 relevant search keywords or phrases that users might use to find this website. Analyze the content to understand what the site offers, its main topics, and services.

Website Content:
${websiteContent}

Consider:
1. Main topics and services mentioned in the content
2. Key features and offerings
3. Industry-specific terms
4. Problem-solving keywords
5. Brand/product specific terms

Return only a comma-separated list of keywords, no explanations. Example: "web scraping, data extraction, api tools, crawler service, content parsing"`
      : `Based on the website ${domain}, generate 10 relevant search keywords or phrases that users might use to find this website. Consider:

1. The website's domain name and branding
2. Common industry terms related to the domain
3. Popular search queries for similar websites
4. Long-tail keywords that are specific to the site

Return only a comma-separated list of keywords, no explanations. Example: "web scraping, data extraction, api tools, crawler service, content parsing"`;

    const keywordResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: keywordPrompt }],
      temperature: 0.7,
      max_tokens: 200,
    });

    const keywordsText = keywordResponse.choices[0]?.message?.content?.replaceAll('"', '') || '';
    const keywords = keywordsText.split(',').map(k => k.trim()).filter(k => k.length > 0).slice(0, 10);

    console.log('Generated keywords:', keywords);

    // Search for each keyword using Firecrawl and analyze rankings
    let totalSearches = 0;
    let totalResults = 0;
    let top10Appearances = 0;
    let averagePosition = 0;
    let searchInsights: string[] = [];

    for (const keyword of keywords) {
      try {
        const searchResult = await firecrawl.search(keyword, {
          limit: 20, // Get more results to find the site
        });

        if (searchResult.web) {
          const webResults = searchResult.web;
          totalSearches++;

          // Find the website's position in search results
          const siteResult = webResults.find((result: any) =>
            result.url.includes(domain) || domain.includes(result.url.replace(/^https?:\/\//, ''))
          );

          if (siteResult) {
            totalResults++;
            const position = webResults.indexOf(siteResult) + 1;
            averagePosition += position;

            if (position <= 10) {
              top10Appearances++;
            }

            searchInsights.push(`${keyword}: Position ${position}`);
          } else {
            searchInsights.push(`${keyword}: Not found in top 20`);
          }
        }
      } catch (error) {
        console.error(`Error searching for keyword "${keyword}":`, error);
      }
    }

    // Calculate search visibility score
    let searchVisibilityScore = 5;
    let searchReasoning = 'Limited search visibility analysis available.';

    if (totalSearches > 0) {
      const appearanceRate = totalResults / totalSearches;
      const top10Rate = top10Appearances / totalSearches;
      const avgPos = totalResults > 0 ? averagePosition / totalResults : 20;

      if (appearanceRate >= 0.8 && top10Rate >= 0.6 && avgPos <= 5) {
        searchVisibilityScore = 9;
        searchReasoning = `Excellent search visibility: Appears in ${Math.round(appearanceRate * 100)}% of searches, ${Math.round(top10Rate * 100)}% in top 10, average position ${avgPos.toFixed(1)}.`;
      } else if (appearanceRate >= 0.6 && top10Rate >= 0.4 && avgPos <= 10) {
        searchVisibilityScore = 7;
        searchReasoning = `Good search visibility: Appears in ${Math.round(appearanceRate * 100)}% of searches, ${Math.round(top10Rate * 100)}% in top 10, average position ${avgPos.toFixed(1)}.`;
      } else if (appearanceRate >= 0.4 && avgPos <= 15) {
        searchVisibilityScore = 6;
        searchReasoning = `Moderate search visibility: Appears in ${Math.round(appearanceRate * 100)}% of searches, average position ${avgPos.toFixed(1)}.`;
      } else if (appearanceRate >= 0.2) {
        searchVisibilityScore = 5;
        searchReasoning = `Fair search visibility: Appears in ${Math.round(appearanceRate * 100)}% of searches, average position ${avgPos.toFixed(1)}.`;
      } else {
        searchVisibilityScore = 3;
        searchReasoning = `Poor search visibility: Rarely appears in search results, average position ${avgPos.toFixed(1)}.`;
      }
    }

    // Enhanced search visibility analysis using AI + actual search data
    const enhancedSearchPrompt = `Based on the actual search performance data for ${domain}, provide additional insights about the website's search visibility and AI compatibility.

Search Performance Summary:
- Keywords analyzed: ${keywords.length} (generated from ${websiteContent ? 'actual website content' : 'domain analysis'})
- Appearance rate: ${totalSearches > 0 ? Math.round((totalResults / totalSearches) * 100) : 0}%
- Top 10 appearances: ${top10Appearances}
- Average position: ${totalResults > 0 ? (averagePosition / totalResults).toFixed(1) : 'N/A'}

Consider:
1. How does this search performance translate to AI/LLM discoverability?
2. What does this say about the website's SEO and content strategy?
3. Any recommendations for improving search visibility?

Provide a brief analysis (2-3 sentences) of the search performance and AI compatibility.`;

    let enhancedSearchReasoning = '';
    try {
      const enhancedResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: enhancedSearchPrompt }],
        temperature: 0.3,
        max_tokens: 300,
      });

      enhancedSearchReasoning = enhancedResponse.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error getting enhanced search analysis:', error);
      enhancedSearchReasoning = 'Additional AI analysis not available.';
    }

    const searchScore = searchVisibilityScore;

    // Evaluate content quality based on site map data
    // Only check HTML pages for titles/descriptions, exclude static assets
    let contentScore = 5;
    let contentReasoning = 'Moderate content structure detected.';

    if (siteMap && siteMap.length > 0) {
      // Filter out non-HTML pages that shouldn't have titles
      const htmlPages = siteMap.filter((link: any) => {
        const url = link.url || '';
        // Exclude file extensions that don't need HTML titles
        const excludeExtensions = ['.txt', '.md', '.css', '.js', '.json', '.xml', '.csv', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.mp3', '.mp4', '.pdf', '.zip', '.exe', '.bin'];
        const hasExcludedExtension = excludeExtensions.some(ext => url.toLowerCase().endsWith(ext));

        // Also exclude URLs that are clearly assets (contain asset paths)
        const isAssetUrl = /\/(assets?|static|media|images?|css|js|files?|downloads?)\//i.test(url);

        return !hasExcludedExtension && !isAssetUrl;
      });

      if (htmlPages.length === 0) {
        contentScore = 7;
        contentReasoning = 'No HTML pages detected to evaluate for titles and descriptions.';
      } else {
        const pagesWithTitles = htmlPages.filter((link: any) => link.title).length;
        const pagesWithDescriptions = htmlPages.filter((link: any) => link.description).length;
        const titleRatio = pagesWithTitles / htmlPages.length;
        const descRatio = pagesWithDescriptions / htmlPages.length;

        if (titleRatio > 0.8 && descRatio > 0.8) {
          contentScore = 9;
          contentReasoning = 'Excellent content structure with comprehensive titles and descriptions on HTML pages.';
        } else if (titleRatio > 0.6 && descRatio > 0.6) {
          contentScore = 7;
          contentReasoning = 'Good content structure with most HTML pages having titles and descriptions.';
        } else if (titleRatio > 0.4 && descRatio > 0.4) {
          contentScore = 6;
          contentReasoning = 'Moderate content structure, some HTML pages missing metadata.';
        } else {
          contentScore = 4;
          contentReasoning = 'Poor content structure, many HTML pages missing essential metadata.';
        }
      }
    }

    // Evaluate technical SEO based on available data
    let technicalScore = 5;
    let technicalReasoning = 'Basic technical SEO assessment.';

    const hasSitemap = siteMap && siteMap.length > 10;
    const hasStructuredContent = siteMap && siteMap.some((link: any) => link.description && link.description.length > 50);

    if (hasSitemap && hasStructuredContent) {
      technicalScore = 8;
      technicalReasoning = 'Good technical foundation with substantial content and proper structure.';
    } else if (hasSitemap) {
      technicalScore = 6;
      technicalReasoning = 'Adequate technical setup with content discovery capabilities.';
    } else {
      technicalScore = 4;
      technicalReasoning = 'Limited technical SEO implementation detected.';
    }

    // Evaluate AI optimization based on AI files
    let aiScore = 3;
    let aiReasoning = 'No AI optimization files detected.';

    if (aiFiles) {
      const existingFiles = aiFiles.filter((file: any) => file.exists);
      if (existingFiles.length >= 3) {
        aiScore = 9;
        aiReasoning = 'Excellent AI optimization with multiple configuration files.';
      } else if (existingFiles.length >= 1) {
        aiScore = 7;
        aiReasoning = 'Good AI optimization with some configuration files present.';
      } else {
        aiScore = 4;
        aiReasoning = 'Minimal AI optimization, missing standard configuration files.';
      }
    }

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (searchScore * 0.4) + (contentScore * 0.3) + (technicalScore * 0.2) + (aiScore * 0.1)
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (searchScore < 7) {
      recommendations.push('Improve AI search visibility by optimizing for semantic search and AI discovery');
    }
    if (contentScore < 7) {
      recommendations.push('Add comprehensive titles and meta descriptions to all pages');
    }
    if (technicalScore < 7) {
      recommendations.push('Implement proper technical SEO foundations and content structure');
    }
    if (aiScore < 7) {
      recommendations.push('Add AI optimization files (/llms.txt, /llm.txt, /ai.txt, etc.) for better AI compatibility');
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent optimization! Continue monitoring and maintaining high standards.');
    }

    const result: EvaluationResult = {
      overall_score: overallScore,
      search_visibility: {
        score: searchScore,
        reasoning: `${searchReasoning}\n\n${enhancedSearchReasoning}`,
      },
      content_quality: {
        score: contentScore,
        reasoning: contentReasoning,
      },
      technical_seo: {
        score: technicalScore,
        reasoning: technicalReasoning,
      },
      ai_optimization: {
        score: aiScore,
        reasoning: aiReasoning,
      },
      recommendations,
    };

    // Add search performance details to the response
    const extendedResult = {
      ...result,
      search_performance: {
        keywords_analyzed: keywords.length,
        keywords: keywords,
        keyword_source: websiteContent ? 'content_analysis' : 'domain_analysis',
        total_searches: totalSearches,
        appearance_rate: totalSearches > 0 ? (totalResults / totalSearches) : 0,
        top10_appearances: top10Appearances,
        average_position: totalResults > 0 ? (averagePosition / totalResults) : 0,
        search_insights: searchInsights,
      },
    };

    // Save evaluation to Convex
    try {
      await convex.mutation(api.evaluations.saveEvaluation, {
        userId: userId as any,
        url: processedUrl,
        domain,
        overall_score: result.overall_score,
        search_visibility_score: result.search_visibility.score,
        content_quality_score: result.content_quality.score,
        technical_seo_score: result.technical_seo.score,
        ai_optimization_score: result.ai_optimization.score,
        search_performance: extendedResult.search_performance,
        recommendations: result.recommendations,
      });
    } catch (convexError) {
      console.error('Error saving evaluation to Convex:', convexError);
      // Don't fail the request if Convex save fails
    }

    return NextResponse.json({
      success: true,
      evaluation: extendedResult,
    });

  } catch (error) {
    console.error('Error evaluating website:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}