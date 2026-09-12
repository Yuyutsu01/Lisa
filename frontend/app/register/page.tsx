"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, setToken, setActiveWorkspaceId } from "@/lib/api";
import { Lock, Mail, User, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.register({ name, email, password });
      setToken(response.token.access_token);
      setActiveWorkspaceId(response.workspace_id);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#ede8df] selection:bg-[#ede8df]/20 selection:text-white p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] ambient-glow-warm pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] ambient-glow-center pointer-events-none z-0" />

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
            Create your workspace
          </h1>
          <p className="text-xs text-[#8a8a93] mt-1">
            Turn 1 piece of content into a multi-platform distribution engine
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
              Full Name or Brand Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787672]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivers"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-[#ede8df] placeholder-[#6b6965] focus:border-white/30 focus:outline-none transition-all"
              />
            </div>
          </div>

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
                placeholder="alex@creator.io"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-[#ede8df] placeholder-[#6b6965] focus:border-white/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono tracking-wider uppercase text-[#85827b] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787672]" />
              <input
                type="password"
                required
                minLength={6}
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
                <span>Setting up workspace...</span>
              ) : (
                <>
                  <span>Create Workspace & Start</span>
                  <div className="w-5 h-5 rounded-full bg-[#08080a] text-[#ede8df] flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#8a8a93]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#d4a373] shrink-0" />
            <span>Auto-provisions your dedicated isolated workspace</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8a8a93]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#d4a373] shrink-0" />
            <span>Pre-configured Brand Intelligence voice profile</span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-[#787672]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#d4a373] hover:text-[#ede8df] transition-colors font-medium">
            Sign In
          </Link>
        </div>
      </div>

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
