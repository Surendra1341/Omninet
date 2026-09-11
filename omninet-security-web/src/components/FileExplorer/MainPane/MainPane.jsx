import React, { useState } from 'react';
import { FaFolder, FaFile, FaImage, FaVideo, FaMusic, FaFileAlt, FaFileArchive } from 'react-icons/fa';
import { storageClient } from '../../../services/storageClient';
// import './MainPane.css';

const getFileIcon = (fileName, type) => {
  if (type === 'folder') return <FaFolder className="text-yellow-500 text-3xl" />;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
      return <FaImage className="text-green-500 text-3xl" />;
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
      return <FaVideo className="text-red-500 text-3xl" />;
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return <FaMusic className="text-purple-500 text-3xl" />;
    case 'txt':
    case 'doc':
    case 'docx':
    case 'pdf':
      return <FaFileAlt className="text-blue-500 text-3xl" />;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
      return <FaFileArchive className="text-orange-500 text-3xl" />;
    default:
      return <FaFile className="text-gray-500 text-3xl" />;
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
  return new Date(dateString).toLocaleString();
};

const GridView = ({ items, selectedItems, onItemSelect, onItemDoubleClick, onContextMenu }) => {
  const isSelected = (item) => selectedItems.some(selected => selected.path === item.path);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4">
      {items.map((item, index) => (
        <div
          key={item.path}
          data-file-item="true"
          className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
            isSelected(item) ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-200'
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
          <div className="mb-2">
            {getFileIcon(item.name, item.type)}
          </div>
          <div className="text-sm text-center w-full">
            <div className="font-medium text-gray-900 truncate" title={item.name}>
              {item.name}
            </div>
            {item.type !== 'folder' && (
              <div className="text-xs text-gray-500 mt-1">
                {formatFileSize(item.size)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ListView = ({ items, selectedItems, onItemSelect, onItemDoubleClick, onContextMenu }) => {
  const isSelected = (item) => selectedItems.some(selected => selected.path === item.path);

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3">Modified</div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={item.path}
            data-file-item="true"
            className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
              isSelected(item) ? 'bg-blue-50 border-blue-200' : ''
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
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0">
                {getFileIcon(item.name, item.type)}
              </div>
              <span className="text-sm text-gray-900 truncate">{item.name}</span>
            </div>
            <div className="col-span-2 flex items-center text-sm text-gray-600">
              {item.type === 'folder' ? '-' : formatFileSize(item.size)}
            </div>
            <div className="col-span-2 flex items-center text-sm text-gray-600">
              {item.type === 'folder' ? 'Folder' : item.name.split('.').pop()?.toUpperCase() || 'File'}
            </div>
            <div className="col-span-3 flex items-center text-sm text-gray-600">
              {formatDate(item.lastModified)}
            </div>
          </div>
        ))}
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
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Contents</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex-1 bg-white overflow-hidden relative ${isDragOver ? 'bg-blue-50' : ''}`}
      onClick={handleMainPaneClick}
      onContextMenu={handleMainPaneContextMenu}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-400 z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-lg font-semibold text-blue-700">Drop files here to upload</p>
          </div>
        </div>
      )}

      {uploadingFiles.length > 0 && (
        <div className="absolute top-4 right-4 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Uploading Files</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uploadingFiles.map((file, index) => (
              <div key={index} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="truncate flex-1 mr-2" title={file.name}>
                    {file.name}
                  </span>
                  <span className={`text-xs ${
                    file.status === 'completed' ? 'text-green-600' :
                    file.status === 'failed' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {file.status === 'completed' ? '✓' :
                     file.status === 'failed' ? '✗' :
                     `${Math.round(file.progress)}%`}
                  </span>
                </div>
                {file.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {file.status === 'failed' && file.error && (
                  <div className="text-red-500 text-xs mt-1 truncate" title={file.error}>
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
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">This folder is empty</h3>
              <p className="text-gray-600">Drag files here or use the toolbar to add content</p>
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
