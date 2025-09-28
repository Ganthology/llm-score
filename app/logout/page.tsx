'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function LogoutPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Sign out the user
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              // Redirect to home page after successful logout
              router.push('/');
            },
            onError: (ctx) => {
              console.error('Logout error:', ctx.error);
              // Even if there's an error, redirect to home
              router.push('/');
            },
          },
        });
      } catch (error) {
        console.error('Logout failed:', error);
        // Force redirect even if logout fails
        router.push('/');
      } finally {
        setIsLoggingOut(false);
      }
    };

    // Start logout process immediately when component mounts
    handleLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-mono">
      <div className="max-w-md w-full bg-white border border-gray-200 p-8 text-center">
        {isLoggingOut ? (
          <>
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
            <h1 className="text-xl font-bold text-black mb-4">Logging out...</h1>
            <p className="text-sm text-gray-600">
              Please wait while we sign you out.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-black mb-4">Logged out</h1>
            <p className="text-sm text-gray-600 mb-4">
              You have been successfully logged out.
            </p>
            <p className="text-xs text-gray-500">
              Redirecting you to the home page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}