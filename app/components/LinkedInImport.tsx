import React, { useState } from 'react';
import { extractLinkedInJobData } from '~/lib/linkedinServerAction';

interface LinkedInImportProps {
  onDataExtracted: (data: { companyName: string; jobTitle: string; jobDescription: string }) => void;
  onError: (error: string) => void;
}

export const LinkedInImport: React.FC<LinkedInImportProps> = ({ onDataExtracted, onError }) => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExtractData = async () => {
    if (!linkedinUrl.trim()) {
      onError('Please enter a LinkedIn job URL');
      return;
    }

    // Validate LinkedIn URL
    const linkedinJobRegex = /^https:\/\/(www\.)?linkedin\.com\/jobs\/view\/\d+/;
    if (!linkedinJobRegex.test(linkedinUrl)) {
      onError('Please enter a valid LinkedIn job posting URL (e.g., https://www.linkedin.com/jobs/view/1234567890)');
      return;
    }

    setIsLoading(true);
    setError(''); // Clear any previous errors
    setSuccess(''); // Clear any previous success messages
    
    try {
      console.log('Extracting data from LinkedIn URL:', linkedinUrl);
      
      // Call the server action directly
      const data = await extractLinkedInJobData(linkedinUrl);
      console.log('Extraction result:', data);
      
      if (data.success) {
        console.log('Calling onDataExtracted with:', {
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          jobDescription: data.jobDescription?.substring(0, 100) + '...'
        });
        
        onDataExtracted({
          companyName: data.companyName || '',
          jobTitle: data.jobTitle || '',
          jobDescription: data.jobDescription || '',
        });
        setSuccess('Job data extracted successfully! Form has been auto-filled.');
        setIsExpanded(false);
        setLinkedinUrl('');
        console.log('Data extracted successfully and form should be updated');
      } else {
        console.log('Extraction failed:', data.error);
        onError(data.error || 'Failed to extract job data');
      }
    } catch (error) {
      console.error('Error extracting LinkedIn data:', error);
      onError('Failed to extract job data. Please try again or enter the information manually.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Import from LinkedIn</h3>
            <p className="text-sm text-gray-600">Extract job details automatically from LinkedIn job posting</p>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {/* Success Display */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                {success}
              </div>
            )}
            
            <div>
              <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Job URL
              </label>
              <input
                type="url"
                id="linkedin-url"
                value={linkedinUrl}
                onChange={(e) => {
                  setLinkedinUrl(e.target.value);
                  setError(''); // Clear error when user types
                  setSuccess(''); // Clear success message when user types
                }}
                placeholder="https://www.linkedin.com/jobs/view/1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Paste the URL of the LinkedIn job posting you want to apply for
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleExtractData}
                disabled={isLoading || !linkedinUrl.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Extracting...
                  </>
                ) : (
                  'Extract Job Data'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setLinkedinUrl('');
                  setError('');
                  setSuccess('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
