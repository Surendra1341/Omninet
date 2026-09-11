import { useState, useRef, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DownloadIcon from '@mui/icons-material/Download';
import ToolTip from './ToolTip';
import CloseIcon from '@mui/icons-material/Close';

function NoteDetailModal({ 
    isOpen, 
    onClose, 
    note,
    categories, 
    onEdit,
    onDelete,
    onCopy,
    onDeletePermanently,
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
            setFilePreview(null);
        }
    }, [note]);

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
        onEdit(editNote, file);
        setIsEditing(false);
    };

    const handleClose = () => {
        setIsEditing(false);
        setFilePreview(null);
        setIsCategoryDropdownOpen(false);
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
        <div className={`fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4 transition-all duration-300 ease-in-out ${
            isOpen && note 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
        }`}>
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ease-in-out ${
                isOpen && note 
                    ? 'opacity-100 scale-100 translate-y-0' 
                    : 'opacity-0 scale-95 translate-y-4'
            }`}>
                {note && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {isEditing ? 'Edit Note' : 'Note Details'}
                            </h2>
                            <div className="flex items-center space-x-2">
                                {!isEditing && (
                                    <>
                                        {/* Edit Button */}
                                        <ToolTip className="" title="Edit" event={() => setIsEditing(true)}>
                                            <EditIcon/>
                                        </ToolTip>

                                        {/* Copy Button */}
                                        <ToolTip title="Copy" event={() => onCopy(note)}>
                                            <ContentCopyIcon />
                                        </ToolTip>

                                        {/* Delete Button */}
                                        {currentView == 'notes' && (
                                            <>
                                                <ToolTip title="Delete" event={() => onDelete(note)}>
                                                    <DeleteIcon />
                                                </ToolTip>
                                            </>
                                        )}

                                        {/* Download Button */}
                                        {note.fileDetails !== null && (
                                            <ToolTip title="Download" event={() => onDownload(note)}>
                                                <DownloadIcon />
                                            </ToolTip>
                                            
                                        )}


                                        {currentView === 'recycled' && (
                                            <>
                                                {/* Permanent Delete Button */}
                                                <ToolTip title="Delete Permanently" event={() => onDeletePermanently(note)}>
                                                    <DeleteForeverIcon />
                                                </ToolTip>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Close Button */}
                                <button
                                    onClick={handleClose}
                                    className="p-2 text-red-700 hover:text-red-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                {/* Title Field */}
                                <div>
                                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        id="edit-title"
                                        name="title"
                                        value={editNote.title}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-3 focus:ring-green-600 focus:border-green-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 ${
                                            editNote.title.trim() === '' ? 'border-gray-300' : 'border-green-600'
                                        }`}
                                        placeholder="Enter note title"
                                        required
                                    />
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category
                                    </label>
                                    <div className="relative" ref={categoryDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                            className={`w-full px-3 py-2 text-left border-1 rounded-lg focus:ring-3 focus:ring-green-600 focus:border-black dark:bg-gray-700 dark:border-gray-600 dark:text-white flex justify-between items-center ${editNote.category.name === 'Select Category' ? 'border-gray-300':'border-green-600'}`}
                                        >
                                            <span className={editNote.category.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                                                {editNote.category.name}
                                            </span>
                                            <svg className={`w-4 h-4 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {isCategoryDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto transition-all duration-200">
                                                {categories.map((category) => (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => handleCategorySelect(category)}
                                                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
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
                                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="edit-description"
                                        name="description"
                                        value={editNote.description}
                                        onChange={handleInputChange}
                                        rows={6}
                                        className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 resize-none ${editNote.description.trim() === '' ? 'border-gray-300' : 'border-green-600'}`}
                                        placeholder="Enter note description"
                                        required
                                    />
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Update File
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-gray-300"
                                            accept="*/*"
                                            required
                                        />
                                        
                                        {filePreview && (
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        {filePreview.type === 'image' ? (
                                                            <img 
                                                                src={filePreview.url} 
                                                                alt="Preview" 
                                                                className="w-10 h-10 object-cover rounded"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                {filePreview.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {formatFileSize(filePreview.size)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveFile}
                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
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
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{note.title}</h3>
                                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                        {note.category.name}
                                    </span>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                        {note.description}
                                    </p>
                                </div>

                                {note.fileDetails !== null && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File Detail</h4>
                                    <p onClick={() => onDownload(note)} className="w-fit hover:text-blue-700 cursor-pointer underline text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                        {note.fileDetails.displayFileName}
                                    </p>
                                </div>
                                    
                                )}


                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Created</p>
                                            <p className="text-gray-900 dark:text-white">{formatDate(note.createdDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
                                            <p className="text-gray-900 dark:text-white">{formatDate(note.updatedDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NoteDetailModal;