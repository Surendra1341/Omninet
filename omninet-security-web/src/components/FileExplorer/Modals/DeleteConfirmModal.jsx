import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteConfirmModal = ({ items, onConfirm, onCancel }) => {
  const itemCount = items.length;
  const isMultiple = itemCount > 1;
  const firstItem = items[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-base-300 flex items-center justify-between">
          <h3 className="text-base font-semibold text-base-content">Confirm Delete</h3>
        </div>
        
        <div className="p-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-error/10 text-error shrink-0">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              {isMultiple ? (
                <p className="text-sm text-base-content mb-2">
                  Are you sure you want to delete these <strong className="font-semibold text-base-content">{itemCount}</strong> items?
                </p>
              ) : (
                <p className="text-sm text-base-content mb-2">
                  Are you sure you want to delete <strong className="font-semibold text-base-content">"{firstItem?.name}"</strong>?
                </p>
              )}
              <p className="text-xs text-error font-medium">
                This action cannot be undone.
              </p>
            </div>
          </div>
          
          {isMultiple && itemCount <= 5 && (
            <div className="mt-4 p-3 bg-base-200 rounded-xl border border-base-300">
              <p className="text-xs font-medium text-base-content/70 mb-1.5">Items to delete:</p>
              <ul className="text-xs text-base-content/80 space-y-1">
                {items.map(item => (
                  <li key={item.path} className="truncate">• {item.name}</li>
                ))}
              </ul>
            </div>
          )}
          
          {isMultiple && itemCount > 5 && (
            <div className="mt-4 p-3 bg-base-200 rounded-xl border border-base-300">
              <p className="text-xs font-medium text-base-content/70 mb-1.5">Items to delete:</p>
              <ul className="text-xs text-base-content/80 space-y-1">
                {items.slice(0, 3).map(item => (
                  <li key={item.path} className="truncate">• {item.name}</li>
                ))}
                <li className="text-base-content/50 italic text-[11px]">... and {itemCount - 3} more items</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="px-6 py-3.5 border-t border-base-300 bg-base-200/50 flex justify-end gap-2.5">
          <button 
            type="button"
            onClick={onCancel} 
            className="btn btn-ghost btn-sm text-xs font-medium"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={onConfirm} 
            className="btn btn-error btn-sm text-xs font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
