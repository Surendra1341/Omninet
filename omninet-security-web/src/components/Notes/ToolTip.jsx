import { useState } from 'react';

function ToolTip({ title, children, event, className = "" }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <button 
                onClick={event}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className={`cursor-pointer px-2 dark:text-blue-400 dark:hover:text-blue-300 transition-colors ${className}`}
            >
                {children}
            </button>
            
            <div className={`mb-1 absolute bottom-full left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200 ease-in-out ${
                isVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-1'
            }`}>
                <div className="px-2 py-0.5 text-[10px] text-grey-700 bg-gray-50 rounded  dark:bg-gray-600 whitespace-nowrap">
                    {title}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400 dark:border-t-gray-600"></div>
            </div>
        </div>
    );
}

export default ToolTip;