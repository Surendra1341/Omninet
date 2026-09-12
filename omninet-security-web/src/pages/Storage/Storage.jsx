import React from 'react';
import FileExplorer from '../../components/FileExplorer/FileExplorer';

function Storage() {
  return (
    <div className="h-[calc(100vh-4rem)] p-3 sm:p-5 flex flex-col overflow-hidden max-w-[1600px] w-full mx-auto">
      <div className="flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm flex flex-col">
        <FileExplorer />
      </div>
    </div>
  );
}

export default Storage;