import React, { useState, useEffect, useRef } from 'react';

const CreateFolderModal = ({ onConfirm, onCancel }) => {
  const [folderName, setFolderName] = useState('New Folder');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const validateFolderName = (name) => {
    if (!name || !name.trim()) {
      return 'Folder name is required';
    }
    
    const trimmedName = name.trim();
    
    // Check for invalid characters (backend only allows alphanumeric, dots, hyphens, underscores, and forward slashes)
    const validChars = /^[a-zA-Z0-9.\-_/]+$/;
    if (!validChars.test(trimmedName)) {
      return 'Folder name can only contain letters, numbers, dots, hyphens, underscores, and forward slashes';
    }
    
    // Check for reserved names
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(trimmedName.toUpperCase())) {
      return 'This folder name is reserved and cannot be used';
    }
    
    // Check length
    if (trimmedName.length > 255) {
      return 'Folder name is too long (maximum 255 characters)';
    }
    
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateFolderName(folderName);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onConfirm(folderName.trim());
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFolderName(value);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
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
          <h3 className="text-base font-semibold text-base-content">Create New Folder</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-2">
            <label htmlFor="folderName" className="block text-xs font-semibold uppercase tracking-wider text-base-content/70">
              Folder Name
            </label>
            <input
              ref={inputRef}
              type="text"
              id="folderName"
              value={folderName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Projects, Invoices..."
              maxLength={255}
              className={`input input-bordered w-full rounded-xl text-sm bg-base-100 border-base-300 focus:outline-primary ${
                error ? 'input-error' : ''
              }`}
            />
            {error && (
              <p className="text-xs text-error mt-1">{error}</p>
            )}
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
              disabled={!folderName.trim() || !!error}
              className="btn btn-primary btn-sm rounded-xl text-xs font-semibold shadow-xs"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;
