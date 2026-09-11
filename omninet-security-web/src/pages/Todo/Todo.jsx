import React, { useState, useEffect, useMemo } from 'react';
import { todoAPI } from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FlagIcon from '@mui/icons-material/Flag';
import RepeatIcon from '@mui/icons-material/Repeat';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import FilterListIcon from '@mui/icons-material/FilterList';
import TuneIcon from '@mui/icons-material/Tune';

import TodoModal from '../../components/Todo/TodoModal';
import TodoKanbanView from '../../components/Todo/TodoKanbanView';
import TodoCalendarView from '../../components/Todo/TodoCalendarView';
import TodoAnalytics from '../../components/Todo/TodoAnalytics';

const PRIORITY_CONFIG = {
  URGENT: { label: 'Urgent', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60', dot: 'bg-red-500' },
  HIGH: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60', dot: 'bg-orange-500' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60', dot: 'bg-blue-500' },
  LOW: { label: 'Low', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' }
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
        className={`group bg-white dark:bg-gray-800 border rounded-2xl p-4 transition-all duration-200 shadow-2xs hover:shadow-md ${
          isCompleted
            ? 'border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/50 opacity-70'
            : 'border-gray-200/90 dark:border-gray-700/80 hover:border-blue-300 dark:hover:border-blue-500/50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Checkbox & Task details */}
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => handleToggleStatus(todo)}
              className="mt-0.5 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
              title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
            >
              {isCompleted ? (
                <CheckCircleIcon className="text-emerald-500 dark:text-emerald-400" style={{ fontSize: '1.45rem' }} />
              ) : (
                <RadioButtonUncheckedIcon style={{ fontSize: '1.45rem' }} />
              )}
            </button>

            <div className="min-w-0 flex-1">
              {/* Title & Strikethrough */}
              <h3 className={`text-sm font-semibold tracking-tight text-gray-900 dark:text-white break-words ${
                isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''
              }`}>
                {todo.title}
              </h3>

              {/* Description preview */}
              {todo.description && (
                <p className={`text-xs mt-1 text-gray-500 dark:text-gray-400 line-clamp-2 ${isCompleted ? 'line-through opacity-70' : ''}`}>
                  {todo.description}
                </p>
              )}

              {/* Metadata Badges Row */}
              <div className="flex items-center gap-2 flex-wrap mt-2.5">
                {/* Priority */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${priority.bg} ${priority.color}`}>
                  <FlagIcon style={{ fontSize: '0.75rem' }} />
                  <span>{priority.label}</span>
                </span>

                {/* Due Date */}
                {dateInfo && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                    isCompleted
                      ? 'border-gray-200 dark:border-gray-700 text-gray-400'
                      : dateInfo.isPast
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                      : dateInfo.isToday
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}>
                    <CalendarMonthIcon style={{ fontSize: '0.8rem' }} />
                    <span>{dateInfo.label}</span>
                    {dateInfo.isPast && !isCompleted && (
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider ml-0.5">Overdue</span>
                    )}
                  </span>
                )}

                {/* Recurring indicator */}
                {todo.isRecurring && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <RepeatIcon style={{ fontSize: '0.8rem' }} />
                    <span className="capitalize">{todo.recurrencePattern?.toLowerCase()}</span>
                  </span>
                )}

                {/* Tags */}
                {todo.tags && todo.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}

                {/* Checklist toggle button */}
                {subtasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleChecklistExpand(todo.id)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <span>Checklist ({completedSubtasks}/{subtasks.length})</span>
                    {isExpanded ? <ExpandLessIcon style={{ fontSize: '0.9rem' }} /> : <ExpandMoreIcon style={{ fontSize: '0.9rem' }} />}
                  </button>
                )}
              </div>

              {/* Subtasks Progress Bar if has subtasks */}
              {subtasks.length > 0 && (
                <div className="w-full max-w-xs bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((completedSubtasks / subtasks.length) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (always clean and accessible) */}
          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => openEditModal(todo)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
              title="Edit Task"
            >
              <EditOutlinedIcon style={{ fontSize: '1.15rem' }} />
            </button>

            <button
              type="button"
              onClick={() => handleDelete(todo.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition cursor-pointer"
              title="Delete Task"
            >
              <DeleteOutlineIcon style={{ fontSize: '1.15rem' }} />
            </button>
          </div>
        </div>

        {/* Expandable Checklist Sub-Items */}
        {isExpanded && subtasks.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-700/80 space-y-2 pl-9">
            {subtasks.map(subtask => (
              <div
                key={subtask.id}
                onClick={() => handleToggleSubtask(todo.id, subtask.id)}
                className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 transition select-none"
              >
                {subtask.isCompleted ? (
                  <CheckBoxIcon style={{ fontSize: '1.1rem' }} className="text-blue-600" />
                ) : (
                  <CheckBoxOutlineBlankIcon style={{ fontSize: '1.1rem' }} className="text-gray-400" />
                )}
                <span className={subtask.isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''}>
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
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Tasks
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {counts.total} active
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Organize, prioritize, and conquer your goals
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented View Mode Tabs */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FormatListBulletedIcon style={{ fontSize: '1rem' }} />
              <span>List</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ViewKanbanIcon style={{ fontSize: '1rem' }} />
              <span>Board</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CalendarMonthIcon style={{ fontSize: '1rem' }} />
              <span>Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'analytics'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TrendingUpIcon style={{ fontSize: '1rem' }} />
              <span>Analytics</span>
            </button>
          </div>

          {/* Primary + New Task Button */}
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm transition cursor-pointer"
          >
            <AddIcon style={{ fontSize: '1.1rem' }} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Modern Quick-Add Bar (Visible in List & Board views) */}
      {viewMode !== 'analytics' && (
        <form
          onSubmit={handleQuickAdd}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/90 rounded-2xl p-2.5 shadow-2xs flex items-center gap-2 flex-wrap"
        >
          <div className="p-2 text-gray-400">
            <RadioButtonUncheckedIcon style={{ fontSize: '1.3rem' }} />
          </div>

          <input
            type="text"
            placeholder="Add a task (e.g., Update system documentation) and press Enter..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="flex-1 min-w-[200px] px-2 py-1.5 text-sm bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />

          {/* Date Selector Shortcuts */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuickDateOption(prev => prev === 'today' ? 'none' : 'today')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition cursor-pointer ${
                quickDateOption === 'today'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              📅 Today
            </button>

            <button
              type="button"
              onClick={() => setQuickDateOption(prev => prev === 'tomorrow' ? 'none' : 'tomorrow')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition cursor-pointer ${
                quickDateOption === 'tomorrow'
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              ⏳ Tomorrow
            </button>
          </div>

          {/* Quick Priority Toggle */}
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
          >
            <option value="URGENT">🔴 Urgent</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🔵 Medium</option>
            <option value="LOW">⚪ Low</option>
          </select>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isQuickSubmitting || !quickTitle.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
          >
            {isQuickSubmitting ? 'Adding...' : 'Add'}
          </button>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="text-xs text-gray-400 hover:text-blue-600 px-2 font-medium"
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
              { id: 'today', label: '📅 Today', count: counts.today },
              { id: 'upcoming', label: '⏳ Upcoming', count: counts.upcoming },
              { id: 'overdue', label: '🚨 Overdue', count: counts.overdue, isAlert: counts.overdue > 0 },
              { id: 'completed', label: '✅ Completed', count: counts.completed }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : tab.isAlert
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
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
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="URGENT">🔴 Urgent only</option>
              <option value="HIGH">🟠 High only</option>
              <option value="MEDIUM">🔵 Medium only</option>
              <option value="LOW">⚪ Low only</option>
            </select>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 outline-none"
              >
                <option value="all">All Tags</option>
                {allTags.map(t => (
                  <option key={t} value={t}>#{t}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative min-w-[180px]">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main View Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading tasks...</p>
        </div>
      ) : viewMode === 'list' ? (
        /* UNIFIED LIST VIEW */
        <div className="space-y-3">
          {sortedTodos.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-8 shadow-xs">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {activeTab === 'completed' ? 'No completed tasks yet' : 'All clear!'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {activeTab === 'completed'
                  ? 'Tasks you check off will appear here.'
                  : 'No tasks found matching your filter. Use the bar above to add a new task.'}
              </p>
              {activeTab !== 'all' && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('all'); setPriorityFilter('all'); setSelectedTag('all'); setSearchQuery(''); }}
                  className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
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