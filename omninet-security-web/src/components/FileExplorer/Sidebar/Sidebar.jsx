import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
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
          const folderChildren = (result.data.folders || []).map((folder) => {
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
              hasChildren: true,
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
    <div className="folder-tree-node text-xs">
      <div
        className={`group flex items-center py-1.5 px-2 cursor-pointer rounded-xl transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-base-content/75 hover:bg-base-200/80 hover:text-base-content'
        }`}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
      >
        <button
          type="button"
          className="flex items-center justify-center w-4 h-4 mr-1 text-base-content/40 hover:text-base-content"
          onClick={handleToggle}
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs text-primary" />
          ) : hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronRightIcon className="w-3.5 h-3.5" />
            )
          ) : (
            <span className="w-3" />
          )}
        </button>

        <button
          type="button"
          className="w-full flex items-center gap-2 truncate text-left"
          onClick={handleClick}
        >
          {isExpanded ? (
            <FolderOpenIcon className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <FolderIcon className="w-4 h-4 text-primary/80 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
      </div>

      {isExpanded && children.length > 0 && (
        <div className="space-y-0.5 mt-0.5">
          {children.map((child) => (
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
        const folders = (result.data.folders || []).map((folder) => ({
          name: folder.name,
          path: folder.name,
          hasChildren: true,
        }));
        setRootFolders(folders);
      }
    } catch (error) {
      console.error('Failed to load root folders:', error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: loadRootFolders,
  }));

  useEffect(() => {
    loadRootFolders();
  }, []);

  if (collapsed) {
    return <div className="w-0 overflow-hidden border-r border-base-300" />;
  }

  return (
    <aside className="w-60 bg-base-200/40 border-r border-base-300 flex flex-col shrink-0 select-none transition-colors">
      <div className="px-4 py-3 border-b border-base-300">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
          Folders
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {/* Root item */}
        <div
          className={`flex items-center py-1.5 px-2 rounded-xl cursor-pointer transition-colors text-xs ${
            currentPath === ''
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-base-content/75 hover:bg-base-200/80 hover:text-base-content'
          }`}
          onClick={() => onNavigate('')}
        >
          <span className="w-4 mr-1" />
          <FolderIcon className="w-4 h-4 text-primary/80 shrink-0 mr-2" />
          <span className="font-medium">Root</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-base-content/50 text-xs">
            <span className="loading loading-spinner loading-xs text-primary" />
            <span>Loading...</span>
          </div>
        ) : (
          rootFolders.map((folder) => (
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
    </aside>
  );
});

export default Sidebar;
