import { useState, useRef, useEffect } from 'react';
import {
    PencilSquareIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    ArrowPathIcon,
    XMarkIcon,
    DocumentIcon
} from '@heroicons/react/24/outline';
import ToolTip from './ToolTip';
import FileActionModal, { canPreviewFile } from '../FileExplorer/Modals/FileActionModal';
import storageClient from '../../services/storageClient';
import toast from 'react-hot-toast';

function NoteDetailModal({ 
    isOpen, 
    onClose, 
    note,
    categories, 
    onEdit,
    onDelete,
    onCopy,
    onDeletePermanently,
    onRestore,
    onDownload,
    isSubmitting ,
    currentView
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editNote, setEditNote] = useState({
        id: '',
        title: '',
        description: '',
        category: { id: null, name: 'Select Category' },
    });
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);
    const fileInputRef = useRef(null);
    const [fileActionItem, setFileActionItem] = useState(null);
    const [isFileActionWorking, setIsFileActionWorking] = useState(false);
    const [attachmentMode, setAttachmentMode] = useState('keep'); // 'keep', 'replace', 'remove', 'none'

    useEffect(() => {
        if (note) {
            setEditNote({
                id: note.id,
                title: note.title || '',
                description: note.description || '',
                category: { 
                    id: note.category?.id || null, 
                    name: note.category?.name || 'Select Category' 
                }
            });
            setFile(null);
            setFilePreview(null);
            setAttachmentMode(note.fileDetails ? 'keep' : 'none');
        }
    }, [note, isEditing]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setIsCategoryDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditNote(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFilePreview({
                        type: 'image',
                        url: e.target.result,
                        name: file.name,
                        size: file.size
                    });
                };
                reader.readAsDataURL(file);
            } else {
                setFilePreview({
                    type: 'file',
                    name: file.name,
                    size: file.size
                });
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleCategorySelect = (category) => {
        setEditNote(prev => ({
            ...prev,
            category: { id: category.id, name: category.name }
        }));
        setIsCategoryDropdownOpen(false);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        const fileToSend = attachmentMode === 'replace' ? file : null;
        const removeAttachment = attachmentMode === 'remove';
        onEdit(editNote, fileToSend, removeAttachment);
        setIsEditing(false);
    };

    const handlePreviewAttachment = async (fileDetails = note?.fileDetails) => {
        if (!fileDetails) return;
        setIsFileActionWorking(true);
        try {
            const filePath = fileDetails.path || fileDetails.displayFileName;
            const res = await storageClient.previewFile(filePath);
            if (!res?.success) {
                toast.error(res?.error || 'Unable to preview file');
            } else {
                setFileActionItem(null);
            }
        } catch (err) {
            console.error('Preview error:', err);
            toast.error('Preview failed');
        } finally {
            setIsFileActionWorking(false);
        }
    };

    const handleDownloadAttachment = async (fileDetails = note?.fileDetails) => {
        if (!fileDetails) return;
        setIsFileActionWorking(true);
        try {
            if (onDownload) {
                await onDownload(note);
            } else if (fileDetails.path) {
                const res = await storageClient.downloadFile(fileDetails.path);
                if (!res?.success) {
                    toast.error(res?.error || 'Download failed');
                }
            }
            setFileActionItem(null);
        } catch (err) {
            console.error('Download error:', err);
            toast.error('Download failed');
        } finally {
            setIsFileActionWorking(false);
        }
    };


    const handleClose = () => {
        setIsEditing(false);
        setFilePreview(null);
        setIsCategoryDropdownOpen(false);
        setFileActionItem(null);
        onClose();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[60] p-4 transition-all duration-300 ease-in-out ${
            isOpen && note 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
        }`}>
            <div className={`card bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ease-in-out ${
                isOpen && note 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 translate-y-4'
            }`}>
                {note && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-bold text-base-content tracking-tight">
                                {isEditing ? 'Edit Note' : 'Note Details'}
                            </h2>
                            <div className="flex items-center gap-1">
                                {!isEditing && (
                                    <>
                                        {/* Edit Button */}
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary rounded-lg"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>

                                        {/* Copy Button */}
                                        <button
                                            onClick={() => onCopy(note)}
                                            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content rounded-lg"
                                            title="Copy"
                                        >
                                            <DocumentDuplicateIcon className="w-4 h-4" />
                                        </button>

                                        {/* Delete Button */}
                                        {currentView === 'notes' && (
                                            <button
                                                onClick={() => onDelete(note)}
                                                className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-error rounded-lg"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}

                                        {/* Preview Attachment Button */}
                                        {note.fileDetails !== null && canPreviewFile(note.fileDetails.displayFileName) && (
                                            <button
                                                onClick={() => handlePreviewAttachment(note.fileDetails)}
                                                className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary rounded-lg"
                                                title="Preview Attachment"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                        )}

                                        {/* Download Button */}
                                        {note.fileDetails !== null && (
                                            <button
                                                onClick={() => onDownload ? onDownload(note) : handleDownloadAttachment(note.fileDetails)}
                                                className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary rounded-lg"
                                                title="Download"
                                            >
                                                <ArrowDownTrayIcon className="w-4 h-4" />
                                            </button>
                                        )}

                                        {currentView === 'recycled' && (
                                            <>
                                                {/* Restore Button */}
                                                {onRestore && (
                                                    <button
                                                        onClick={() => onRestore(note)}
                                                        className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-success rounded-lg"
                                                        title="Restore Note"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {/* Permanent Delete Button */}
                                                <button
                                                    onClick={() => onDeletePermanently(note)}
                                                    className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-error rounded-lg"
                                                    title="Delete Permanently"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Close Button */}
                                <button
                                    onClick={handleClose}
                                    className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content rounded-lg"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                {/* Title Field */}
                                <div>
                                    <label htmlFor="edit-title" className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        id="edit-title"
                                        name="title"
                                        value={editNote.title}
                                        onChange={handleInputChange}
                                        className="input input-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl focus:border-primary"
                                        placeholder="Enter note title"
                                        required
                                    />
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                                        Category
                                    </label>
                                    <div className="relative" ref={categoryDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                            className="input input-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl flex justify-between items-center cursor-pointer focus:border-primary"
                                        >
                                            <span className={editNote.category.id ? 'text-base-content' : 'text-base-content/40'}>
                                                {editNote.category.name}
                                            </span>
                                            <svg className={`w-4 h-4 text-base-content/50 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {isCategoryDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1.5">
                                                {categories.map((category) => (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => handleCategorySelect(category)}
                                                        className="w-full px-3 py-2 text-left rounded-lg text-xs hover:bg-base-200 text-base-content transition"
                                                    >
                                                        {category.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description Field */}
                                <div>
                                    <label htmlFor="edit-description" className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        id="edit-description"
                                        name="description"
                                        value={editNote.description}
                                        onChange={handleInputChange}
                                        rows={6}
                                        className="textarea textarea-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl focus:border-primary resize-none"
                                        placeholder="Enter note description"
                                        required
                                    />
                                </div>

                                {/* Attachment in Edit Mode */}
                                <div>
                                    <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                                        Attachment
                                    </label>

                                    {/* Case 1: Note has an existing file and user is keeping it */}
                                    {note.fileDetails && attachmentMode === 'keep' && (
                                        <div className="flex items-center justify-between p-3 rounded-xl border border-base-300 bg-base-200/40">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                    <DocumentIcon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-semibold text-base-content truncate">
                                                            {note.fileDetails.displayFileName}
                                                        </p>
                                                        <span className="badge badge-success badge-xs">
                                                            Current file
                                                        </span>
                                                    </div>
                                                    {note.fileDetails.fileSize ? (
                                                        <p className="text-[11px] text-base-content/50">
                                                            {formatFileSize(note.fileDetails.fileSize)}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ml-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAttachmentMode('replace');
                                                        setFile(null);
                                                        setFilePreview(null);
                                                    }}
                                                    className="btn btn-ghost btn-xs text-primary rounded-lg"
                                                >
                                                    Replace
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAttachmentMode('remove');
                                                        setFile(null);
                                                        setFilePreview(null);
                                                    }}
                                                    className="btn btn-ghost btn-xs text-error rounded-lg"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Case 2: User chose to remove existing attachment */}
                                    {note.fileDetails && attachmentMode === 'remove' && (
                                        <div className="flex items-center justify-between p-3 rounded-xl border border-error/30 bg-error/10 text-error">
                                            <span className="text-xs">Attachment will be removed when updated.</span>
                                            <button
                                                type="button"
                                                onClick={() => setAttachmentMode('keep')}
                                                className="btn btn-ghost btn-xs text-primary"
                                            >
                                                Undo (Keep file)
                                            </button>
                                        </div>
                                    )}

                                    {/* Case 3: Choosing a new file or replacing */}
                                    {(!note.fileDetails || attachmentMode === 'replace') && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    className="file-input file-input-bordered file-input-sm w-full bg-base-200/50 text-base-content rounded-xl"
                                                    accept="*/*"
                                                />
                                                {note.fileDetails && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAttachmentMode('keep');
                                                            setFile(null);
                                                            setFilePreview(null);
                                                        }}
                                                        className="btn btn-ghost btn-sm text-base-content/60 shrink-0"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>

                                            {filePreview && (
                                                <div className="bg-base-200/40 rounded-xl p-3 border border-base-300">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3 min-w-0">
                                                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                                                                <DocumentIcon className="w-5 h-5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-medium text-base-content truncate">
                                                                    {filePreview.name}
                                                                </p>
                                                                <p className="text-[11px] text-base-content/50">
                                                                    {formatFileSize(filePreview.size)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveFile}
                                                            className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10 rounded-lg"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end gap-2 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="btn btn-ghost btn-sm rounded-xl font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn btn-primary btn-sm rounded-xl font-medium"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs" />
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            'Update Note'
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                {/* Note Display */}
                                <div>
                                    <h3 className="text-xl font-bold text-base-content mb-2 tracking-tight">{note.title}</h3>
                                    <span className="badge badge-neutral badge-sm">
                                        {note.category?.name || note.categoryName || 'General'}
                                    </span>
                                </div>

                                <div className="border-t border-base-200 pt-4">
                                    <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">Description</h4>
                                    <p className="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                                        {note.description}
                                    </p>
                                </div>

                                {note.fileDetails !== null && (
                                    <div className="border-t border-base-200 pt-4">
                                        <h4 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">Attachment</h4>
                                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-base-300 bg-base-200/30 hover:border-primary/40 transition-colors">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 group"
                                                onClick={() => setFileActionItem({
                                                    name: note.fileDetails.displayFileName,
                                                    path: note.fileDetails.path,
                                                    size: note.fileDetails.fileSize
                                                })}
                                            >
                                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                                    <DocumentIcon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-base-content truncate group-hover:text-primary transition-colors">
                                                        {note.fileDetails.displayFileName}
                                                    </p>
                                                    {note.fileDetails.fileSize ? (
                                                        <p className="text-[11px] text-base-content/50">
                                                            {formatFileSize(note.fileDetails.fileSize)}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ml-3">
                                                {canPreviewFile(note.fileDetails.displayFileName) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePreviewAttachment(note.fileDetails)}
                                                        className="btn btn-ghost btn-xs text-primary gap-1"
                                                        title="Preview attachment"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Preview</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onDownload ? onDownload(note) : handleDownloadAttachment(note.fileDetails)}
                                                    className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content gap-1"
                                                    title="Download attachment"
                                                >
                                                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">Download</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-base-200 pt-4">
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-base-content/50">Created</p>
                                            <p className="font-medium text-base-content/80 mt-0.5">{formatDate(note.createdDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-base-content/50">Last Updated</p>
                                            <p className="font-medium text-base-content/80 mt-0.5">{formatDate(note.updatedDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <FileActionModal
                item={fileActionItem}
                isWorking={isFileActionWorking}
                onClose={() => !isFileActionWorking && setFileActionItem(null)}
                onPreview={() => handlePreviewAttachment(note?.fileDetails)}
                onDownload={() => handleDownloadAttachment(note?.fileDetails)}
            />
        </div>
    );
}

export default NoteDetailModal;