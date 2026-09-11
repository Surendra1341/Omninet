import React from 'react';

const ProgressModal = ({ 
  title, 
  progress = 0, 
  current, 
  total, 
  currentItem, 
  step, 
  onCancel 
}) => {
  const getProgressText = () => {
    if (step) {
      const stepLabels = {
        checking: 'Checking...',
        downloading: 'Downloading...',
        uploading: 'Uploading...',
        verifying: 'Verifying...',
        cleaning: 'Cleaning up...',
        analyzing: 'Analyzing...',
        copying: 'Copying...',
        complete: 'Complete!'
      };
      return stepLabels[step] || step;
    }
    
    if (current && total) {
      return `Processing ${current} of ${total} items`;
    }
    
    return 'Processing...';
  };

  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="px-6 py-6">
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
              />
            </div>
            
            <div className="text-center mt-2">
              <span className="text-lg font-semibold text-gray-900">
                {Math.round(progress || 0)}%
              </span>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-gray-700 font-medium">{getProgressText()}</p>
            {currentItem && (
              <p className="text-sm text-gray-600 truncate" title={currentItem}>
                <strong>{currentItem}</strong>
              </p>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;
