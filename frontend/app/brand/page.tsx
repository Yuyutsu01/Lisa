"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  brandApi,
  BrandProfile,
  BrandKnowledgeDoc,
  getActiveWorkspaceId,
} from "@/lib/api";
import {
  BookOpen,
  Sparkles,
  ShieldAlert,
  Sliders,
  Plus,
  Trash2,
  Save,
  FileText,
} from "lucide-react";
import { InteractiveButton } from "@/components/InteractiveButton";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function BrandIntelligencePage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [knowledgeDocs, setKnowledgeDocs] = useState<BrandKnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New phrase inputs
  const [newForbidden, setNewForbidden] = useState("");
  const [newPreferred, setNewPreferred] = useState("");
  const [newPillarName, setNewPillarName] = useState("");
  const [newPillarShare, setNewPillarShare] = useState(25);

  // Knowledge doc upload input
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    if (wsId) {
      loadBrandData(wsId);
    }
  }, []);

  const loadBrandData = async (workspaceId: string) => {
    try {
      setLoading(true);
      const profileData = await brandApi.getProfile(workspaceId);
      setProfile(profileData);
      const docsData = await brandApi.listKnowledgeDocs(workspaceId);
      setKnowledgeDocs(docsData);
    } catch (err) {
      console.error("Failed to load brand profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!activeWorkspaceId || !profile) return;
    try {
      setSaving(true);
      const updated = await brandApi.updateProfile(activeWorkspaceId, profile);
      setProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const addForbiddenPhrase = () => {
    if (!newForbidden.trim() || !profile) return;
    if (!profile.forbidden_phrases_json.includes(newForbidden.trim())) {
      setProfile({
        ...profile,
        forbidden_phrases_json: [...profile.forbidden_phrases_json, newForbidden.trim()],
      });
    }
    setNewForbidden("");
  };

  const removeForbiddenPhrase = (phrase: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      forbidden_phrases_json: profile.forbidden_phrases_json.filter((p) => p !== phrase),
    });
  };

  const addPreferredPhrase = () => {
    if (!newPreferred.trim() || !profile) return;
    if (!profile.preferred_phrases_json.includes(newPreferred.trim())) {
      setProfile({
        ...profile,
        preferred_phrases_json: [...profile.preferred_phrases_json, newPreferred.trim()],
      });
    }
    setNewPreferred("");
  };

  const removePreferredPhrase = (phrase: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      preferred_phrases_json: profile.preferred_phrases_json.filter((p) => p !== phrase),
    });
  };

  const addPillar = () => {
    if (!newPillarName.trim() || !profile) return;
    setProfile({
      ...profile,
      content_pillars_json: [
        ...profile.content_pillars_json,
        { name: newPillarName.trim(), target_percentage: newPillarShare },
      ],
    });
    setNewPillarName("");
    setNewPillarShare(25);
  };

  const removePillar = (index: number) => {
    if (!profile) return;
    const updated = [...profile.content_pillars_json];
    updated.splice(index, 1);
    setProfile({ ...profile, content_pillars_json: updated });
  };

  const handleAddKnowledgeDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !newDocTitle.trim() || !newDocContent.trim()) return;

    try {
      const created = await brandApi.createKnowledgeDoc(activeWorkspaceId, {
        title: newDocTitle,
        source_type: "text",
        content: newDocContent,
      });
      setKnowledgeDocs([created, ...knowledgeDocs]);
      setNewDocTitle("");
      setNewDocContent("");
    } catch (err) {
      console.error("Failed to add knowledge doc", err);
    }
  };

  const handleDeleteKnowledgeDoc = async (docId: string) => {
    if (!activeWorkspaceId) return;
    try {
      await brandApi.deleteKnowledgeDoc(activeWorkspaceId, docId);
      setKnowledgeDocs(knowledgeDocs.filter((d) => d.id !== docId));
    } catch (err) {
      console.error("Failed to delete knowledge doc", err);
    }
  };

  if (loading) {
    return (
      <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-[#8a8a93] text-xs font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4a373] animate-ping" />
            Loading Brand Intelligence profile...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2.5 text-[11px] sm:text-xs lg:text-[13px] font-mono uppercase tracking-widest text-[#85827b] mb-1.5">
              <BookOpen className="w-4 h-4 text-[#d4a373]" />
              <span>Voice &amp; Positioning Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#ede8df]">
              Brand Intelligence System
            </h1>
            <p className="text-xs sm:text-sm lg:text-[15px] xl:text-[15.5px] text-[#8a8a93] mt-2 max-w-3xl leading-relaxed">
              Configure brand voice, forbidden vocabulary, and content pillars enforced by all 10 specialized AI adaptation agents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <InteractiveButton
              onClick={handleSaveProfile}
              loading={saving}
              loadingText="Saving Guidelines..."
              success={savedSuccess}
              successText="Guidelines Saved"
              variant="primary"
              size="lg"
              glow
              shimmer
              magnetic
              leftIcon={<Save className="w-4 h-4" />}
              className="px-6 py-3 text-xs sm:text-sm lg:text-[14px] font-semibold"
            >
              Save Brand Profile
            </InteractiveButton>
          </div>
        </div>

        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Voice, Persona & Rules */}
            <div className="lg:col-span-2 space-y-8">
              {/* Core Identity */}
              <ScrollReveal delay={0}>
                <div className="hirael-card p-6 sm:p-7 lg:p-8 space-y-6 rounded-2xl sm:rounded-3xl">
                  <h2 className="text-xs sm:text-sm lg:text-[15px] font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a373]" />
                    <span>Voice &amp; Target Audience</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">Brand Name</label>
                      <input
                        type="text"
                        value={profile.name || ""}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">Industry</label>
                      <input
                        type="text"
                        value={profile.industry || ""}
                        onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                        placeholder="e.g. AI SaaS, Developer Tools"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">Tone of Voice</label>
                    <input
                      type="text"
                      value={profile.tone || ""}
                      onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
                      placeholder="e.g. Technical, authoritative yet approachable, direct, no fluff"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">Target Audience &amp; Personas</label>
                    <textarea
                      rows={3}
                      value={profile.target_audience || ""}
                      onChange={(e) => setProfile({ ...profile, target_audience: e.target.value })}
                      placeholder="e.g. Senior software engineers, engineering managers, and technical founders"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20 leading-relaxed resize-none transition-all"
                    />
                  </div>
                </div>
              </ScrollReveal>

              {/* Forbidden & Preferred Vocabulary */}
              <ScrollReveal delay={50}>
                <div className="hirael-card p-6 sm:p-7 lg:p-8 space-y-6 rounded-2xl sm:rounded-3xl">
                  <h2 className="text-xs sm:text-sm lg:text-[15px] font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                    <span>Vocabulary Rules &amp; Guardrails</span>
                  </h2>

                  {/* Forbidden Phrases */}
                  <div>
                    <label className="block text-xs sm:text-sm text-[#8a8a93] mb-2.5 font-medium">
                      Strictly Prohibited Phrases (AI agents will never output these)
                    </label>
                    <div className="flex flex-wrap gap-2.5 mb-3.5">
                      {profile.forbidden_phrases_json.map((phrase) => (
                        <span
                          key={phrase}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs sm:text-[13px]"
                        >
                          <span>{phrase}</span>
                          <button
                            type="button"
                            onClick={() => removeForbiddenPhrase(phrase)}
                            className="hover:text-rose-100 transition-colors ml-0.5 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newForbidden}
                        onChange={(e) => setNewForbidden(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addForbiddenPhrase())}
                        placeholder="Add forbidden word (e.g. synergy, game-changer)..."
                        className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20 transition-all"
                      />
                      <InteractiveButton
                        type="button"
                        onClick={addForbiddenPhrase}
                        variant="secondary"
                        size="md"
                        className="px-5 py-2.5 sm:py-3 text-xs sm:text-sm shrink-0 font-medium"
                      >
                        Add Rule
                      </InteractiveButton>
                    </div>
                  </div>

                  {/* Preferred Phrases */}
                  <div className="border-t border-white/[0.08] pt-6">
                    <label className="block text-xs sm:text-sm text-[#8a8a93] mb-2.5 font-medium">
                      Preferred Signature Vocabulary &amp; Slogans
                    </label>
                    <div className="flex flex-wrap gap-2.5 mb-3.5">
                      {profile.preferred_phrases_json.map((phrase) => (
                        <span
                          key={phrase}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4a373]/10 border border-[#d4a373]/25 text-[#d4a373] text-xs sm:text-[13px]"
                        >
                          <span>{phrase}</span>
                          <button
                            type="button"
                            onClick={() => removePreferredPhrase(phrase)}
                            className="hover:text-[#ede8df] transition-colors ml-0.5 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newPreferred}
                        onChange={(e) => setNewPreferred(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPreferredPhrase())}
                        placeholder="Add preferred phrase (e.g. first principles, build in public)..."
                        className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20 transition-all"
                      />
                      <InteractiveButton
                        type="button"
                        onClick={addPreferredPhrase}
                        variant="secondary"
                        size="md"
                        className="px-5 py-2.5 sm:py-3 text-xs sm:text-sm shrink-0 font-medium"
                      >
                        Add Preferred
                      </InteractiveButton>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Content Pillars */}
              <ScrollReveal delay={100}>
                <div className="hirael-card p-6 sm:p-7 lg:p-8 space-y-6 rounded-2xl sm:rounded-3xl">
                  <h2 className="text-xs sm:text-sm lg:text-[15px] font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a373]" />
                    <span>Content Pillars &amp; Target Distribution</span>
                  </h2>

                  <div className="space-y-3">
                    {profile.content_pillars_json.map((pillar, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs sm:text-sm"
                      >
                        <div className="font-medium text-[#ede8df] text-sm sm:text-base">{pillar.name}</div>
                        <div className="flex items-center gap-3.5">
                          <span className="px-3 py-1 rounded-full bg-[#d4a373]/10 text-[#d4a373] border border-[#d4a373]/20 font-mono text-xs">
                            {pillar.target_percentage}% share
                          </span>
                          <button
                            onClick={() => removePillar(index)}
                            className="p-1.5 text-[#71717a] hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <input
                      type="text"
                      value={newPillarName}
                      onChange={(e) => setNewPillarName(e.target.value)}
                      placeholder="New Pillar Name (e.g. Deep Dives, Case Studies)..."
                      className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20 transition-all"
                    />
                    <input
                      type="number"
                      value={newPillarShare}
                      onChange={(e) => setNewPillarShare(Number(e.target.value))}
                      className="w-24 px-3.5 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none text-center focus:border-[#d4a373]/60"
                      placeholder="%"
                    />
                    <InteractiveButton
                      type="button"
                      onClick={addPillar}
                      variant="secondary"
                      size="md"
                      className="px-5 py-2.5 sm:py-3 text-xs sm:text-sm shrink-0 font-medium"
                    >
                      Add Pillar
                    </InteractiveButton>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Policies & Knowledge Docs */}
            <div className="space-y-8">
              {/* Policies */}
              <ScrollReveal delay={30}>
                <div className="hirael-card p-6 sm:p-7 lg:p-8 space-y-6 rounded-2xl sm:rounded-3xl">
                  <h2 className="text-xs sm:text-sm lg:text-[15px] font-mono uppercase tracking-wider text-[#ede8df]">
                    Platform Policies
                  </h2>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">CTA Style</label>
                    <select
                      value={profile.cta_style}
                      onChange={(e) => setProfile({ ...profile, cta_style: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 cursor-pointer"
                    >
                      <option value="soft">Soft &amp; Thought-Provoking</option>
                      <option value="direct">Direct &amp; Action-Oriented</option>
                      <option value="educational">Educational / Discussion</option>
                      <option value="promotional">Promotional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">Emoji Usage</label>
                    <select
                      value={profile.emoji_policy}
                      onChange={(e) => setProfile({ ...profile, emoji_policy: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 cursor-pointer"
                    >
                      <option value="limited">Limited &amp; Tasteful (1-2 max)</option>
                      <option value="none">Strictly None</option>
                      <option value="expressive">Expressive &amp; Visual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">Hashtags Policy</label>
                    <select
                      value={profile.hashtag_policy}
                      onChange={(e) => setProfile({ ...profile, hashtag_policy: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 cursor-pointer"
                    >
                      <option value="optional">Platform-Optimized (Optional)</option>
                      <option value="required">Always Include 3-5</option>
                      <option value="prohibited">Prohibited / Clean text</option>
                    </select>
                  </div>
                </div>
              </ScrollReveal>

              {/* Brand Knowledge Docs (RAG Context) */}
              <ScrollReveal delay={80}>
                <div className="hirael-card p-6 sm:p-7 lg:p-8 space-y-6 rounded-2xl sm:rounded-3xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs sm:text-sm lg:text-[15px] font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2.5">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a373]" />
                      <span>Knowledge Base</span>
                    </h2>
                    <span className="text-xs text-[#71717a] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                      {knowledgeDocs.length} Docs
                    </span>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-none">
                    {knowledgeDocs.length === 0 ? (
                      <p className="text-xs sm:text-sm text-[#71717a] text-center py-6">No reference documents added yet.</p>
                    ) : (
                      knowledgeDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs sm:text-sm"
                        >
                          <div className="truncate pr-3">
                            <p className="font-medium text-[#ede8df] truncate text-xs sm:text-sm">{doc.title}</p>
                            <p className="text-[11px] font-mono text-emerald-400 mt-0.5">Indexed for RAG Context</p>
                          </div>
                          <button
                            onClick={() => handleDeleteKnowledgeDoc(doc.id)}
                            className="p-1.5 text-[#71717a] hover:text-rose-400 transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Knowledge Doc Form */}
                  <form onSubmit={handleAddKnowledgeDoc} className="border-t border-white/[0.08] pt-4 space-y-3.5">
                    <input
                      type="text"
                      required
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      placeholder="Doc Title (e.g. Brand Positioning 2026)"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20"
                    />
                    <textarea
                      rows={3}
                      required
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      placeholder="Paste reference text, guidelines, or FAQs..."
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20 resize-none leading-relaxed"
                    />
                    <InteractiveButton
                      type="submit"
                      variant="secondary"
                      size="md"
                      leftIcon={<Plus className="w-4 h-4 text-[#d4a373]" />}
                      className="w-full py-2.5 sm:py-3 text-xs sm:text-sm justify-center font-medium"
                    >
                      Add Reference Document
                    </InteractiveButton>
                  </form>
                </div>
              </ScrollReveal>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
