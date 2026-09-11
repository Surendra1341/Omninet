import React from 'react';

const DeleteConfirmModal = ({ items, onConfirm, onCancel }) => {
  const itemCount = items.length;
  const isMultiple = itemCount > 1;
  const firstItem = items[0];

  return (
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              {isMultiple ? (
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete these <strong className="font-semibold">{itemCount}</strong> items?
                </p>
              ) : (
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete <strong className="font-semibold">"{firstItem.name}"</strong>?
                </p>
              )}
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone.
              </p>
            </div>
          </div>
          
          {isMultiple && itemCount <= 5 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-2">Items to delete:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {items.map(item => (
                  <li key={item.path} className="truncate">• {item.name}</li>
                ))}
              </ul>
            </div>
          )}
          
          {isMultiple && itemCount > 5 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-2">Items to delete:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {items.slice(0, 3).map(item => (
                  <li key={item.path} className="truncate">• {item.name}</li>
                ))}
                <li className="text-gray-500 italic">... and {itemCount - 3} more items</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
