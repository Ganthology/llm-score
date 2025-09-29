'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '../../components/AuthGuard';
import { authClient } from '@/lib/auth-client';

interface PricingPackage {
  name: string;
  credits: number;
  price: number;
  description: string;
  savings?: number;
}

interface CreditsResponse {
  success: boolean;
  credits: {
    credits: number;
    total_purchased: number;
    total_consumed: number;
  };
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

export default function PricingPage() {
  const [creditsData, setCreditsData] = useState<CreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
        throw new Error('Failed to fetch pricing data');
      }
      
      const data = await response.json();
      setCreditsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageType: string) => {
    try {
      setPurchasing(packageType);
      setError(null);
      setSuccess(null);

      // Mock payment - in production, integrate with Stripe, PayPal, etc.
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType,
          paymentToken: 'demo_success', // Mock payment token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Purchase failed');
      }

      const result = await response.json();
      setSuccess(`Successfully purchased ${result.credits_added} credits! Your new balance is ${result.new_balance}.`);
      
      // Refresh credits data
      await fetchCredits();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-mono">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
            <p className="text-gray-600">Loading pricing...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error && !creditsData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-mono">
          <div className="text-center">
            <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchCredits}
              className="mt-4 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const packages = creditsData?.pricing.packages;
  const currentBalance = creditsData?.credits.credits || 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 font-mono">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <a 
                href="/"
                className="text-sm text-gray-600 hover:text-black underline"
              >
                ← Back to Scanner
              </a>
              <a
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-black underline"
              >
                View Dashboard →
              </a>
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">Credit Packages</h1>
            <p className="text-gray-600">Choose the perfect plan for your scanning needs</p>
            
            {/* Current Balance */}
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded">
              <span className="text-sm text-gray-600 mr-2">Current Balance:</span>
              <span className="font-bold text-lg text-black">{currentBalance}</span>
              <span className="text-sm text-gray-600 ml-1">credit{currentBalance !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm font-mono">
              ✅ {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm font-mono">
              ❌ {error}
            </div>
          )}

          {/* Pricing Cards */}
          {packages && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Object.entries(packages).map(([key, pkg]) => {
                const isPopular = key === 'growth';
                const pricePerCredit = pkg.price / pkg.credits;
                
                return (
                  <div 
                    key={key}
                    className={`relative bg-white border rounded-lg p-6 ${
                      isPopular 
                        ? 'border-blue-500 shadow-lg' 
                        : 'border-gray-200'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          BEST VALUE
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-black mb-2">{pkg.name}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-black">${pkg.price}</span>
                        <span className="text-sm text-gray-600 ml-1">USD</span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {pkg.credits} Credit{pkg.credits !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${pricePerCredit.toFixed(2)} per credit
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                      
                      {pkg.savings && (
                        <div className="mb-4 text-sm font-bold text-green-600">
                          Save ${pkg.savings.toFixed(2)}!
                        </div>
                      )}
                      
                      <button
                        onClick={() => handlePurchase(key)}
                        disabled={purchasing === key}
                        className={`w-full py-3 px-4 font-bold transition-colors ${
                          isPopular
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-black hover:bg-gray-800 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {purchasing === key ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          `Purchase ${pkg.credits} Credit${pkg.credits !== 1 ? 's' : ''}`
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Scan Costs Info */}
          {creditsData && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-black mb-4">How Credits Work</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-sm">{creditsData.pricing.scan_costs.basic}</span>
                  </div>
                  <div>
                    <div className="font-bold text-black">Basic Scan</div>
                    <div className="text-sm text-gray-600">Complete website analysis</div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold text-sm">{creditsData.pricing.scan_costs.premium}</span>
                  </div>
                  <div>
                    <div className="font-bold text-black">Premium Scan</div>
                    <div className="text-sm text-gray-600">Coming soon - Advanced features</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-sm text-gray-600 font-mono">
                  💡 <strong>Note:</strong> This is a demo implementation. In production, this would integrate with a real payment processor like Stripe or PayPal for secure transactions.
                </p>
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-black mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-black text-sm">What happens if I run out of credits?</h4>
                <p className="text-sm text-gray-600 mt-1">You'll need to purchase more credits to continue scanning. Your previous scan results will always remain accessible.</p>
              </div>
              <div>
                <h4 className="font-bold text-black text-sm">Do credits expire?</h4>
                <p className="text-sm text-gray-600 mt-1">No, your credits never expire. Use them whenever you need to scan websites.</p>
              </div>
              <div>
                <h4 className="font-bold text-black text-sm">Can I get a refund?</h4>
                <p className="text-sm text-gray-600 mt-1">We offer refunds within 30 days of purchase for unused credits. Contact support for assistance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}