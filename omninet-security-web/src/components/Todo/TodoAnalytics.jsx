import React from 'react';
import {
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  FlagIcon,
  TagIcon
} from '@heroicons/react/24/outline';

function TodoAnalytics({ analytics, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="loading loading-spinner loading-md text-primary" />
        <p className="text-sm text-base-content/50">Calculating your productivity metrics...</p>
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
        <div className="card bg-base-100 border border-base-300 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">Daily Streak</span>
            <div className="p-2.5 bg-warning/10 text-warning rounded-xl">
              <FireIcon className="w-5 h-5 stroke-2" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-3xl font-extrabold text-base-content flex items-baseline gap-2">
              <span>{streakDays}</span>
              <span className="text-sm font-semibold text-base-content/60">{streakDays === 1 ? 'Day' : 'Days'}</span>
            </div>
            <p className="text-xs text-base-content/60 mt-1">
              {streakDays > 0
                ? 'Great momentum! Keep completing tasks daily to extend your streak.'
                : 'Complete a task today to kickstart your productivity streak!'}
            </p>
          </div>

          <div className="text-[11px] text-base-content/40">
            Updated automatically with each completion
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="card bg-base-100 border border-base-300 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">Completion Rate</span>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <ArrowTrendingUpIcon className="w-5 h-5 stroke-2" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-3xl font-extrabold text-base-content">
              {completionRate}%
            </div>
            <div className="w-full bg-base-200 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, completionRate)}%` }}
              />
            </div>
            <p className="text-xs text-base-content/60 mt-2">
              {completedTasks} of {totalTasks} total tasks completed
            </p>
          </div>

          <div className="text-[11px] text-base-content/40">
            {inProgressTasks} currently in progress
          </div>
        </div>

        {/* Velocity / Today Card */}
        <div className="card bg-base-100 border border-base-300 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">Weekly Velocity</span>
            <div className="p-2.5 bg-success/10 text-success rounded-xl">
              <CheckCircleIcon className="w-5 h-5 stroke-2" />
            </div>
          </div>

          <div className="my-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-base-content/70">Completed Today</span>
              <span className="text-lg font-bold text-base-content">{completedToday}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-base-content/70">Completed This Week</span>
              <span className="text-lg font-bold text-base-content">{completedThisWeek}</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center justify-between text-error font-semibold text-xs pt-2 border-t border-base-200">
                <span className="flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                  <span>Overdue Tasks</span>
                </span>
                <span>{overdueCount}</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-base-content/40">
            Based on active tasks history
          </div>
        </div>
      </div>

      {/* Breakdown Section: Priority & Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="card bg-base-100 border border-base-300 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <FlagIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-base-content tracking-tight">
              Tasks by Priority
            </h3>
          </div>

          <div className="space-y-3">
            {[
              { key: 'URGENT', label: 'Urgent', color: 'bg-error', text: 'text-error' },
              { key: 'HIGH', label: 'High', color: 'bg-warning', text: 'text-warning' },
              { key: 'MEDIUM', label: 'Medium', color: 'bg-info', text: 'text-info' },
              { key: 'LOW', label: 'Low', color: 'bg-base-content/40', text: 'text-base-content/60' }
            ].map(p => {
              const count = priorityDistribution[p.key] || 0;
              const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

              return (
                <div key={p.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className={p.text}>{p.label}</span>
                    <span className="text-base-content/50">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-base-200 h-1.5 rounded-full overflow-hidden">
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
        <div className="card bg-base-100 border border-base-300 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <TagIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-base-content tracking-tight">
              Tags & Categories
            </h3>
          </div>

          {Object.keys(tagDistribution).length === 0 ? (
            <div className="text-center py-8 text-xs text-base-content/40">
              No tags used yet. Add tags like #work, #personal to your tasks!
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagDistribution).map(([tag, count]) => (
                <div
                  key={tag}
                  className="badge badge-neutral gap-2 py-3 px-3 text-xs font-medium rounded-xl"
                >
                  <span>#{tag}</span>
                  <span className="badge badge-primary badge-xs font-bold">
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
