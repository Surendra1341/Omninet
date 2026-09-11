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
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
      <div className="flex items-center">
        <span>{getItemText()}</span>
      </div>
      
      <div className="flex items-center">
        <span>
          <strong className="font-medium">Location:</strong> {getCurrentLocationText()}
        </span>
      </div>
      
      <div className="flex items-center">
        <span className="font-medium text-gray-700">OmniNet Storage</span>
      </div>
    </div>
  );
};

export default StatusBar;
