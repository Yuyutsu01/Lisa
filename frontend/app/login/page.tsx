"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, setToken, setActiveWorkspaceId, workspacesApi } from "@/lib/api";
import { Lock, Mail, ArrowRight, Sparkles, KeyRound, CheckCircle2, X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"request" | "reset" | "success">("request");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { access_token } = await authApi.login({ email, password });
      setToken(access_token);

      // Fetch user's workspaces and store the first one as active
      const workspaces = await workspacesApi.list();
      if (workspaces.length > 0) {
        setActiveWorkspaceId(workspaces[0].id);
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    setForgotLoading(true);

    try {
      const res = await authApi.forgotPassword(forgotEmail || email);
      setForgotMessage(res.message || "Recovery instructions dispatched.");
      if (res.reset_token) {
        setForgotToken(res.reset_token);
      }
      setForgotStep("reset");
    } catch (err: any) {
      setForgotError(err.message || "Failed to initiate password reset.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    setForgotLoading(true);

    try {
      await authApi.resetPassword({
        token: forgotToken,
        new_password: newPassword,
      });
      setForgotStep("success");
      setPassword("");
    } catch (err: any) {
      setForgotError(err.message || "Invalid or expired token. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email);
    setForgotStep("request");
    setForgotError(null);
    setForgotMessage(null);
    setShowForgotModal(true);
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#ede8df] selection:bg-[#ede8df]/20 selection:text-white p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] ambient-glow-warm pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] ambient-glow-center pointer-events-none z-0" />

      {/* Main card matching Lisa studio container styling */}
      <div className="w-full max-w-md rounded-[28px] sm:rounded-[32px] bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Display at Top - Only Lisa with warm glow */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-block group mb-2 focus:outline-none">
            <span className="text-4xl sm:text-5xl font-normal tracking-[-0.05em] text-[#ede8df] lisa-hero-title">
              Lisa<span className="lisa-asterisk text-[#d4a373] text-[0.6em] -translate-y-1 sm:-translate-y-2 inline-block">*</span>
            </span>
          </Link>
          <h1 className="text-lg sm:text-xl font-normal tracking-tight text-[#ede8df] mt-1">
            Welcome back
          </h1>
          <p className="text-xs text-[#8a8a93] mt-1">
            Sign in to your content operations studio
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono tracking-wider uppercase text-[#85827b] mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787672]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@brand.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-[#ede8df] placeholder-[#6b6965] focus:border-white/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono tracking-wider uppercase text-[#85827b]">
                Password
              </label>
              <button
                type="button"
                onClick={openForgotModal}
                className="text-[11px] text-[#d4a373] hover:text-[#ede8df] transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787672]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-[#ede8df] placeholder-[#6b6965] focus:border-white/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 rounded-full bg-[#ede8df] hover:bg-white text-[#08080a] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer group"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Studio</span>
                  <div className="w-5 h-5 rounded-full bg-[#08080a] text-[#ede8df] flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-[#787672] border-t border-white/[0.06] pt-5">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="text-[#d4a373] hover:text-[#ede8df] transition-colors font-medium">
            Create an account
          </Link>
        </div>
      </div>

      {/* Forgot Password Interactive Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-[28px] bg-[#0e0e11] border border-white/[0.12] p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#8a8a93] hover:text-[#ede8df] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6 pr-6">
              <h2 className="text-lg font-semibold text-[#ede8df]">Reset Password</h2>
              <p className="text-xs text-[#8a8a93] mt-1">
                {forgotStep === "request" && "Enter your email to receive recovery instructions"}
                {forgotStep === "reset" && "Set a new secure password"}
                {forgotStep === "success" && "Password updated successfully"}
              </p>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {forgotError}
              </div>
            )}

            {forgotMessage && forgotStep !== "success" && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                {forgotMessage}
              </div>
            )}

            {forgotStep === "request" && (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#85827b] mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787672]" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="creator@brand.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-[#ede8df] placeholder-[#6b6965] focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 px-4 rounded-full bg-[#ede8df] hover:bg-white text-[#08080a] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending..." : "Request Reset Instructions"}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === "reset" && (
              <form onSubmit={handleForgotReset} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#85827b] mb-1.5">
                    Reset Token
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787672]" />
                    <input
                      type="text"
                      required
                      value={forgotToken}
                      onChange={(e) => setForgotToken(e.target.value)}
                      placeholder="Enter verification token"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-[#ede8df] font-mono focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#85827b] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787672]" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-[#ede8df] focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#85827b] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787672]" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-[#ede8df] focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 px-4 rounded-full bg-[#ede8df] hover:bg-white text-[#08080a] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? "Updating..." : "Save New Password"}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === "success" && (
              <div className="text-center space-y-4 py-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-[#ede8df]">Password Reset Complete</h3>
                <p className="text-xs text-[#8a8a93] leading-relaxed">
                  Your password has been successfully updated. You can now sign in immediately.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2.5 px-4 rounded-full bg-[#ede8df] hover:bg-white text-[#08080a] font-medium text-xs sm:text-sm transition-all"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back to Home Link */}
      <div className="mt-6 relative z-10">
        <Link
          href="/"
          className="text-xs font-mono text-[#787672] hover:text-[#ede8df] transition-colors inline-flex items-center gap-1.5"
        >
          <span>← Back to Overview</span>
        </Link>
      </div>
    </div>
  );
}
