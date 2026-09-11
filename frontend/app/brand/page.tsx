"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  brandApi,
  BrandProfile,
  BrandKnowledgeDoc,
  ContentPillar,
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
  UploadCloud,
  CheckCircle2,
} from "lucide-react";

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
    const newPillar: ContentPillar = {
      name: newPillarName.trim(),
      target_percentage: Number(newPillarShare) || 25,
    };
    setProfile({
      ...profile,
      content_pillars_json: [...profile.content_pillars_json, newPillar],
    });
    setNewPillarName("");
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
          <div className="text-slate-400 text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
            Loading Brand Intelligence profile...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              Brand Intelligence System
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Configure brand voice, forbidden words, and content pillars used by all 10 AI adaptation agents.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Guidelines Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Guidelines..." : "Save Brand Profile"}</span>
              </>
            )}
          </button>
        </div>

        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Voice, Persona & Rules */}
            <div className="lg:col-span-2 space-y-6">
              {/* Core Identity */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Voice & Target Audience
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Brand Name</label>
                    <input
                      type="text"
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Industry</label>
                    <input
                      type="text"
                      value={profile.industry || ""}
                      onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                      placeholder="e.g. AI SaaS, Developer Tools"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Tone of Voice</label>
                  <input
                    type="text"
                    value={profile.tone || ""}
                    onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
                    placeholder="e.g. Technical, authoritative yet approachable, direct, no fluff"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target Audience & Personas</label>
                  <textarea
                    rows={3}
                    value={profile.target_audience || ""}
                    onChange={(e) => setProfile({ ...profile, target_audience: e.target.value })}
                    placeholder="e.g. Senior software engineers, engineering managers, and technical founders"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Forbidden & Preferred Vocabulary */}
              <div className="glass-card rounded-2xl p-6 space-y-6">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Vocabulary Rules & Forbidden Phrases
                </h2>

                {/* Forbidden Phrases */}
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-medium">
                    Strictly Prohibited Phrases (AI will never output these)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.forbidden_phrases_json.map((phrase) => (
                      <span
                        key={phrase}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs"
                      >
                        <span>{phrase}</span>
                        <button
                          type="button"
                          onClick={() => removeForbiddenPhrase(phrase)}
                          className="hover:text-rose-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newForbidden}
                      onChange={(e) => setNewForbidden(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addForbiddenPhrase())}
                      placeholder="Add forbidden word (e.g. synergy, paradigm shift)..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addForbiddenPhrase}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Preferred Phrases */}
                <div className="border-t border-slate-800/80 pt-5">
                  <label className="block text-xs text-slate-400 mb-2 font-medium">
                    Preferred Signature Phrases & Slogans
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.preferred_phrases_json.map((phrase) => (
                      <span
                        key={phrase}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs"
                      >
                        <span>{phrase}</span>
                        <button
                          type="button"
                          onClick={() => removePreferredPhrase(phrase)}
                          className="hover:text-indigo-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPreferred}
                      onChange={(e) => setNewPreferred(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPreferredPhrase())}
                      placeholder="Add preferred phrase (e.g. first principles, build in public)..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addPreferredPhrase}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Pillars */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Content Pillars & Target Distribution
                </h2>

                <div className="space-y-3">
                  {profile.content_pillars_json.map((pillar, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <div className="font-medium text-slate-200">{pillar.name}</div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
                          {pillar.target_percentage}% share
                        </span>
                        <button
                          onClick={() => removePillar(index)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newPillarName}
                    onChange={(e) => setNewPillarName(e.target.value)}
                    placeholder="New Pillar Name (e.g. Deep Dives, Case Studies)..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    value={newPillarShare}
                    onChange={(e) => setNewPillarShare(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none text-center"
                    placeholder="%"
                  />
                  <button
                    type="button"
                    onClick={addPillar}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium"
                  >
                    Add Pillar
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Policies & Knowledge Docs */}
            <div className="space-y-6">
              {/* Policies */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Platform Policies
                </h2>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">CTA Style</label>
                  <select
                    value={profile.cta_style}
                    onChange={(e) => setProfile({ ...profile, cta_style: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  >
                    <option value="soft">Soft & Thought-Provoking</option>
                    <option value="direct">Direct & Action-Oriented</option>
                    <option value="educational">Educational / Discussion</option>
                    <option value="promotional">Promotional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Emoji Usage</label>
                  <select
                    value={profile.emoji_policy}
                    onChange={(e) => setProfile({ ...profile, emoji_policy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  >
                    <option value="limited">Limited & Tasteful (1-2 max)</option>
                    <option value="none">Strictly None</option>
                    <option value="expressive">Expressive & Visual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Hashtags Policy</label>
                  <select
                    value={profile.hashtag_policy}
                    onChange={(e) => setProfile({ ...profile, hashtag_policy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  >
                    <option value="optional">Platform-Optimized (Optional)</option>
                    <option value="required">Always Include 3-5</option>
                    <option value="prohibited">Prohibited / Clean text</option>
                  </select>
                </div>
              </div>

              {/* Brand Knowledge Docs (RAG Context) */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Knowledge Base
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {knowledgeDocs.length} Docs
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {knowledgeDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-slate-200 truncate">{doc.title}</p>
                        <p className="text-[10px] text-emerald-400">Indexed for RAG</p>
                      </div>
                      <button
                        onClick={() => handleDeleteKnowledgeDoc(doc.id)}
                        className="text-slate-500 hover:text-rose-400 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Knowledge Doc Form */}
                <form onSubmit={handleAddKnowledgeDoc} className="border-t border-slate-800 pt-3 space-y-2">
                  <input
                    type="text"
                    required
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Doc Title (e.g. Brand Positioning 2026)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  />
                  <textarea
                    rows={2}
                    required
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Paste reference text, guidelines, or FAQs..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Reference Document
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
