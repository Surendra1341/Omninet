import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  FlagIcon,
  ArrowPathIcon,
  TagIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: 'Urgent', badge: 'badge-error text-white' },
  { value: 'HIGH', label: 'High', badge: 'badge-warning' },
  { value: 'MEDIUM', label: 'Medium', badge: 'badge-info' },
  { value: 'LOW', label: 'Low', badge: 'badge-ghost' }
];

const RECURRENCE_OPTIONS = [
  { value: 'NONE', label: 'Does not repeat' },
  { value: 'DAILY', label: 'Repeats Daily' },
  { value: 'WEEKLY', label: 'Repeats Weekly' },
  { value: 'MONTHLY', label: 'Repeats Monthly' }
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card bg-base-100 border border-base-300 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8 animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <PlusIcon className="w-5 h-5 stroke-2" />
            </div>
            <h2 className="text-base font-bold text-base-content tracking-tight">
              {initialData ? 'Edit Task' : 'Create New Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content rounded-lg"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g., Review API documentation, Design landing page..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input input-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
              Notes & Details (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="Add extra context, links, or instructions..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="textarea textarea-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl focus:border-primary resize-y"
            />
          </div>

          {/* Priority & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FlagIcon className="w-3.5 h-3.5" />
                <span>Priority</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: opt.value }))}
                    className={`btn btn-xs rounded-xl font-medium gap-1 ${
                      formData.priority === opt.value
                        ? 'btn-primary'
                        : 'btn-ghost bg-base-200/60 text-base-content/70'
                    }`}
                  >
                    <FlagIcon className="w-3 h-3" />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="select select-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl"
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
              <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                <span>Due Date & Time</span>
              </label>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDate('today')}
                  className="btn btn-ghost btn-xs rounded-lg text-[11px] font-medium"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('tomorrow')}
                  className="btn btn-ghost btn-xs rounded-lg text-[11px] font-medium"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate('next_week')}
                  className="btn btn-ghost btn-xs rounded-lg text-[11px] font-medium"
                >
                  Next Week
                </button>
                {formData.dueDate && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, dueDate: '' }))}
                    className="btn btn-ghost btn-xs text-error text-[11px] font-medium"
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
              className="input input-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl"
            />
          </div>

          {/* Recurring Rules */}
          <div>
            <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>Recurrence</span>
            </label>
            <select
              value={formData.recurrencePattern}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                recurrencePattern: e.target.value,
                isRecurring: e.target.value !== 'NONE'
              }))}
              className="select select-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl"
            >
              {RECURRENCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {formData.recurrencePattern !== 'NONE' && (
              <p className="text-xs text-primary mt-1">
                When this task is completed, it will automatically schedule the next occurrence.
              </p>
            )}
          </div>

          {/* Subtasks / Checklist */}
          <div>
            <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
              Subtasks & Checklist ({formData.subtasks.filter(s => s.isCompleted).length}/{formData.subtasks.length})
            </label>

            {/* List of subtasks */}
            {formData.subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2.5 max-h-36 overflow-y-auto">
                {formData.subtasks.map((subtask, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-base-200/50 border border-base-300 text-xs"
                  >
                    <div
                      onClick={() => handleToggleSubtask(idx)}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        subtask.isCompleted ? 'bg-primary border-primary text-primary-content' : 'border-base-content/30'
                      }`}>
                        {subtask.isCompleted && <CheckIcon className="w-3 h-3 stroke-2" />}
                      </div>
                      <span className={`truncate ${subtask.isCompleted ? 'line-through text-base-content/40' : 'text-base-content'}`}>
                        {subtask.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error rounded-lg"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
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
                className="input input-bordered input-sm flex-1 bg-base-200/50 text-base-content text-xs rounded-xl"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!subtaskInput.trim()}
                className="btn btn-primary btn-sm rounded-xl font-medium text-xs"
              >
                Add
              </button>
            </div>
          </div>

          {/* Tags Manager */}
          <div>
            <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" />
              <span>Tags / Labels</span>
            </label>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {formData.tags.map(t => (
                <span
                  key={t}
                  className="badge badge-neutral badge-sm gap-1 font-medium"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-error ml-0.5"
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
                className="input input-bordered input-sm flex-1 bg-base-200/50 text-base-content text-xs rounded-xl"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                disabled={!tagInput.trim()}
                className="btn btn-ghost btn-sm rounded-xl text-xs font-medium border border-base-300"
              >
                + Tag
              </button>
            </div>

            {/* Suggested Tags */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2 text-[11px] text-base-content/50">
              <span>Suggestions:</span>
              {POPULAR_TAGS.filter(t => !formData.tags.includes(t)).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAddTag(t)}
                  className="btn btn-ghost btn-xs text-[11px] text-base-content/70 rounded-md"
                >
                  +{t}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="btn btn-primary btn-sm rounded-xl font-medium"
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
