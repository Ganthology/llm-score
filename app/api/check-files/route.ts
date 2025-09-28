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
          },
        });

        const fileCheck: FileCheck = {
          path: filePath,
          exists: response.ok,
        };

        if (response.ok) {
          try {
            const content = await response.text();
            // fileCheck.content = content.substring(0, 1000); // Limit content to first 1000 chars
            fileCheck.content = content;
          } catch (contentError) {
            fileCheck.error = 'Could not read content';
          }
        }

        fileChecks.push(fileCheck);
      } catch (error) {
        fileChecks.push({
          path: filePath,
          exists: false,
          error: 'Network error',
        });
      }
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