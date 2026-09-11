import { useRef, useEffect } from 'react';

function CategoryDropdown({ 
    categories, 
    loading, 
    selectedCategory, 
    onCategorySelect, 
    isOpen, 
    onToggle 
}) {
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                if (isOpen) {
                    onToggle();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onToggle]);

    return (
        <div className="flex relative" ref={dropdownRef}>
            <label htmlFor="search-dropdown" className="mb-2 text-sm font-medium text-gray-900 sr-only  dark:text-white">Category Filter</label>
            <button
                id="dropdown-button"
                onClick={onToggle}
                className="shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600"
                type="button"
            >
                {selectedCategory} 
                <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                </svg>
            </button>
            <div id="dropdown" className={` w-fit min-w-35 absolute top-full left-0 z-50 ${isOpen ? 'block' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg shadow-lg dark:bg-gray-700 mt-1`}>
                <ul className="py-2 text-sm w-full text-gray-700 dark:text-gray-200" aria-labelledby="dropdown-button">
                    {loading ? (
                        <p className="text-center py-10 text-gray-500">
                            Loading categories...
                        </p>
                    ) : !categories ? (
                        <div className="text-center py-10 text-gray-500">
                            No categories found
                        </div>
                    ) : (
                        categories.map((category) => (
                            <li key={category.id} >
                                <button 
                                    type="button" 
                                    onClick={() => onCategorySelect(category.name)} 
                                    className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white text-left"
                                >
                                    {category.name}
                                </button>
                            </li>
                        ))
                    )}

                    {!categories ? null : (
                    <li>
                        <button 
                            type="button" 
                            onClick={() => onCategorySelect('All categories')} 
                            className="inline-flex w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white text-left"
                        >
                            All categories
                        </button>
                    </li>

                    )}
                </ul>
            </div>
        </div>
    );
}

export default CategoryDropdown;
