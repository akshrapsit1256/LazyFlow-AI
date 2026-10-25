import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Trash2,
  Edit2,
  RotateCw,
  Bookmark,
  Check,
  Save,
  Clock,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAIStatus } from '../context/AIStatusContext';
import { Modal } from '../components/Modal';

const SAMPLE_NOTES = `I need to finish my Java assignment tomorrow, prepare for the DBMS quiz on Friday, and send my project report to my teammate. Also need to review the pull request for our local AI dashboard before Monday's standup. Next week I should start researching vector embeddings for our open-source challenge.`;

export function TaskGeneratorPage() {
  const toast = useToast();
  const { status: aiStatus } = useAIStatus();

  // Generator input state
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [savedAllExtracted, setSavedAllExtracted] = useState(false);

  // Saved task list state
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Edit / Manual Add Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [taskForm, setTaskForm] = useState({
    id: null,
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    is_completed: false,
  });

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const data = await api.getTasks(filterStatus);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterStatus]);

  const handleGenerate = async () => {
    if (!notes.trim()) {
      toast.error('Please enter notes or thoughts to generate tasks from.');
      return;
    }

    setGenerating(true);
    setSavedAllExtracted(false);
    try {
      const res = await api.generateTasks(notes.trim(), false);
      setExtractedTasks(res.tasks || []);
      if (res.tasks?.length > 0) {
        toast.success(`Extracted ${res.tasks.length} actionable tasks with local AI!`);
      } else {
        toast.info('No distinct tasks detected in the notes.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to extract tasks');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveExtractedTask = async (taskItem, index) => {
    try {
      await api.createTask({
        title: taskItem.title,
        description: taskItem.description,
        priority: taskItem.priority,
        due_date: taskItem.due_date,
        is_completed: false,
      });
      // remove from extracted list
      setExtractedTasks((prev) => prev.filter((_, i) => i !== index));
      toast.success(`Task saved: "${taskItem.title}"`);
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to save task');
    }
  };

  const handleSaveAllExtracted = async () => {
    if (!extractedTasks.length) return;
    try {
      await api.createBulkTasks(extractedTasks);
      toast.success(`Saved all ${extractedTasks.length} tasks to your active list!`);
      setExtractedTasks([]);
      setSavedAllExtracted(true);
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to save tasks');
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      await api.updateTask(taskId, { is_completed: !currentStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: !currentStatus } : t))
      );
      toast.success(!currentStatus ? 'Task completed!' : 'Task reopened');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task removed');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleOpenEdit = (task) => {
    setTaskForm({
      id: task.id,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      due_date: task.due_date || '',
      is_completed: task.is_completed,
    });
    setModalMode('edit');
  };

  const handleOpenCreate = () => {
    setTaskForm({
      id: null,
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      is_completed: false,
    });
    setModalMode('create');
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      if (modalMode === 'edit') {
        await api.updateTask(taskForm.id, {
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || null,
          priority: taskForm.priority,
          due_date: taskForm.due_date.trim() || null,
          is_completed: taskForm.is_completed,
        });
        toast.success('Task updated');
      } else {
        await api.createTask({
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || null,
          priority: taskForm.priority,
          due_date: taskForm.due_date.trim() || null,
          is_completed: false,
        });
        toast.success('Task created');
      }
      setModalMode(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to save task');
    }
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          High
        </span>
      );
    }
    if (p === 'low') {
      return (
        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          Low
        </span>
      );
    }
    return (
      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
        Medium
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Generator</h1>
          <p className="text-sm text-slate-500">
            Convert messy thoughts, chat notes, or meeting logs into verified, actionable tasks.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setNotes(SAMPLE_NOTES)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Load Sample Notes
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Manual Add
          </button>
        </div>
      </div>

      {/* AI Extraction Input Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Raw Unstructured Notes
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            Model: {aiStatus.configured_model}
          </span>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. 'I need to finish my Java assignment tomorrow, prepare for the DBMS quiz on Friday, and send project report to my teammate...'"
          rows={4}
          className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-sans leading-relaxed resize-y"
        />

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Honest AI rule: Deadlines are preserved only when explicitly stated. No hallucinated dates.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating || !notes.trim()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
          >
            {generating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting Tasks...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Extract Structured Tasks</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Extracted Tasks Proposal Area (shown if any tasks were generated) */}
      {extractedTasks.length > 0 && (
        <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                AI Generated Proposals ({extractedTasks.length} tasks detected)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Review and save individual tasks, or commit all of them to your persistent SQLite database.
              </p>
            </div>
            <button
              onClick={handleSaveAllExtracted}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              Save All to Task List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {extractedTasks.map((task, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {getPriorityBadge(task.priority)}
                    {task.due_date ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {task.due_date}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">No deadline stated</span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => handleSaveExtractedTask(task, idx)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-brand-50 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Persistent Tasks Board */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-brand-600" />
              Your Task List ({tasks.length})
            </h2>
            <p className="text-xs text-slate-500">
              Persisted in SQLite database. Fully functional offline.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'completed', label: 'Completed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filterStatus === f.id
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {loadingTasks ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <ListTodo className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-600">No tasks in this view.</p>
            <p className="text-[11px] text-slate-400">
              Extract tasks from notes above or add one manually.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                  task.is_completed
                    ? 'bg-slate-50/70 border-slate-200/60 opacity-75'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Checkbox & Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleTask(task.id, task.is_completed)}
                    className="mt-0.5 text-slate-400 hover:text-brand-600 transition-colors shrink-0"
                    aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 hover:text-brand-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`font-semibold text-sm ${
                          task.is_completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>
                      {getPriorityBadge(task.priority)}
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.due_date}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p
                        className={`text-xs leading-relaxed ${
                          task.is_completed ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Creating / Editing Task */}
      <Modal
        isOpen={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === 'edit' ? 'Edit Task' : 'Add New Task'}
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Finish DBMS assignment"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Context or notes..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Due Date / Timeline
              </label>
              <input
                type="text"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                placeholder="e.g. Tomorrow or Friday"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs"
            >
              {modalMode === 'edit' ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
