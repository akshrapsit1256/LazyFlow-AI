import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  RotateCw,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  HardDrive,
  Database,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAIStatus } from '../context/AIStatusContext';
import { useToast } from '../context/ToastContext';

export function SettingsPage() {
  const toast = useToast();
  const { status: aiStatus, loading, refreshStatus, changeModel } = useAIStatus();

  const [selectedModel, setSelectedModel] = useState(aiStatus.configured_model || 'gemma2:2b');
  const [customModelInput, setCustomModelInput] = useState('');
  const [copiedCmd, setCopiedCmd] = useState('');
  const [savingModel, setSavingModel] = useState(false);

  const handleModelChange = async (newModel) => {
    setSavingModel(true);
    const success = await changeModel(newModel);
    if (success) {
      setSelectedModel(newModel);
      toast.success(`Active model updated to ${newModel}`);
    } else {
      toast.error('Failed to update model');
    }
    setSavingModel(false);
  };

  const copyCommand = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    toast.success(`Copied: ${cmd}`);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & AI Settings</h1>
        <p className="text-sm text-slate-500">
          Manage local model configurations, test your Ollama connection, and inspect privacy parameters.
        </p>
      </div>

      {/* Local AI Engine Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Ollama Local Inference Service</h2>
              <p className="text-xs text-slate-400 font-mono">
                {aiStatus.base_url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                aiStatus.connected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {aiStatus.connected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Service Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Offline
                </>
              )}
            </span>

            <button
              onClick={refreshStatus}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Test connection"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Model Selection Dropdown */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Select Active Open-Weight Model
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={savingModel}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
              >
                {aiStatus.models_available?.length > 0 ? (
                  aiStatus.models_available.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} {m.parameter_size ? `(${m.parameter_size})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="gemma2:2b">gemma2:2b (Default)</option>
                )}
                {/* Fallback popular models */}
                <option value="gemma2:9b">gemma2:9b (9B params)</option>
                <option value="llama3.2">llama3.2 (3B params)</option>
                <option value="mistral">mistral (7B params)</option>
              </select>
            </div>

            {/* Custom model input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                placeholder="Or specify model name (e.g. qwen2.5)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                type="button"
                onClick={() => {
                  if (customModelInput.trim()) {
                    handleModelChange(customModelInput.trim());
                    setCustomModelInput('');
                  }
                }}
                disabled={!customModelInput.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shrink-0"
              >
                Set
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Selected model is saved directly in your SQLite configuration and used across all tools.
          </p>
        </div>

        {/* Installed Models list if available */}
        {aiStatus.models_available?.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Locally Installed Models in Ollama
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiStatus.models_available.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-800">{m.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Family: {m.family || 'Open-Weight'} • {m.quantization_level || 'Q4_0'}
                    </span>
                  </div>
                  {m.size && (
                    <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Terminal Quick Setup Guide */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-600" />
          Ollama Quick-Start Commands (Windows)
        </h2>
        <p className="text-xs text-slate-500">
          Run these commands in PowerShell or Command Prompt to launch Ollama or download models:
        </p>

        <div className="space-y-2">
          {[
            {
              label: '1. Start the Ollama background daemon',
              cmd: 'ollama serve',
            },
            {
              label: '2. Download the Gemma 2 (2B) model (1.6 GB download)',
              cmd: 'ollama pull gemma2:2b',
            },
            {
              label: '3. List currently installed local models',
              cmd: 'ollama list',
            },
            {
              label: '4. Optional: Download larger Gemma 2 (9B) model',
              cmd: 'ollama pull gemma2:9b',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-900 rounded-xl flex items-center justify-between text-xs text-slate-200 font-mono shadow-inner"
            >
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">{item.label}</span>
                <span className="text-brand-300 font-semibold">{item.cmd}</span>
              </div>
              <button
                onClick={() => copyCommand(item.cmd)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy command"
              >
                {copiedCmd === item.cmd ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Open Innovation & Open-Weight Principles */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          Hacktoberfest 2026 Open-Source AI Challenge
        </div>
        <h2 className="text-xl font-bold tracking-tight">
          Why Open-Weight AI & Local Inference Matter
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <h3 className="font-bold text-white text-sm">Complete Data Sovereignty</h3>
            <p className="leading-relaxed">
              Your notes, financial records, client email drafts, and folder names never leave your device. There is no remote logging, training on your data, or compliance risk.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <h3 className="font-bold text-white text-sm">Zero Token Paywalls</h3>
            <p className="leading-relaxed">
              Commercial APIs charge per thousand input and output tokens. Local open weights run for unlimited prompts without recurring credit card bills or subscription fees.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <h3 className="font-bold text-white text-sm">True Offline Capability</h3>
            <p className="leading-relaxed">
              While model weights require an initial download from the internet, all ongoing inference runs 100% offline. Keep working on airplanes, trains, or during outages.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <h3 className="font-bold text-white text-sm">Open Weights vs Open Source</h3>
            <p className="leading-relaxed">
              Gemma 2 is provided under open model terms with permissible commercial use. Open weights grant model architecture freedom and fine-tuning independence.
            </p>
          </div>
        </div>
      </div>

      {/* Application System Metadata */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Local SQLite Storage</h3>
            <p className="text-slate-400 font-mono text-[11px]">Database: lazyflow.db</p>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px] text-right">
          <div>LazyFlow AI v1.0.0</div>
          <div>Stack: React 19 • Vite • FastAPI • Ollama</div>
        </div>
      </div>
    </div>
  );
}
