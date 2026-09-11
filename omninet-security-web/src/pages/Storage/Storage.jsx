import React from 'react';
import FileExplorer from '../../components/FileExplorer/FileExplorer';

function Storage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <FileExplorer />
      </div>
    </div>
  );
}

export default Storage;