import React, { useState, useEffect } from 'react';
import { categoryAPI, notesAPI } from '../../services/api.js';
import {
  FolderIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
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
      <div className="card bg-base-100 border border-base-300 shadow-xs rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <PlusIcon className="w-5 h-5 stroke-2" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-base-content tracking-tight">
              Add New Category
            </h2>
            <p className="text-xs text-base-content/60">
              Organize your notes into distinct categories
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Work, Personal, Architecture..."
              value={formData.name}
              onChange={handleInputChange}
              className="input input-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl focus:border-primary"
              required
              maxLength="30"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                Description
              </label>
              <span className="text-xs text-base-content/40">
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
              className="textarea textarea-bordered w-full bg-base-200/50 text-base-content text-sm rounded-xl focus:border-primary resize-y"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
              className="btn btn-primary rounded-xl font-medium text-sm gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4 stroke-2" />
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
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-base-content tracking-tight">
              All Categories
            </h2>
            <span className="badge badge-sm badge-neutral border-base-300 font-medium">
              {categories.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="loading loading-spinner loading-md text-primary" />
            <p className="text-sm text-base-content/50">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-base-100 rounded-2xl border border-base-300 p-8">
            <FolderIcon className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
            <p className="text-base-content/80 font-medium">No categories found</p>
            <p className="text-xs text-base-content/50 mt-1">Create your first category using the form above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="card bg-base-100 border border-base-300 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 group flex flex-col justify-between"
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
                        className="input input-bordered input-sm w-full bg-base-200/50 text-base-content rounded-lg"
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
                        className="textarea textarea-bordered textarea-sm w-full bg-base-200/50 text-base-content rounded-lg resize-none"
                        required
                        maxLength="180"
                      />
                      <div className="text-[10px] text-base-content/40 text-right mt-0.5">
                        {isEditing.description.length}/180
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="btn btn-ghost btn-xs text-base-content/70 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary btn-xs rounded-lg font-medium"
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
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                            <FolderIcon className="w-4 h-4" />
                          </span>
                          <h3 className="text-sm font-semibold text-base-content truncate">
                            {category.name}
                          </h3>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(category)}
                            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary rounded-lg"
                            title="Edit category"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(category)}
                            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-error rounded-lg"
                            title="Delete category"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-base-content/70 line-clamp-3 mb-4 leading-relaxed">
                        {category.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="text-[11px] text-base-content/40 border-t border-base-200 pt-3 flex items-center justify-between">
                      <span>Created</span>
                      <span className="font-medium text-base-content/60">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="card bg-base-100 border border-base-300 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-error/10 text-error rounded-xl">
                <ExclamationTriangleIcon className="w-6 h-6 stroke-2" />
              </div>
              <div>
                <h3 className="text-base font-bold text-base-content">
                  Delete Category
                </h3>
                <p className="text-xs text-base-content/60">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-sm text-base-content/70 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-base-content">"{deleteConfirm.name}"</span>? All notes associated with this category will also be deleted.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-ghost btn-sm rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDelete(deleteConfirm.id)}
                className="btn btn-error btn-sm text-white rounded-xl font-medium"
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