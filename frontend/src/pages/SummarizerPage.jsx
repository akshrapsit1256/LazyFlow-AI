import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Trash2,
  Clock,
  RotateCw,
  Search,
  BookOpen,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAIStatus } from '../context/AIStatusContext';
import { Modal } from '../components/Modal';

const SAMPLE_TEXT = `Modern artificial intelligence models have traditionally relied on massive, centralized cloud compute clusters owned by hyperscale providers. However, the rise of open-weight foundational models—such as Google's Gemma 2 family, Meta's Llama, and Mistral—has sparked a quiet revolution in local client-side computing. 

By executing neural inference directly on local hardware via modern inference runtimes like Ollama and llama.cpp, developers and everyday users gain unprecedented privacy: personal notes, proprietary research, and sensitive company correspondence never leave the local machine. Furthermore, local inference fundamentally breaks the recurring per-token paywall imposed by commercial API gateways. Once a model is downloaded to disk, inference requires zero network bandwidth and costs zero dollars per prompt, ensuring maximum availability even during internet outages or offline transit. 

While running local models demands modest consumer hardware—typically 8GB to 16GB of system RAM or a dedicated GPU—the rapid optimization of 4-bit and 8-bit quantized weights makes high-performance AI accessible on everyday laptops and workstations.`;

export function SummarizerPage() {
  const toast = useToast();
  const { status: aiStatus } = useAIStatus();

  const [inputText, setInputText] = useState('');
  const [lengthOption, setLengthOption] = useState('standard');
  const [formatOption, setFormatOption] = useState('bullet');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Saved summaries state
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState(null);

  const fetchSavedSummaries = async () => {
    try {
      setLoadingHistory(true);
      const data = await api.getSavedSummaries();
      setSavedSummaries(data);
    } catch (err) {
      console.error('Failed to load saved summaries:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSavedSummaries();
  }, []);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error('Please paste or enter text to summarize.');
      return;
    }
    if (inputText.trim().length < 15) {
      toast.error('Text is too short. Please provide at least a couple of sentences.');
      return;
    }

    setGenerating(true);
    setGeneratedResult(null);
    try {
      const res = await api.generateSummary(inputText.trim(), lengthOption, formatOption);
      setGeneratedResult(res);
      toast.success('Summary generated via local AI!');
    } catch (err) {
      toast.error(err.message || 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!generatedResult) return;
    setSaving(true);
    try {
      const titleCandidate = inputText.trim().split('\n')[0].slice(0, 50) || 'Text Summary';
      await api.saveSummary({
        title: titleCandidate,
        original_text: inputText,
        summary_text: generatedResult.summary,
        length_option: generatedResult.length_option,
        format_option: generatedResult.format_option,
        model_used: generatedResult.model_used,
      });
      toast.success('Summary saved to your history!');
      fetchSavedSummaries();
    } catch (err) {
      toast.error(err.message || 'Failed to save summary');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteSummary(id);
      setSavedSummaries((prev) => prev.filter((s) => s.id !== id));
      if (selectedSummary?.id === id) {
        setSelectedSummary(null);
      }
      toast.success('Summary deleted');
    } catch (err) {
      toast.error('Failed to delete summary');
    }
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const filteredSaved = savedSummaries.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Summarizer</h1>
          <p className="text-sm text-slate-500">
            Distill dense articles, research papers, and notes into structured executive takeaways.
          </p>
        </div>
        <button
          onClick={() => setInputText(SAMPLE_TEXT)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs self-start"
        >
          <BookOpen className="w-3.5 h-3.5 text-brand-600" />
          Load Sample Text
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input & Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand-600" />
                Source Text
              </label>
              <div className="text-xs text-slate-400 font-mono">
                {wordCount} words • {inputText.length} chars
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste article, technical document, meeting transcripts, or rough notes here..."
              rows={12}
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-sans leading-relaxed resize-y"
            />

            {/* Options Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Summary Length
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                  {['concise', 'standard', 'detailed'].map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setLengthOption(len)}
                      className={`py-1.5 rounded-lg capitalize transition-all ${
                        lengthOption === len
                          ? 'bg-white text-brand-700 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Format Style
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                  {[
                    { id: 'bullet', label: 'Bullets' },
                    { id: 'paragraph', label: 'Paragraph' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormatOption(fmt.id)}
                      className={`py-1.5 rounded-lg transition-all ${
                        formatOption === fmt.id
                          ? 'bg-white text-brand-700 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Model: {aiStatus.configured_model}
              </span>
              <button
                onClick={handleGenerate}
                disabled={generating || !inputText.trim()}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing locally...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Card (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col min-h-[460px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Generated Result
              </h3>

              {generatedResult && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(generatedResult.summary)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Save summary to history"
                  >
                    <Bookmark className="w-4 h-4 text-brand-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Output Content Area */}
            <div className="flex-1 py-4 flex flex-col justify-start">
              {generating ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 animate-pulse">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800">
                      Processing with {aiStatus.configured_model}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Running offline local inference directly on your machine.
                    </p>
                  </div>
                </div>
              ) : generatedResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 capitalize">
                      {generatedResult.length_option}
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 capitalize">
                      {generatedResult.format_option}
                    </span>
                    <span>•</span>
                    <span>{generatedResult.word_count_summary} words</span>
                  </div>

                  <div className="prose prose-sm text-slate-800 max-w-none leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    {generatedResult.summary}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl my-auto">
                  <FileText className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">No summary generated yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Paste content on the left and click "Generate Summary".
                  </p>
                </div>
              )}
            </div>

            {generatedResult && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Model: {generatedResult.model_used}</span>
                <span className="text-emerald-600 font-medium">100% Local Inference</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Summaries Drawer / History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-brand-600" />
              Saved Summaries Archive ({savedSummaries.length})
            </h2>
            <p className="text-xs text-slate-500">
              Persisted in your local SQLite database for instant retrieval.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved summaries..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading saved summaries...</div>
        ) : filteredSaved.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-medium text-slate-500">No saved summaries found.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Generate a summary and click the bookmark button to save it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSaved.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-brand-200 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {s.length_option}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 mb-1.5">
                    {s.title || 'Summary'}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {s.summary_text}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedSummary(s)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <span>Read full</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                    title="Delete saved summary"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for viewing full saved summary */}
      <Modal
        isOpen={!!selectedSummary}
        onClose={() => setSelectedSummary(null)}
        title={selectedSummary?.title || 'Saved Summary'}
        maxWidth="max-w-2xl"
      >
        {selectedSummary && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 capitalize font-medium">
                {selectedSummary.length_option}
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 capitalize font-medium">
                {selectedSummary.format_option}
              </span>
              <span>•</span>
              <span className="font-mono">Model: {selectedSummary.model_used}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-800 whitespace-pre-line">
              {selectedSummary.summary_text}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Original Text ({selectedSummary.word_count_original} words)
              </h4>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 max-h-36 overflow-y-auto whitespace-pre-line leading-relaxed">
                {selectedSummary.original_text}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => handleCopy(selectedSummary.summary_text)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Summary
              </button>
              <button
                onClick={() => setSelectedSummary(null)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
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
