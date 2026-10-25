import React, { useState, useEffect } from 'react';
import {
  Mail,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Trash2,
  Clock,
  RotateCw,
  Search,
  Send,
  User,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAIStatus } from '../context/AIStatusContext';
import { Modal } from '../components/Modal';

const SAMPLE_SITUATION = `Client requested a feature update by tomorrow morning, but our team discovered an edge-case bug in the database migration that requires 24 extra hours to test safely. I need to explain the delay gracefully, assure them that the quality and security of their data is top priority, and propose delivery for Thursday at 2 PM instead.`;

export function EmailAssistantPage() {
  const toast = useToast();
  const { status: aiStatus } = useAIStatus();

  const [promptOrOriginal, setPromptOrOriginal] = useState('');
  const [tone, setTone] = useState('professional');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Saved drafts state
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDraft, setSelectedDraft] = useState(null);

  const fetchSavedDrafts = async () => {
    try {
      setLoadingDrafts(true);
      const data = await api.getSavedEmails();
      setSavedDrafts(data);
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    fetchSavedDrafts();
  }, []);

  const handleGenerate = async () => {
    if (!promptOrOriginal.trim()) {
      toast.error('Please describe the situation or paste the email to reply to.');
      return;
    }

    setGenerating(true);
    setGeneratedDraft(null);
    try {
      const res = await api.generateEmail(
        promptOrOriginal.trim(),
        tone,
        recipient.trim() || null,
        subject.trim() || null
      );
      setGeneratedDraft(res);
      toast.success('Email draft composed locally!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate email');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Draft copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = async () => {
    if (!generatedDraft) return;
    setSaving(true);
    try {
      await api.saveEmail({
        prompt_or_original: promptOrOriginal,
        draft_content: generatedDraft.draft_content,
        tone: generatedDraft.tone,
        recipient: recipient.trim() || null,
        subject: generatedDraft.subject_suggested || subject.trim() || null,
        model_used: generatedDraft.model_used,
      });
      toast.success('Draft saved to history!');
      fetchSavedDrafts();
    } catch (err) {
      toast.error(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteEmail(id);
      setSavedDrafts((prev) => prev.filter((d) => d.id !== id));
      if (selectedDraft?.id === id) setSelectedDraft(null);
      toast.success('Draft deleted');
    } catch (err) {
      toast.error('Failed to delete draft');
    }
  };

  const filteredDrafts = savedDrafts.filter(
    (d) =>
      d.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.draft_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.recipient?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Assistant</h1>
          <p className="text-sm text-slate-500">
            Compose refined, situation-tailored email drafts using local AI without touching cloud servers.
          </p>
        </div>
        <button
          onClick={() => {
            setPromptOrOriginal(SAMPLE_SITUATION);
            setRecipient('Alex Johnson, Product Director');
            setSubject('Project Timeline Update');
            setTone('professional');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs self-start"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Load Sample Scenario
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between text-xs text-indigo-950">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Safe Drafting Mode:</strong> LazyFlow AI never sends emails automatically and never connects to real email inboxes. Review, copy, and send drafts through your preferred email client.
          </span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            {/* Tone Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                Select Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'professional', label: 'Professional', desc: 'Balanced & courteous' },
                  { id: 'friendly', label: 'Friendly', desc: 'Warm & approachable' },
                  { id: 'concise', label: 'Concise', desc: 'Direct & brief' },
                  { id: 'formal', label: 'Formal', desc: 'Official & elevated' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === t.id
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-xs capitalize font-bold">{t.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient & Subject Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Recipient (Optional)
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. Sarah Miller, VP Engineering"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Subject / Topic (Optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Schedule delay notice"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Main Situation / Incoming Message Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  Context or Incoming Email *
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {promptOrOriginal.length} chars
                </span>
              </div>
              <textarea
                value={promptOrOriginal}
                onChange={(e) => setPromptOrOriginal(e.target.value)}
                placeholder="Paste the email you received, or describe the outcome you want to communicate..."
                rows={9}
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-sans leading-relaxed resize-y"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Model: {aiStatus.configured_model}
              </span>
              <button
                onClick={handleGenerate}
                disabled={generating || !promptOrOriginal.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Drafting locally...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Draft Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Draft Card (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col min-h-[460px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Generated Draft
              </h3>

              {generatedDraft && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(generatedDraft.draft_content)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Copy draft"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Save draft"
                  >
                    <Bookmark className="w-4 h-4 text-indigo-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Output View */}
            <div className="flex-1 py-4 flex flex-col justify-start">
              {generating ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 animate-pulse">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800">
                      Crafting draft with {aiStatus.configured_model}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Simulating human executive tone without cloud network roundtrips.
                    </p>
                  </div>
                </div>
              ) : generatedDraft ? (
                <div className="space-y-3">
                  {generatedDraft.subject_suggested && (
                    <div className="bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-600">Subject: </span>
                      <span className="font-semibold text-slate-800">
                        {generatedDraft.subject_suggested}
                      </span>
                    </div>
                  )}

                  <div className="prose prose-sm text-slate-800 max-w-none leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs font-sans">
                    {generatedDraft.draft_content}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl my-auto">
                  <Mail className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">No draft composed yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the situation or paste an email to generate a draft.
                  </p>
                </div>
              )}
            </div>

            {generatedDraft && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Tone: {generatedDraft.tone}</span>
                <span className="text-emerald-600 font-medium">Ready to Review & Send</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Drafts History Archive */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              Saved Email Drafts ({savedDrafts.length})
            </h2>
            <p className="text-xs text-slate-500">
              Persisted in your local SQLite database.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drafts..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {loadingDrafts ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading saved drafts...</div>
        ) : filteredDrafts.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-medium text-slate-500">No saved drafts found.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Draft an email above and click the bookmark button to preserve it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrafts.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 capitalize">
                      {d.tone}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 mb-1">
                    {d.subject || 'Draft Reply'}
                  </h3>
                  {d.recipient && (
                    <p className="text-[11px] text-slate-500 mb-1.5 font-medium">
                      To: {d.recipient}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {d.draft_content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDraft(d)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>Read full</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                    title="Delete saved draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing full saved draft */}
      <Modal
        isOpen={!!selectedDraft}
        onClose={() => setSelectedDraft(null)}
        title={selectedDraft?.subject || 'Saved Draft'}
        maxWidth="max-w-2xl"
      >
        {selectedDraft && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded capitalize font-medium">
                {selectedDraft.tone}
              </span>
              {selectedDraft.recipient && (
                <span className="text-slate-600 font-medium">
                  To: {selectedDraft.recipient}
                </span>
              )}
              <span>•</span>
              <span className="font-mono">Model: {selectedDraft.model_used}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-800 whitespace-pre-line font-sans">
              {selectedDraft.draft_content}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Original Prompt / Context
              </h4>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 max-h-32 overflow-y-auto whitespace-pre-line leading-relaxed">
                {selectedDraft.prompt_or_original}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => handleCopy(selectedDraft.draft_content)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Draft
              </button>
              <button
                onClick={() => setSelectedDraft(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
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
