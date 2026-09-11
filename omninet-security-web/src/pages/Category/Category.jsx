import React, { useState, useEffect } from 'react';
import { categoryAPI, notesAPI } from '../../services/api.js';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import toast, { Toaster } from 'react-hot-toast';

function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [isEditing, setIsEditing] = useState({
    id: null,
    name: '',
    description: '',
    isActive: true
  });
  const [originalEditData, setOriginalEditData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getCategory();
      if (response && (response.status === 'success' || response.success !== false)) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description' && value.length > 180) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await categoryAPI.createCategory(formData);
      if (response && (response.status === 'success' || response.success !== false)) {
        setFormData({ name: '', description: '', isActive: true });
        await fetchCategories();
        toast.success('Category added successfully!');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to add category. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!isEditing.name.trim() || !isEditing.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const hasChanges = originalEditData && (
      isEditing.name.trim() !== originalEditData.name ||
      isEditing.description.trim() !== originalEditData.description ||
      isEditing.isActive !== originalEditData.isActive
    );

    if (!hasChanges) {
      toast.error('No changes detected. Please modify the category before saving.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await categoryAPI.editCategory({
        id: isEditing.id,
        name: isEditing.name.trim(),
        description: isEditing.description.trim(),
        isActive: isEditing.isActive
      });

      if (response && (response.status === 'success' || response.success !== false)) {
        toast.success('Category updated successfully!');
        setIsEditing({ id: null, name: '', description: '', isActive: true });
        setOriginalEditData(null);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to update category';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (category) => {
    setIsEditing({
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive
    });
    setOriginalEditData({
      name: category.name,
      description: category.description,
      isActive: category.isActive
    });
  };

  const cancelEdit = () => {
    setIsEditing({ id: null, name: '', description: '', isActive: true });
    setOriginalEditData(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description' && value.length > 180) {
      return;
    }
    setIsEditing(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (id) => {
    try {
      setIsSubmitting(true);
      // Fetch notes to clean up associated notes
      const notesResponse = await notesAPI.getNotes(0, 1000);
      if (notesResponse && notesResponse.status === 'success') {
        const allNotesList = notesResponse.data?.notes || notesResponse.data || [];
        const notesToDelete = allNotesList.filter(note => ((note.category && note.category.id === id) || note.categoryId === id));
        for (const note of notesToDelete) {
          await notesAPI.deleteNote(note.id);
        }
      }

      await categoryAPI.deleteCategory(id);
      await fetchCategories();
      setDeleteConfirm(null);
      toast.success('Category and associated notes deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="w-full space-y-6">
      <Toaster position="top-right" />

      {/* Add Category Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <AddIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add New Category
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Organize your notes into distinct categories
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Work, Personal, Meeting Notes..."
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
              maxLength="30"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Description
              </label>
              <span className="text-xs text-gray-400">
                {formData.description.length}/180
              </span>
            </div>
            <textarea
              name="description"
              placeholder="Brief description of what belongs in this category..."
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
              required
              maxLength="180"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-500/20 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <AddIcon className="w-4 h-4" />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Categories Grid Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              All Categories
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              {categories.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-500">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-8">
            <FolderIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">No categories found</p>
            <p className="text-xs text-gray-400 mt-1">Create your first category using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-200 group relative flex flex-col justify-between"
              >
                {isEditing.id === category.id ? (
                  // Edit Mode
                  <form onSubmit={handleEdit} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={isEditing.name}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                        required
                        maxLength="30"
                      />
                    </div>
                    <div>
                      <textarea
                        name="description"
                        value={isEditing.description}
                        onChange={handleEditInputChange}
                        rows="2"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 outline-none resize-none"
                        required
                        maxLength="180"
                      />
                      <div className="text-[10px] text-gray-400 text-right mt-0.5">
                        {isEditing.description.length}/180
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  // View Mode
                  <>
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FolderIcon className="w-4 h-4" />
                          </span>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                            {category.name}
                          </h3>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(category)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                            title="Edit category"
                          >
                            <EditIcon style={{ fontSize: '1.1rem' }} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(category)}
                            className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Delete category"
                          >
                            <DeleteIcon style={{ fontSize: '1.1rem' }} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                        {category.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700/80 pt-3 flex items-center justify-between">
                      <span>Created</span>
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        {formatDate(category.createdDate)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                <DeleteIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Delete Category
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{deleteConfirm.name}"</span>? All notes associated with this category will also be deleted.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDelete(deleteConfirm.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm shadow-red-500/20 active:scale-95"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Category;