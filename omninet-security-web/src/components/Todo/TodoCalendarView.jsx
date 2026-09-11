import React, { useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import RepeatIcon from '@mui/icons-material/Repeat';

const PRIORITY_COLORS = {
  URGENT: 'bg-red-500 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-blue-500 text-white',
  LOW: 'bg-slate-500 text-white'
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-5 shadow-xs">
      {/* Calendar Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
            title="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
            title="Next month"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-xs font-bold uppercase tracking-wider text-gray-400 py-1">
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
                  ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-blue-500'
                  : cell.isCurrentMonth
                  ? 'border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  : 'border-transparent bg-gray-50/50 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600'
              }`}
            >
              {/* Day Cell Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : cell.isCurrentMonth
                      ? 'text-gray-800 dark:text-gray-200'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={() => onAddTaskOnDate && onAddTaskOnDate(cell.date)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition"
                  title="Add task for this date"
                >
                  <AddIcon style={{ fontSize: '0.9rem' }} />
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
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium truncate cursor-pointer transition flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-gray-100 dark:bg-gray-700/60 text-gray-400 line-through'
                          : `${priorityClass} shadow-2xs hover:opacity-90`
                      }`}
                      title={`${task.title} (${task.priority || 'MEDIUM'})`}
                    >
                      {task.isRecurring && <RepeatIcon style={{ fontSize: '0.75rem' }} className="shrink-0" />}
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}

                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold px-1">
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
