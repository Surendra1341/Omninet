import React from 'react';

const TypingIndicator = ({ typers = [] }) => {
  if (!typers || typers.length === 0) return null;

  const names = typers.map((t) => t.userName || 'Someone');
  let label = '';
  if (names.length === 1) {
    label = `${names[0]} is typing`;
  } else if (names.length === 2) {
    label = `${names[0]} and ${names[1]} are typing`;
  } else {
    label = `${names[0]} and ${names.length - 1} others are typing`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-slate-400 select-none animate-fade-in">
      <div className="flex items-center gap-1 bg-slate-800/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/50 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
        <span className="ml-1 text-slate-300 font-medium">{label}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
