import React from 'react';
import FlagIcon from '@mui/icons-material/Flag';
import RepeatIcon from '@mui/icons-material/Repeat';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const PRIORITY_STYLES = {
  URGENT: { label: 'Urgent', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60' },
  HIGH: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60' },
  LOW: { label: 'Low', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' }
};

const COLUMNS = [
  { id: 'NOT_STARTED', title: 'To Do', accent: 'border-slate-400', headerBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { id: 'IN_PROGRESS', title: 'In Progress', accent: 'border-amber-400', headerBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' },
  { id: 'COMPLETED', title: 'Completed', accent: 'border-emerald-400', headerBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' }
];

function TodoKanbanView({
  todos = [],
  onEdit,
  onDelete,
  onStatusChange,
  onToggleStatus
}) {
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    try {
      const due = new Date(dateString);
      const now = new Date();
      const isPast = due < now;
      const isToday = due.toDateString() === now.toDateString();

      const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { label, isPast, isToday };
    } catch (e) {
      return null;
    }
  };

  const getStatusString = (todo) => {
    if (typeof todo.status === 'string') return todo.status;
    if (todo.status?.name) {
      const s = todo.status.name.toUpperCase();
      if (s.includes('COMPLET')) return 'COMPLETED';
      if (s.includes('PROG')) return 'IN_PROGRESS';
    }
    return 'NOT_STARTED';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {COLUMNS.map(col => {
        const columnTodos = todos.filter(t => getStatusString(t) === col.id);

        return (
          <div
            key={col.id}
            className="bg-gray-50/70 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-between mb-4 border ${col.headerBg}`}>
              <span>{col.title}</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/80 dark:bg-gray-800/80 font-semibold shadow-2xs">
                {columnTodos.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnTodos.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-400">
                  No tasks in {col.title}
                </div>
              ) : (
                columnTodos.map(todo => {
                  const priority = PRIORITY_STYLES[todo.priority] || PRIORITY_STYLES.MEDIUM;
                  const dateInfo = formatDueDate(todo.dueDate);
                  const isCompleted = col.id === 'COMPLETED';
                  const subtasks = todo.subtasks || [];
                  const completedSubtasks = subtasks.filter(s => s.isCompleted).length;

                  return (
                    <div
                      key={todo.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 rounded-xl p-4 shadow-xs hover:shadow-md transition-all group relative"
                    >
                      {/* Priority Flag & Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priority.bg} ${priority.color}`}>
                          <FlagIcon style={{ fontSize: '0.8rem' }} />
                          <span>{priority.label}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          {todo.isRecurring && (
                            <span className="p-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md text-[10px]" title={`Recurring: ${todo.recurrencePattern}`}>
                              <RepeatIcon style={{ fontSize: '0.9rem' }} />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(todo)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded-md transition"
                            title="Edit task"
                          >
                            <EditOutlinedIcon style={{ fontSize: '1rem' }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(todo.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-md transition"
                            title="Delete task"
                          >
                            <DeleteOutlineIcon style={{ fontSize: '1rem' }} />
                          </button>
                        </div>
                      </div>

                      {/* Title & Checkbox */}
                      <div className="flex items-start gap-2.5 mb-2">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(todo)}
                          className="mt-0.5 text-gray-400 hover:text-emerald-500 transition shrink-0"
                          title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                        >
                          {isCompleted ? (
                            <CheckCircleIcon style={{ fontSize: '1.2rem' }} className="text-emerald-500" />
                          ) : (
                            <RadioButtonUncheckedIcon style={{ fontSize: '1.2rem' }} />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h4 className={`text-sm font-semibold text-gray-900 dark:text-white leading-snug break-words ${
                            isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : ''
                          }`}>
                            {todo.title}
                          </h4>
                          {todo.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                              {todo.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subtask Progress Bar (if any) */}
                      {subtasks.length > 0 && (
                        <div className="mb-2.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                            <span>Checklist</span>
                            <span className="font-semibold">{completedSubtasks}/{subtasks.length}</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.round((completedSubtasks / subtasks.length) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {todo.tags && todo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {todo.tags.map(t => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Due Date & Move Column Actions */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                        {dateInfo ? (
                          <div className={`flex items-center gap-1 font-medium ${
                            isCompleted
                              ? 'text-gray-400'
                              : dateInfo.isPast
                              ? 'text-red-600 dark:text-red-400'
                              : dateInfo.isToday
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            <CalendarMonthIcon style={{ fontSize: '0.9rem' }} />
                            <span>{dateInfo.label}</span>
                            {dateInfo.isPast && !isCompleted && (
                              <span className="text-[10px] uppercase font-bold text-red-600">(Overdue)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">No date</span>
                        )}

                        {/* Move Column Shortcut Buttons */}
                        <div className="flex items-center gap-1">
                          {col.id === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(todo.id, 'NOT_STARTED')}
                              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                              title="Move back to To Do"
                            >
                              <ArrowBackIcon style={{ fontSize: '0.9rem' }} />
                            </button>
                          )}
                          {col.id === 'NOT_STARTED' && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(todo.id, 'IN_PROGRESS')}
                              className="inline-flex items-center gap-0.5 px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-semibold transition"
                              title="Start task"
                            >
                              <span>Start</span>
                              <ArrowForwardIcon style={{ fontSize: '0.75rem' }} />
                            </button>
                          )}
                          {col.id === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(todo.id, 'COMPLETED')}
                              className="inline-flex items-center gap-0.5 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-semibold transition"
                              title="Mark complete"
                            >
                              <span>Done</span>
                              <CheckCircleIcon style={{ fontSize: '0.85rem' }} />
                            </button>
                          )}
                          {col.id === 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(todo.id, 'IN_PROGRESS')}
                              className="inline-flex items-center gap-0.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-semibold transition"
                              title="Reopen task"
                            >
                              <span>Reopen</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TodoKanbanView;
