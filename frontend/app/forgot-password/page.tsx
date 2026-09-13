"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Lock, Mail, ArrowRight, CheckCircle2, KeyRound, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset" | "success">("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message || "Reset instructions generated.");
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Failed to initiate password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        token: resetToken,
        new_password: newPassword,
      });
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Invalid or expired token. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#ede8df] selection:bg-[#ede8df]/20 selection:text-white p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] ambient-glow-warm pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] ambient-glow-center pointer-events-none z-0" />

      {/* Main card */}
      <div className="w-full max-w-md rounded-[28px] sm:rounded-[32px] bg-[#0e0e11] border border-white/[0.08] p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Display at Top */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-block group mb-2 focus:outline-none">
            <span className="text-4xl sm:text-5xl font-normal tracking-[-0.05em] text-[#ede8df] lisa-hero-title">
              Lisa<span className="lisa-asterisk text-[#d4a373] text-[0.6em] -translate-y-1 sm:-translate-y-2 inline-block">*</span>
            </span>
          </Link>
          <h1 className="text-lg sm:text-xl font-normal tracking-tight text-[#ede8df] mt-1">
            Reset your password
          </h1>
          <p className="text-xs text-[#8a8a93] mt-1">
            {step === "request" && "Enter your email to receive recovery instructions"}
            {step === "reset" && "Set a secure new password for your account"}
            {step === "success" && "Password reset complete"}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        {message && step !== "success" && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            {message}
          </div>
        )}

        {step === "request" && (
          <form onSubmit={handleRequestReset} className="space-y-4">
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-5 rounded-full bg-[#ede8df] hover:bg-white text-[#08080a] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer group"
              >
                {loading ? (
                  <span>Sending instructions...</span>
                ) : (
                  <>
                    <span>Continue to Reset</span>
                    <div className="w-5 h-5 rounded-full bg-[#08080a] text-[#ede8df] flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono tracking-wider uppercase text-[#85827b] mb-1.5">
                Verification / Reset Token
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787672]" />
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Reset token"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-[#ede8df] placeholder-[#6b6965] focus:border-white/30 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono tracking-wider uppercase text-[#85827b] mb-1.5">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-[#ede8df] placeholder-[#6b6965] focus:border-white/30 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono tracking-wider uppercase text-[#85827b] mb-1.5">
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
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <span>Confirm New Password</span>
                    <div className="w-5 h-5 rounded-full bg-[#08080a] text-[#ede8df] flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#ede8df]">Password Reset Complete</h3>
            <p className="text-xs text-[#8a8a93] leading-relaxed">
              Your password has been successfully updated. You can now proceed to log in with your new credentials.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3 px-5 rounded-full bg-[#ede8df] hover:bg-white text-[#08080a] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-[#787672] border-t border-white/[0.06] pt-5">
          Remember your password?{" "}
          <Link href="/login" className="text-[#d4a373] hover:text-[#ede8df] transition-colors font-medium">
            Back to Sign In
          </Link>
        </div>
      </div>

      {/* Back to Home Link */}
      <div className="mt-6 relative z-10">
        <Link
          href="/"
          className="text-xs font-mono text-[#787672] hover:text-[#ede8df] transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
      </div>
    </div>
  );
}
