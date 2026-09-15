"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken, setActiveWorkspaceId } from "@/lib/api";

/**
 * Handles the redirect callback from backend Google OAuth.
 * Consumes JWT token & workspace ID, scrubs sensitive parameters from browser history,
 * and routes directly to the dashboard.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const googleError = searchParams.get("google");
    const errorMessage = searchParams.get("message");
    const token = searchParams.get("token");
    const workspaceId = searchParams.get("workspace_id");

    // 1. Handle OAuth error response from Google or backend
    if (googleError === "error" || errorMessage) {
      const displayError = errorMessage || "Google authentication failed";
      router.replace(`/login?google_error=${encodeURIComponent(displayError)}`);
      return;
    }

    // 2. Handle successful token issuance
    if (token) {
      setToken(token);
      if (workspaceId) {
        setActiveWorkspaceId(workspaceId);
      }

      // Immediately scrub the token from browser history to avoid token exposure in history
      window.history.replaceState({}, document.title, window.location.pathname);

      // Redirect to main workspace dashboard
      router.replace("/dashboard");
      return;
    }

    // 3. Fallback for invalid/empty callback
    router.replace(
      `/login?google_error=${encodeURIComponent("Malformed authentication callback")}`
    );
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#08080a] text-[#ede8df] flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] ambient-glow-warm pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] ambient-glow-center pointer-events-none z-0" />

      <div className="w-full max-w-sm rounded-[28px] bg-[#0e0e11] border border-white/[0.08] p-8 text-center shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="w-10 h-10 border-2 border-white/20 border-t-[#ede8df] rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-medium text-[#ede8df]">Authenticating with Lisa</h2>
        <p className="text-xs text-[#8a8a93] mt-1">Completing your secure sign-in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080a] text-[#ede8df] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#ede8df] rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
