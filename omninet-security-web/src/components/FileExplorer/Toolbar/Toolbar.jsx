import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  Bars3Icon,
  ArrowsUpDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

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
  onRefresh,
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

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

  const breadcrumbParts = currentPath ? currentPath.split('/').filter(Boolean) : [];

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      onNavigateTo('');
    } else {
      const path = breadcrumbParts.slice(0, index + 1).join('/');
      onNavigateTo(path);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-base-100 border-b border-base-300 flex-wrap transition-colors">
      {/* Left: Nav Buttons & Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-[280px]">
        {/* Toggle Sidebar */}
        <button
          className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:text-base-content"
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
          type="button"
        >
          <Bars3Icon className="w-4 h-4" />
        </button>

        {/* Back / Forward / Up / Home Group */}
        <div className="flex items-center gap-0.5 bg-base-200/60 rounded-xl p-0.5 border border-base-300/60">
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/70 disabled:opacity-30"
            onClick={onNavigateBack}
            disabled={!canGoBack}
            title="Back"
            type="button"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </button>
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/70 disabled:opacity-30"
            onClick={onNavigateForward}
            disabled={!canGoForward}
            title="Forward"
            type="button"
          >
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/70 disabled:opacity-30"
            onClick={onNavigateUp}
            disabled={!canGoUp}
            title="Up one level"
            type="button"
          >
            <ArrowUpIcon className="w-3.5 h-3.5" />
          </button>
          <button
            className="btn btn-ghost btn-xs btn-square text-base-content/70"
            onClick={() => onNavigateTo('')}
            title="Root"
            type="button"
          >
            <HomeIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address / Breadcrumbs Bar */}
        <nav aria-label="Breadcrumb" className="flex items-center bg-base-200/50 border border-base-300 rounded-xl px-2.5 py-1 text-xs max-w-md overflow-x-auto custom-scrollbar">
          <button
            type="button"
            className="text-base-content/70 hover:text-primary font-medium transition-colors px-1 py-0.5 rounded"
            onClick={() => handleBreadcrumbClick(-1)}
          >
            Root
          </button>
          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRightIcon className="w-3 h-3 text-base-content/40 shrink-0 mx-0.5" />
              <button
                type="button"
                className={`px-1 py-0.5 rounded transition-colors font-medium truncate max-w-[120px] ${
                  index === breadcrumbParts.length - 1
                    ? 'text-base-content font-semibold'
                    : 'text-base-content/70 hover:text-primary'
                }`}
                onClick={() => handleBreadcrumbClick(index)}
                title={part}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Search, Actions, View Mode & Sort */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input */}
        <div className="relative flex items-center">
          <MagnifyingGlassIcon className="w-4 h-4 text-base-content/40 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input input-sm input-bordered rounded-xl bg-base-200/50 border-base-300 pl-8 pr-3 w-40 sm:w-52 text-xs focus:bg-base-100 transition-all"
          />
        </div>

        {/* Create Folder Button */}
        <button
          type="button"
          className="btn btn-ghost btn-sm border border-base-300 rounded-xl gap-1.5 text-xs font-medium text-base-content hover:bg-base-200"
          onClick={onCreateFolder}
          title="New Folder"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Folder</span>
        </button>

        {/* Upload Button */}
        <button
          type="button"
          className="btn btn-primary btn-sm rounded-xl gap-1.5 text-xs font-semibold shadow-xs"
          onClick={onUpload}
          title="Upload Files"
        >
          <ArrowUpTrayIcon className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:text-base-content"
          onClick={onRefresh}
          title="Refresh"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>

        {/* View Mode Toggle */}
        <div className="join border border-base-300 rounded-xl bg-base-200/50 p-0.5">
          <button
            type="button"
            className={`btn btn-xs btn-square border-0 join-item ${
              viewMode === 'grid'
                ? 'bg-base-100 text-primary shadow-xs'
                : 'btn-ghost text-base-content/60'
            }`}
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
          >
            <Squares2X2Icon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className={`btn btn-xs btn-square border-0 join-item ${
              viewMode === 'list'
                ? 'bg-base-100 text-primary shadow-xs'
                : 'btn-ghost text-base-content/60'
            }`}
            onClick={() => onViewModeChange('list')}
            title="List View"
          >
            <ListBulletIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sort Menu */}
        <div className="relative" ref={sortMenuRef}>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square border border-base-300 rounded-xl text-base-content/70 hover:text-base-content"
            onClick={() => setShowSortMenu(!showSortMenu)}
            title="Sort Options"
          >
            <ArrowsUpDownIcon className="w-4 h-4" />
          </button>

          {showSortMenu && (
            <div className="absolute top-full right-0 mt-1.5 w-44 rounded-xl border border-base-300 bg-base-100 p-1.5 shadow-xl z-50 text-xs animate-fadeIn">
              <div className="px-2 py-1 text-[11px] font-semibold text-base-content/50 uppercase tracking-wider">
                Sort by
              </div>
              <button
                type="button"
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  sortBy === 'name' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-base-200 text-base-content'
                }`}
                onClick={() => {
                  onSortChange('name', sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                  setShowSortMenu(false);
                }}
              >
                <span>Name</span>
                {sortBy === 'name' && <span>{sortOrder === 'asc' ? 'A→Z' : 'Z→A'}</span>}
              </button>
              <button
                type="button"
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  sortBy === 'size' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-base-200 text-base-content'
                }`}
                onClick={() => {
                  onSortChange('size', sortBy === 'size' && sortOrder === 'asc' ? 'desc' : 'asc');
                  setShowSortMenu(false);
                }}
              >
                <span>Size</span>
                {sortBy === 'size' && <span>{sortOrder === 'asc' ? 'Small' : 'Large'}</span>}
              </button>
              <button
                type="button"
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  sortBy === 'modified' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-base-200 text-base-content'
                }`}
                onClick={() => {
                  onSortChange('modified', sortBy === 'modified' && sortOrder === 'asc' ? 'desc' : 'asc');
                  setShowSortMenu(false);
                }}
              >
                <span>Date Modified</span>
                {sortBy === 'modified' && <span>{sortOrder === 'asc' ? 'Oldest' : 'Newest'}</span>}
              </button>
              <button
                type="button"
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  sortBy === 'type' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-base-200 text-base-content'
                }`}
                onClick={() => {
                  onSortChange('type', sortBy === 'type' && sortOrder === 'asc' ? 'desc' : 'asc');
                  setShowSortMenu(false);
                }}
              >
                <span>Type</span>
                {sortBy === 'type' && <span>{sortOrder === 'asc' ? 'A→Z' : 'Z→A'}</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
