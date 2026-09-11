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
    <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create New Folder</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name:
            </label>
            <input
              ref={inputRef}
              type="text"
              id="folderName"
              value={folderName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter folder name"
              maxLength={255}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={!folderName.trim() || !!error}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;
