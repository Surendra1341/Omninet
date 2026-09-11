import React from 'react';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';

function NotesGrid({
    notes = [],
    loading = false,
    onPageChange,
    pagination = {},
    currentView = 'notes',
    viewMode = 'grid',
    onNoteClick,
    onTogglePin,
    onToggleFavorite,
    onCopyNote,
    onDeleteNote,
    onRestoreNote,
    onDeletePermanently,
    onDownload
}) {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading your notes...</p>
            </div>
        );
    }

    if (!notes || notes.length === 0) {
        return (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-8 shadow-xs">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <DescriptionIcon style={{ fontSize: '2rem' }} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {currentView === 'recycled' ? 'Recycle bin is empty' : 'No notes found'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    {currentView === 'recycled' 
                        ? 'Items moved to the recycle bin will appear here.'
                        : 'Create your first note using the + button below.'}
                </p>
            </div>
        );
    }

    // Separate pinned and unpinned notes if in standard notes view
    const isRecycled = currentView === 'recycled';
    const pinnedNotes = !isRecycled ? notes.filter(n => n.isPinned) : [];
    const otherNotes = !isRecycled ? notes.filter(n => !n.isPinned) : notes;
    const hasPinned = pinnedNotes.length > 0;

    const renderNoteCard = (note) => {
        const hasAttachment = Boolean(note.fileDetails);
        const fileName = note.fileDetails?.originalFileName || note.fileDetails?.displayFileName || 'Attachment';
        const fileSize = note.fileDetails?.fileSize ? formatFileSize(note.fileDetails.fileSize) : '';

        return (
            <div
                key={note.id}
                onClick={() => onNoteClick && onNoteClick(note)}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border transition-all duration-200 cursor-pointer group relative flex flex-col justify-between hover:shadow-md ${
                    note.isPinned
                        ? 'border-blue-300 dark:border-blue-600/60 bg-blue-50/20 dark:bg-blue-950/10'
                        : 'border-gray-200/80 dark:border-gray-700/80 hover:border-blue-300 dark:hover:border-blue-500/50'
                }`}
            >
                {/* Header: Title, Category & Top Quick Actions */}
                <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate flex-1" title={note.title}>
                            {note.title}
                        </h3>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* Pin status icon */}
                            {note.isPinned && (
                                <span className="text-blue-600 dark:text-blue-400" title="Pinned note">
                                    <PushPinIcon style={{ fontSize: '1rem' }} />
                                </span>
                            )}
                            {/* Favorite status icon */}
                            {note.isFavorite && (
                                <span className="text-amber-500" title="Favorite note">
                                    <StarIcon style={{ fontSize: '1rem' }} />
                                </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                                {note.category?.name || note.categoryName || 'General'}
                            </span>
                        </div>
                    </div>

                    {/* Note Description Preview */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed whitespace-pre-line">
                        {note.description || <span className="italic text-gray-400">No content</span>}
                    </p>

                    {/* Attachment Pill (if attached) */}
                    {hasAttachment && (
                        <div className="mb-4">
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onDownload) onDownload(note);
                                    else if (onNoteClick) onNoteClick(note);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-600 transition max-w-full"
                                title={`Attached: ${fileName} ${fileSize ? `(${fileSize})` : ''} - Click to download`}
                            >
                                <AttachFileIcon style={{ fontSize: '1rem' }} className="shrink-0 text-gray-500 dark:text-gray-400" />
                                <span className="truncate max-w-[170px]">{fileName}</span>
                                {fileSize && <span className="text-[10px] text-gray-400 shrink-0">({fileSize})</span>}
                                <DownloadIcon style={{ fontSize: '0.9rem' }} className="shrink-0 ml-0.5 opacity-60 hover:opacity-100" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer: Date & Quick Actions on Hover */}
                <div className="border-t border-gray-100 dark:border-gray-700/80 pt-3 flex items-center justify-between mt-auto">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {formatDate(note.createdDate || note.createdOn)}
                    </span>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        {!isRecycled ? (
                            <>
                                {onTogglePin && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTogglePin(note);
                                        }}
                                        className={`p-1.5 rounded-lg text-xs transition ${
                                            note.isPinned
                                                ? 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                                : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                        title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                                    >
                                        {note.isPinned ? (
                                            <PushPinIcon style={{ fontSize: '1.1rem' }} />
                                        ) : (
                                            <PushPinOutlinedIcon style={{ fontSize: '1.1rem' }} />
                                        )}
                                    </button>
                                )}

                                {onToggleFavorite && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFavorite(note);
                                        }}
                                        className={`p-1.5 rounded-lg text-xs transition ${
                                            note.isFavorite
                                                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                        title={note.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                                    >
                                        {note.isFavorite ? (
                                            <StarIcon style={{ fontSize: '1.1rem' }} />
                                        ) : (
                                            <StarBorderIcon style={{ fontSize: '1.1rem' }} />
                                        )}
                                    </button>
                                )}

                                {onCopyNote && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCopyNote(note);
                                        }}
                                        className="p-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                        title="Copy description"
                                    >
                                        <ContentCopyIcon style={{ fontSize: '1rem' }} />
                                    </button>
                                )}

                                {onDeleteNote && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteNote(note.id);
                                        }}
                                        className="p-1.5 rounded-lg text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                        title="Move to recycle bin"
                                    >
                                        <DeleteOutlineIcon style={{ fontSize: '1.1rem' }} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                {onRestoreNote && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRestoreNote(note.id);
                                        }}
                                        className="p-1.5 rounded-lg text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition flex items-center gap-1"
                                        title="Restore note"
                                    >
                                        <RestoreFromTrashIcon style={{ fontSize: '1.1rem' }} />
                                        <span className="text-[11px] font-semibold">Restore</span>
                                    </button>
                                )}

                                {onDeletePermanently && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeletePermanently(note.id);
                                        }}
                                        className="p-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                        title="Delete permanently"
                                    >
                                        <DeleteForeverIcon style={{ fontSize: '1.1rem' }} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderNoteRow = (note) => {
        const hasAttachment = Boolean(note.fileDetails);
        const fileName = note.fileDetails?.originalFileName || note.fileDetails?.displayFileName || 'Attachment';

        return (
            <div
                key={note.id}
                onClick={() => onNoteClick && onNoteClick(note)}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 border transition-all duration-150 cursor-pointer group flex items-center justify-between gap-4 hover:shadow-xs ${
                    note.isPinned
                        ? 'border-blue-300 dark:border-blue-600/60 bg-blue-50/15 dark:bg-blue-950/10'
                        : 'border-gray-200/80 dark:border-gray-700/80 hover:border-blue-300 dark:hover:border-blue-500/50'
                }`}
            >
                {/* Left side: Icon, title, excerpt */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 shrink-0">
                        <DescriptionIcon style={{ fontSize: '1.2rem' }} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {note.title}
                            </h4>
                            {note.isPinned && (
                                <PushPinIcon style={{ fontSize: '0.9rem' }} className="text-blue-600 dark:text-blue-400 shrink-0" />
                            )}
                            {note.isFavorite && (
                                <StarIcon style={{ fontSize: '0.9rem' }} className="text-amber-500 shrink-0" />
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shrink-0">
                                {note.category?.name || note.categoryName || 'General'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {note.description || 'No content'}
                        </p>
                    </div>
                </div>

                {/* Middle: Attachment & Date */}
                <div className="flex items-center gap-3 shrink-0">
                    {hasAttachment && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onDownload) onDownload(note);
                                else if (onNoteClick) onNoteClick(note);
                            }}
                            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-blue-600 transition"
                            title={`Attachment: ${fileName}`}
                        >
                            <AttachFileIcon style={{ fontSize: '0.9rem' }} />
                            <span className="truncate max-w-[120px]">{fileName}</span>
                        </div>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:block">
                        {formatDate(note.createdDate || note.createdOn)}
                    </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    {!isRecycled ? (
                        <>
                            {onTogglePin && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTogglePin(note);
                                    }}
                                    className={`p-1.5 rounded-lg text-xs transition ${
                                        note.isPinned ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
                                    }`}
                                    title={note.isPinned ? 'Unpin' : 'Pin'}
                                >
                                    <PushPinIcon style={{ fontSize: '1rem' }} />
                                </button>
                            )}
                            {onToggleFavorite && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(note);
                                    }}
                                    className={`p-1.5 rounded-lg text-xs transition ${
                                        note.isFavorite ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
                                    }`}
                                    title="Favorite"
                                >
                                    <StarIcon style={{ fontSize: '1rem' }} />
                                </button>
                            )}
                            {onDeleteNote && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteNote(note.id);
                                    }}
                                    className="p-1.5 rounded-lg text-xs text-gray-400 hover:text-red-600 transition"
                                    title="Delete"
                                >
                                    <DeleteOutlineIcon style={{ fontSize: '1.1rem' }} />
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            {onRestoreNote && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRestoreNote(note.id);
                                    }}
                                    className="p-1.5 rounded-lg text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition"
                                    title="Restore note"
                                >
                                    <RestoreFromTrashIcon style={{ fontSize: '1.1rem' }} />
                                </button>
                            )}
                            {onDeletePermanently && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeletePermanently(note.id);
                                    }}
                                    className="p-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                    title="Delete permanently"
                                >
                                    <DeleteForeverIcon style={{ fontSize: '1.1rem' }} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* If there are pinned notes, render them in a distinct section */}
            {hasPinned ? (
                <>
                    <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            <PushPinIcon style={{ fontSize: '1rem' }} />
                            <span>Pinned Notes ({pinnedNotes.length})</span>
                        </div>
                        {viewMode === 'grid' ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pinnedNotes.map(renderNoteCard)}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pinnedNotes.map(renderNoteRow)}
                            </div>
                        )}
                    </div>

                    {otherNotes.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                <DescriptionIcon style={{ fontSize: '1rem' }} />
                                <span>Other Notes ({otherNotes.length})</span>
                            </div>
                            {viewMode === 'grid' ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {otherNotes.map(renderNoteCard)}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {otherNotes.map(renderNoteRow)}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* Standard layout (all notes or recycled) */
                viewMode === 'grid' ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {otherNotes.map(renderNoteCard)}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {otherNotes.map(renderNoteRow)}
                    </div>
                )
            )}

            {/* Pagination Controls */}
            {pagination.totalPagesCount > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2 flex-wrap gap-2 pt-4">
                    <button
                        onClick={() => onPageChange(pagination.pageNo - 1)}
                        disabled={pagination.first}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                    >
                        Previous
                    </button>

                    <span className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Page {pagination.pageNo + 1} of {pagination.totalPagesCount}
                    </span>

                    <button
                        onClick={() => onPageChange(pagination.pageNo + 1)}
                        disabled={pagination.last}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default NotesGrid;
