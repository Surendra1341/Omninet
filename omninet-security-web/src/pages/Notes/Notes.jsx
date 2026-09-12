import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoryAPI, notesAPI } from '../../services/api';
import AddNoteModal from '../../components/Notes/AddNoteModal';
import NoteDetailModal from '../../components/Notes/NoteDetailModal';
import CategoryDropdown from '../../components/Notes/CategoryDropdown';
import FloatingActionButton from '../../components/Notes/FloatingActionButton';
import NotesGrid from '../../components/Notes/NotesGrid';
import Category from '../Category/Category';
import storageClient from '../../services/storageClient';
import toast, { Toaster } from 'react-hot-toast';
import {
    DocumentTextIcon,
    TagIcon,
    TrashIcon,
    Squares2X2Icon,
    Bars3Icon,
    BookmarkIcon,
    StarIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

function Notes() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);
    const [notes, setNotes] = useState([]);
    const [pagination, setPagination] = useState({
        pageNo: 0,
        pageSize: 20,
        totalNotesCount: 0,
        totalPagesCount: 0,
        first: true,
        last: true
    });
    const [loading, setLoading] = useState(false);
    const [notesLoading, setNotesLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All categories');
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [isPageSizeDropdownOpen, setIsPageSizeDropdownOpen] = useState(false);
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentView, setCurrentView] = useState('notes'); // 'notes', 'recycled', 'deleted'
    const [selectedNote, setSelectedNote] = useState(null);
    const [isNoteDetailModalOpen, setIsNoteDetailModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'pinned' | 'favorites'
    const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);
    const pageSizeDropdownRef = useRef(null);


    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const selectCategory = (category) => {
        setSelectedCategory(category);
        setIsDropdownOpen(false);
        // Reset to first page and apply filter
        fetchAndFilterNotes(category, 0, pagination.pageSize);
    };

    const toggleFab = () => {
        setIsFabOpen(!isFabOpen);
    };

    const handleAddNote = () => {
        setIsAddNoteModalOpen(true);
        setIsFabOpen(false);
    };

    const handleRecycleBin = async () => {
        try {
            setNotesLoading(true);
            setCurrentView('recycled');
            const response = await notesAPI.getRecycledNotes();
            
            if (response.status === 'success') {
                // Handle different possible data structures
                let recycledNotes = Array.isArray(response.data) ? response.data : (response.data?.notes || []);

                // Calculate pagination for recycled notes
                const totalNotesCount = recycledNotes.length;
                const totalPagesCount = Math.ceil(totalNotesCount / pagination.pageSize);
                const startIndex = 0 * pagination.pageSize;
                const endIndex = startIndex + pagination.pageSize;
                const paginatedNotes = recycledNotes.slice(startIndex, endIndex);

                setNotes(paginatedNotes);
                setPagination({
                    pageNo: 0,
                    pageSize: pagination.pageSize,
                    totalNotesCount: totalNotesCount,
                    totalPagesCount: totalPagesCount,
                    first: true,
                    last: totalPagesCount <= 1
                });
            }
        } catch (error) {
            console.error('Error fetching recycled notes:', error);
            setNotes([]);
            setPagination({
                pageNo: 0,
                pageSize: pagination.pageSize,
                totalNotesCount: 0,
                totalPagesCount: 0,
                first: true,
                last: true
            });
        } finally {
            setNotesLoading(false);
            setIsFabOpen(false);
        }
    };

    const handleDeleteRecycled = async () => {
        try {
            const response = await notesAPI.emptyRecycleBin();
            handleRecycleBin();
            if(response.status === 'success') {
                toast.success('Recycle bin emptied successfully!', {
                    duration: 3000,
                    position: 'top-right',
                });
            }
        } catch (error) {
            console.error('Error emptying recycle bin:', error);
        }
        console.log('Show deleted notes');
        setIsFabOpen(false);
    };

    const handleShowAllNotes = () => {
        setSelectedCategory('All categories');
        setCurrentView('notes');
        fetchAndFilterNotes('All categories', 0, pagination.pageSize);
        setIsFabOpen(false);
    };

    const handlePageSizeChange = (newPageSize) => {
        setIsPageSizeDropdownOpen(false);
        fetchAndFilterNotes(selectedCategory, 0, newPageSize);
    };

    const togglePageSizeDropdown = () => {
        setIsPageSizeDropdownOpen(!isPageSizeDropdownOpen);
    };

    const handleCloseModal = () => {
        setIsAddNoteModalOpen(false);
    };

    const handleSubmitNote = async (noteData) => {
        if (!noteData.title.trim() || !noteData.description.trim() || !noteData.category.id) {
            toast.error('Please fill in all fields and select a category');
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await notesAPI.createNote({
                title: noteData.title.trim(),
                description: noteData.description.trim(),
                category: {
                    id: noteData.category.id,
                    name: noteData.category.name
                },
                file: noteData.file
            });

            if (response.status === 'success') {
                fetchAndFilterNotes(selectedCategory, 0, pagination.pageSize);
                toast.success('Note created successfully!', {
                    duration: 3000,
                    position: 'top-right',
                });
            }
        } catch (error) {
            console.error('Error creating note:', error);
            toast.error('Failed to create note. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNoteClick = (note) => {
        setSelectedNote(note);
        setIsNoteDetailModalOpen(true);
    };

    const handleCloseNoteDetail = () => {
        setIsNoteDetailModalOpen(false);
        setSelectedNote(null);
    };

    const handleEditNote = async (noteData, fileData, removeAttachment = false) => {
        if (!noteData.title.trim() || !noteData.description.trim() || !noteData.category.id) {
            toast.error('Please fill in all fields and select a category');
            return;
        }

        try {
            setIsSubmitting(true);
            
            const payload = {
                id: noteData.id,
                title: noteData.title.trim(),
                description: noteData.description.trim(),
                category: {
                    id: noteData.category.id,
                    name: noteData.category.name
                },
                removeAttachment: removeAttachment
            };

            if (fileData) {
                payload.file = fileData;
            }

            await notesAPI.updateNote(payload);

            if (currentView === 'recycled') {
                handleRecycleBin();
            } else {
                fetchAndFilterNotes(selectedCategory, pagination.pageNo, pagination.pageSize);
            }
            toast.success('Note updated successfully!', {
                duration: 3000,
                position: 'top-right',
            });
            handleCloseNoteDetail();
        } catch (error) {
            console.error('Error updating note:', error);
            toast.error('Failed to update note. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePin = async (note) => {
        try {
            const willPin = !note.isPinned;
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isPinned: willPin } : n));
            await notesAPI.togglePin(note.id);
            toast.success(willPin ? 'Note pinned to top' : 'Note unpinned');
        } catch (error) {
            console.error('Error toggling pin:', error);
            toast.error('Failed to update pin status');
            fetchAndFilterNotes(selectedCategory, pagination.pageNo, pagination.pageSize);
        }
    };

    const handleToggleFavorite = async (note) => {
        try {
            const willFav = !note.isFavorite;
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isFavorite: willFav } : n));
            await notesAPI.toggleFavorite(note.id);
            toast.success(willFav ? 'Marked as favorite' : 'Removed from favorites');
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('Failed to update favorite status');
            fetchAndFilterNotes(selectedCategory, pagination.pageNo, pagination.pageSize);
        }
    };

    const handleDeleteNote =  async (note) => {
        try {
            await notesAPI.deleteNote(note.id);
            fetchAndFilterNotes(selectedCategory, pagination.pageNo, pagination.pageSize);
            handleCloseNoteDetail();
            toast.success('Note deleted successfully!', {
                duration: 3000,
                position: 'top-right',
            });
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('Failed to delete note. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
        }
    };

    const handleDeleteForever = async (note) => {
        try {
            await notesAPI.deleteNotePermanently(note.id);
            setCurrentView('recycled');
            handleRecycleBin();
            handleCloseNoteDetail();
            toast.success('Note deleted successfully!', {
                duration: 3000,
                position: 'top-right',
            });
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('Failed to delete note. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
        }
    };

    const handleRestoreNote = async (note) => {
        try {
            await notesAPI.restoreNote(note.id);
            handleRecycleBin();
            handleCloseNoteDetail();
            toast.success('Note restored successfully!', {
                duration: 3000,
                position: 'top-right',
            });
        } catch (error) {
            console.error('Error restoring note:', error);
            toast.error('Failed to restore note. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
        }
    };

    const handleDownloadNote = async (note) => {
        try {
            const id = note.fileDetails?.id || note.id;
            const response = await notesAPI.downloadNote(id);
            
            const contentType = response.headers?.['content-type'] || 'application/octet-stream';
            
            const blob = new Blob([response.data || response], { type: contentType });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            
            // Use the display file name from note.fileDetails.displayFileName
            if (note.fileDetails?.displayFileName) {
                a.download = note.fileDetails.displayFileName;
            } else {
                // Fallback: Determine extension from content type
                let fileExtension = '';
                switch (contentType) {
                    case 'application/pdf':
                        fileExtension = '.pdf';
                        break;
                    case 'image/jpeg':
                        fileExtension = '.jpg';
                        break;
                    case 'image/png':
                        fileExtension = '.png';
                        break;
                    case 'text/plain':
                        fileExtension = '.txt';
                        break;
                    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                        fileExtension = '.docx';
                        break;
                    case 'application/msword':
                        fileExtension = '.doc';
                        break;
                    default:
                        fileExtension = '.file';
                }
                a.download = `${note.title || 'note_' + note.id}${fileExtension}`;
            }
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success('File downloaded successfully!', {
                duration: 3000,
                position: 'top-right',
            });
        } catch (error) {
            console.error('Error downloading note:', error);
            // Fallback directly to storageClient
            if (note?.fileDetails?.path) {
                try {
                    const fallbackRes = await storageClient.downloadFile(note.fileDetails.path);
                    if (fallbackRes?.success) {
                        toast.success('File downloaded successfully!', {
                            duration: 3000,
                            position: 'top-right',
                        });
                        return;
                    }
                } catch (fallbackErr) {
                    console.error('Fallback download error:', fallbackErr);
                }
            }
            toast.error('Failed to download note. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
        }
    };

    const handleCopyNote = async (note) => {
        try {
            // Copy the note description to clipboard
            await navigator.clipboard.writeText(note.description);
            
            toast.success('Note description copied to clipboard!', {
                duration: 3000,
                position: 'top-right',
            });
        } catch (error) {
            console.error('Error copying note description:', error);
            
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = note.description;
                document.body.appendChild(textArea);
                textArea.select();
                textArea.setSelectionRange(0, 99999); // For mobile devices
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                toast.success('Note description copied to clipboard!', {
                    duration: 3000,
                    position: 'top-right',
                });
            } catch (fallbackError) {
                console.error('Fallback copy failed:', fallbackError);
                toast.error('Failed to copy note description. Please try again.', {
                    duration: 4000,
                    position: 'top-right',
                });
            }
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            handleClearSearch();
            return;
        }

        try {
            setNotesLoading(true);
            setIsSearching(true);
            setCurrentView('search');
            
            const response = await notesAPI.searchNotes(searchQuery.trim(), 0, pagination.pageSize);
            
            if (response.status === 'success') {
                const searchNotes = response.data.notes || [];
                
                setSearchResults(searchNotes);
                setNotes(searchNotes);
                setPagination({
                    pageNo: 0,
                    pageSize: pagination.pageSize,
                    totalNotesCount: searchNotes.length,
                    totalPagesCount: Math.ceil(searchNotes.length / pagination.pageSize),
                    first: true,
                    last: searchNotes.length <= pagination.pageSize
                });
            }
        } catch (error) {
            console.error('Error searching notes:', error);
            toast.error('Failed to search notes. Please try again.', {
                duration: 4000,
                position: 'top-right',
            });
        } finally {
            setNotesLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        setSearchResults([]);
        setCurrentView('notes');
        fetchAndFilterNotes(selectedCategory, 0, pagination.pageSize);
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // Clear search if input is empty
        if (!value.trim() && isSearching) {
            handleClearSearch();
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        fetchCategories();
        fetchAndFilterNotes("All categories", 0, pagination.pageSize);
        const handleClickOutside = (event) => {
            if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target)) {
                setIsPageSizeDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Sync active tab with searchParams
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'categories') {
            setCurrentView('categories');
        } else if (tab === 'recycled') {
            handleRecycleBin();
        } else if (tab === 'notes') {
            setCurrentView('notes');
        }
    }, [searchParams]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await categoryAPI.getCategory();
            if (response.status === 'success') {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };





    const fetchAndFilterNotes = async (categoryName, pageNo = 0, pageSize = 20) => {
        try {
            setNotesLoading(true);
            // Fetch all notes without pagination for filtering
            const response = await notesAPI.getNotes(0, 1000); // Fetch a large number to get all notes
            if (response.status === 'success') {
                const allNotes = response.data.notes;
                
                let filteredNotes;
                if (categoryName === 'All categories') {
                    filteredNotes = allNotes;
                } else {
                    filteredNotes = allNotes.filter(note => (note.category?.name || note.categoryName) === categoryName);
                }

                // Calculate pagination for filtered notes
                const totalNotesCount = filteredNotes.length;
                const totalPagesCount = Math.ceil(totalNotesCount / pageSize);
                const startIndex = pageNo * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedNotes = filteredNotes.slice(startIndex, endIndex);

                setNotes(paginatedNotes);
                setPagination({
                    pageNo: pageNo,
                    pageSize: pageSize,
                    totalNotesCount: totalNotesCount,
                    totalPagesCount: totalPagesCount,
                    first: pageNo === 0,
                    last: pageNo >= totalPagesCount - 1 || totalPagesCount === 0
                });
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setNotesLoading(false);
        }
    };

    const handlePageChange = (newPageNo) => {
        if (isSearching) {
            // Handle search pagination
            handleSearchPagination(newPageNo);
        } else if (currentView === 'recycled') {
            // Handle pagination for recycled notes
            handleRecycleBinPagination(newPageNo);
        } else {
            fetchAndFilterNotes(selectedCategory, newPageNo, pagination.pageSize);
        }
    };

    const handleRecycleBinPagination = async (pageNo) => {
        try {
            setNotesLoading(true);
            const response = await notesAPI.getRecycledNotes();
            
            if (response.status === 'success') {
                let recycledNotes = Array.isArray(response.data) ? response.data : (response.data?.notes || []);
                
                const totalNotesCount = recycledNotes.length;
                const totalPagesCount = Math.ceil(totalNotesCount / pagination.pageSize);
                const startIndex = pageNo * pagination.pageSize;
                const endIndex = startIndex + pagination.pageSize;
                const paginatedNotes = recycledNotes.slice(startIndex, endIndex);

                setNotes(paginatedNotes);
                setPagination({
                    pageNo: pageNo,
                    pageSize: pagination.pageSize,
                    totalNotesCount: totalNotesCount,
                    totalPagesCount: totalPagesCount,
                    first: pageNo === 0,
                    last: pageNo >= totalPagesCount - 1 || totalPagesCount === 0
                });
            }
        } catch (error) {
            console.error('Error fetching recycled notes:', error);
        } finally {
            setNotesLoading(false);
        }
    };

    const handleSearchPagination = async (pageNo) => {
        if (!searchQuery.trim()) return;

        try {
            setNotesLoading(true);
            const response = await notesAPI.searchNotes(searchQuery.trim(), pageNo, pagination.pageSize);
            
            if (response.status === 'success') {
                const searchNotes = response.data.notes || [];
                const totalCount = response.data.totalElements || searchResults.length;
                
                setNotes(searchNotes);
                setPagination({
                    pageNo: pageNo,
                    pageSize: pagination.pageSize,
                    totalNotesCount: totalCount,
                    totalPagesCount: Math.ceil(totalCount / pagination.pageSize),
                    first: pageNo === 0,
                    last: pageNo >= Math.ceil(totalCount / pagination.pageSize) - 1 || totalCount === 0
                });
            }
        } catch (error) {
            console.error('Error searching notes:', error);
        } finally {
            setNotesLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-base-200 text-base-content py-6">
            {/* Toast Container */}
            <Toaster position="top-right" />

            {/* Top Header: Title, Segmented Tabs & Actions */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
                <div className="flex items-center justify-between border-b border-base-300 pb-5 flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-base-content">
                            {currentView === 'categories' ? 'Note Categories' : currentView === 'recycled' ? 'Recycle Bin' : 'Notes'}
                        </h1>
                        <p className="text-xs text-base-content/60 mt-1">
                            {currentView === 'categories' 
                                ? 'Organize and structure your notes into workspaces' 
                                : currentView === 'recycled' 
                                ? 'View and restore previously discarded notes' 
                                : 'Capture knowledge, ideas, and documentation seamlessly'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Segmented View Switcher */}
                        <div className="join bg-base-100 border border-base-300 rounded-xl p-0.5 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentView('notes');
                                    setSearchParams({});
                                    fetchCategories();
                                    fetchAndFilterNotes(selectedCategory, 0, pagination.pageSize);
                                }}
                                className={`btn btn-xs join-item border-0 text-xs font-medium gap-1.5 px-3 ${
                                    currentView === 'notes' || currentView === 'search'
                                        ? 'bg-base-200 text-primary font-semibold shadow-2xs'
                                        : 'btn-ghost text-base-content/65 hover:text-base-content'
                                }`}
                            >
                                <DocumentTextIcon className="w-3.5 h-3.5" />
                                <span>All Notes</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentView('categories');
                                    setSearchParams({ tab: 'categories' });
                                }}
                                className={`btn btn-xs join-item border-0 text-xs font-medium gap-1.5 px-3 ${
                                    currentView === 'categories'
                                        ? 'bg-base-200 text-primary font-semibold shadow-2xs'
                                        : 'btn-ghost text-base-content/65 hover:text-base-content'
                                }`}
                            >
                                <TagIcon className="w-3.5 h-3.5" />
                                <span>Categories</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    handleRecycleBin();
                                    setSearchParams({ tab: 'recycled' });
                                }}
                                className={`btn btn-xs join-item border-0 text-xs font-medium gap-1.5 px-3 ${
                                    currentView === 'recycled'
                                        ? 'bg-base-200 text-primary font-semibold shadow-2xs'
                                        : 'btn-ghost text-base-content/65 hover:text-base-content'
                                }`}
                            >
                                <TrashIcon className="w-3.5 h-3.5" />
                                <span>Recycle Bin</span>
                            </button>
                        </div>

                        {/* Top New Note Action */}
                        {currentView !== 'categories' && currentView !== 'recycled' && (
                            <button
                                type="button"
                                onClick={handleAddNote}
                                className="btn btn-primary btn-sm rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>New Note</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {currentView === 'categories' ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Category />
                </div>
            ) : (
                <>
                    {/* Centered Search Bar */}
                    <form className="max-w-7xl mx-auto px-4 sm:px-6 mb-4" onSubmit={handleSearch}>
                        <div className="flex justify-center">
                            <div className="join w-full max-w-2xl bg-base-100 border border-base-300 rounded-2xl shadow-xs overflow-hidden transition-all focus-within:border-primary/60">
                                <CategoryDropdown
                                    categories={categories}
                                    loading={loading}
                                    selectedCategory={selectedCategory}
                                    onCategorySelect={selectCategory}
                                    isOpen={isDropdownOpen}
                                    onToggle={() => {
                                        toggleDropdown();
                                        if (isSearching) {
                                            handleClearSearch();
                                        } else {
                                            setCurrentView('notes');
                                        }
                                    }}
                                />
                                <div className="relative flex-1 flex items-center">
                                    <input
                                        type="search"
                                        id="search-dropdown"
                                        className="input input-sm w-full border-0 focus:outline-none bg-transparent text-xs text-base-content placeholder:text-base-content/40 pl-3 pr-8"
                                        placeholder="Search notes by title or content..."
                                        value={searchQuery}
                                        onChange={handleSearchInputChange}
                                    />
                                    {isSearching && searchQuery && (
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content absolute right-2"
                                        >
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm join-item text-xs font-medium px-4"
                                >
                                    <MagnifyingGlassIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Search</span>
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Quick Filter Chips (No Emojis) */}
                    {currentView !== 'recycled' && !isSearching && (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                                type="button"
                                onClick={() => {
                                    setQuickFilter('all');
                                    setSelectedCategory('All categories');
                                    fetchAndFilterNotes('All categories', 0, pagination.pageSize);
                                }}
                                className={`btn btn-xs rounded-xl text-xs transition-all ${
                                    quickFilter === 'all' && selectedCategory === 'All categories'
                                        ? 'btn-primary shadow-xs'
                                        : 'btn-ghost bg-base-100 border border-base-300 text-base-content/70 hover:text-base-content'
                                }`}
                            >
                                All Notes
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickFilter(quickFilter === 'pinned' ? 'all' : 'pinned')}
                                className={`btn btn-xs rounded-xl text-xs gap-1 transition-all ${
                                    quickFilter === 'pinned'
                                        ? 'btn-primary shadow-xs'
                                        : 'btn-ghost bg-base-100 border border-base-300 text-base-content/70 hover:text-base-content'
                                }`}
                            >
                                <BookmarkIcon className="w-3 h-3" />
                                <span>Pinned</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuickFilter(quickFilter === 'favorites' ? 'all' : 'favorites')}
                                className={`btn btn-xs rounded-xl text-xs gap-1 transition-all ${
                                    quickFilter === 'favorites'
                                        ? 'btn-warning text-warning-content shadow-xs'
                                        : 'btn-ghost bg-base-100 border border-base-300 text-base-content/70 hover:text-base-content'
                                }`}
                            >
                                <StarIcon className="w-3 h-3 text-warning" />
                                <span>Favorites</span>
                            </button>
                            {categories.slice(0, 6).map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setQuickFilter('all');
                                        selectCategory(cat.name);
                                    }}
                                    className={`btn btn-xs rounded-xl text-xs transition-all ${
                                        selectedCategory === cat.name
                                            ? 'btn-primary shadow-xs'
                                            : 'btn-ghost bg-base-100 border border-base-300 text-base-content/70 hover:text-base-content'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Display Notes Section */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-base-content">
                                    {isSearching ? 'Search Results' : currentView === 'recycled' ? 'Recycled Notes' : 'All Notes'}
                                </h2>
                                {isSearching && (
                                    <span className="text-sm font-medium text-base-content/60">
                                        for "{searchQuery}"
                                    </span>
                                )}
                                <span className="badge badge-sm badge-neutral">
                                    {pagination.totalNotesCount}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {currentView === 'recycled' && notes.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setEmptyConfirmOpen(true)}
                                        className="btn btn-error btn-outline btn-xs rounded-xl gap-1"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                        <span>Empty Bin</span>
                                    </button>
                                )}

                                {/* View Mode Toggle (Grid / List) */}
                                <div className="join border border-base-300 rounded-xl bg-base-100 p-0.5 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        className={`btn btn-xs btn-square border-0 join-item ${
                                            viewMode === 'grid'
                                                ? 'bg-base-200 text-primary font-semibold shadow-2xs'
                                                : 'btn-ghost text-base-content/60'
                                        }`}
                                        title="Grid View"
                                    >
                                        <Squares2X2Icon className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={`btn btn-xs btn-square border-0 join-item ${
                                            viewMode === 'list'
                                                ? 'bg-base-200 text-primary font-semibold shadow-2xs'
                                                : 'btn-ghost text-base-content/60'
                                        }`}
                                        title="List View"
                                    >
                                        <Bars3Icon className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Page Size Selector */}
                                <div className="flex items-center gap-1.5 text-xs text-base-content/60">
                                    <span>Show:</span>
                                    <select
                                        value={pagination.pageSize}
                                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                        className="select select-bordered select-xs rounded-xl bg-base-100 border-base-300 text-xs font-semibold focus:outline-primary"
                                    >
                                        {[10, 20, 30, 50].map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <NotesGrid
                            notes={notes.filter(note => {
                                if (quickFilter === 'pinned') return note.isPinned;
                                if (quickFilter === 'favorites') return note.isFavorite;
                                return true;
                            })}
                            loading={notesLoading}
                            onPageChange={handlePageChange}
                            pagination={pagination}
                            currentView={currentView}
                            viewMode={viewMode}
                            onNoteClick={handleNoteClick}
                            onTogglePin={handleTogglePin}
                            onToggleFavorite={handleToggleFavorite}
                            onCopyNote={handleCopyNote}
                            onDeleteNote={(id) => handleDeleteNote({ id })}
                            onRestoreNote={(id) => handleRestoreNote({ id })}
                            onDeletePermanently={(id) => handleDeleteForever({ id })}
                            onDownload={handleDownloadNote}
                        />
                    </div>
                </>
            )}

            <AddNoteModal
                isOpen={isAddNoteModalOpen}
                onClose={handleCloseModal}
                categories={categories}
                onSubmit={handleSubmitNote}
                isSubmitting={isSubmitting}
            />

            <NoteDetailModal
                isOpen={isNoteDetailModalOpen}
                onClose={handleCloseNoteDetail}
                note={selectedNote}
                categories={categories}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onCopy={handleCopyNote}
                onDeletePermanently={handleDeleteForever}
                onRestore={handleRestoreNote}
                onDownload={handleDownloadNote}
                isSubmitting={isSubmitting}
                currentView={currentView}
            />

            {/* Empty Recycle Bin Modal */}
            {emptyConfirmOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                                <TrashIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Empty Recycle Bin?
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    All notes and attachments will be permanently deleted
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                            Are you sure you want to permanently delete all notes in the recycle bin? This action cannot be reversed.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setEmptyConfirmOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEmptyConfirmOpen(false);
                                    handleDeleteRecycled();
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm shadow-red-500/20 active:scale-95"
                            >
                                Empty Bin
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <FloatingActionButton
                isOpen={isFabOpen}
                onToggle={toggleFab}
                onAddNote={handleAddNote}
                onRecycleBin={handleRecycleBin}
                onDeleteRecycled={handleDeleteRecycled}
                onShowAllNotes={handleShowAllNotes}
            />
        </div>
    );
}

export default Notes;