import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCw,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  FileText,
  ListTodo,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAIStatus } from '../context/AIStatusContext';
import { Modal } from '../components/Modal';

export function DailyBriefingPage() {
  const toast = useToast();
  const { status: aiStatus } = useAIStatus();

  const [additionalNotes, setAdditionalNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentBriefing, setCurrentBriefing] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Past briefings
  const [pastBriefings, setPastBriefings] = useState([]);
  const [loadingPast, setLoadingPast] = useState(true);
  const [selectedBriefing, setSelectedBriefing] = useState(null);

  const fetchPastBriefings = async () => {
    try {
      setLoadingPast(true);
      const data = await api.getSavedBriefings();
      setPastBriefings(data);
    } catch (err) {
      console.error('Failed to load past briefings:', err);
    } finally {
      setLoadingPast(false);
    }
  };

  useEffect(() => {
    fetchPastBriefings();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setCurrentBriefing(null);
    try {
      const res = await api.generateBriefing(additionalNotes.trim() || null);
      setCurrentBriefing(res);
      toast.success('Daily briefing synthesized with local AI!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate briefing');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveBriefing = async () => {
    if (!currentBriefing) return;
    setSaving(true);
    try {
      await api.saveBriefing({
        title: currentBriefing.title || 'Daily Briefing',
        briefing_content: currentBriefing.briefing_content,
        priorities_content: currentBriefing.priorities_content,
        recommended_actions: currentBriefing.recommended_actions,
        stats_snapshot: currentBriefing.stats_snapshot || {},
        model_used: currentBriefing.model_used,
      });
      toast.success('Briefing preserved in SQLite history!');
      fetchPastBriefings();
    } catch (err) {
      toast.error(err.message || 'Failed to save briefing');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Briefing copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteBriefing(id);
      setPastBriefings((prev) => prev.filter((b) => b.id !== id));
      if (selectedBriefing?.id === id) setSelectedBriefing(null);
      toast.success('Briefing deleted');
    } catch (err) {
      toast.error('Failed to delete briefing');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Productivity Briefing</h1>
          <p className="text-sm text-slate-500">
            Synthesize real tasks, pending deadlines, and workload priorities into an actionable morning brief.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-purple-600/20 self-start"
        >
          {generating ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Task Data...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Today's Briefing</span>
            </>
          )}
        </button>
      </div>

      {/* Optional Daily Goal Note Input */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5" />
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Today's Primary Focus / Energy Level (Optional Context for AI)
          </label>
          <input
            type="text"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="e.g. 'Deep focus morning for coding, lighter afternoon for administrative tasks'"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* Active Briefing Display Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Executive Productivity Briefing
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Derived from live SQLite task metrics • Model: {aiStatus.configured_model}
            </p>
          </div>

          {currentBriefing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(currentBriefing.briefing_content)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Briefing
              </button>
              <button
                onClick={handleSaveBriefing}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Save to History
              </button>
            </div>
          )}
        </div>

        {/* Content Display */}
        {generating ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 animate-pulse">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">
                Synthesizing priorities with {aiStatus.configured_model}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Auditing pending tasks, deadlines, and progress statistics offline.
              </p>
            </div>
          </div>
        ) : currentBriefing ? (
          <div className="space-y-6">
            {/* Stats Snapshot bar */}
            {currentBriefing.stats_snapshot && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Active Workload</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {currentBriefing.stats_snapshot.pending ?? 0} Pending
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Tasks Completed</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {currentBriefing.stats_snapshot.completed ?? 0} Done
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Overdue Items</span>
                  <span className="font-bold text-rose-700 text-sm">
                    {currentBriefing.stats_snapshot.overdue_count ?? 0} Overdue
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Model Provider</span>
                  <span className="font-mono text-purple-800 text-xs font-semibold">
                    {currentBriefing.model_used}
                  </span>
                </div>
              </div>
            )}

            {/* Markdown rendered content */}
            <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 whitespace-pre-line text-sm font-sans">
              {currentBriefing.briefing_content}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-600">No briefing generated yet today.</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Click the "Generate Today's Briefing" button above to review active tasks and create a strategic daily roadmap.
            </p>
          </div>
        )}
      </div>

      {/* Past Briefings History Archive */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-purple-600" />
          Briefing History ({pastBriefings.length})
        </h3>

        {loadingPast ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
        ) : pastBriefings.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-medium text-slate-500">No past briefings saved yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastBriefings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-200 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {b.model_used}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-800 text-sm line-clamp-1 mb-1">
                    {b.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {b.briefing_content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedBriefing(b)}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <span>Read full</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                    title="Delete saved briefing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to view full archived briefing */}
      <Modal
        isOpen={!!selectedBriefing}
        onClose={() => setSelectedBriefing(null)}
        title={selectedBriefing?.title || 'Daily Briefing Archive'}
        maxWidth="max-w-2xl"
      >
        {selectedBriefing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                {selectedBriefing.model_used}
              </span>
              <span>•</span>
              <span>{new Date(selectedBriefing.created_at).toLocaleString()}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-800 whitespace-pre-line font-sans">
              {selectedBriefing.briefing_content}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => handleCopy(selectedBriefing.briefing_content)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
              <button
                onClick={() => setSelectedBriefing(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
