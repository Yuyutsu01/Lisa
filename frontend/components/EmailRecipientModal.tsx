"use client";

import React, { useState } from "react";
import { Mail } from "lucide-react";
import { InteractiveButton } from "@/components/InteractiveButton";

interface EmailRecipientModalProps {
  isOpen: boolean;
  variantTitle: string;
  onClose: () => void;
  onConfirm: (recipient: string) => void;
  isSubmitting?: boolean;
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function EmailRecipientModal({
  isOpen,
  variantTitle,
  onClose,
  onConfirm,
  isSubmitting = false,
}: EmailRecipientModalProps) {
  const [recipient, setRecipient] = useState("");

  if (!isOpen) return null;

  const trimmed = recipient.trim();
  const isValid = EMAIL_REGEX.test(trimmed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    onConfirm(trimmed);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setRecipient("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="hirael-card p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 rounded-2xl sm:rounded-3xl border border-white/[0.08]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <h3 className="font-normal text-[#ede8df] text-base sm:text-lg flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-amber-400" />
            <span>Send email to…</span>
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[#ede8df] flex items-center justify-center text-xs font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Context & Description */}
        <div className="space-y-2">
          <p className="text-xs text-[#8a8a93] leading-relaxed">
            This variant will be sent as a one-off email to the specified address.
          </p>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-[#a6a39b] truncate">
            Subject: {variantTitle || "Update from Lisa"}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="recipient-email"
              className="block text-xs font-mono text-[#85827b] mb-1.5"
            >
              Recipient Email <span className="text-rose-400">*</span>
            </label>
            <input
              id="recipient-email"
              type="email"
              required
              autoFocus
              placeholder="name@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-[#161618] border border-white/10 rounded-xl px-3.5 py-2 text-[#ede8df] placeholder-[#555] text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-400/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl text-xs text-[#8a8a93] hover:text-[#ede8df] transition-colors"
            >
              Cancel
            </button>
            <InteractiveButton
              type="submit"
              disabled={!isValid || isSubmitting}
              className="hirael-btn-primary px-4 py-1.5 text-xs flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Sending…</span>
                </>
              ) : (
                <span>Send</span>
              )}
            </InteractiveButton>
          </div>
        </form>
      </div>
    </div>
  );
}
