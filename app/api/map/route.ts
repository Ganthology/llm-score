import Firecrawl from 'firecrawl';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { getCurrentUserId } from '@/lib/auth-utils';

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY || '',
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    const { url, scanType = 'basic' } = await request.json();

    // Check if user has enough credits
    const creditCheck = await convex.query(api.credits.checkCreditsForScan, {
      userId,
      scanType,
    });

    if (!creditCheck.hasEnoughCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          details: {
            required: creditCheck.requiredCredits,
            available: creditCheck.availableCredits,
            shortfall: creditCheck.shortfall,
          }
        },
        { status: 402 } // Payment Required
      );
    }

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const result = await firecrawl.map(url, {
      limit: 100,
      sitemap: 'include',
    });

    // Check if result has links (successful response)
    if (!result || !Array.isArray(result.links)) {
      return NextResponse.json(
        { error: 'Failed to map website' },
        { status: 500 }
      );
    }

    // Consume credits for the scan
    try {
      await convex.mutation(api.credits.consumeCredits, {
        userId,
        credits: creditCheck.requiredCredits,
        scanType,
        scanUrl: url,
        description: `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} website map scan`,
      });
    } catch (creditError) {
      console.error('Error consuming credits:', creditError);
      return NextResponse.json(
        { error: 'Failed to consume credits' },
        { status: 500 }
      );
    }

    // Save to Convex
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Calculate HTML pages and missing metadata
      const htmlPages = result.links.filter((link: any) => {
        const linkUrl = link.url || '';
        const excludeExtensions = ['.txt', '.md', '.css', '.js', '.json', '.xml', '.csv', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.mp3', '.mp4', '.pdf', '.zip', '.exe', '.bin'];
        const hasExcludedExtension = excludeExtensions.some(ext => linkUrl.toLowerCase().endsWith(ext));
        const isAssetUrl = /\/(assets?|static|media|images?|css|js|files?|downloads?)\//i.test(linkUrl);
        return !hasExcludedExtension && !isAssetUrl;
      });

      const missingTitles = htmlPages.filter((link: any) => !link.title).length;
      const missingDescriptions = htmlPages.filter((link: any) => !link.description).length;

      await convex.mutation(api.websiteMaps.saveWebsiteMap, {
        userId: userId as any,
        url,
        domain,
        links: result.links,
        total_links: result.links.length,
        html_pages: htmlPages.length,
        missing_titles: missingTitles,
        missing_descriptions: missingDescriptions,
        credits_consumed: creditCheck.requiredCredits,
        scan_type: scanType,
      });
    } catch (convexError) {
      console.error('Error saving to Convex:', convexError);
      // Don't fail the request if Convex save fails
    }

    return NextResponse.json({
      success: true,
      links: result.links,
      totalLinks: result.links.length,
    });

  } catch (error) {
    console.error('Error mapping website:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}