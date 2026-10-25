import React from 'react';
import {
  RotateCw,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useAIStatus } from '../context/AIStatusContext';
import { NAV_ITEMS } from './Sidebar';

export function TopNavbar({ activeTab, onSelectTab }) {
  const { status, loading, refreshStatus } = useAIStatus();
  const currentItem = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title & Subtitle */}
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {currentItem.label}
        </h2>
        <p className="text-xs text-slate-500 font-normal">
          {currentItem.desc}
        </p>
      </div>

      {/* Right Controls: AI Status Pill & Quick Shortcuts */}
      <div className="flex items-center gap-3">
        {/* Local AI Connection Status Indicator */}
        <div
          onClick={() => {
            if (!status.connected) onSelectTab('settings');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
            status.connected
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100/80'
              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
          }`}
          title={status.connected ? 'Ollama is connected and ready' : 'Ollama is offline. Click for setup'}
        >
          <span className="relative flex h-2 w-2">
            {status.connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status.connected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="font-semibold">
            {status.connected ? 'Ollama Online' : 'Ollama Offline'}
          </span>
          <span className="text-slate-400">•</span>
          <span className="font-mono text-[11px] text-slate-600">
            {status.configured_model}
          </span>
        </div>

        {/* Refresh AI Status Button */}
        <button
          onClick={refreshStatus}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh connection status"
          aria-label="Refresh AI Connection"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
        </button>

        {/* Settings Shortcut Button */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`p-2 rounded-lg transition-colors ${
            activeTab === 'settings'
              ? 'bg-brand-50 text-brand-700'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title="Open Settings"
          aria-label="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
