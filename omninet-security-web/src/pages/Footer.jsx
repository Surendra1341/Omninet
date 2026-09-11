import React from 'react';

export default function Footer() {
  return (
    <div className="pb-4 md:pb-6 lg:pb-8">
      <div className="mt-4 md:mt-6 lg:mt-8">
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-col mx-2 md:mx-6 lg:mx-8 my-2 md:my-0 md:w-5/12">
            <h3 className="font-sans text-left font-bold text-lg text-gray-600">
              Omninet
            </h3>
            <p className="font-sans text-sm text-left font-medium text-gray-500">
              Your gateway to secure networking
            </p>
          </div>
          
          <div className="flex flex-col mx-2 md:mx-6 lg:mx-8 my-2 md:my-0 md:w-7/12">
            <h3 className="font-sans text-left font-bold text-base text-gray-600">
              Quick links
            </h3>
            <div className="font-sans text-sm text-left font-medium text-gray-500">
              <p className="mt-2">
                <a href="/" className="no-underline hover:underline text-gray-500 hover:text-gray-700 transition-colors">
                  Home
                </a>
              </p>
              <p className="mt-2">
                <a href="/storage" className="no-underline hover:underline text-gray-500 hover:text-gray-700 transition-colors">
                  Storage
                </a>
              </p>
              <p className="mt-2">
                <a href="/notes" className="no-underline hover:underline text-gray-500 hover:text-gray-700 transition-colors">
                  Notes
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
