import React from 'react';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import FlagIcon from '@mui/icons-material/Flag';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

function TodoAnalytics({ analytics, loading }) {
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-3 text-sm text-gray-500">Calculating your productivity metrics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  const {
    totalTasks = 0,
    completedTasks = 0,
    inProgressTasks = 0,
    notStartedTasks = 0,
    completionRate = 0,
    completedToday = 0,
    completedThisWeek = 0,
    overdueCount = 0,
    streakDays = 0,
    priorityDistribution = {},
    tagDistribution = {}
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Top Banner: Streak & Completion Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Streak Card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Daily Streak</span>
            <span className="p-2 bg-white/20 rounded-xl">
              <WhatshotIcon style={{ fontSize: '1.5rem' }} />
            </span>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold flex items-baseline gap-2">
              <span>{streakDays}</span>
              <span className="text-lg font-semibold opacity-90">{streakDays === 1 ? 'Day' : 'Days'}</span>
            </div>
            <p className="text-xs opacity-90 mt-1">
              {streakDays > 0
                ? '🔥 You are on fire! Keep completing tasks daily to extend your streak.'
                : 'Complete a task today to kickstart your productivity streak!'}
            </p>
          </div>

          <div className="text-[11px] opacity-75">
            Updated automatically with each completion
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Completion Rate</span>
            <span className="p-2 bg-white/20 rounded-xl">
              <TrendingUpIcon style={{ fontSize: '1.5rem' }} />
            </span>
          </div>

          <div className="my-3">
            <div className="text-4xl font-extrabold">
              {completionRate}%
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, completionRate)}%` }}
              />
            </div>
            <p className="text-xs opacity-90 mt-2">
              {completedTasks} of {totalTasks} total tasks completed
            </p>
          </div>

          <div className="text-[11px] opacity-75">
            {inProgressTasks} currently in progress
          </div>
        </div>

        {/* Velocity / Today Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Weekly Velocity</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircleIcon style={{ fontSize: '1.5rem' }} />
            </span>
          </div>

          <div className="my-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed Today</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{completedToday}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed This Week</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{completedThisWeek}</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center justify-between text-red-600 dark:text-red-400 font-semibold text-xs pt-1 border-t border-gray-100 dark:border-gray-700">
                <span className="flex items-center gap-1">
                  <WarningAmberIcon style={{ fontSize: '1rem' }} />
                  <span>Overdue Tasks</span>
                </span>
                <span>{overdueCount}</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-gray-400">
            Based on active tasks history
          </div>
        </div>
      </div>

      {/* Breakdown Section: Priority & Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <FlagIcon style={{ fontSize: '1.2rem' }} />
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Tasks by Priority
            </h3>
          </div>

          <div className="space-y-3">
            {[
              { key: 'URGENT', label: 'Urgent', color: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
              { key: 'HIGH', label: 'High', color: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
              { key: 'MEDIUM', label: 'Medium', color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
              { key: 'LOW', label: 'Low', color: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400' }
            ].map(p => {
              const count = priorityDistribution[p.key] || 0;
              const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

              return (
                <div key={p.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={p.text}>{p.label}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${p.color} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags Breakdown */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <LocalOfferIcon style={{ fontSize: '1.2rem' }} />
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Tags & Categories
            </h3>
          </div>

          {Object.keys(tagDistribution).length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No tags used yet. Add tags like #work, #personal to your tasks!
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagDistribution).map(([tag, count]) => (
                <div
                  key={tag}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-200"
                >
                  <span>#{tag}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodoAnalytics;
