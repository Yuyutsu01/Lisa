"use client";

import React, { useState } from "react";
import { Mail, AlertCircle, ExternalLink } from "lucide-react";
import { connectionsApi, ConnectedAccount } from "@/lib/api";
import { InteractiveButton } from "@/components/InteractiveButton";

interface EmailConnectModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (connection: ConnectedAccount) => void;
}

export function EmailConnectModal({
  workspaceId,
  isOpen,
  onClose,
  onSuccess,
}: EmailConnectModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const trimmedKey = apiKey.trim();
  const isKeyFormatValid = trimmedKey.startsWith("re_") && trimmedKey.length > 5;
  const showFormatError = trimmedKey.length > 0 && !isKeyFormatValid;

  const handleClose = () => {
    if (isSubmitting) return;
    setApiKey("");
    setFromName("");
    setFromEmail("");
    setLabel("");
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKeyFormatValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await connectionsApi.connectEmail(
        workspaceId,
        trimmedKey,
        fromName.trim() || undefined,
        fromEmail.trim() || undefined,
        label.trim() || undefined
      );
      setApiKey("");
      setFromName("");
      setFromEmail("");
      setLabel("");
      onSuccess(result);
      onClose();
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("invalid")) {
        setErrorMessage("Invalid Resend API key. Please check your credentials in the Resend dashboard.");
      } else if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        setErrorMessage("Resend is rate limiting requests. Try again in a moment.");
      } else if (msg.includes("502")) {
        setErrorMessage("Failed to connect to Resend API. Please check your internet connection.");
      } else {
        setErrorMessage(msg || "Failed to connect Resend account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="hirael-card p-7 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 rounded-2xl sm:rounded-3xl border border-white/[0.08]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h3 className="font-normal text-[#ede8df] text-lg sm:text-xl flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-amber-400" />
            <span>Connect Email (Resend)</span>
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#ede8df] flex items-center justify-center text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Description & Guide Link */}
        <div className="text-xs sm:text-sm text-[#8a8a93] leading-relaxed">
          <p>
            Connect your Resend API key to deliver dispatches, newsletters, and email variants directly to inboxes.
          </p>
          <a
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#d4a373] hover:underline mt-2 text-xs font-mono"
          >
            <span>Get your Resend API key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm text-rose-200 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="resend-api-key"
              className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-1.5"
            >
              Resend API Key <span className="text-rose-400">*</span>
            </label>
            <input
              id="resend-api-key"
              type="password"
              required
              placeholder="re_..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full bg-[#161618] border border-white/10 rounded-xl px-4 py-2.5 text-[#ede8df] placeholder-[#555] text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-400/50"
            />
            {showFormatError && (
              <p className="text-rose-400 text-xs mt-1.5 font-mono">
                API key must start with &apos;re_&apos;
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sender-display-name"
              className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-1.5"
            >
              Sender Display Name <span className="text-[#555]">(Optional)</span>
            </label>
            <input
              id="sender-display-name"
              type="text"
              placeholder="Lisa"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-xl px-4 py-2.5 text-[#ede8df] placeholder-[#555] text-xs sm:text-sm font-mono focus:outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label
              htmlFor="sender-email"
              className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-1.5"
            >
              Sender Email <span className="text-[#555]">(Optional)</span>
            </label>
            <input
              id="sender-email"
              type="email"
              placeholder="hello@yourdomain.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-xl px-4 py-2.5 text-[#ede8df] placeholder-[#555] text-xs sm:text-sm font-mono focus:outline-none focus:border-white/20"
            />
            <p className="text-[#666] text-[11px] mt-1 font-mono">
              Leave blank to use onboarding@resend.dev for testing.
            </p>
          </div>

          <div>
            <label
              htmlFor="connection-label"
              className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-1.5"
            >
              Connection Label <span className="text-[#555]">(Optional)</span>
            </label>
            <input
              id="connection-label"
              type="text"
              placeholder="My Resend"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-xl px-4 py-2.5 text-[#ede8df] placeholder-[#555] text-xs sm:text-sm font-mono focus:outline-none focus:border-white/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm text-[#8a8a93] hover:text-[#ede8df] transition-colors"
            >
              Cancel
            </button>
            <InteractiveButton
              type="submit"
              disabled={!isKeyFormatValid || isSubmitting}
              className="hirael-btn-primary px-5 py-2 text-xs sm:text-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                <span>Connect</span>
              )}
            </InteractiveButton>
          </div>
        </form>
      </div>
    </div>
  );
}
