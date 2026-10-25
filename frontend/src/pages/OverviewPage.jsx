import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  ListTodo,
  Mail,
  FolderTree,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Plus,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAIStatus } from '../context/AIStatusContext';

export function OverviewPage({ onNavigate }) {
  const toast = useToast();
  const { status: aiStatus } = useAIStatus();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickTaskSubmit = async (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    setSubmittingTask(true);
    try {
      await api.createTask({
        title: quickTaskTitle.trim(),
        priority: 'medium',
        is_completed: false,
      });
      setQuickTaskTitle('');
      toast.success('Task added to your list');
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Failed to add task');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      await api.updateTask(taskId, { is_completed: !currentStatus });
      fetchStats();
      toast.success(!currentStatus ? 'Task completed!' : 'Task reopened');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            100% Private Local AI Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
            Welcome to LazyFlow AI
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6 font-normal">
            Automate your daily busywork without sending sensitive information to cloud servers.
            Powered by open-weight models (<span className="text-brand-300 font-mono font-medium">{aiStatus.configured_model}</span>) running natively on your hardware.
          </p>

          {/* Quick Capture Input */}
          <form onSubmit={handleQuickTaskSubmit} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Quick capture a task or thought..."
                className="w-full bg-white/10 text-white placeholder-slate-400 px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm backdrop-blur-md"
              />
            </div>
            <button
              type="submit"
              disabled={submittingTask || !quickTaskTitle.trim()}
              className="px-5 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-brand-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Capture</span>
            </button>
          </form>
        </div>

        {/* Decorative backdrop elements */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Real Productivity Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Tasks
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : stats?.pending_tasks ?? 0}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {stats?.completed_tasks ?? 0} completed
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <ListTodo className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saved Summaries
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : stats?.saved_summaries_count ?? 0}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Distilled local notes
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Email Drafts
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '...' : stats?.saved_emails_count ?? 0}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ready for client review
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Time Saved (Est.)
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {loading
                ? '...'
                : `${Math.round((stats?.estimated_time_saved_minutes ?? 0) / 60 * 10) / 10} hrs`}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Based on local workflow actions
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Productivity Workflows
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Select a tool to launch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('summarizer')}
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-brand-300 hover:shadow-md transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                Smart Summarizer
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Compress articles, papers, or messy logs into bulleted key points or concise paragraphs.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
              <span>Open tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigate('tasks')}
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ListTodo className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Task Generator
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Paste rambling thoughts, brainstorms, or meeting notes to extract structured task items.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-amber-700 group-hover:translate-x-1 transition-transform">
              <span>Open tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigate('emails')}
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Email Assistant
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Draft professional responses with controlled tone (friendly, concise, formal) without sending.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>Open tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigate('files')}
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FolderTree className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                File Organizer
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Tidy messy folders with safe category recommendations and full preview verification.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
              <span>Open tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => onNavigate('briefing')}
            className="group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Daily Briefing
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Synthesize your saved tasks into an executive morning briefing and priority roadmap.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-purple-700 group-hover:translate-x-1 transition-transform">
              <span>Open tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800">
                Ollama Local Engine
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-mono">
                Model: {aiStatus.configured_model}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero rate limits, zero API subscriptions.
              </p>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="mt-5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              Configure engine
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Pending Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks Panel (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-brand-600" />
              Active Priority Tasks
            </h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Manage all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading tasks...</div>
            ) : !stats?.recent_activity?.filter((a) => a.type === 'task').length ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-medium text-slate-500">No active tasks right now.</p>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Generate tasks from notes
                </button>
              </div>
            ) : (
              stats.recent_activity
                .filter((a) => a.type === 'task')
                .slice(0, 5)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          item.status === 'completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-800'
                        }`}
                      >
                        {item.title.replace('Task: ', '')}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {item.status}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Recent Activity Feed (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Recent Activity
            </h2>
            <button
              onClick={fetchStats}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              title="Refresh activity"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading activity...</div>
            ) : !stats?.recent_activity?.length ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No activity recorded yet.
              </div>
            ) : (
              stats.recent_activity.slice(0, 6).map((act, index) => (
                <div key={index} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === 'summary' && <FileText className="w-3 h-3 text-brand-600" />}
                    {act.type === 'task' && <ListTodo className="w-3 h-3 text-amber-600" />}
                    {act.type === 'email' && <Mail className="w-3 h-3 text-indigo-600" />}
                    {act.type === 'briefing' && <Sparkles className="w-3 h-3 text-purple-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {act.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span className="capitalize">{act.status}</span>
                      <span>{new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
