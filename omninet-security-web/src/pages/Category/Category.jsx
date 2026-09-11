import React, { useState, useEffect } from 'react';
import { categoryAPI, notesAPI } from '../../services/api.js';
import { theme } from '../../theme.js';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
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
    id:null,
    name:'',
    description:'',
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
        await fetchCategories(); // Refresh the list
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

    // Check if any changes were made
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
    
    // Store original data for comparison
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
    
    if (name === 'description' && value.length > 100) {
      return;
    }
    
    setIsEditing(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (id) => {
    try {


      // First fetch all notes to find ones belonging to this category
      const notesResponse = await notesAPI.getNotes(0, 1000); // Fetch a large number to get all notes
      
      if (notesResponse.status === 'success') {
        const notesToDelete = allNotes.filter(note => ((note.category && note.category.id === id) || note.categoryId === id));
        
        // Delete each note that belongs to this category
        for (const note of notesToDelete) {
          await notesAPI.deleteNote(note.id);
        }
      }
      
      // Delete the category
      await categoryAPI.deleteCategory(id);

      await fetchCategories();
      setDeleteConfirm(null);
      toast.success('Category and associated notes deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category. Please try again.');
    }
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
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-stone-800">
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
        }}
      />

      {/* Add Category Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-5">
          Add New Category
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              name="name"
              placeholder="Category name..."
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 text-base border-3 border-gray-200 rounded-lg bg-white text-gray-800 outline-none transition-colors duration-200 focus:border-green-500 font-sans ${formData.name.length > 0 ? 'border-green-500' : 'border-gray-200'}`}
              required
              maxLength="20"
            />
          </div>
          
          <div className="mb-5">
            <textarea
              name="description"
              placeholder="Category description..."
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              required
              maxLength="100"
              className={`w-full px-4 py-3 text-base border-3 border-gray-200 rounded-lg bg-white text-gray-800 outline-none transition-colors duration-200 focus:border-green-500 font-sans resize-y ${formData.description.length > 0 ? 'border-green-500' : 'border-gray-200'}`}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {formData.description.length}/100 characters
            </div>
          </div>
          
          <button
            type="submit"
            // disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
            className="bg-green-700 hover:bg-green-600 hover:scale-105 ease-in-out text-white px-6 py-3 rounded-lg text-base font-semibold transition-all duration-200 font-sans"
          >
            {isSubmitting ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>

      {/* Categories Grid */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Categories
        </h1>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading categories...
          </div>
        ) : !categories ? (
          <div className="text-center py-10 text-gray-500">
            No categories found. Add your first category above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:translate-x-1 hover:-translate-y-1 relative group"
              >
                {isEditing.id === category.id ? (
                  // Edit mode
                  <form onSubmit={handleEdit} className="space-y-3">
                    <input
                      type="text"
                      name="name"
                      value={isEditing.name}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                      required
                      maxLength="20"
                    />
                    <textarea
                      name="description"
                      value={isEditing.description}
                      onChange={handleEditInputChange}
                      rows="2"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-green-500 outline-none resize-none"
                      required
                      maxLength="100"
                    />
                    <div className="text-xs text-gray-400 text-right">
                      {isEditing.description.length}/100 characters
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  // View mode
                  <>
                    <div className="absolute top-3 right-3 flex gap-1 transition-opacity duration-200">
                      <button
                        onClick={() => startEdit(category)}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-lg text-xs font-semibold transition-all duration-300 ease-out hover:scale-110 cursor-pointer"
                        title="Edit category"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category)}
                        className="bg-red-600 hover:bg-red-500 text-white p-1 mx-2 rounded-lg text-xs font-semibold transition-all duration-300 ease-out hover:scale-110 cursor-pointer"
                        title="Delete category"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2 pr-16">
                      {category.name}
                    </h3>
                    
                    <p className="break-all text-sm text-gray-600 leading-relaxed mb-3">
                      {category.description || 'No description'}
                    </p>
                    
                    <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                      Created: {formatDate(category.createdDate)}
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
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Delete Category
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{deleteConfirm.name}</strong>"? This action cannot be undone. All notes associated with this category will also be deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Category;