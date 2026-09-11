import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaFolder, FaFolderOpen, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { storageClient } from '../../../services/storageClient';

const FolderTreeNode = ({ node, currentPath, onNavigate, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  const isActive = currentPath === node.path;
  const hasChildren = node.hasChildren || children.length > 0;

  const handleToggle = async () => {
    if (!hasChildren) return;

    if (!isExpanded && children.length === 0) {
      setLoading(true);
      try {
        const result = await storageClient.getContents(node.path);
        if (result.success) {
          const folderChildren = (result.data.folders || []).map(folder => {
            // Fix path construction to avoid double slashes
            let folderPath;
            if (!node.path || node.path === '') {
              folderPath = folder.name;
            } else {
              const cleanNodePath = node.path.replace(/\/+$/, '');
              folderPath = `${cleanNodePath}/${folder.name}`;
            }
            
            return {
              name: folder.name,
              path: folderPath,
              hasChildren: true
            };
          });
          setChildren(folderChildren);
        }
      } catch (error) {
        console.error('Failed to load folder children:', error);
      } finally {
        setLoading(false);
      }
    }

    setIsExpanded(!isExpanded);
  };

  const handleClick = () => {
    onNavigate(node.path);
  };

  return (
    <div className="folder-tree-node">
      <div 
        className={`flex items-center py-1 px-2 cursor-pointer rounded hover:bg-gray-100 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
        <button
          className="flex items-center justify-center w-4 h-4 mr-2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
          onClick={handleToggle}
          // disabled={!hasChildren || loading}
        >
          {loading ? (
            <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          ) : hasChildren ? (
            isExpanded ? <FaChevronDown className="text-xs" /> : <FaChevronRight className="text-xs" />
          ) : (
            <span className="w-3" />
          )}
        </button>
        
        <button className="cursor-pointer w-full flex items-center gap-2 text-sm hover:text-blue-600" onClick={handleClick}>
          {isExpanded ? <FaFolderOpen className="text-yellow-500" /> : <FaFolder className="text-yellow-500" />}
          <span className="truncate">{node.name}</span>
        </button>
      </div>
      
      {isExpanded && children.length > 0 && (
        <div className="ml-2">
          {children.map(child => (
            <FolderTreeNode
              key={child.path}
              node={child}
              currentPath={currentPath}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = forwardRef(({ collapsed, currentPath, onNavigate }, ref) => {
  const [rootFolders, setRootFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRootFolders = async () => {
    setLoading(true);
    try {
      const result = await storageClient.getContents('');
      if (result.success) {
        const folders = (result.data.folders || []).map(folder => ({
          name: folder.name,
          path: folder.name,
          hasChildren: true
        }));
        setRootFolders(folders);
      }
    } catch (error) {
      console.error('Failed to load root folders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: loadRootFolders
  }));

  useEffect(() => {
    loadRootFolders();
  }, []);

  if (collapsed) {
    return <div className="w-0 overflow-hidden border-r border-gray-200" />;
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-semibold text-gray-900">Folders</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          <div className="folder-tree-node">
            <div 
              className={`flex items-center py-1 px-2 cursor-pointer rounded hover:bg-gray-100 ${currentPath === '' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              style={{ paddingLeft: '8px' }}
            >
              <span className="w-4 mr-2" />
              <button className="flex items-center gap-2 text-sm hover:text-blue-600" onClick={() => onNavigate('')}>
                <FaFolder className="text-yellow-500" />
                <span className="font-medium">Root</span>
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-3" />
              <span className="text-sm text-gray-500">Loading folders...</span>
            </div>
          ) : (
            rootFolders.map(folder => (
              <FolderTreeNode
                key={folder.path}
                node={folder}
                currentPath={currentPath}
                onNavigate={onNavigate}
                level={0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});

export default Sidebar;
