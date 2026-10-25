import React, { useState } from 'react';
import {
  FolderTree,
  Folder,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Download,
  Copy,
  Check,
  RotateCw,
  FolderOpen,
  ArrowRight,
  ListPlus,
  Terminal,
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAIStatus } from '../context/AIStatusContext';
import { Modal } from '../components/Modal';

const SAMPLE_FILES_TEXT = `invoice_october_2026.pdf
receipt_aws_hosting.pdf
presentation_pitch_deck.pptx
quarterly_budget_final.xlsx
user_survey_responses.csv
main_server_backend.py
client_dashboard.jsx
database_schema.sql
team_offsite_photo1.jpg
app_logo_vector.svg
podcast_episode_12.mp3
product_walkthrough_screen.mp4
project_backup_v2.zip
notes_brainstorm_hackathon.txt
architecture_design.md`;

export function FileOrganizerPage() {
  const toast = useToast();
  const { status: aiStatus } = useAIStatus();

  const [inputMode, setInputMode] = useState('text'); // 'text' | 'picker'
  const [fileListText, setFileListText] = useState('');
  const [selectedDirectoryPath, setSelectedDirectoryPath] = useState('');
  const [customPreferences, setCustomPreferences] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [copiedPlan, setCopiedPlan] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Directory picker handler using File System Access API
  const handlePickDirectory = async () => {
    if (!('showDirectoryPicker' in window)) {
      toast.info('Browser Directory Picker is not supported in this browser. Please use the Filename List mode below.');
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker();
      const filesFound = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const fileData = await entry.getFile();
          filesFound.push({
            name: entry.name,
            size: fileData.size,
            extension: `.${entry.name.split('.').pop()}`,
            type: fileData.type,
          });
        }
      }

      if (filesFound.length === 0) {
        toast.info('No files found directly in selected directory.');
        return;
      }

      const names = filesFound.map((f) => f.name).join('\n');
      setFileListText(names);
      setSelectedDirectoryPath(dirHandle.name || 'Selected Folder');
      toast.success(`Loaded ${filesFound.length} filenames from "${dirHandle.name}"!`);
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Could not access folder: ' + err.message);
      }
    }
  };

  const handleAnalyze = async () => {
    const rawLines = fileListText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (rawLines.length === 0) {
      toast.error('Please provide at least one filename to analyze.');
      return;
    }

    const filesPayload = rawLines.map((name) => {
      const parts = name.split('.');
      const ext = parts.length > 1 ? `.${parts.pop()}` : '';
      return {
        name,
        extension: ext,
        size: null,
      };
    });

    setAnalyzing(true);
    setPlanResult(null);
    try {
      const res = await api.planFileOrganization(filesPayload, customPreferences.trim() || null);
      setPlanResult(res);
      toast.success('Organization plan created!');
    } catch (err) {
      toast.error(err.message || 'Failed to analyze files');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyPlan = () => {
    if (!planResult) return;
    const summary = planResult.plan
      .map((p) => `${p.original_name} -> ${p.proposed_subfolder}/${p.destination_name} (${p.reason})`)
      .join('\n');
    navigator.clipboard.writeText(summary);
    setCopiedPlan(true);
    toast.success('Organization plan copied');
    setTimeout(() => setCopiedPlan(false), 2000);
  };

  const handleDownloadScript = () => {
    if (!planResult) return;
    // Generate safe PowerShell script with verification
    const scriptLines = [
      '# LazyFlow AI - Safe Local File Organization Script',
      '# Review commands below before running in PowerShell.',
      '# All operations are local and reversible.',
      '',
      '$Host.UI.RawUI.WindowTitle = "LazyFlow AI Organization"',
      'Write-Host "Organizing files based on AI recommendations..." -ForegroundColor Cyan',
      '',
    ];

    planResult.plan.forEach((item) => {
      const folder = item.proposed_subfolder.replace(/\//g, '\\');
      scriptLines.push(`if (Test-Path "${item.original_name}") {`);
      scriptLines.push(`    if (!(Test-Path "${folder}")) { New-Item -ItemType Directory -Path "${folder}" -Force | Out-Null }`);
      scriptLines.push(`    Move-Item -Path "${item.original_name}" -Destination "${folder}\\${item.destination_name}"`);
      scriptLines.push(`    Write-Host "Moved ${item.original_name} -> ${folder}" -ForegroundColor Green`);
      scriptLines.push('}');
    });

    scriptLines.push('');
    scriptLines.push('Write-Host "Done! All files organized safely." -ForegroundColor Green');

    const blob = new Blob([scriptLines.join('\r\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organize_files_safely.ps1';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded PowerShell organization script');
  };

  const handleExecuteSafeMoves = async () => {
    if (!selectedDirectoryPath || !planResult) return;
    setExecuting(true);
    try {
      const operations = planResult.plan.map((p) => ({
        original_relative_path: p.original_name,
        target_relative_path: `${p.proposed_subfolder}/${p.destination_name}`,
      }));

      const res = await api.executeFileOrganization(selectedDirectoryPath, operations);
      if (res.success) {
        toast.success(res.message);
        setShowConfirmModal(false);
      } else {
        toast.error(res.message + (res.errors?.length ? ` (${res.errors[0]})` : ''));
      }
    } catch (err) {
      toast.error(err.message || 'Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">File Organizer Assistant</h1>
          <p className="text-sm text-slate-500">
            Categorize chaotic directories with AI recommendations, strict safety gates, and preview confirmation.
          </p>
        </div>
        <button
          onClick={() => {
            setFileListText(SAMPLE_FILES_TEXT);
            setSelectedDirectoryPath('');
            setCustomPreferences('Group finances into a Finance folder, and separate media by photos and videos.');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs self-start"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Load Sample Files
        </button>
      </div>

      {/* Safety Manifesto Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Zero-Risk Safety Guarantee</p>
          <p className="text-emerald-900/90 leading-relaxed">
            LazyFlow AI only analyzes filenames and extensions. <strong>File contents are never uploaded</strong> or read into memory. Proposed moves are previewed for your review, and no destructive deletes or unconfirmed operations are ever executed.
          </p>
        </div>
      </div>

      {/* Input Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-600" />
            File Input & Source Selection
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePickDirectory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
              Select Local Folder (Browser API)
            </button>
          </div>
        </div>

        {selectedDirectoryPath && (
          <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
            <Folder className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="font-semibold text-slate-700">Selected Directory:</span>
            <span className="font-mono text-slate-600">{selectedDirectoryPath}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            List of Filenames (One filename per line)
          </label>
          <textarea
            value={fileListText}
            onChange={(e) => setFileListText(e.target.value)}
            placeholder="invoice_october.pdf&#10;project_spec.docx&#10;screenshot_2026.png&#10;database_dump.sql"
            rows={7}
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-y"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Custom Organization Preferences (Optional)
          </label>
          <input
            type="text"
            value={customPreferences}
            onChange={(e) => setCustomPreferences(e.target.value)}
            placeholder="e.g. 'Put all invoices into Finance/2026, and create a Media folder for photos'"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Model: {aiStatus.configured_model}
          </span>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !fileListText.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Formulating Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Organization Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Plan Results & Preview */}
      {planResult && (
        <div className="space-y-6">
          {/* Categories Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Folder className="w-4 h-4 text-emerald-600" />
                  Proposed Directory Structure ({planResult.categories.length} Categories)
                </h3>
                <p className="text-xs text-slate-500">
                  Recommended folder groupings for {planResult.total_files} analyzed files.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPlan}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
                >
                  {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Plan
                </button>
                <button
                  onClick={handleDownloadScript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Script (.ps1)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {planResult.categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{cat.category}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {cat.description}
                    </p>
                    <span className="inline-block mt-2 font-mono text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      📂 {cat.suggested_folder}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {cat.file_count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Itemized Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCode className="w-4 h-4 text-brand-600" />
              Itemized File Move Plan ({planResult.plan.length} files)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-4">Current File</th>
                    <th className="py-2.5 px-4">Proposed Target Folder</th>
                    <th className="py-2.5 px-4">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planResult.plan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                        {item.original_name}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {item.proposed_subfolder}/{item.destination_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Local execution section if user picked a folder */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-800">Ready to organize your folder?</p>
                <p className="text-slate-500 mt-0.5">
                  You can download the inspection script above, or provide a local folder path to apply moves with safety confirmation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Apply Proposed Moves
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Executing Moves */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Safe Local File Organization"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">Explicit Approval Required:</p>
            <p>
              This operation will organize files on your local drive into designated subfolders.
              No files will ever be deleted. If a file with the same name exists, it will be safely renamed.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Target Local Folder Absolute Path *
            </label>
            <input
              type="text"
              value={selectedDirectoryPath}
              onChange={(e) => setSelectedDirectoryPath(e.target.value)}
              placeholder="e.g. C:\Users\Username\Downloads"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Directory must exist on your local disk. Path traversal outside this folder is strictly prevented.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteSafeMoves}
              disabled={executing || !selectedDirectoryPath.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              {executing ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Execute Organization</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
