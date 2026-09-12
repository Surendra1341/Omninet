import React from 'react';

const StatusBar = ({ totalItems, selectedCount, currentPath }) => {
  const getItemText = () => {
    if (selectedCount > 0) {
      return `${selectedCount} of ${totalItems} items selected`;
    }
    return `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
  };

  const getCurrentLocationText = () => {
    if (!currentPath) return 'Root';
    return currentPath;
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-base-200/50 border-t border-base-300 text-xs text-base-content/60 transition-colors">
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-base-content/80">{getItemText()}</span>
      </div>

      <div className="flex items-center truncate max-w-xs">
        <span className="truncate">
          <span className="font-semibold text-base-content/70">Location:</span> {getCurrentLocationText()}
        </span>
      </div>

      <div className="flex items-center">
        <span className="text-[11px] font-medium text-base-content/50">OmniNet Cloud Drive</span>
      </div>
    </div>
  );
};

export default StatusBar;
