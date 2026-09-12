import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import {
    BookmarkIcon,
    StarIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    ArrowUturnLeftIcon,
    PaperClipIcon,
    ArrowDownTrayIcon,
    DocumentTextIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import {
    StarIcon as StarIconSolid,
    BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';

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
    onDownload,
}) {
    const gridRef = useRef(null);

    useLayoutEffect(() => {
        if (!loading && notes.length > 0 && gridRef.current) {
            const ctx = gsap.context(() => {
                gsap.from('[data-note-item]', {
                    y: 16,
                    opacity: 0,
                    duration: 0.35,
                    stagger: 0.04,
                    ease: 'power2.out',
                });
            }, gridRef);
            return () => ctx.revert();
        }
    }, [loading, notes, viewMode]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
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
            <div className="text-center py-20 flex flex-col items-center gap-3">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="text-xs text-base-content/60 font-medium">Loading your notes...</p>
            </div>
        );
    }

    if (!notes || notes.length === 0) {
        return (
            <div className="text-center py-16 bg-base-100 rounded-2xl border border-base-300 p-8 shadow-xs max-w-lg mx-auto">
                <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/50">
                    <DocumentTextIcon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-base-content mb-1">
                    {currentView === 'recycled' ? 'Recycle bin is empty' : 'No notes found'}
                </h3>
                <p className="text-xs text-base-content/60 max-w-sm mx-auto">
                    {currentView === 'recycled'
                        ? 'Discarded notes will appear here. You can restore them anytime.'
                        : 'Create your first note using the "New Note" button above.'}
                </p>
            </div>
        );
    }

    const isRecycled = currentView === 'recycled';
    const pinnedNotes = !isRecycled ? notes.filter((n) => n.isPinned) : [];
    const otherNotes = !isRecycled ? notes.filter((n) => !n.isPinned) : notes;
    const hasPinned = pinnedNotes.length > 0;

    const renderNoteCard = (note) => {
        const hasAttachment = Boolean(note.fileDetails);
        const fileName = note.fileDetails?.originalFileName || note.fileDetails?.displayFileName || 'Attachment';
        const fileSize = note.fileDetails?.fileSize ? formatFileSize(note.fileDetails.fileSize) : '';

        return (
            <div
                key={note.id}
                data-note-item="true"
                onClick={() => onNoteClick && onNoteClick(note)}
                className={`bg-base-100 rounded-2xl p-5 border transition-all duration-200 cursor-pointer group relative flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-primary/40 select-none ${
                    note.isPinned
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-base-300'
                }`}
            >
                {/* Top: Title, Badges & Icons */}
                <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-bold text-base-content group-hover:text-primary transition-colors truncate flex-1" title={note.title}>
                            {note.title}
                        </h3>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {note.isPinned && (
                                <span className="text-primary" title="Pinned">
                                    <BookmarkIconSolid className="w-4 h-4" />
                                </span>
                            )}
                            {note.isFavorite && (
                                <span className="text-warning" title="Favorite">
                                    <StarIconSolid className="w-4 h-4" />
                                </span>
                            )}
                            <span className="badge badge-sm badge-outline border-base-300 text-base-content/70 font-medium">
                                {note.category?.name || note.categoryName || 'General'}
                            </span>
                        </div>
                    </div>

                    {/* Description Excerpt */}
                    <p className="text-xs text-base-content/70 line-clamp-3 mb-4 leading-relaxed whitespace-pre-line">
                        {note.description || <span className="italic text-base-content/40">No description</span>}
                    </p>

                    {/* Attachment Chip */}
                    {hasAttachment && (
                        <div className="mb-4">
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onDownload) onDownload(note);
                                    else if (onNoteClick) onNoteClick(note);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-base-200 border border-base-300 text-base-content/80 hover:text-primary hover:border-primary/40 transition max-w-full"
                                title={`Attachment: ${fileName} ${fileSize ? `(${fileSize})` : ''}`}
                            >
                                <PaperClipIcon className="w-3.5 h-3.5 shrink-0 text-base-content/50" />
                                <span className="truncate max-w-[170px]">{fileName}</span>
                                {fileSize && <span className="text-[10px] text-base-content/50 shrink-0">({fileSize})</span>}
                                <ArrowDownTrayIcon className="w-3.5 h-3.5 shrink-0 ml-0.5 opacity-60 hover:opacity-100" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom: Date & Actions */}
                <div className="border-t border-base-300/60 pt-3 flex items-center justify-between mt-auto">
                    <span className="text-[11px] text-base-content/50">
                        {formatDate(note.createdDate || note.createdOn)}
                    </span>

                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        {!isRecycled ? (
                            <>
                                {onTogglePin && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTogglePin(note);
                                        }}
                                        className={`btn btn-ghost btn-xs btn-square ${
                                            note.isPinned ? 'text-primary' : 'text-base-content/60 hover:text-base-content'
                                        }`}
                                        title={note.isPinned ? 'Unpin' : 'Pin'}
                                    >
                                        {note.isPinned ? (
                                            <BookmarkIconSolid className="w-3.5 h-3.5" />
                                        ) : (
                                            <BookmarkIcon className="w-3.5 h-3.5" />
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
                                        className={`btn btn-ghost btn-xs btn-square ${
                                            note.isFavorite ? 'text-warning' : 'text-base-content/60 hover:text-warning'
                                        }`}
                                        title={note.isFavorite ? 'Unfavorite' : 'Favorite'}
                                    >
                                        {note.isFavorite ? (
                                            <StarIconSolid className="w-3.5 h-3.5" />
                                        ) : (
                                            <StarIcon className="w-3.5 h-3.5" />
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
                                        className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content"
                                        title="Copy description"
                                    >
                                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {onDeleteNote && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteNote(note.id);
                                        }}
                                        className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-error"
                                        title="Move to recycle bin"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
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
                                        className="btn btn-ghost btn-xs text-success gap-1 px-2"
                                        title="Restore note"
                                    >
                                        <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
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
                                        className="btn btn-ghost btn-xs text-error gap-1 px-2"
                                        title="Delete permanently"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-semibold">Delete</span>
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
                data-note-item="true"
                onClick={() => onNoteClick && onNoteClick(note)}
                className={`bg-base-100 rounded-2xl p-4 border transition-all duration-150 cursor-pointer group flex items-center justify-between gap-4 shadow-2xs hover:shadow-xs hover:border-primary/40 select-none ${
                    note.isPinned ? 'border-primary/40 bg-primary/5' : 'border-base-300'
                }`}
            >
                {/* Left side: Icon, title, description */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-xl bg-base-200 text-base-content/60 shrink-0">
                        <DocumentTextIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors truncate">
                                {note.title}
                            </h4>
                            {note.isPinned && (
                                <BookmarkIconSolid className="w-3.5 h-3.5 text-primary shrink-0" />
                            )}
                            {note.isFavorite && (
                                <StarIconSolid className="w-3.5 h-3.5 text-warning shrink-0" />
                            )}
                            <span className="badge badge-xs badge-outline border-base-300 text-base-content/60 shrink-0">
                                {note.category?.name || note.categoryName || 'General'}
                            </span>
                        </div>
                        <p className="text-xs text-base-content/60 truncate">
                            {note.description || 'No description'}
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
                            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-base-200 border border-base-300 text-base-content/80 hover:text-primary hover:border-primary/40 transition"
                            title={`Attachment: ${fileName}`}
                        >
                            <PaperClipIcon className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{fileName}</span>
                        </div>
                    )}
                    <span className="text-xs text-base-content/50 hidden md:block">
                        {formatDate(note.createdDate || note.createdOn)}
                    </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                    {!isRecycled ? (
                        <>
                            {onTogglePin && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTogglePin(note);
                                    }}
                                    className={`btn btn-ghost btn-xs btn-square ${
                                        note.isPinned ? 'text-primary' : 'text-base-content/60 hover:text-base-content'
                                    }`}
                                    title={note.isPinned ? 'Unpin' : 'Pin'}
                                >
                                    {note.isPinned ? <BookmarkIconSolid className="w-3.5 h-3.5" /> : <BookmarkIcon className="w-3.5 h-3.5" />}
                                </button>
                            )}
                            {onToggleFavorite && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(note);
                                    }}
                                    className={`btn btn-ghost btn-xs btn-square ${
                                        note.isFavorite ? 'text-warning' : 'text-base-content/60 hover:text-warning'
                                    }`}
                                    title={note.isFavorite ? 'Unfavorite' : 'Favorite'}
                                >
                                    {note.isFavorite ? <StarIconSolid className="w-3.5 h-3.5" /> : <StarIcon className="w-3.5 h-3.5" />}
                                </button>
                            )}
                            {onDeleteNote && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteNote(note.id);
                                    }}
                                    className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-error"
                                    title="Delete"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
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
                                    className="btn btn-ghost btn-xs text-success gap-1 px-2"
                                    title="Restore note"
                                >
                                    <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
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
                                    className="btn btn-ghost btn-xs text-error gap-1 px-2"
                                    title="Delete permanently"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-semibold">Delete</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div ref={gridRef} className="space-y-6">
            {/* If there are pinned notes, render them in a distinct section */}
            {hasPinned ? (
                <>
                    <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                            <BookmarkIconSolid className="w-3.5 h-3.5" />
                            <span>Pinned Notes ({pinnedNotes.length})</span>
                        </div>
                        {viewMode === 'grid' ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-base-content/50">
                                <DocumentTextIcon className="w-3.5 h-3.5" />
                                <span>Other Notes ({otherNotes.length})</span>
                            </div>
                            {viewMode === 'grid' ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                viewMode === 'grid' ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                        className="btn btn-sm btn-ghost border border-base-300 rounded-xl text-xs disabled:opacity-40"
                    >
                        Previous
                    </button>

                    <span className="text-xs font-medium text-base-content/60 px-2">
                        Page {pagination.pageNo + 1} of {pagination.totalPagesCount}
                    </span>

                    <button
                        onClick={() => onPageChange(pagination.pageNo + 1)}
                        disabled={pagination.last}
                        className="btn btn-sm btn-ghost border border-base-300 rounded-xl text-xs disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default NotesGrid;
