'use client';

import { authClient } from "@/lib/auth-client";
import { AuthButton } from './AuthButton';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-mono">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }

    const handlePricingClick = (packageType: string) => {
      localStorage.setItem('selectedPackage', packageType);
      localStorage.setItem('redirectAfterLogin', '/pricing');
      // Use the auth client from lib
      const { authClient } = require('@/lib/auth-client');
      authClient.signIn.social({ provider: 'google' });
    };

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-mono">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">LLMScore</h1>
            <p className="text-lg text-gray-800 leading-relaxed">
              Is your website LLM friendly? Get your LLM score now
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Side - Login */}
            <div className="bg-white border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-black mb-4">Get Started Free</h2>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Sign in to analyze your website's LLM compatibility and track improvements over time.
              </p>

              {/* Free Plan Highlight */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-green-800">Free Plan Included</span>
                </div>
                <div className="text-sm text-green-700 mb-3">
                  Get <strong>1 free credit</strong> when you sign up - no payment required!
                </div>
                <AuthButton />
              </div>

              <div className="text-xs text-gray-600 space-y-2 border-t border-gray-100 pt-4">
                <p>✓ Comprehensive LLM scoring</p>
                <p>✓ Search performance analysis</p>
                <p>✓ AI optimization recommendations</p>
                <p>✓ Track progress over time</p>
              </div>
            </div>

            {/* Right Side - Pricing */}
            <div className="bg-white border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-black mb-4">Need More Credits?</h2>
              <p className="text-gray-600 mb-6 text-sm">
                After using your free credit, purchase more with our simple pricing. No subscriptions, no hidden fees.
              </p>

              <div className="space-y-4 mb-6">
                {/* Starter Package */}
                <div 
                  onClick={() => handlePricingClick('starter')}
                  className="border border-gray-200 rounded p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-bold text-black">Starter Pack</div>
                      <div className="text-xs text-gray-500">Perfect for testing</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">$5</div>
                      <div className="text-xs text-blue-600">1 Credit</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors font-medium">
                    Click to sign up and purchase →
                  </div>
                </div>

                {/* Growth Package - Popular */}
                <div 
                  onClick={() => handlePricingClick('growth')}
                  className="border-2 border-blue-500 rounded p-4 hover:border-blue-600 hover:shadow-lg transition-all cursor-pointer group relative"
                >
                  <div className="absolute -top-2 left-4">
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">POPULAR</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-bold text-black">Growth Pack</div>
                      <div className="text-xs text-green-600 font-bold">Save $5</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">$20</div>
                      <div className="text-xs text-blue-600">5 Credits</div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 group-hover:text-blue-700 transition-colors font-bold">
                    Click to sign up and purchase →
                  </div>
                </div>

                {/* Pro Package */}
                <div 
                  onClick={() => handlePricingClick('pro')}
                  className="border border-gray-200 rounded p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-bold text-black">Pro Pack</div>
                      <div className="text-xs text-green-600 font-bold">Save $25</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-black">$50</div>
                      <div className="text-xs text-blue-600">15 Credits</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors font-medium">
                    Click to sign up and purchase →
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="text-xs text-blue-800 mb-2">
                  <strong>Each credit includes:</strong>
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• Complete website mapping</div>
                  <div>• AI file optimization check</div>
                  <div>• Search performance analysis</div>
                  <div>• LLM compatibility scoring</div>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
                <div className="text-xs text-purple-800 font-bold mb-2">🚀 Coming Soon (Premium):</div>
                <div className="text-xs text-purple-700">
                  Advanced SEO suggestions • LLM text generation • Content quality checks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}