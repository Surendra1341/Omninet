import React, { useState } from 'react';
import {
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { storageClient } from '../../../services/storageClient';

const getFileIcon = (fileName, type) => {
  if (type === 'folder') {
    return <FolderIcon className="w-9 h-9 text-primary transition-transform group-hover:scale-105" />;
  }

  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return <PhotoIcon className="w-8 h-8 text-emerald-500/90 transition-transform group-hover:scale-105" />;
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
      return <FilmIcon className="w-8 h-8 text-rose-500/90 transition-transform group-hover:scale-105" />;
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
    case 'ogg':
      return <SpeakerWaveIcon className="w-8 h-8 text-purple-500/90 transition-transform group-hover:scale-105" />;
    case 'txt':
    case 'md':
    case 'json':
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'py':
    case 'java':
    case 'go':
    case 'doc':
    case 'docx':
    case 'pdf':
      return <DocumentTextIcon className="w-8 h-8 text-sky-500/90 transition-transform group-hover:scale-105" />;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <ArchiveBoxIcon className="w-8 h-8 text-amber-500/90 transition-transform group-hover:scale-105" />;
    default:
      return <DocumentIcon className="w-8 h-8 text-base-content/50 transition-transform group-hover:scale-105" />;
  }
};

const formatFileSize = (bytes) => {
  if (!bytes) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const GridView = ({ items, selectedItems, onItemSelect, onItemDoubleClick, onContextMenu }) => {
  const isSelected = (item) => selectedItems.some((selected) => selected.path === item.path);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 p-4">
      {items.map((item, index) => {
        const selected = isSelected(item);
        return (
          <div
            key={item.path}
            data-file-item="true"
            className={`group flex flex-col items-center p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer text-center select-none ${
              selected
                ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30'
                : 'bg-base-100 border-base-300/70 hover:border-primary/40 hover:bg-base-200/50 hover:shadow-xs'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onItemSelect(item, index, e);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onItemDoubleClick(item);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              onContextMenu(e, item);
            }}
          >
            <div className="mb-2.5 flex items-center justify-center h-10">
              {getFileIcon(item.name, item.type)}
            </div>
            <div className="w-full">
              <div
                className={`text-xs font-medium truncate transition-colors ${
                  selected ? 'text-primary font-semibold' : 'text-base-content group-hover:text-primary'
                }`}
                title={item.name}
              >
                {item.name}
              </div>
              <div className="text-[11px] text-base-content/50 mt-0.5">
                {item.type === 'folder' ? 'Folder' : formatFileSize(item.size)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ListView = ({ items, selectedItems, onItemSelect, onItemDoubleClick, onContextMenu }) => {
  const isSelected = (item) => selectedItems.some((selected) => selected.path === item.path);

  return (
    <div className="flex flex-col select-none">
      <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-base-200/50 border-b border-base-300 text-[11px] font-semibold text-base-content/50 uppercase tracking-wider">
        <div className="col-span-6 sm:col-span-5">Name</div>
        <div className="col-span-2 hidden sm:block">Size</div>
        <div className="col-span-2 hidden sm:block">Type</div>
        <div className="col-span-6 sm:col-span-3 text-right sm:text-left">Modified</div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-base-300/40">
        {items.map((item, index) => {
          const selected = isSelected(item);
          return (
            <div
              key={item.path}
              data-file-item="true"
              className={`grid grid-cols-12 gap-4 px-4 py-2.5 cursor-pointer transition-colors text-xs items-center ${
                selected
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'hover:bg-base-200/50 text-base-content'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onItemSelect(item, index, e);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onItemDoubleClick(item);
              }}
              onContextMenu={(e) => {
                e.stopPropagation();
                onContextMenu(e, item);
              }}
            >
              <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 flex items-center">
                  {getFileIcon(item.name, item.type)}
                </div>
                <span className="truncate" title={item.name}>{item.name}</span>
              </div>
              <div className="col-span-2 hidden sm:block text-base-content/60">
                {item.type === 'folder' ? '—' : formatFileSize(item.size)}
              </div>
              <div className="col-span-2 hidden sm:block text-base-content/60 uppercase text-[11px]">
                {item.type === 'folder' ? 'Folder' : item.name.split('.').pop() || 'File'}
              </div>
              <div className="col-span-6 sm:col-span-3 text-right sm:text-left text-base-content/60 text-[11px]">
                {formatDate(item.lastModified)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MainPane = ({ 
  items, 
  selectedItems, 
  viewMode, 
  loading, 
  error,
  currentPath,
  onItemSelect,
  onItemDoubleClick,
  onContextMenu,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileUpload,
  onRefresh
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const handleMainPaneClick = (e) => {
    // Check if the click is on the main pane itself or its direct children (not on an item)
    const isClickOnItem = e.target.closest('[data-file-item]');
    if (!isClickOnItem) {
      onItemSelect(null, -1, e);
    }
  };

  const handleMainPaneContextMenu = (e) => {
    e.preventDefault();
    // Check if right-click is on an item or empty space
    const isClickOnItem = e.target.closest('[data-file-item]');
    if (!isClickOnItem) {
      // Clear selection when right-clicking on empty space
      onItemSelect(null, -1, e);
    }
    // Always show context menu when right-clicking on main pane
    onContextMenu(e);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show drag over state if files are being dragged
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
    
    onDragEnter?.(e);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the main pane completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
    
    onDragLeave?.(e);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set the dropEffect to copy to show the correct cursor
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
    
    onDragOver?.(e);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    try {
      const files = Array.from(e.dataTransfer.files);
      
      if (files.length === 0) {
        console.log('No files dropped');
        return;
      }

      console.log('Files dropped:', files.map(f => f.name));
      
      // Set uploading state
      const uploadingFilesList = files.map(file => ({
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading'
      }));
      setUploadingFiles(uploadingFilesList);

      // Upload files one by one
      const uploadResults = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Update progress for current file
          setUploadingFiles(prev => prev.map((item, index) => 
            index === i ? { ...item, status: 'uploading', progress: 0 } : item
          ));

          const result = await storageClient.uploadFile(
            file, 
            currentPath || '', 
            (progress) => {
              // Update upload progress
              setUploadingFiles(prev => prev.map((item, index) => 
                index === i ? { ...item, progress } : item
              ));
            }
          );

          if (result.success) {
            // Mark as completed
            setUploadingFiles(prev => prev.map((item, index) => 
              index === i ? { ...item, status: 'completed', progress: 100 } : item
            ));
            
            uploadResults.push({ file: file.name, success: true });
            
            // Notify parent component about successful upload
            onFileUpload?.(result.data);
          } else {
            // Mark as failed
            setUploadingFiles(prev => prev.map((item, index) => 
              index === i ? { ...item, status: 'failed', error: result.error } : item
            ));
            
            uploadResults.push({ file: file.name, success: false, error: result.error });
            console.error(`Failed to upload ${file.name}:`, result.error);
          }
          
        } catch (error) {
          // Mark as failed
          setUploadingFiles(prev => prev.map((item, index) => 
            index === i ? { ...item, status: 'failed', error: error.message } : item
          ));
          
          uploadResults.push({ file: file.name, success: false, error: error.message });
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      // Clear uploading state after a delay
      setTimeout(() => {
        setUploadingFiles([]);
        // Refresh the file list to show new uploads
        onRefresh?.();
      }, 200);

      // Show summary
      const successCount = uploadResults.filter(r => r.success).length;
      const failCount = uploadResults.filter(r => !r.success).length;
      
      if (successCount > 0) {
        console.log(`Successfully uploaded ${successCount} file(s)`);
      }
      if (failCount > 0) {
        console.warn(`Failed to upload ${failCount} file(s)`);
      }

    } catch (error) {
      console.error('Drop handling error:', error);
      setUploadingFiles([]);
    }
    
    onDrop?.(e);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base-100">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <span className="text-xs text-base-content/60 font-medium">Loading folder...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-base-100">
        <div className="text-center">
          <div className="flex justify-center mb-4 text-warning">
            <ExclamationTriangleIcon className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-semibold text-base-content mb-2">Error Loading Contents</h3>
          <p className="text-base-content/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex-1 bg-base-100 overflow-hidden relative ${isDragOver ? 'bg-primary/5' : ''}`}
      onClick={handleMainPaneClick}
      onContextMenu={handleMainPaneContextMenu}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary/40 z-10 flex items-center justify-center backdrop-blur-xs">
          <div className="text-center">
            <div className="flex justify-center mb-2 text-primary">
              <FolderIcon className="w-10 h-10" />
            </div>
            <p className="text-sm font-semibold text-primary">Drop files here to upload</p>
          </div>
        </div>
      )}

      {uploadingFiles.length > 0 && (
        <div className="absolute top-4 right-4 z-20 bg-base-100 border border-base-300 rounded-xl shadow-lg p-4 max-w-sm">
          <h3 className="text-sm font-semibold text-base-content mb-2">Uploading Files</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uploadingFiles.map((file, index) => (
              <div key={index} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="truncate flex-1 mr-2" title={file.name}>
                    {file.name}
                  </span>
                  <span className={`text-xs ${
                    file.status === 'completed' ? 'text-success' :
                    file.status === 'failed' ? 'text-error' :
                    'text-primary'
                  }`}>
                    {file.status === 'completed' ? 'Uploaded' :
                     file.status === 'failed' ? 'Failed' :
                     `${Math.round(file.progress)}%`}
                  </span>
                </div>
                {file.status === 'uploading' && (
                  <div className="w-full bg-base-200 rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {file.status === 'failed' && file.error && (
                  <div className="text-error text-xs mt-1 truncate" title={file.error}>
                    {file.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="h-full overflow-y-auto main-pane-content">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="flex justify-center mb-3 text-base-content/30">
                <FolderIcon className="w-14 h-14" />
              </div>
              <h3 className="text-base font-semibold text-base-content mb-1">This folder is empty</h3>
              <p className="text-sm text-base-content/50">Drag files here or use the toolbar to add content</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <GridView
            items={items}
            selectedItems={selectedItems}
            onItemSelect={onItemSelect}
            onItemDoubleClick={onItemDoubleClick}
            onContextMenu={onContextMenu}
          />
        ) : (
          <ListView
            items={items}
            selectedItems={selectedItems}
            onItemSelect={onItemSelect}
            onItemDoubleClick={onItemDoubleClick}
            onContextMenu={onContextMenu}
          />
        )}
      </div>
    </div>
  );
};

export default MainPane;
