import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ListTodo,
  Mail,
  FolderTree,
  Sparkles,
  Settings as SettingsIcon,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAIStatus } from '../context/AIStatusContext';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'Dashboard & quick actions' },
  { id: 'summarizer', label: 'Smart Summarizer', icon: FileText, desc: 'Distill long documents' },
  { id: 'tasks', label: 'Task Generator', icon: ListTodo, desc: 'Turn notes into actions' },
  { id: 'emails', label: 'Email Assistant', icon: Mail, desc: 'Craft refined replies' },
  { id: 'files', label: 'File Organizer', icon: FolderTree, desc: 'Safe directory tidy-up' },
  { id: 'briefing', label: 'Daily Briefing', icon: Sparkles, desc: 'AI morning priorities' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, desc: 'Models & system info' },
];

export function Sidebar({ activeTab, onSelectTab }) {
  const { status } = useAIStatus();

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen select-none shrink-0 shadow-sm">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-slate-900 tracking-tight text-lg">LazyFlow</h1>
            <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200">
              AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium tracking-tight">
            Local AI Productivity
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Workspace
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${
                isActive
                  ? 'bg-brand-50/80 text-brand-700 shadow-sm border border-brand-100 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Model & System Status Card at Bottom of Sidebar */}
      <div className="p-3 border-t border-slate-100 m-3 rounded-2xl bg-slate-50/90 border border-slate-200/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Local Engine</span>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              status.connected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {status.connected ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Online
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Offline
              </>
            )}
          </span>
        </div>
        <div className="text-xs text-slate-600 font-mono truncate bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
          {status.configured_model || 'gemma2:2b'}
        </div>
        <p className="text-[10px] text-slate-400 mt-2 leading-tight">
          100% private inference on your machine. Zero cloud fees.
        </p>
      </div>
    </aside>
  );
}
