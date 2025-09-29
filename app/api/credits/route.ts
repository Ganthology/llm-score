import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { getCurrentUserId } from '@/lib/auth-utils';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Get user's credit balance and stats
export async function GET(request: NextRequest) {
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

    // Initialize user credits if they don't exist
    await convex.mutation(api.credits.initializeUserCredits, { userId });

    // Get user credits and stats
    const [credits, stats, transactions] = await Promise.all([
      convex.query(api.credits.getUserCredits, { userId }),
      convex.query(api.credits.getCreditStats, { userId }),
      convex.query(api.credits.getTransactionHistory, { userId, limit: 10 }),
    ]);

    return NextResponse.json({
      success: true,
      credits,
      stats,
      recent_transactions: transactions,
      pricing: {
        packages: {
          starter: {
            name: "Starter Pack",
            credits: 1,
            price: 5.00,
            description: "Perfect for testing our service"
          },
          growth: {
            name: "Growth Pack", 
            credits: 5,
            price: 20.00,
            description: "Best value for regular users",
            savings: 5.00
          },
          pro: {
            name: "Pro Pack",
            credits: 15,
            price: 50.00,
            description: "For power users and agencies",
            savings: 25.00
          }
        },
        scan_costs: {
          basic: 1,
          premium: 3
        }
      }
    });

  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Purchase credits (mock implementation - would integrate with payment processor)
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

    const { packageType, paymentToken } = await request.json();

    if (!packageType) {
      return NextResponse.json(
        { error: 'Package type is required' },
        { status: 400 }
      );
    }

    // Validate package type
    const packages = {
      starter: { credits: 1, price: 500 }, // USD cents
      growth: { credits: 5, price: 2000 },
      pro: { credits: 15, price: 5000 }
    };

    const selectedPackage = packages[packageType as keyof typeof packages];
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      );
    }

    // TODO: Integrate with payment processor (Stripe, etc.)
    // For now, we'll simulate a successful payment
    if (!paymentToken || paymentToken !== 'demo_success') {
      return NextResponse.json(
        { error: 'Payment processing failed' },
        { status: 402 }
      );
    }

    // Add credits to user account
    const newBalance = await convex.mutation(api.credits.addCredits, {
      userId,
      credits: selectedPackage.credits,
      packageType,
      pricePaid: selectedPackage.price,
      description: `Purchased ${packageType} package (${selectedPackage.credits} credits)`,
    });

    return NextResponse.json({
      success: true,
      message: 'Credits purchased successfully',
      credits_added: selectedPackage.credits,
      new_balance: newBalance,
      package: packageType,
      amount_paid: selectedPackage.price / 100, // Convert to dollars
    });

  } catch (error) {
    console.error('Error purchasing credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}