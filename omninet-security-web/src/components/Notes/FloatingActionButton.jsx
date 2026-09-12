function FloatingActionButton({ 
    isOpen, 
    onToggle, 
    onAddNote, 
    onRecycleBin, 
    onDeleteRecycled, 
    onShowAllNotes 
}) {
    return (
        <div className="fixed bottom-8 right-8 z-50 transition-all duration-200">
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-neutral/20 backdrop-blur-2xs -z-10 transition-all duration-300"
                    onClick={() => onToggle()}
                />
            )}

            {/* Action Items */}
            <div className={`flex flex-col items-end space-y-2.5 mb-3 transition-all duration-300 ${
                isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}>
                {/* Add Note */}
                <div className="flex items-center gap-2.5">
                    <span className="badge bg-base-100 border border-base-300 text-base-content text-xs font-medium py-2.5 px-3 shadow-md">
                        Add New Note
                    </span>
                    <button
                        onClick={onAddNote}
                        className="btn btn-circle btn-sm bg-base-100 border border-base-300 text-primary hover:bg-base-200 shadow-md"
                        title="Add Note"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </div>

                {/* Recycle Bin */}
                <div className="flex items-center gap-2.5">
                    <span className="badge bg-base-100 border border-base-300 text-base-content text-xs font-medium py-2.5 px-3 shadow-md">
                        Recycle Bin
                    </span>
                    <button
                        onClick={onRecycleBin}
                        className="btn btn-circle btn-sm bg-base-100 border border-base-300 text-base-content/70 hover:bg-base-200 shadow-md"
                        title="Recycle Bin"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                {/* Show All Notes */}
                <div className="flex items-center gap-2.5">
                    <span className="badge bg-base-100 border border-base-300 text-base-content text-xs font-medium py-2.5 px-3 shadow-md">
                        All Notes
                    </span>
                    <button
                        onClick={onShowAllNotes}
                        className="btn btn-circle btn-sm bg-base-100 border border-base-300 text-base-content/70 hover:bg-base-200 shadow-md"
                        title="Show All Notes"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main FAB Button */}
            <div className="flex justify-end">
                <button
                    onClick={onToggle}
                    className={`btn btn-primary btn-circle shadow-lg transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
                    aria-label="Toggle actions"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default FloatingActionButton;
