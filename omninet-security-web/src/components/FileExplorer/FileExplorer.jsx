import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import Toolbar from './Toolbar/Toolbar';
import Sidebar from './Sidebar/Sidebar';
import MainPane from './MainPane/MainPane';
import StatusBar from './StatusBar/StatusBar';
import ContextMenu from './ContextMenu/ContextMenu';
import ProgressModal from './Modals/ProgressModal';
import CreateFolderModal from './Modals/CreateFolderModal';
import RenameModal from './Modals/RenameModal';
import DeleteConfirmModal from './Modals/DeleteConfirmModal';
import { storageClient } from '../../services/storageClient';

const FileExplorer = () => {
  // Navigation state
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Content state
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);
  
  // View state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Modal state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressInfo, setProgressInfo] = useState({});
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null });
  
  // Refs
  const fileInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const dragCounter = useRef(0);

  // Load folder contents
  const loadContents = useCallback(async (path = currentPath) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await storageClient.getContents(path);
      if (result.success) {
        setFiles(result.data.files || []);
        setFolders(result.data.folders || []);
        setSelectedItems([]);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      const errorMsg = 'Failed to load folder contents';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // Navigation functions
  const navigateTo = useCallback((path) => {
    if (path !== currentPath) {
      const newHistory = pathHistory.slice(0, historyIndex + 1);
      newHistory.push(path);
      setPathHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCurrentPath(path);
    }
  }, [currentPath, pathHistory, historyIndex]);

  const navigateBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
    }
  }, [historyIndex, pathHistory]);

  const navigateForward = useCallback(() => {
    if (historyIndex < pathHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
    }
  }, [historyIndex, pathHistory]);

  const navigateUp = useCallback(() => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      navigateTo(parentPath);
    }
  }, [currentPath, navigateTo]);

  // File operations
  const handleCreateFolder = async (folderName) => {
    // Validate folder name
    if (!folderName || !folderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    const trimmedName = folderName.trim();
    
    // Basic validation for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      toast.error('Folder name contains invalid characters');
      return;
    }
    
    try {
      // Use createUniqueFolder which handles the path construction correctly
      const result = await storageClient.createUniqueFolder(currentPath, trimmedName);
      
      if (result.success) {
        toast.success(result.message || `Folder "${trimmedName}" created successfully`);
        await loadContents();
        // Refresh sidebar to show new folder
        sidebarRef.current?.refresh();
        setShowCreateFolder(false);
      } else {
        // Handle validation errors from backend
        if (result.validationErrors) {
          const errorMessages = Object.values(result.validationErrors).flat();
          errorMessages.forEach(msg => toast.error(msg));
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error('Create folder error:', error);
      toast.error('Failed to create folder');
    }
  };

  // Drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    console.log('Drag enter, counter:', dragCounter.current);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    console.log('Drag leave, counter:', dragCounter.current);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Set the drop effect to copy
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    
    console.log('Files dropped:', e.dataTransfer.files);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      console.log('Processing', droppedFiles.length, 'dropped files');
      await handleUpload(droppedFiles);
    } else {
      console.log('No files in drop event');
    }
  };

  const handleUpload = async (files) => {
    if (!files.length) {
      console.log('No files to upload');
      return;
    }

    console.log('Starting upload of', files.length, 'files to path:', currentPath);

    setShowProgress(true);
    setProgressInfo({
      title: 'Uploading Files',
      current: 0,
      total: files.length,
      currentItem: ''
    });

    let successCount = 0;
    let errorCount = 0;
    const warnings = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading file ${i + 1}/${files.length}:`, file.name);
        
        setProgressInfo(prev => ({
          ...prev,
          current: i + 1,
          currentItem: file.name
        }));

        const result = await storageClient.uploadFile(file, currentPath, (progress) => {
          setProgressInfo(prev => ({
            ...prev,
            progress
          }));
        });

        if (result.success) {
          successCount++;
          console.log(`Successfully uploaded: ${file.name}`);
          
          // Check if file name was sanitized
          if (result.data.nameChanged) {
            warnings.push(`"${result.data.originalFileName}" was renamed to "${result.data.sanitizedFileName}" to meet file name requirements`);
          }
        } else {
          errorCount++;
          console.error(`Failed to upload ${file.name}:`, result.error);
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
        }
      }

      // Show success message
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
        await loadContents();
        // Refresh sidebar in case folders were uploaded
        sidebarRef.current?.refresh();
      }
      
      // Show warnings for sanitized file names
      warnings.forEach(warning => {
        toast.warning(warning, { autoClose: 7000 });
      });
      
      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} file(s)`);
      }
    } catch (error) {
      console.error('Upload operation failed:', error);
      toast.error('Upload operation failed');
    } finally {
      setShowProgress(false);
    }
  };

  const handleDownload = async (item) => {
    try {
      console.log('Downloading item:', item);
      const result = await storageClient.downloadFile(item.path);
      if (result.success) {
        toast.success(`Downloaded ${item.name}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  };

  const handleRename = async (newName) => {
    const selectedItem = selectedItems[0];
    if (!selectedItem) return;

    const oldPath = selectedItem.path;
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');

    setShowProgress(true);
    setProgressInfo({
      title: `Renaming ${selectedItem.name}`,
      step: 'starting',
      progress: 0
    });

    try {
      const result = selectedItem.type === 'folder'
        ? await storageClient.renameFolder(oldPath, newPath, setProgressInfo)
        : await storageClient.renameFile(oldPath, newPath, setProgressInfo);

      if (result.success) {
        toast.success(`Renamed to "${newName}"`);
        await loadContents();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Rename operation failed');
    } finally {
      setShowProgress(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItems.length) return;

    console.log('Deleting items:', selectedItems.map(item => ({ name: item.name, path: item.path, type: item.type })));

    setShowProgress(true);
    setProgressInfo({
      title: 'Deleting Items',
      current: 0,
      total: selectedItems.length
    });

    try {
      const result = await storageClient.batchDelete(selectedItems, setProgressInfo);
      
      if (result.success) {
        toast.success(`Successfully deleted ${result.data.successful} item(s)`);
      } else {
        toast.error(`Deleted ${result.data.successful} of ${result.data.total} items`);
        result.data.failedItems.forEach(failed => {
          toast.error(`Failed to delete ${failed.item.name}: ${failed.error}`);
        });
      }
      
      await loadContents();
      // Refresh sidebar to reflect deleted folders
      sidebarRef.current?.refresh();
    } catch (error) {
      toast.error('Delete operation failed');
    } finally {
      setShowProgress(false);
    }
  };

  // Selection functions
  const handleItemSelect = (item, index, event) => {
    // Handle case where item is null (clicked on empty space)
    if (!item) {
      setSelectedItems([]);
      setLastSelectedIndex(-1);
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedItems(prev => {
        const isSelected = prev.find(selected => selected.path === item.path || selected.name === item.name);
        if (isSelected) {
          return prev.filter(selected => selected.path !== item.path && selected.name !== item.name);
        } else {
          return [...prev, { ...item, path: item.path || item.name }];
        }
      });
    } else if (event.shiftKey && lastSelectedIndex !== -1) {
      // Range select with Shift
      const allItems = [...folders, ...files];
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeItems = allItems.slice(start, end + 1).map(rangeItem => {
        // Fix path construction to avoid double slashes
        let itemPath;
        if (!currentPath || currentPath === '') {
          itemPath = rangeItem.name;
        } else {
          const cleanCurrentPath = currentPath.replace(/\/+$/, '');
          itemPath = rangeItem.path || `${cleanCurrentPath}/${rangeItem.name}`;
        }
        
        return {
          ...rangeItem,
          path: itemPath,
          type: rangeItem.type || (folders.includes(rangeItem) ? 'folder' : 'file')
        };
      });
      setSelectedItems(rangeItems);
    } else {
      // Single select - ensure proper path and type
      let itemPath;
      if (!currentPath || currentPath === '') {
        itemPath = item.name;
      } else {
        const cleanCurrentPath = currentPath.replace(/\/+$/, '');
        itemPath = item.path || `${cleanCurrentPath}/${item.name}`;
      }
      
      const selectedItem = {
        ...item,
        path: itemPath,
        type: item.type || (folders.includes(item) ? 'folder' : 'file')
      };
      setSelectedItems([selectedItem]);
    }
    setLastSelectedIndex(index);
  };

  const handleItemDoubleClick = (item) => {
    const itemType = item.type || (folders.includes(item) ? 'folder' : 'file');
    if (itemType === 'folder') {
      // Fix path construction to avoid double slashes
      let folderPath;
      if (!currentPath || currentPath === '') {
        folderPath = item.name;
      } else {
        const cleanCurrentPath = currentPath.replace(/\/+$/, '');
        folderPath = item.path || `${cleanCurrentPath}/${item.name}`;
      }
      navigateTo(folderPath);
    } else {
      // Fix path construction to avoid double slashes
      let filePath;
      if (!currentPath || currentPath === '') {
        filePath = item.name;
      } else {
        const cleanCurrentPath = currentPath.replace(/\/+$/, '');
        filePath = item.path || `${cleanCurrentPath}/${item.name}`;
      }
      handleDownload({ ...item, path: filePath });
    }
  };

  // Context menu
  const handleContextMenu = (event, item = null) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      item
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, item: null });
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event) => {
    if (event.target.tagName === 'INPUT') return;

    switch (event.key) {
      case 'Delete':
        if (selectedItems.length > 0) {
          setShowDeleteConfirm(true);
        }
        break;
      case 'F2':
        if (selectedItems.length === 1) {
          setShowRename(true);
        }
        break;
      case 'F5':
        loadContents();
        break;
      case 'Escape':
        setSelectedItems([]);
        closeContextMenu();
        break;
      case 'Enter':
        if (selectedItems.length === 1) {
          handleItemDoubleClick(selectedItems[0]);
        }
        break;
      default:
        break;
    }
  }, [selectedItems, loadContents]);

  // Filter and sort items
  const filteredAndSortedItems = React.useMemo(() => {
    // Combine folders and files with proper structure
    const foldersWithType = folders.map((folder, index) => {
      // Fix path construction to avoid double slashes
      let folderPath;
      if (!currentPath || currentPath === '') {
        folderPath = folder.name;
      } else {
        const cleanCurrentPath = currentPath.replace(/\/+$/, '');
        folderPath = folder.path || `${cleanCurrentPath}/${folder.name}`;
      }
      
      return {
        ...folder,
        type: 'folder',
        path: folderPath,
        id: `folder-${index}`,
        size: folder.size || 0,
        lastModified: folder.lastModified || folder.modifiedDate || null
      };
    });

    const filesWithType = files.map((file, index) => {
      // Fix path construction to avoid double slashes
      let filePath;
      if (!currentPath || currentPath === '') {
        filePath = file.name;
      } else {
        const cleanCurrentPath = currentPath.replace(/\/+$/, '');
        filePath = file.path || `${cleanCurrentPath}/${file.name}`;
      }
      
      return {
        ...file,
        type: 'file',
        path: filePath,
        id: `file-${index}`,
        size: file.size || 0,
        lastModified: file.lastModified || file.modifiedDate || null
      };
    });

    const allItems = [...foldersWithType, ...filesWithType];
    
    // Filter by search query
    let filtered = allItems;
    if (searchQuery) {
      filtered = allItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort items
    return filtered.sort((a, b) => {
      // Always show folders first
      if (a.type !== b.type) {
        if (a.type === 'folder') return -1;
        if (b.type === 'folder') return 1;
      }

      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'modified':
          aValue = new Date(a.lastModified || 0);
          bValue = new Date(b.lastModified || 0);
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [folders, files, searchQuery, sortBy, sortOrder, currentPath]);

  // Effects
  useEffect(() => {
    loadContents();
  }, [currentPath, loadContents]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', closeContextMenu);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', closeContextMenu);
    };
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans" onClick={closeContextMenu}>
      <Toolbar
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < pathHistory.length - 1}
        canGoUp={currentPath !== ''}
        currentPath={currentPath}
        viewMode={viewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchQuery={searchQuery}
        sidebarCollapsed={sidebarCollapsed}
        onNavigateBack={navigateBack}
        onNavigateForward={navigateForward}
        onNavigateUp={navigateUp}
        onNavigateTo={navigateTo}
        onViewModeChange={setViewMode}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCreateFolder={() => setShowCreateFolder(true)}
        onUpload={() => fileInputRef.current?.click()}
        onRefresh={() => loadContents()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          ref={sidebarRef}
          collapsed={sidebarCollapsed}
          currentPath={currentPath}
          onNavigate={navigateTo}
        />

        <MainPane
          items={filteredAndSortedItems}
          selectedItems={selectedItems}
          viewMode={viewMode}
          loading={loading}
          error={error}
          currentPath={currentPath}
          onItemSelect={handleItemSelect}
          onItemDoubleClick={handleItemDoubleClick}
          onContextMenu={handleContextMenu}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onFileUpload={(uploadData) => {
            // Optional: Handle individual file upload completion
            console.log('File uploaded:', uploadData.fileName);
          }}
          onRefresh={() => {
            loadContents();
            // Also refresh sidebar to show any new folders
            sidebarRef.current?.refresh();
          }}
        />
      </div>

      <StatusBar
        totalItems={folders.length + files.length}
        selectedCount={selectedItems.length}
        currentPath={currentPath}
      />

      {contextMenu.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          selectedItems={selectedItems}
          onClose={closeContextMenu}
          onCreateFolder={() => setShowCreateFolder(true)}
          onUpload={() => fileInputRef.current?.click()}
          onDownload={handleDownload}
          onRename={() => setShowRename(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onRefresh={() => loadContents()}
        />
      )}

      {/* Modals */}
      {showCreateFolder && (
        <CreateFolderModal
          onConfirm={handleCreateFolder}
          onCancel={() => setShowCreateFolder(false)}
        />
      )}

      {showRename && selectedItems.length === 1 && (
        <RenameModal
          currentName={selectedItems[0].name}
          onConfirm={handleRename}
          onCancel={() => setShowRename(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          items={selectedItems}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            handleDelete();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showProgress && (
        <ProgressModal
          title={progressInfo.title}
          progress={progressInfo.progress}
          current={progressInfo.current}
          total={progressInfo.total}
          currentItem={progressInfo.currentItem}
          step={progressInfo.step}
          onCancel={() => setShowProgress(false)}
        />
      )}

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0) {
            handleUpload(files);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default FileExplorer;
