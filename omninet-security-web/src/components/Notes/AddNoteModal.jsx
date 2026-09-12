import { useState, useRef } from 'react';

function AddNoteModal({ 
    isOpen, 
    onClose, 
    categories, 
    onSubmit, 
    isSubmitting 
}) {
    const [newNote, setNewNote] = useState({
        title: '',
        description: '',
        category: { id: null, name: 'Select Category' },
        file: null
    });
    const [filePreview, setFilePreview] = useState(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewNote(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewNote(prev => ({
                ...prev,
                file: file
            }));
            
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
        setNewNote(prev => ({
            ...prev,
            file: null
        }));
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
        setNewNote(prev => ({
            ...prev,
            category: { id: category.id, name: category.name }
        }));
        setIsCategoryDropdownOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(newNote);
        handleClose();
    };

    const handleClose = () => {
        setNewNote({
            title: '',
            description: '',
            category: { id: null, name: 'Select Category' },
            file: null
        });
        setFilePreview(null);
        setIsCategoryDropdownOpen(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
            <div className="card bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-lg font-bold text-base-content tracking-tight">Add New Note</h2>
                        <button
                            onClick={handleClose}
                            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content rounded-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title Field */}
                        <div>
                            <label htmlFor="title" className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={newNote.title}
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
                                    <span className={newNote.category.id ? 'text-base-content' : 'text-base-content/40'}>
                                        {newNote.category.name}
                                    </span>
                                    <svg className={`w-4 h-4 text-base-content/50 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isCategoryDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1.5">
                                        {!categories || categories.length === 0 ? (
                                            <div className="text-center py-4 text-xs text-base-content/40">
                                                No categories found
                                            </div>
                                        ) : (
                                            categories.map((category) => (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    onClick={() => handleCategorySelect(category)}
                                                    className="w-full px-3 py-2 text-left rounded-lg text-xs hover:bg-base-200 text-base-content transition"
                                                >
                                                    {category.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description Field */}
                        <div>
                            <label htmlFor="description" className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={newNote.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="textarea textarea-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl focus:border-primary resize-none"
                                placeholder="Enter note description"
                                required
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
                                Attachment (Optional)
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="file-input file-input-bordered file-input-sm w-full bg-base-200/50 text-base-content rounded-xl"
                                    accept="*/*"
                                />
                                
                                {/* File Preview */}
                                {filePreview && (
                                    <div className="bg-base-200/40 rounded-xl p-3 border border-base-300">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 min-w-0">
                                                {filePreview.type === 'image' ? (
                                                    <img 
                                                        src={filePreview.url} 
                                                        alt="Preview" 
                                                        className="w-10 h-10 object-cover rounded-lg shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                )}
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
                                                className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10 rounded-lg shrink-0"
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
                        <div className="flex justify-end gap-2 pt-3">
                            <button
                                type="button"
                                onClick={handleClose}
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
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    'Create Note'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddNoteModal;
