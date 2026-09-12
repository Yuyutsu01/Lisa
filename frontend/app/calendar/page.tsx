"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import {
  calendarApi,
  CalendarEvent,
  getActiveWorkspaceId,
} from "@/lib/api";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { InteractiveButton } from "@/components/InteractiveButton";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function CalendarPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Platform Filter
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    if (wsId) {
      loadCalendarData(wsId);
    }
  }, []);

  const loadCalendarData = async (workspaceId: string) => {
    try {
      setLoading(true);
      const data = await calendarApi.getEvents(workspaceId);
      setEvents(data);
    } catch (err) {
      console.error("Failed to load calendar", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvent = async (jobId: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled publishing job?")) return;
    try {
      await calendarApi.cancelJob(jobId);
      if (activeWorkspaceId) loadCalendarData(activeWorkspaceId);
    } catch (err) {
      console.error("Cancel failed", err);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return "bg-white/[0.06] text-[#ede8df] border-white/15";
      case "x":
        return "bg-white/[0.04] text-[#a6a39b] border-white/[0.08]";
      case "instagram":
        return "bg-pink-500/15 text-pink-300 border-pink-500/25";
      case "youtube":
        return "bg-red-500/15 text-red-300 border-red-500/25";
      case "tiktok":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
      case "threads":
        return "bg-white/[0.06] text-[#ede8df] border-white/10";
      default:
        return "bg-[#d4a373]/15 text-[#d4a373] border-[#d4a373]/30";
    }
  };

  const filteredEvents = events.filter((e) =>
    selectedPlatform === "all" ? true : e.platform.toLowerCase() === selectedPlatform
  );

  // Month grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (loading) {
    return (
      <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-[#8a8a93] text-xs font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4a373] animate-ping" />
            Loading distribution calendar...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with View Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#85827b] mb-1">
              <CalendarIcon className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>Omnichannel Schedule Orchestration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-[#ede8df]">
              Content Distribution Calendar
            </h1>
            <p className="text-xs sm:text-sm text-[#8a8a93] mt-1">
              Visualize, schedule, and orchestrate automated publishing across all connected channels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/content">
              <InteractiveButton
                variant="primary"
                size="md"
                glow
                shimmer
                magnetic
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                New Scheduled Post
              </InteractiveButton>
            </Link>
          </div>
        </div>

        {/* Toolbar: Month selector, View switch, Platform Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Month Navigation */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-[#ede8df] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-sm text-[#ede8df] min-w-36 text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-[#ede8df] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Platform Filter & View Modes */}
          <div className="flex items-center gap-3">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-[#ede8df] outline-none focus:border-[#d4a373]/60"
            >
              <option value="all">All Channels</option>
              <option value="linkedin">LinkedIn</option>
              <option value="x">X (Twitter)</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube Shorts</option>
              <option value="tiktok">TikTok</option>
            </select>

            <div className="flex items-center p-1 rounded-full bg-[#0a0a0d] border border-white/[0.08]">
              {(["month", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                    viewMode === mode
                      ? "bg-[#ede8df] text-[#09090b] font-semibold shadow-sm"
                      : "text-[#85827b] hover:text-[#ede8df]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Month Calendar Grid View */}
        {viewMode === "month" && (
          <ScrollReveal delay={0}>
            <div className="hirael-card p-4 sm:p-6 space-y-4">
              {/* Weekdays Header */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono text-[#85827b] uppercase tracking-wider pb-2 border-b border-white/[0.06]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-2 min-h-[480px]">
                {/* Blank offset days */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="rounded-xl bg-white/[0.01] border border-white/[0.03] p-2 opacity-20"
                  />
                ))}

                {/* Days of Month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNumber = i + 1;
                  const cellDate = new Date(year, month, dayNumber);
                  const dayEvents = filteredEvents.filter((e) => {
                    const d = new Date(e.scheduled_at);
                    return (
                      d.getFullYear() === year &&
                      d.getMonth() === month &&
                      d.getDate() === dayNumber
                    );
                  });

                  const isToday =
                    new Date().toDateString() === cellDate.toDateString();

                  return (
                    <div
                      key={dayNumber}
                      className={`rounded-xl border p-2 flex flex-col justify-between transition-all min-h-[95px] ${
                        isToday
                          ? "bg-[#d4a373]/10 border-[#d4a373]/40 shadow-sm"
                          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-medium ${
                            isToday
                              ? "w-5 h-5 rounded-full bg-[#d4a373] text-[#09090b] font-bold flex items-center justify-center text-[10px]"
                              : "text-[#ede8df]"
                          }`}
                        >
                          {dayNumber}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] text-[#71717a] font-mono">
                            {dayEvents.length} post{dayEvents.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Events inside this day */}
                      <div className="space-y-1 flex-1 overflow-y-auto max-h-20 scrollbar-none">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className={`p-1.5 rounded-lg border text-[10px] font-medium leading-tight truncate ${getPlatformColor(
                              evt.platform
                            )}`}
                            title={`${evt.title} - ${evt.snippet}`}
                          >
                            <span className="font-semibold uppercase text-[9px]">{evt.platform}:</span>{" "}
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <ScrollReveal delay={0}>
            <div className="hirael-card p-5 sm:p-6 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4a373]" />
                <span>Scheduled Publishing Queue ({filteredEvents.length})</span>
              </h2>

              {filteredEvents.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#71717a]">
                  No scheduled posts in queue. Approve variants in the Studio to schedule publication.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${getPlatformColor(
                              evt.platform
                            )}`}
                          >
                            {evt.platform}
                          </span>
                          <p className="font-medium text-[#ede8df] truncate">{evt.title}</p>
                        </div>
                        <p className="text-[#8a8a93] text-[11px] line-clamp-1">{evt.snippet}</p>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                        <div className="text-right text-[11px] text-[#8a8a93]">
                          <p className="font-medium text-[#ede8df]">
                            {new Date(evt.scheduled_at).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-[#71717a] font-mono">
                            {new Date(evt.scheduled_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {evt.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancelEvent(evt.job_id)}
                            className="p-1.5 rounded-lg text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Cancel Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        )}
      </div>
    </AppLayout>
  );
}
