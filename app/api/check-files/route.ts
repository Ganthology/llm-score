import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { getCurrentUserId } from '@/lib/auth-utils';

const AI_FILES = [
  '/agents.txt',
  '/agent.txt',
  '/llm.txt',
  '/llms.txt'
];

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface FileCheck {
  path: string;
  exists: boolean;
  content?: string;
  error?: string;
  statusCode?: number;
  contentType?: string;
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

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let baseUrl: URL;
    try {
      baseUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const fileChecks: FileCheck[] = [];

    // Check each AI file
    for (const filePath of AI_FILES) {
      try {
        const fileUrl = `${baseUrl.origin}${filePath}`;
        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'LLMScore/1.0 (AI Optimization Checker)',
            'Accept': 'text/plain, text/*, */*',
          },
        });

        const contentType = response.headers.get('content-type') || '';
        const statusCode = response.status;
        
        const fileCheck: FileCheck = {
          path: filePath,
          exists: false, // Will be determined based on analysis below
          statusCode,
          contentType,
        };

        if (response.ok) {
          // Status 200-299 - file exists
          try {
            const content = await response.text();
            
            // Additional validation for legitimate text files
            if (isLegitimateTextFile(content, contentType, filePath)) {
              fileCheck.exists = true;
              fileCheck.content = content;
            } else {
              fileCheck.exists = false;
              fileCheck.error = 'File appears to be a generated error page or invalid content';
            }
          } catch (contentError) {
            fileCheck.exists = false;
            fileCheck.error = 'Could not read content';
          }
        } else if (response.status === 404) {
          // Status 404 - check if it's a legitimate 404 or an error page
          try {
            const content = await response.text();
            
            if (isLegitimate404(content, contentType)) {
              fileCheck.exists = false;
              fileCheck.error = 'File not found (404)';
            } else if (isProbablyErrorPage(content)) {
              fileCheck.exists = false;
              fileCheck.error = 'File not found - website error page';
            } else {
              // Unexpected 404 response
              fileCheck.exists = false;
              fileCheck.error = 'File not found (unexpected 404 response)';
            }
          } catch {
            fileCheck.exists = false;
            fileCheck.error = 'File not found (404)';
          }
        } else if (response.status >= 400) {
          // Other client/server errors
          fileCheck.exists = false;
          fileCheck.error = `Server error (${response.status})`;
        } else {
          // Redirects or other status codes
          fileCheck.exists = false;
          fileCheck.error = `Unexpected response (${response.status})`;
        }

        fileChecks.push(fileCheck);
      } catch (error) {
        fileChecks.push({
          path: filePath,
          exists: false,
          error: 'Network error',
          statusCode: 0,
        });
      }
    }

    // Helper function to validate if content is a legitimate text file
    function isLegitimateTextFile(content: string, contentType: string, filePath: string): boolean {
      // Check content type
      if (contentType.includes('text/html')) {
        // If it's HTML, it's likely an error page, not a legitimate AI file
        return false;
      }
      
      // Check for common error page indicators in content
      if (isProbablyErrorPage(content)) {
        return false;
      }
      
      // Check file size - legitimate AI files are usually not empty and not extremely long
      if (content.trim().length === 0) {
        return false;
      }
      
      if (content.length > 50000) { // 50KB limit - AI files are usually much smaller
        return false;
      }
      
      return true;
    }
    
    // Helper function to detect if 404 is legitimate
    function isLegitimate404(content: string, contentType: string): boolean {
      // If it's a very short response or empty, it's likely a legitimate 404
      if (content.trim().length < 100) {
        return true;
      }
      
      // If content type is text/plain with minimal content, likely legitimate
      if (contentType.includes('text/plain') && content.trim().length < 500) {
        return true;
      }
      
      return false;
    }
    
    // Helper function to detect error pages
    function isProbablyErrorPage(content: string): boolean {
      const lowerContent = content.toLowerCase();
      
      // Common error page indicators
      const errorIndicators = [
        'page not found',
        '404 error',
        'not found',
        'error 404',
        'sorry, the page you are looking for',
        'oops! that page can\'t be found',
        'the requested url was not found',
        '<html',
        '<head>',
        '<title>',
        'nginx',
        'apache',
        'cloudflare',
        'page does not exist',
        'file not found'
      ];
      
      // If content contains multiple error indicators, it's likely an error page
      const foundIndicators = errorIndicators.filter(indicator => 
        lowerContent.includes(indicator)
      );
      
      return foundIndicators.length >= 2;
    }

    // Save to Convex
    try {
      await convex.mutation(api.aiFiles.saveAIFiles, {
        userId: userId as any,
        url: baseUrl.href,
        domain: baseUrl.hostname,
        files: fileChecks,
      });
    } catch (convexError) {
      console.error('Error saving AI files to Convex:', convexError);
      // Don't fail the request if Convex save fails
    }

    return NextResponse.json({
      success: true,
      url: baseUrl.origin,
      files: fileChecks,
    });

  } catch (error) {
    console.error('Error checking AI files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}