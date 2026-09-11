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
  Share2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

export default function CalendarPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
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
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "x":
        return "bg-slate-700/40 text-slate-200 border-slate-600";
      case "instagram":
        return "bg-pink-500/20 text-pink-300 border-pink-500/40";
      case "youtube":
        return "bg-red-500/20 text-red-300 border-red-500/40";
      case "tiktok":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      default:
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
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

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with View Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-indigo-400" />
              Content Distribution Calendar
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Visualize, schedule, and orchestrate publishing across all connected channels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/content"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Scheduled Post</span>
            </Link>
          </div>
        </div>

        {/* Toolbar: Month selector, View switch, Platform Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Month Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-base text-slate-200 min-w-36 text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Platform Filter & View Modes */}
          <div className="flex items-center gap-3">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
            >
              <option value="all">All Channels</option>
              <option value="linkedin">LinkedIn</option>
              <option value="x">X (Twitter)</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube Shorts</option>
              <option value="tiktok">TikTok</option>
            </select>

            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              {(["month", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    viewMode === mode
                      ? "bg-indigo-600/30 text-indigo-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
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
          <div className="glass-card rounded-3xl p-6 space-y-4">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800/80">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 gap-2 min-h-[520px]">
              {/* Blank offset days */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="rounded-2xl bg-slate-950/30 border border-slate-900/50 p-2 opacity-30"
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
                    className={`rounded-2xl border p-2.5 flex flex-col justify-between transition-all min-h-[100px] ${
                      isToday
                        ? "bg-indigo-950/20 border-indigo-500/40 shadow-sm"
                        : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]"
                            : "text-slate-300"
                        }`}
                      >
                        {dayNumber}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {dayEvents.length} post{dayEvents.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Events inside this day */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-24 scrollbar-none">
                      {dayEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className={`p-1.5 rounded-lg border text-[10px] font-medium leading-tight truncate ${getPlatformColor(
                            evt.platform
                          )}`}
                          title={`${evt.title} - ${evt.snippet}`}
                        >
                          <span className="font-bold capitalize">{evt.platform}:</span>{" "}
                          {evt.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Scheduled Publishing Queue ({filteredEvents.length})
            </h2>

            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No scheduled posts in queue. Approve variants in the Studio to schedule publication.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${getPlatformColor(
                            evt.platform
                          )}`}
                        >
                          {evt.platform}
                        </span>
                        <p className="font-semibold text-slate-200">{evt.title}</p>
                      </div>
                      <p className="text-slate-400 text-[11px] line-clamp-1">{evt.snippet}</p>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right text-[11px] text-slate-400">
                        <p className="font-medium text-slate-200">
                          {new Date(evt.scheduled_at).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(evt.scheduled_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {evt.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancelEvent(evt.job_id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
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
        )}
      </div>
    </AppLayout>
  );
}
