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
        <div className="relative" ref={dropdownRef}>
            <button
                id="dropdown-button"
                onClick={onToggle}
                className="btn btn-sm join-item bg-base-200/90 border-base-300 text-xs font-semibold text-base-content hover:bg-base-300 shrink-0 gap-2 h-10 px-3.5"
                type="button"
            >
                <span className="truncate max-w-[120px]">{selectedCategory}</span>
                <svg className="w-2.5 h-2.5 opacity-60 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                </svg>
            </button>
            <div id="dropdown" className={`w-48 absolute top-full left-0 z-50 ${isOpen ? 'block' : 'hidden'} bg-base-100 border border-base-300 rounded-xl shadow-xl p-1 mt-1.5 animate-fadeIn`}>
                <ul className="text-xs text-base-content space-y-0.5" aria-labelledby="dropdown-button">
                    {loading ? (
                        <li className="text-center py-4 text-base-content/50">
                            Loading categories...
                        </li>
                    ) : !categories ? (
                        <li className="text-center py-4 text-base-content/50">
                            No categories found
                        </li>
                    ) : (
                        categories.map((category) => (
                            <li key={category.id}>
                                <button 
                                    type="button" 
                                    onClick={() => onCategorySelect(category.name)} 
                                    className={`w-full px-3 py-1.5 rounded-lg text-left transition-colors ${
                                        selectedCategory === category.name
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'hover:bg-base-200 text-base-content'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            </li>
                        ))
                    )}

                    {categories && (
                        <li className="border-t border-base-300/60 pt-1 mt-1">
                            <button 
                                type="button" 
                                onClick={() => onCategorySelect('All categories')} 
                                className={`w-full px-3 py-1.5 rounded-lg text-left transition-colors ${
                                    selectedCategory === 'All categories'
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'hover:bg-base-200 text-base-content'
                                }`}
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
