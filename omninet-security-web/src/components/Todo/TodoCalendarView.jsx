import React, { useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const PRIORITY_COLORS = {
  URGENT: 'bg-error text-white',
  HIGH: 'bg-warning text-warning-content',
  MEDIUM: 'bg-info text-info-content',
  LOW: 'bg-base-300 text-base-content'
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function TodoCalendarView({
  todos = [],
  onEdit,
  onAddTaskOnDate
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar matrix (42 cells: 6 weeks x 7 days)
  const calendarCells = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateObj = new Date(year, month - 1, day);
    calendarCells.push({
      date: dateObj,
      dayNumber: day,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    calendarCells.push({
      date: dateObj,
      dayNumber: d,
      isCurrentMonth: true
    });
  }

  // Next month leading days to complete 35 or 42 cells
  const remainingCells = 42 - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const dateObj = new Date(year, month + 1, d);
    calendarCells.push({
      date: dateObj,
      dayNumber: d,
      isCurrentMonth: false
    });
  }

  const todayStr = new Date().toDateString();

  const getTasksForDate = (dateObj) => {
    const targetStr = dateObj.toDateString();
    return todos.filter(t => {
      if (!t.dueDate) return false;
      try {
        return new Date(t.dueDate).toDateString() === targetStr;
      } catch (e) {
        return false;
      }
    });
  };

  return (
    <div className="card bg-base-100 border border-base-300 rounded-2xl p-5 shadow-xs">
      {/* Calendar Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4 border-b border-base-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-base-content tracking-tight">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="btn btn-ghost btn-xs text-xs font-semibold rounded-lg"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="btn btn-ghost btn-xs btn-square text-base-content/70 rounded-lg"
            title="Previous month"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="btn btn-ghost btn-xs btn-square text-base-content/70 rounded-lg"
            title="Next month"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-xs font-bold uppercase tracking-wider text-base-content/40 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarCells.map((cell, idx) => {
          const isToday = cell.date.toDateString() === todayStr;
          const dayTasks = getTasksForDate(cell.date);

          return (
            <div
              key={idx}
              className={`min-h-[105px] p-2 rounded-xl border flex flex-col justify-between transition group relative ${
                isToday
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : cell.isCurrentMonth
                  ? 'border-base-200 bg-base-100 hover:border-base-300'
                  : 'border-transparent bg-base-200/30 text-base-content/30'
              }`}
            >
              {/* Day Cell Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-primary text-primary-content'
                      : cell.isCurrentMonth
                      ? 'text-base-content'
                      : 'text-base-content/40'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={() => onAddTaskOnDate && onAddTaskOnDate(cell.date)}
                  className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary rounded"
                  title="Add task for this date"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[70px]">
                {dayTasks.slice(0, 3).map(task => {
                  const isCompleted = task.status === 'COMPLETED' || task.status?.name?.includes('Compl');
                  const priorityClass = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onEdit && onEdit(task)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer transition flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-base-200 text-base-content/40 line-through'
                          : `${priorityClass} shadow-2xs hover:opacity-90`
                      }`}
                      title={`${task.title} (${task.priority || 'MEDIUM'})`}
                    >
                      {task.isRecurring && <ArrowPathIcon className="w-2.5 h-2.5 shrink-0" />}
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}

                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-base-content/50 font-semibold px-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TodoCalendarView;
