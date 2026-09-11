import React, { useEffect, useRef } from 'react';
import { 
  FaPlus, 
  FaUpload, 
  FaDownload, 
  FaEdit, 
  FaTrash, 
  FaSync,
  FaCopy,
  FaCut,
  FaPaste,
  FaInfo
} from 'react-icons/fa';

const ContextMenu = ({ 
  x, 
  y, 
  item, 
  selectedItems, 
  onClose, 
  onCreateFolder, 
  onUpload, 
  onDownload, 
  onRename, 
  onDelete, 
  onRefresh 
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }
      
      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleAction = (action) => {
    action();
    onClose();
  };

  const isMultipleSelected = selectedItems.length > 1;
  const hasSelection = selectedItems.length > 0;
  const selectedItem = selectedItems[0];

  return (
    <div 
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {!hasSelection && (
        <>
      <button 
        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        onClick={() => handleAction(onCreateFolder)}
      >
        <FaPlus className="text-green-500" />
        <span>New Folder</span>
      </button>
      
      <button 
        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        onClick={() => handleAction(onUpload)}
      >
        <FaUpload className="text-blue-500" />
        <span>Upload Files</span>
      </button>
      
      <div className="border-t border-gray-200 my-1" />
      
      <button 
        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        onClick={() => handleAction(onRefresh)}
      >
        <FaSync className="text-gray-500" />
        <span>Refresh</span>
      </button>
        </>
      )}

      {/* Only show these options when items are selected */}
      {hasSelection && (
        <>
          <div className=" my-1" />
          
          {!isMultipleSelected && selectedItem.type !== 'folder' && (
            <button 
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => handleAction(() => onDownload(selectedItem))}
            >
              <FaDownload className="text-blue-500" />
              <span>Download</span>
            </button>
          )}
          
          {/* {!isMultipleSelected && (
            <button 
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => handleAction(onRename)}
            >
              <FaEdit className="text-orange-500" />
              <span>Rename</span>
            </button>
          )} */}
          
          {/* <button 
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
            onClick={() => handleAction(() => {})}
            disabled
          >
            <FaCopy />
            <span>Copy</span>
          </button> */}
          
          {/* <button 
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
            onClick={() => handleAction(() => {})}
            disabled
          >
            <FaCut />
            <span>Cut</span>
          </button> */}
          
          <div className="border-t border-gray-200 my-1" />
          
          <button 
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => handleAction(onDelete)}
          >
            <FaTrash />
            <span>Delete</span>
          </button>
          
          {/* {!isMultipleSelected && (
            <>
              <div className="border-t border-gray-200 my-1" />
              
              <button 
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                onClick={() => handleAction(() => {})}
                disabled
              >
                <FaInfo />
                <span>Properties</span>
              </button>
            </>
          )} */}
        </>
      )}
    </div>
  );
};

export default ContextMenu;
