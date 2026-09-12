import React, { useState, useEffect, useRef } from 'react';

const RenameModal = ({ currentName, onConfirm, onCancel }) => {
  const [newName, setNewName] = useState(currentName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      
      const lastDotIndex = currentName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        inputRef.current.setSelectionRange(0, lastDotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [currentName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() && newName !== currentName) {
      onConfirm(newName.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-base-300">
          <h3 className="text-base font-semibold text-base-content">Rename Item</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-2">
            <label htmlFor="newName" className="block text-xs font-semibold uppercase tracking-wider text-base-content/70">
              New Name
            </label>
            <input
              ref={inputRef}
              type="text"
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter new name"
              maxLength={255}
              className="input input-bordered w-full rounded-xl text-sm bg-base-100 border-base-300 focus:outline-primary"
            />
          </div>

          <div className="px-5 py-3.5 border-t border-base-300 bg-base-200/40 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost btn-sm rounded-xl text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newName.trim() || newName === currentName}
              className="btn btn-primary btn-sm rounded-xl text-xs font-semibold shadow-xs"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
