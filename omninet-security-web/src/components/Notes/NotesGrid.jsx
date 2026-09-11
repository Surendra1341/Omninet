function NotesGrid({ notes, loading, onPageChange, pagination, currentView, onNoteClick }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            // hour: '2-digit',
            // minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading notes...</p>
            </div>
        );
    }



    if (notes.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No notes found create your first note</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                    <div 
                        key={note.id} 
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-600 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:bg-green-100 transition delay-10 duration-300 ease-in-out hover:scale-103"
                        onClick={() => onNoteClick(note)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {note.title}
                            </h3>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                {note.category.name}
                            </span>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                            {note.description}
                        </p>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Created: {formatDate(note.createdDate)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {pagination.totalPagesCount > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2 flex-wrap gap-2">
                    <button
                        onClick={() => onPageChange(pagination.pageNo - 1)}
                        disabled={pagination.first}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                        Previous
                    </button>

                    <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                        Page {pagination.pageNo + 1} of {pagination.totalPagesCount}
                    </span>

                    <span className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        ({(pagination.pageNo * pagination.pageSize) + 1}-{Math.min((pagination.pageNo + 1) * pagination.pageSize, pagination.totalNotesCount)} of {pagination.totalNotesCount})
                    </span>

                    <button
                        onClick={() => onPageChange(pagination.pageNo + 1)}
                        disabled={pagination.last}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                        Next
                    </button>
                </div>
            )}
        </>
    );
}

export default NotesGrid;
