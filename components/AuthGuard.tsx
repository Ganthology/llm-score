'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthButton } from './AuthButton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const currentUser = useQuery(api.auth.getCurrentUser);

  // if (currentUser === undefined) {
  //   return (
  //     <div className="min-h-screen bg-white flex items-center justify-center p-4 font-mono">
  //       <div className="text-center">
  //         <p className="text-gray-600">Checking authentication...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-white border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">LLMScore</h1>
          <p className="text-base text-gray-800 mb-6 leading-relaxed">
            Sign in to analyze your website's LLM compatibility
          </p>

          <div className="mb-6">
            <AuthButton />
          </div>

          <div className="text-xs text-gray-600 space-y-2">
            <p>• Get comprehensive LLM scoring</p>
            <p>• Track your website's AI optimization</p>
            <p>• View detailed search performance analysis</p>
            <p>• Store your analysis history securely</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}