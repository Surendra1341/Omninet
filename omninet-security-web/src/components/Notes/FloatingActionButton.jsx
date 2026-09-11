function FloatingActionButton({ 
    isOpen, 
    onToggle, 
    onAddNote, 
    onRecycleBin, 
    onDeleteRecycled, 
    onShowAllNotes 
}) {
    return (
        <div className="fixed bottom-30 sm:bottom-6 right-6 z-50 p-3 rounded-2xl transition-all duration-200">
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 -z-10 transition-all duration-300"
                    onClick={() => onToggle()}
                />
            )}

            {/* Action Items */}
            <div className={`flex flex-col items-end space-y-3 mb-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 pr-1' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}>
                {/* Add Note */}
                <div className="flex items-center space-x-3">
                    <span className="bg-stone-600 text-white text-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
                        Add New Note
                    </span>
                    <button
                        onClick={onAddNote}
                        className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </div>

                {/* Recycle Bin */}
                <div className="flex items-center space-x-3">
                    <span className="bg-stone-600 text-white text-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
                        Recycle Bin
                    </span>
                    <button
                        onClick={onRecycleBin}
                        className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                {/* Deleted Notes */}
                <div className="flex items-center space-x-3">
                    <span className="bg-stone-600 text-white text-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
                        Empty Bin
                    </span>
                    <button
                        onClick={onDeleteRecycled}
                        className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                    </button>
                </div>

                {/* Show All Notes */}
                <div className="flex items-center space-x-3">
                    <span className="bg-stone-600 text-white text-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
                        Show All Notes
                    </span>
                    <button
                        onClick={onShowAllNotes}
                        className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main FAB Button */}
            <div className="flex justify-end">
                <button
                    onClick={onToggle}
                    className={`w-14 h-14 relative right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${isOpen ? 'rotate-90' : 'rotate-0'}`}
                >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default FloatingActionButton;
