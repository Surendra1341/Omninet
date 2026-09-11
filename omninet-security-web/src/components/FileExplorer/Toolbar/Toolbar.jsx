import React, { useState, useEffect, useRef } from 'react';
import { 
  FaArrowLeft, 
  FaArrowRight, 
  FaArrowUp, 
  FaHome,
  FaSearch,
  FaTh,
  FaList,
  FaPlus,
  FaUpload,
  FaSync,
  FaBars,
  FaSort,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSortNumericDown,
  FaSortNumericUp
} from 'react-icons/fa';

const Toolbar = ({
  canGoBack,
  canGoForward,
  canGoUp,
  currentPath,
  viewMode,
  sortBy,
  sortOrder,
  searchQuery,
  sidebarCollapsed,
  onNavigateBack,
  onNavigateForward,
  onNavigateUp,
  onNavigateTo,
  onViewModeChange,
  onSortChange,
  onSearchChange,
  onToggleSidebar,
  onCreateFolder,
  onUpload,
  onRefresh
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };

    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortMenu]);

  const breadcrumbParts = currentPath ? currentPath.split('/') : [];

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      onNavigateTo('');
    } else {
      const path = breadcrumbParts.slice(0, index + 1).join('/');
      onNavigateTo(path);
    }
  };

  const getSortIcon = () => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />;
    } else if (sortBy === 'size' || sortBy === 'modified') {
      return sortOrder === 'asc' ? <FaSortNumericDown /> : <FaSortNumericUp />;
    }
    return <FaSort />;
  };

  return (
    <div className="flex items-center p-3 bg-white border-b border-gray-200 shadow-sm gap-3 flex-wrap">
      {/* Navigation Section */}
      <div className="flex items-center gap-1">
        <button
          className="flex items-center justify-center p-2 border border-transparent bg-transparent rounded hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-sm text-gray-700 transition-all duration-200"
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
        >
          <FaBars />
        </button>

        <button
          className="flex items-center justify-center p-2 border border-transparent bg-transparent rounded hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-sm text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onNavigateBack}
          disabled={!canGoBack}
          title="Back"
        >
          <FaArrowLeft />
        </button>

        <button
          className="flex items-center justify-center p-2 border border-transparent bg-transparent rounded hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-sm text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onNavigateForward}
          disabled={!canGoForward}
          title="Forward"
        >
          <FaArrowRight />
        </button>

        <button
          className="flex items-center justify-center p-2 border border-transparent bg-transparent rounded hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-sm text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onNavigateUp}
          disabled={!canGoUp}
          title="Up"
        >
          <FaArrowUp />
        </button>

        <button
          className="flex items-center justify-center p-2 border border-transparent bg-transparent rounded hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-sm text-gray-700 transition-all duration-200"
          onClick={() => onNavigateTo('')}
          title="Home"
        >
          <FaHome />
        </button>
      </div>

      {/* Address Bar */}
      <div className="flex items-center flex-1 min-w-[200px]">
        <div className="flex items-center bg-white border border-gray-300 rounded px-3 py-1.5 overflow-hidden">
          <button
            className="bg-transparent border-none text-blue-600 cursor-pointer px-2 py-1 rounded text-sm transition-colors hover:bg-blue-50"
            onClick={() => handleBreadcrumbClick(-1)}
          >
            Root
          </button>
          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <span className="text-gray-600 mx-1">/</span>
              <button
                className="bg-transparent border-none text-blue-600 cursor-pointer px-2 py-1 rounded text-sm transition-colors hover:bg-blue-50"
                onClick={() => handleBreadcrumbClick(index)}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center min-w-[200px]">
        <div className="relative flex items-center">
          <FaSearch className="absolute left-3 text-gray-400 z-10" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded text-sm w-52 transition-colors focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 px-3 py-2 border border-transparent bg-transparent rounded hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-sm text-gray-700 transition-all duration-200"
          onClick={onCreateFolder}
          title="New Folder"
        >
          <FaPlus />
          <span>New Folder</span>
        </button>

        <button
          className="flex items-center gap-1.5 px-3 py-2 border border-transparent bg-transparent rounded hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-sm text-gray-700 transition-all duration-200"
          onClick={onUpload}
          title="Upload Files"
        >
          <FaUpload />
          <span>Upload</span>
        </button>

        <button
          className="flex items-center justify-center p-2 border border-transparent bg-transparent rounded hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-sm text-gray-700 transition-all duration-200"
          onClick={onRefresh}
          title="Refresh"
        >
          <FaSync />
        </button>

        {/* View Mode Toggle */}
        <div className="flex border border-gray-300 rounded overflow-hidden">
          <button
            className={`flex items-center justify-center p-2 border-none text-sm transition-colors ${
              viewMode === 'grid' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-transparent text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
          >
            <FaTh />
          </button>
          <button
            className={`flex items-center justify-center p-2 border-none text-sm transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-transparent text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => onViewModeChange('list')}
            title="List View"
          >
            <FaList />
          </button>
        </div>

        {/* Sort Menu */}
        <div className="relative" ref={sortMenuRef}>
          <button
            className="flex items-center justify-center p-2 border border-transparent bg-transparent rounded hover:bg-gray-100 hover:border-gray-300 cursor-pointer text-sm text-gray-700 transition-all duration-200"
            onClick={() => setShowSortMenu(!showSortMenu)}
            title="Sort Options"
          >
            {getSortIcon()}
          </button>
          {showSortMenu && (
            <div className="absolute top-full right-0 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[150px]">
              <button
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                  sortBy === 'name' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
                onClick={() => {
                  onSortChange('name', sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                  setShowSortMenu(false);
                }}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                  sortBy === 'size' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
                onClick={() => {
                  onSortChange('size', sortBy === 'size' && sortOrder === 'asc' ? 'desc' : 'asc');
                  setShowSortMenu(false);
                }}
              >
                Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                  sortBy === 'modified' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
                onClick={() => {
                  onSortChange('modified', sortBy === 'modified' && sortOrder === 'asc' ? 'desc' : 'asc');
                  setShowSortMenu(false);
                }}
              >
                Modified {sortBy === 'modified' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                  sortBy === 'type' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
                onClick={() => {
                  onSortChange('type', sortBy === 'type' && sortOrder === 'asc' ? 'desc' : 'asc');
                  setShowSortMenu(false);
                }}
              >
                Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
