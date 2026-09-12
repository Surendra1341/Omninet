import React from 'react';
import {
  FlagIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const PRIORITY_STYLES = {
  URGENT: { label: 'Urgent', badge: 'badge-error text-white' },
  HIGH: { label: 'High', badge: 'badge-warning' },
  MEDIUM: { label: 'Medium', badge: 'badge-info' },
  LOW: { label: 'Low', badge: 'badge-ghost' }
};

const COLUMNS = [
  { id: 'NOT_STARTED', title: 'To Do', badge: 'badge-neutral' },
  { id: 'IN_PROGRESS', title: 'In Progress', badge: 'badge-warning' },
  { id: 'COMPLETED', title: 'Completed', badge: 'badge-success text-white' }
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
            className="card bg-base-200/40 border border-base-300 rounded-2xl p-4 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="px-3 py-2 rounded-xl font-bold text-sm flex items-center justify-between mb-4 border border-base-300 bg-base-100">
              <span className="text-base-content">{col.title}</span>
              <span className={`badge badge-sm ${col.badge} font-medium`}>
                {columnTodos.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnTodos.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-base-300 rounded-xl text-xs text-base-content/40">
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
                      className="card bg-base-100 border border-base-300 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-primary/40 transition-all group"
                    >
                      {/* Priority Flag & Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`badge badge-xs ${priority.badge} gap-1 font-medium`}>
                          <FlagIcon className="w-2.5 h-2.5" />
                          <span>{priority.label}</span>
                        </span>

                        <div className="flex items-center gap-0.5">
                          {todo.isRecurring && (
                            <span className="p-1 text-primary bg-primary/10 rounded-md text-[10px]" title={`Recurring: ${todo.recurrencePattern}`}>
                              <ArrowPathIcon className="w-3 h-3" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(todo)}
                            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary rounded-md"
                            title="Edit task"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(todo.id)}
                            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-error rounded-md"
                            title="Delete task"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Checkbox */}
                      <div className="flex items-start gap-2.5 mb-2">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(todo)}
                          className="mt-0.5 text-base-content/40 hover:text-primary transition shrink-0"
                          title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                        >
                          {isCompleted ? (
                            <CheckCircleIcon className="w-4 h-4 text-success stroke-2" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border-2 border-base-content/30 inline-block hover:border-primary" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-semibold text-base-content leading-snug break-words ${
                            isCompleted ? 'line-through text-base-content/40' : ''
                          }`}>
                            {todo.title}
                          </h4>
                          {todo.description && (
                            <p className="text-[11px] text-base-content/60 line-clamp-2 mt-1">
                              {todo.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subtask Progress Bar (if any) */}
                      {subtasks.length > 0 && (
                        <div className="mb-2.5 pt-1">
                          <div className="flex items-center justify-between text-[10px] text-base-content/50 mb-1">
                            <span>Checklist</span>
                            <span className="font-semibold">{completedSubtasks}/{subtasks.length}</span>
                          </div>
                          <div className="w-full bg-base-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-300"
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
                              className="badge badge-xs badge-ghost font-medium"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Due Date & Move Column Actions */}
                      <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs">
                        {dateInfo ? (
                          <div className={`flex items-center gap-1 text-[11px] font-medium ${
                            isCompleted
                              ? 'text-base-content/40'
                              : dateInfo.isPast
                              ? 'text-error'
                              : dateInfo.isToday
                              ? 'text-primary'
                              : 'text-base-content/60'
                          }`}>
                            <CalendarDaysIcon className="w-3 h-3" />
                            <span>{dateInfo.label}</span>
                            {dateInfo.isPast && !isCompleted && (
                              <span className="text-[9px] uppercase font-bold text-error">(Overdue)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-base-content/40">No date</span>
                        )}

                        {/* Move Column Shortcut Buttons */}
                        <div className="flex items-center gap-1">
                          {col.id === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(todo.id, 'NOT_STARTED')}
                              className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content"
                              title="Move back to To Do"
                            >
                              <ArrowLeftIcon className="w-3 h-3" />
                            </button>
                          )}
                          {col.id === 'NOT_STARTED' && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(todo.id, 'IN_PROGRESS')}
                              className="btn btn-xs btn-ghost text-warning hover:bg-warning/10 gap-0.5 text-[10px] font-medium rounded-lg"
                              title="Start task"
                            >
                              <span>Start</span>
                              <ArrowRightIcon className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {col.id === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(todo.id, 'COMPLETED')}
                              className="btn btn-xs btn-ghost text-success hover:bg-success/10 gap-0.5 text-[10px] font-medium rounded-lg"
                              title="Mark complete"
                            >
                              <span>Done</span>
                              <CheckCircleIcon className="w-3 h-3" />
                            </button>
                          )}
                          {col.id === 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(todo.id, 'IN_PROGRESS')}
                              className="btn btn-xs btn-ghost text-base-content/60 hover:text-base-content text-[10px] font-medium rounded-lg"
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
