'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

interface CreditInfo {
  credits: number;
  total_purchased: number;
  total_consumed: number;
  last_updated: number;
}

interface CreditStats {
  current_balance: number;
  total_purchased: number;
  total_consumed: number;
  total_purchases: number;
  total_scans: number;
  recent_scans_30d: number;
  average_monthly_usage: number;
  last_purchase: number | null;
  last_scan: number | null;
}

interface PricingPackage {
  name: string;
  credits: number;
  price: number;
  description: string;
  savings?: number;
}

interface CreditsResponse {
  success: boolean;
  credits: CreditInfo;
  stats: CreditStats;
  pricing: {
    packages: {
      starter: PricingPackage;
      growth: PricingPackage;
      pro: PricingPackage;
    };
    scan_costs: {
      basic: number;
      premium: number;
    };
  };
}

export default function CreditsDisplay() {
  const [creditsData, setCreditsData] = useState<CreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      fetchCredits();
    }
  }, [session]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/credits');
      
      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }
      
      const data = await response.json();
      setCreditsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600 font-mono">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span>Loading credits...</span>
      </div>
    );
  }

  if (error || !creditsData) {
    return (
      <div className="text-sm text-red-600 font-mono">
        Credits unavailable
      </div>
    );
  }

  const { credits, stats, pricing } = creditsData;
  const balance = credits.credits;
  const isLowBalance = balance < pricing.scan_costs.basic;
  const isFreeUser = balance === 1 && credits.total_consumed === 0;

  return (
    <div className="flex items-center space-x-4">
      {/* Credit Balance */}
      <div className="flex items-center space-x-2">
        <div className={`px-3 py-1 rounded-full text-sm font-mono border ${
          isLowBalance 
            ? 'bg-red-50 border-red-200 text-red-800'
            : balance < 3
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <span className="font-bold">{balance}</span> credit{balance !== 1 ? 's' : ''}
          {isFreeUser && <span className="text-xs ml-1">(free)</span>}
        </div>
        
        {isFreeUser && (
          <div className="text-xs text-green-600 font-mono">
            🎉 Free credit
          </div>
        )}
        {isLowBalance && !isFreeUser && (
          <div className="text-xs text-red-600 font-mono">
            ⚠️ Low balance
          </div>
        )}
      </div>

      {/* Buy Credits Button */}
      <a
        href="/pricing"
        className="inline-flex items-center px-3 py-1 text-xs font-mono text-gray-600 hover:text-black border border-gray-300 hover:border-black rounded transition-colors"
      >
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Buy Credits
      </a>
    </div>
  );
}