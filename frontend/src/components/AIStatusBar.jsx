import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { useAIStatus } from '../context/AIStatusContext';
import { useToast } from '../context/ToastContext';

export function AIStatusBar() {
  const { status, refreshStatus, loading } = useAIStatus();
  const toast = useToast();
  const [copiedCmd, setCopiedCmd] = useState('');

  if (status.connected) {
    return null;
  }

  const copyCommand = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    toast.success(`Copied: ${cmd}`);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  return (
    <div className="bg-amber-50/90 border-b border-amber-200 px-6 py-3 text-xs text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Local AI Service Not Detected: </span>
          <span>
            {status.error || 'Cannot communicate with Ollama at http://127.0.0.1:11434.'}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-amber-800 font-medium">To start Ollama locally:</span>
            <button
              onClick={() => copyCommand('ollama serve')}
              className="inline-flex items-center gap-1 font-mono bg-white text-slate-800 px-2 py-0.5 rounded border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <Terminal className="w-3 h-3 text-slate-500" />
              ollama serve
              {copiedCmd === 'ollama serve' ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
            <span className="text-amber-800 font-medium">Model pull command:</span>
            <button
              onClick={() => copyCommand(`ollama pull ${status.configured_model || 'gemma2:2b'}`)}
              className="inline-flex items-center gap-1 font-mono bg-white text-slate-800 px-2 py-0.5 rounded border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <Terminal className="w-3 h-3 text-slate-500" />
              ollama pull {status.configured_model || 'gemma2:2b'}
              {copiedCmd.includes('pull') ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        <button
          onClick={refreshStatus}
          disabled={loading}
          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-xs"
        >
          {loading ? 'Checking...' : 'Check Connection'}
        </button>
      </div>
    </div>
  );
}
