"use client";

import React, { useState } from "react";
import { MessageSquare, AlertCircle, ExternalLink } from "lucide-react";
import { connectionsApi, ConnectedAccount } from "@/lib/api";
import { InteractiveButton } from "@/components/InteractiveButton";

interface DiscordConnectModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (connection: ConnectedAccount) => void;
}

const DISCORD_WEBHOOK_REGEX =
  /^https:\/\/(?:canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/[\w.-]+$/;

export function DiscordConnectModal({
  workspaceId,
  isOpen,
  onClose,
  onSuccess,
}: DiscordConnectModalProps) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const trimmedUrl = webhookUrl.trim();
  const isUrlFormatValid = DISCORD_WEBHOOK_REGEX.test(trimmedUrl);
  const showFormatError = trimmedUrl.length > 0 && !isUrlFormatValid;

  const handleClose = () => {
    if (isSubmitting) return;
    setWebhookUrl("");
    setLabel("");
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUrlFormatValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await connectionsApi.connectDiscord(
        workspaceId,
        trimmedUrl,
        label.trim() || undefined
      );
      setWebhookUrl("");
      setLabel("");
      onSuccess(result);
      onClose();
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        setErrorMessage("Discord is rate limiting requests. Try again in a moment.");
      } else if (
        msg.includes("400") ||
        msg.includes("404") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("deleted")
      ) {
        setErrorMessage(
          "That webhook URL didn't validate with Discord. Check that it was copied correctly."
        );
      } else {
        setErrorMessage(
          "Failed to connect Discord webhook. Please check your connection and try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="hirael-card p-7 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 rounded-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h3 className="font-normal text-[#ede8df] text-lg sm:text-xl flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span>Connect Discord</span>
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
            Connect a Discord channel via Incoming Webhook to automatically broadcast publications
            and updates.
          </p>
          <a
            href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#d4a373] hover:underline mt-2 text-xs font-mono"
          >
            <span>How to find your webhook URL</span>
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="discord-webhook-url"
              className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2"
            >
              Discord Webhook URL <span className="text-rose-400">*</span>
            </label>
            <input
              id="discord-webhook-url"
              type="url"
              required
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/50 border border-white/10 text-[#ede8df] text-xs sm:text-sm lg:text-[14.5px] focus:outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20"
            />
            {showFormatError && (
              <span className="text-[11px] text-rose-400 font-mono block mt-1.5">
                Expected format: https://discord.com/api/webhooks/&#123;id&#125;/&#123;token&#125;
              </span>
            )}
            <span className="text-[11px] text-[#71717a] font-mono block mt-1.5">
              Webhook URL is verified against Discord before saving.
            </span>
          </div>

          <div>
            <label
              htmlFor="discord-display-name"
              className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2"
            >
              Display Name (Optional)
            </label>
            <input
              id="discord-display-name"
              type="text"
              placeholder="e.g. #announcements or Community Server"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/50 border border-white/10 text-[#ede8df] text-xs sm:text-sm lg:text-[14.5px] focus:outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-[#85827b] hover:text-[#ede8df] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <InteractiveButton
              type="submit"
              disabled={!isUrlFormatValid || isSubmitting}
              loading={isSubmitting}
              loadingText="Validating & Connecting..."
              variant="primary"
              size="md"
              glow
              shimmer
              magnetic
              className="px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect Discord
            </InteractiveButton>
          </div>
        </form>
      </div>
    </div>
  );
}
