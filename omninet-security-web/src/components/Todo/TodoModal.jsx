import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';
import RepeatIcon from '@mui/icons-material/Repeat';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60' },
  { value: 'LOW', label: 'Low', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' }
];

const RECURRENCE_OPTIONS = [
  { value: 'NONE', label: 'Does not repeat' },
  { value: 'DAILY', label: 'Repeats Daily 🔁' },
  { value: 'WEEKLY', label: 'Repeats Weekly 🔁' },
  { value: 'MONTHLY', label: 'Repeats Monthly 🔁' }
];

const POPULAR_TAGS = ['work', 'personal', 'project', 'meeting', 'urgent', 'study'];

function TodoModal({
  isOpen = false,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    dueDate: '',
    isRecurring: false,
    recurrencePattern: 'NONE',
    tags: [],
    subtasks: []
  });

  const [tagInput, setTagInput] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Format dueDate to YYYY-MM-DDTHH:mm if present
        let formattedDate = '';
        if (initialData.dueDate) {
          try {
            const d = new Date(initialData.dueDate);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            formattedDate = d.toISOString().slice(0, 16);
          } catch (e) {
            formattedDate = '';
          }
        }

        let currentStatus = 'NOT_STARTED';
        if (typeof initialData.status === 'string') {
          currentStatus = initialData.status;
        } else if (initialData.status?.name) {
          const s = initialData.status.name.toUpperCase();
          if (s.includes('COMPLET')) currentStatus = 'COMPLETED';
          else if (s.includes('PROG')) currentStatus = 'IN_PROGRESS';
        }

        setFormData({
          id: initialData.id,
          title: initialData.title || '',
          description: initialData.description || '',
          status: currentStatus,
          priority: initialData.priority || 'MEDIUM',
          dueDate: formattedDate,
          isRecurring: Boolean(initialData.isRecurring),
          recurrencePattern: initialData.recurrencePattern || 'NONE',
          tags: Array.isArray(initialData.tags) ? [...initialData.tags] : [],
          subtasks: Array.isArray(initialData.subtasks)
            ? initialData.subtasks.map(s => ({
                id: s.id,
                title: s.title,
                isCompleted: Boolean(s.isCompleted),
                sortOrder: s.sortOrder || 0
              }))
            : []
        });
      } else {
        setFormData({
          title: '',
          description: '',
          status: 'NOT_STARTED',
          priority: 'MEDIUM',
          dueDate: '',
          isRecurring: false,
          recurrencePattern: 'NONE',
          tags: [],
          subtasks: []
        });
      }
      setTagInput('');
      setSubtaskInput('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleQuickDate = (type) => {
    const d = new Date();
    if (type === 'today') {
      d.setHours(18, 0, 0, 0);
    } else if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
    } else if (type === 'next_week') {
      d.setDate(d.getDate() + 7);
      d.setHours(9, 0, 0, 0);
    }
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setFormData(prev => ({ ...prev, dueDate: d.toISOString().slice(0, 16) }));
  };

  const handleAddTag = (tagToAdd) => {
    const clean = (tagToAdd || tagInput).trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    if (!formData.tags.includes(clean)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleAddSubtask = (e) => {
    if (e) e.preventDefault();
    const clean = subtaskInput.trim();
    if (!clean) return;
    setFormData(prev => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        { title: clean, isCompleted: false, sortOrder: prev.subtasks.length }
      ]
    }));
    setSubtaskInput('');
  };

  const handleToggleSubtask = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((s, idx) =>
        idx === index ? { ...s, isCompleted: !s.isCompleted } : s
      )
    }));
  };

  const handleRemoveSubtask = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Convert local datetime string to ISO format if provided
    let isoDueDate = null;
    if (formData.dueDate) {
      isoDueDate = new Date(formData.dueDate).toISOString();
    }

    const payload = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description ? formData.description.trim() : '',
      dueDate: isoDueDate,
      isRecurring: formData.recurrencePattern !== 'NONE',
      recurrencePattern: formData.recurrencePattern
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8 animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <AddIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {initialData ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g., Review API documentation, Design landing page..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Notes & Details (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="Add extra context, links, or instructions..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
            />
          </div>

          {/* Priority & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FlagIcon style={{ fontSize: '1rem' }} />
                <span>Priority</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: opt.value }))}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1 cursor-pointer ${
                      formData.priority === opt.value
                        ? `${opt.bg} ${opt.color} shadow-xs`
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FlagIcon style={{ fontSize: '0.85rem' }} className={opt.color} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="NOT_STARTED">To Do (Not Started)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date & Quick Shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
                <CalendarMonthIcon style={{ fontSize: '1rem' }} />
                <span>Due Date & Time</span>
              </label>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDate('today')}
                  className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-600 dark:text-gray-300 hover:text-blue-600 text-[11px] font-medium transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('tomorrow')}
                  className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-600 dark:text-gray-300 hover:text-blue-600 text-[11px] font-medium transition"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('next_week')}
                  className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-600 dark:text-gray-300 hover:text-blue-600 text-[11px] font-medium transition"
                >
                  Next Week
                </button>
                {formData.dueDate && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, dueDate: '' }))}
                    className="px-2 py-0.5 text-red-500 hover:text-red-700 text-[11px] font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Recurring Rules */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <RepeatIcon style={{ fontSize: '1rem' }} />
              <span>Recurrence</span>
            </label>
            <select
              value={formData.recurrencePattern}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                recurrencePattern: e.target.value,
                isRecurring: e.target.value !== 'NONE'
              }))}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {RECURRENCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {formData.recurrencePattern !== 'NONE' && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                🔁 When this task is completed, it will automatically schedule the next occurrence.
              </p>
            )}
          </div>

          {/* Subtasks / Checklist */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Subtasks & Checklist ({formData.subtasks.filter(s => s.isCompleted).length}/{formData.subtasks.length})
            </label>

            {/* List of subtasks */}
            {formData.subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2.5 max-h-36 overflow-y-auto">
                {formData.subtasks.map((subtask, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs"
                  >
                    <div
                      onClick={() => handleToggleSubtask(idx)}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                    >
                      {subtask.isCompleted ? (
                        <CheckBoxIcon style={{ fontSize: '1.1rem' }} className="text-blue-600" />
                      ) : (
                        <CheckBoxOutlineBlankIcon style={{ fontSize: '1.1rem' }} className="text-gray-400" />
                      )}
                      <span className={`truncate ${subtask.isCompleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {subtask.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      <DeleteOutlineIcon style={{ fontSize: '1rem' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Subtask Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a checklist item..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!subtaskInput.trim()}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Tags Manager */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <LocalOfferIcon style={{ fontSize: '1rem' }} />
              <span>Tags / Labels</span>
            </label>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-500 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Tag suggestions & input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type tag and press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                disabled={!tagInput.trim()}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                + Tag
              </button>
            </div>

            {/* Suggested Tags */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2 text-[11px] text-gray-400">
              <span>Suggestions:</span>
              {POPULAR_TAGS.filter(t => !formData.tags.includes(t)).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAddTag(t)}
                  className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition"
                >
                  +{t}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm shadow-blue-500/20 active:scale-95"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TodoModal;
