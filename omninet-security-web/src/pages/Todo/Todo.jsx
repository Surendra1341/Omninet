import React, { useState, useEffect, useMemo } from 'react';
import { todoAPI } from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  FlagIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  ViewColumnsIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

import TodoModal from '../../components/Todo/TodoModal';
import TodoKanbanView from '../../components/Todo/TodoKanbanView';
import TodoCalendarView from '../../components/Todo/TodoCalendarView';
import TodoAnalytics from '../../components/Todo/TodoAnalytics';

const PRIORITY_CONFIG = {
  URGENT: { label: 'Urgent', badge: 'badge-error text-white' },
  HIGH: { label: 'High', badge: 'badge-warning' },
  MEDIUM: { label: 'Medium', badge: 'badge-info' },
  LOW: { label: 'Low', badge: 'badge-ghost' }
};

function Todo() {
  const [todos, setTodos] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // View mode: 'list' | 'board' | 'calendar' | 'analytics'
  const [viewMode, setViewMode] = useState('list');
  
  // Main filter tabs: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'
  const [activeTab, setActiveTab] = useState('all');
  
  // Secondary filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('MEDIUM');
  const [quickDateOption, setQuickDateOption] = useState('none'); // 'none' | 'today' | 'tomorrow'
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);

  // Modals & Expanded items
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedChecklists, setExpandedChecklists] = useState(new Set());

  // Load todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Load analytics when switching to analytics tab
  useEffect(() => {
    if (viewMode === 'analytics') {
      fetchAnalytics();
    }
  }, [viewMode]);

  const fetchTodos = async () => {
    try {
      const res = await todoAPI.getTodos();
      if (res && (res.status === 'success' || res.success !== false)) {
        setTodos(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await todoAPI.getAnalytics();
      if (res && (res.status === 'success' || res.success !== false)) {
        setAnalytics(res.data || null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Helper to extract status string
  const getStatusString = (todo) => {
    if (typeof todo?.status === 'string') return todo.status;
    if (todo?.status?.name) {
      const s = todo.status.name.toUpperCase();
      if (s.includes('COMPLET')) return 'COMPLETED';
      if (s.includes('PROG')) return 'IN_PROGRESS';
    }
    return 'NOT_STARTED';
  };

  // Helper to format due dates with clean relative labels
  const getDueDateInfo = (dateString) => {
    if (!dateString) return null;
    try {
      const due = new Date(dateString);
      const now = new Date();
      const isPast = due < now;
      const isToday = due.toDateString() === now.toDateString();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = due.toDateString() === tomorrow.toDateString();

      let label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (isToday) label = 'Today';
      else if (isTomorrow) label = 'Tomorrow';

      return { label, isPast, isToday, isTomorrow, fullDate: due };
    } catch (e) {
      return null;
    }
  };

  // Quick Add handler with immediate optimistic update
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    try {
      setIsQuickSubmitting(true);

      let isoDueDate = null;
      if (quickDateOption === 'today') {
        const d = new Date();
        d.setHours(18, 0, 0, 0);
        isoDueDate = d.toISOString();
      } else if (quickDateOption === 'tomorrow') {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(18, 0, 0, 0);
        isoDueDate = d.toISOString();
      }

      const payload = {
        title,
        priority: quickPriority,
        dueDate: isoDueDate,
        status: 'NOT_STARTED',
        tags: [],
        subtasks: []
      };

      const res = await todoAPI.createTodo(payload);
      const createdItem = res?.data || {
        ...payload,
        id: Date.now(),
        createdOn: new Date().toISOString()
      };

      // Optimistic instant state update so UI updates immediately!
      setTodos(prev => [createdItem, ...prev.filter(t => t.id !== createdItem.id)]);
      
      // Ensure the newly created task is visible (switch out of completed/overdue tabs)
      if (activeTab === 'completed' || (activeTab === 'overdue' && !isoDueDate)) {
        setActiveTab('all');
      }

      toast.success('Task added!');
      setQuickTitle('');
      setQuickDateOption('none');

      // Refresh in background to sync ID and analytics
      await fetchTodos();
      fetchAnalytics();
    } catch (error) {
      console.error('Error quick adding task:', error);
      toast.error('Failed to create task');
      await fetchTodos();
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  // Create or Update task from modal with instant optimistic state update
  const handleCreateOrUpdate = async (taskData) => {
    try {
      setIsSubmitting(true);
      if (taskData.id) {
        // Optimistic update for edit
        setTodos(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t));
        const res = await todoAPI.updateTodo(taskData);
        if (res?.data) {
          setTodos(prev => prev.map(t => t.id === res.data.id ? res.data : t));
        }
        toast.success('Task updated!');
      } else {
        const res = await todoAPI.createTodo(taskData);
        const newItem = res?.data || { ...taskData, id: Date.now() };
        // Optimistic update for new task: prepend to list
        setTodos(prev => [newItem, ...prev.filter(t => t.id !== newItem.id)]);
        
        // Make sure user sees new task
        if (activeTab === 'completed') {
          setActiveTab('all');
        }
        toast.success('Task created!');
      }

      setIsModalOpen(false);
      setEditingTodo(null);

      // Await server sync
      await fetchTodos();
      fetchAnalytics();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error(error.response?.data?.message || 'Failed to save task');
      await fetchTodos();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle completion with instant feedback
  const handleToggleStatus = async (todo) => {
    const isCurrentlyCompleted = getStatusString(todo) === 'COMPLETED';
    const nextStatus = isCurrentlyCompleted ? 'IN_PROGRESS' : 'COMPLETED';

    // Optimistic instant toggle
    setTodos(prev => prev.map(t => {
      if (t.id === todo.id) {
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : null
        };
      }
      return t;
    }));

    try {
      const res = await todoAPI.updateStatus(todo.id, nextStatus);
      if (res?.data) {
        setTodos(prev => prev.map(t => t.id === todo.id ? res.data : t));
      }
      fetchAnalytics();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update status');
      await fetchTodos();
    }
  };

  // Status change from Kanban or selector
  const handleStatusChange = async (todoId, newStatus) => {
    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, status: newStatus } : t));
    try {
      await todoAPI.updateStatus(todoId, newStatus);
      await fetchTodos();
      fetchAnalytics();
    } catch (error) {
      toast.error('Failed to update status');
      await fetchTodos();
    }
  };

  // Toggle Subtask
  const handleToggleSubtask = async (todoId, subtaskId) => {
    // Optimistic toggle
    setTodos(prev => prev.map(t => {
      if (t.id === todoId && Array.isArray(t.subtasks)) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s)
        };
      }
      return t;
    }));

    try {
      const res = await todoAPI.toggleSubtask(todoId, subtaskId);
      if (res?.data) {
        setTodos(prev => prev.map(t => t.id === todoId ? res.data : t));
      }
      fetchAnalytics();
    } catch (error) {
      console.error('Error toggling subtask:', error);
      toast.error('Failed to update subtask');
      await fetchTodos();
    }
  };

  // Delete Task
  const handleDelete = async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    try {
      await todoAPI.deleteTodo(id);
      toast.success('Task deleted');
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      await fetchTodos();
    }
  };

  // Modal openers
  const openCreateModal = (prefillDueDate = null) => {
    if (prefillDueDate) {
      const d = new Date(prefillDueDate);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setEditingTodo({ dueDate: d.toISOString().slice(0, 16) });
    } else {
      setEditingTodo(null);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (todo) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const toggleChecklistExpand = (todoId) => {
    setExpandedChecklists(prev => {
      const next = new Set(prev);
      if (next.has(todoId)) next.delete(todoId);
      else next.add(todoId);
      return next;
    });
  };

  // Collect all unique tags for filter dropdown
  const allTags = useMemo(() => {
    return Array.from(new Set(todos.flatMap(t => t.tags || []))).filter(Boolean);
  }, [todos]);

  // Tab counts
  const counts = useMemo(() => {
    const now = new Date();
    let total = 0;
    let today = 0;
    let upcoming = 0;
    let overdue = 0;
    let completed = 0;

    todos.forEach(t => {
      const isCompleted = getStatusString(t) === 'COMPLETED';
      if (isCompleted) {
        completed++;
      } else {
        total++;
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          if (d < now && d.toDateString() !== now.toDateString()) {
            overdue++;
          } else if (d.toDateString() === now.toDateString()) {
            today++;
          } else {
            upcoming++;
          }
        }
      }
    });

    return { total, today, upcoming, overdue, completed };
  }, [todos]);

  // Filtered todos based on active tab and search/tag/priority filters
  const filteredTodos = useMemo(() => {
    const now = new Date();

    return todos.filter(t => {
      const status = getStatusString(t);
      const isCompleted = status === 'COMPLETED';

      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchTag = t.tags?.some(tag => tag.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }

      // 2. Tag filter
      if (selectedTag !== 'all') {
        if (!t.tags || !t.tags.includes(selectedTag)) return false;
      }

      // 3. Priority filter
      if (priorityFilter !== 'all') {
        if (t.priority !== priorityFilter) return false;
      }

      // 4. Primary Tab filter
      if (activeTab === 'completed') {
        return isCompleted;
      }

      if (activeTab === 'today') {
        if (isCompleted || !t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === now.toDateString();
      }

      if (activeTab === 'upcoming') {
        if (isCompleted || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d > now && d.toDateString() !== now.toDateString();
      }

      if (activeTab === 'overdue') {
        if (isCompleted || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d < now && d.toDateString() !== now.toDateString();
      }

      // 'all' tab: optionally hide completed if showCompleted is false
      if (!showCompleted && isCompleted) {
        return false;
      }

      return true;
    });
  }, [todos, activeTab, searchQuery, selectedTag, priorityFilter, showCompleted]);

  // Sort todos: Active (Overdue -> Today -> Upcoming -> No Date) then Completed
  const sortedTodos = useMemo(() => {
    const now = new Date();

    return [...filteredTodos].sort((a, b) => {
      const aComp = getStatusString(a) === 'COMPLETED';
      const bComp = getStatusString(b) === 'COMPLETED';
      if (aComp !== bComp) return aComp ? 1 : -1;

      // Priority rank weight
      const rank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      
      // If due dates exist, prioritize overdue and earlier dates
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // Fall back to priority
      return (rank[b.priority] || 2) - (rank[a.priority] || 2);
    });
  }, [filteredTodos]);

  // Render clean task item card
  const renderTaskCard = (todo) => {
    const isCompleted = getStatusString(todo) === 'COMPLETED';
    const priority = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.MEDIUM;
    const dateInfo = getDueDateInfo(todo.dueDate);
    const subtasks = todo.subtasks || [];
    const completedSubtasks = subtasks.filter(s => s.isCompleted).length;
    const isExpanded = expandedChecklists.has(todo.id);

    return (
      <div
        key={todo.id}
        className={`card bg-base-100 border border-base-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all group ${
          isCompleted ? 'opacity-60 bg-base-200/30' : 'hover:border-primary/40'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Checkbox & Task details */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => handleToggleStatus(todo)}
              className="mt-0.5 text-base-content/40 hover:text-primary transition-colors shrink-0"
              title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
            >
              {isCompleted ? (
                <CheckCircleIcon className="w-5 h-5 text-success stroke-2" />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 border-base-content/30 inline-block hover:border-primary transition-colors" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              {/* Title & Strikethrough */}
              <h3 className={`text-sm font-semibold tracking-tight text-base-content break-words ${
                isCompleted ? 'line-through text-base-content/40' : ''
              }`}>
                {todo.title}
              </h3>

              {/* Description preview */}
              {todo.description && (
                <p className={`text-xs mt-1 text-base-content/60 line-clamp-2 ${isCompleted ? 'line-through opacity-70' : ''}`}>
                  {todo.description}
                </p>
              )}

              {/* Metadata Badges Row */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                {/* Priority */}
                <span className={`badge badge-sm ${priority.badge} gap-1 font-medium`}>
                  <FlagIcon className="w-3 h-3 stroke-2" />
                  <span>{priority.label}</span>
                </span>

                {/* Due Date */}
                {dateInfo && (
                  <span className={`badge badge-sm font-medium gap-1 ${
                    isCompleted
                      ? 'badge-ghost text-base-content/40'
                      : dateInfo.isPast
                      ? 'badge-error text-white'
                      : dateInfo.isToday
                      ? 'badge-primary text-white'
                      : 'badge-neutral'
                  }`}>
                    <CalendarDaysIcon className="w-3 h-3" />
                    <span>{dateInfo.label}</span>
                    {dateInfo.isPast && !isCompleted && (
                      <span className="text-[10px] font-bold uppercase tracking-wider ml-0.5">Overdue</span>
                    )}
                  </span>
                )}

                {/* Recurring indicator */}
                {todo.isRecurring && (
                  <span className="badge badge-sm badge-neutral gap-1 font-medium">
                    <ArrowPathIcon className="w-3 h-3" />
                    <span className="capitalize">{todo.recurrencePattern?.toLowerCase()}</span>
                  </span>
                )}

                {/* Tags */}
                {todo.tags && todo.tags.map(tag => (
                  <span
                    key={tag}
                    className="badge badge-sm badge-ghost font-medium"
                  >
                    #{tag}
                  </span>
                ))}

                {/* Checklist toggle button */}
                {subtasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleChecklistExpand(todo.id)}
                    className="badge badge-sm badge-outline gap-1 font-medium hover:border-primary cursor-pointer transition"
                  >
                    <span>Checklist ({completedSubtasks}/{subtasks.length})</span>
                    {isExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Subtasks Progress Bar if has subtasks */}
              {subtasks.length > 0 && (
                <div className="w-full max-w-xs bg-base-200 h-1.5 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((completedSubtasks / subtasks.length) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => openEditModal(todo)}
              className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary rounded-lg"
              title="Edit Task"
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleDelete(todo.id)}
              className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-error rounded-lg"
              title="Delete Task"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Checklist Sub-Items */}
        {isExpanded && subtasks.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-base-200 space-y-2 pl-8">
            {subtasks.map(subtask => (
              <div
                key={subtask.id}
                onClick={() => handleToggleSubtask(todo.id, subtask.id)}
                className="flex items-center gap-2 text-xs text-base-content/80 cursor-pointer hover:text-primary transition select-none"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                  subtask.isCompleted ? 'bg-primary border-primary text-primary-content' : 'border-base-content/30'
                }`}>
                  {subtask.isCompleted && <CheckIcon className="w-3 h-3 stroke-2" />}
                </div>
                <span className={subtask.isCompleted ? 'line-through text-base-content/40' : ''}>
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Toaster position="top-right" />

      {/* Top Header: Title, Counts & Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-base-300 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-base-content">
              Tasks
            </h1>
            <span className="badge badge-sm badge-neutral font-medium">
              {counts.total} active
            </span>
          </div>
          <p className="text-xs text-base-content/60 mt-1">
            Organize, prioritize, and conquer your goals
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented View Mode Tabs */}
          <div className="join bg-base-200 p-0.5 rounded-xl border border-base-300">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`btn btn-xs join-item font-medium gap-1 rounded-lg ${
                viewMode === 'list'
                  ? 'btn-primary'
                  : 'btn-ghost text-base-content/70'
              }`}
            >
              <ListBulletIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`btn btn-xs join-item font-medium gap-1 rounded-lg ${
                viewMode === 'board'
                  ? 'btn-primary'
                  : 'btn-ghost text-base-content/70'
              }`}
            >
              <ViewColumnsIcon className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`btn btn-xs join-item font-medium gap-1 rounded-lg ${
                viewMode === 'calendar'
                  ? 'btn-primary'
                  : 'btn-ghost text-base-content/70'
              }`}
            >
              <CalendarDaysIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('analytics')}
              className={`btn btn-xs join-item font-medium gap-1 rounded-lg ${
                viewMode === 'analytics'
                  ? 'btn-primary'
                  : 'btn-ghost text-base-content/70'
              }`}
            >
              <ChartBarIcon className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Primary + New Task Button */}
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="btn btn-primary btn-sm rounded-xl font-medium gap-1.5 text-xs"
          >
            <PlusIcon className="w-4 h-4 stroke-2" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Modern Quick-Add Bar (Visible in List & Board views) */}
      {viewMode !== 'analytics' && (
        <form
          onSubmit={handleQuickAdd}
          className="card bg-base-100 border border-base-300 rounded-2xl p-2 shadow-xs flex flex-row items-center gap-2 flex-wrap"
        >
          <div className="pl-2 text-base-content/40">
            <span className="w-4 h-4 rounded-full border-2 border-base-content/30 inline-block" />
          </div>

          <input
            type="text"
            placeholder="Add a task (e.g., Update system documentation) and press Enter..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="input input-ghost input-sm flex-1 min-w-[200px] text-sm text-base-content placeholder:text-base-content/40 focus:bg-transparent focus:outline-none"
          />

          {/* Date Selector Shortcuts */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuickDateOption(prev => prev === 'today' ? 'none' : 'today')}
              className={`btn btn-xs rounded-lg font-medium ${
                quickDateOption === 'today'
                  ? 'btn-primary'
                  : 'btn-ghost text-base-content/70'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setQuickDateOption(prev => prev === 'tomorrow' ? 'none' : 'tomorrow')}
              className={`btn btn-xs rounded-lg font-medium ${
                quickDateOption === 'tomorrow'
                  ? 'btn-primary'
                  : 'btn-ghost text-base-content/70'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Quick Priority Toggle */}
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value)}
            className="select select-bordered select-xs rounded-lg bg-base-200/50 text-base-content font-medium"
          >
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isQuickSubmitting || !quickTitle.trim()}
            className="btn btn-primary btn-xs rounded-lg font-medium"
          >
            {isQuickSubmitting ? 'Adding...' : 'Add'}
          </button>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="btn btn-ghost btn-xs text-base-content/50 hover:text-base-content"
            title="Open detailed task creator"
          >
            More details
          </button>
        </form>
      )}

      {/* Main Filter Strip (Visible in List and Board views) */}
      {(viewMode === 'list' || viewMode === 'board') && (
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          {/* Main Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Tasks', count: counts.total },
              { id: 'today', label: 'Today', count: counts.today },
              { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
              { id: 'overdue', label: 'Overdue', count: counts.overdue, isAlert: counts.overdue > 0 },
              { id: 'completed', label: 'Completed', count: counts.completed }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-xs rounded-xl font-medium gap-1.5 ${
                  activeTab === tab.id
                    ? 'btn-primary'
                    : tab.isAlert
                    ? 'btn-error btn-outline'
                    : 'btn-ghost bg-base-200/60 text-base-content/70'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`badge badge-xs ${activeTab === tab.id ? 'badge-neutral bg-white/20 text-white' : 'badge-ghost'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Secondary Filter & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="select select-bordered select-xs rounded-xl bg-base-100 border-base-300 text-base-content font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="URGENT">Urgent only</option>
              <option value="HIGH">High only</option>
              <option value="MEDIUM">Medium only</option>
              <option value="LOW">Low only</option>
            </select>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="select select-bordered select-xs rounded-xl bg-base-100 border-base-300 text-base-content font-medium"
              >
                <option value="all">All Tags</option>
                {allTags.map(t => (
                  <option key={t} value={t}>#{t}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative min-w-[180px]">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-xs rounded-xl bg-base-100 border-base-300 pl-8 w-full text-base-content"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main View Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="loading loading-spinner loading-md text-primary" />
          <p className="text-sm text-base-content/50">Loading tasks...</p>
        </div>
      ) : viewMode === 'list' ? (
        /* UNIFIED LIST VIEW */
        <div className="space-y-3">
          {sortedTodos.length === 0 ? (
            <div className="text-center py-16 bg-base-100 rounded-2xl border border-base-300 p-8 shadow-xs">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-base-content/30 mb-2" />
              <h3 className="text-sm font-semibold text-base-content">
                {activeTab === 'completed' ? 'No completed tasks yet' : 'All clear!'}
              </h3>
              <p className="text-xs text-base-content/50 mt-1">
                {activeTab === 'completed'
                  ? 'Tasks you check off will appear here.'
                  : 'No tasks found matching your filter. Use the bar above to add a new task.'}
              </p>
              {activeTab !== 'all' && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('all'); setPriorityFilter('all'); setSelectedTag('all'); setSearchQuery(''); }}
                  className="mt-3 btn btn-ghost btn-xs text-primary"
                >
                  View All Tasks
                </button>
              )}
            </div>
          ) : (
            sortedTodos.map(renderTaskCard)
          )}
        </div>
      ) : viewMode === 'board' ? (
        /* KANBAN BOARD VIEW */
        <TodoKanbanView
          todos={filteredTodos}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onToggleStatus={handleToggleStatus}
        />
      ) : viewMode === 'calendar' ? (
        /* CALENDAR VIEW */
        <TodoCalendarView
          todos={todos}
          onEdit={openEditModal}
          onAddTaskOnDate={(date) => openCreateModal(date)}
        />
      ) : (
        /* ANALYTICS DASHBOARD */
        <TodoAnalytics
          analytics={analytics}
          loading={analyticsLoading}
        />
      )}

      {/* Task Create / Edit Modal */}
      <TodoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTodo(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingTodo}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default Todo;