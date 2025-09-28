'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { AuthModal } from './AuthModal';
import { useState } from "react";

export function AuthButton() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const [showModal, setShowModal] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  // if (currentUser === undefined) {
  //   return (
  //     <button
  //       disabled
  //       className="px-4 py-2 text-sm font-mono text-gray-600 border border-gray-300 rounded cursor-not-allowed"
  //     >
  //       Loading...
  //     </button>
  //   );
  // }

  if (currentUser) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-mono">
          Welcome, {currentUser.name || currentUser.email}
        </span>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm font-mono text-black border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 text-sm font-mono bg-black text-white border border-black rounded hover:bg-gray-800 transition-colors"
      >
        Sign In
      </button>

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}