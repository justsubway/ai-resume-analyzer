import React, { useState } from 'react';
import { PremiumGate } from './PremiumGate';

interface ResumeImproverProps {
  resumeFile: File | null;
  jobDescription: string;
  companyName: string;
  jobTitle: string;
  onImprovementComplete: (improvedResumeUrl: string) => void;
  onError: (error: string) => void;
}

export const ResumeImprover: React.FC<ResumeImproverProps> = ({
  resumeFile,
  jobDescription,
  companyName,
  jobTitle,
  onImprovementComplete,
  onError
}) => {
  const [isImproving, setIsImproving] = useState(false);
  const [improvementProgress, setImprovementProgress] = useState('');

  const handleImproveResume = async () => {
    if (!resumeFile) {
      onError('Please upload a resume first');
      return;
    }

    setIsImproving(true);
    setImprovementProgress('Analyzing resume...');

    try {
      // Use AI to improve the resume via API
      setImprovementProgress('AI is improving your resume...');
      const improvedPdfUrl = await improveResumeWithAPI(resumeFile, jobDescription, companyName, jobTitle);
      
      setImprovementProgress('Complete!');
      onImprovementComplete(improvedPdfUrl);
    } catch (error) {
      console.error('Resume improvement error:', error);
      onError('Failed to improve resume. Please try again.');
    } finally {
      setIsImproving(false);
      setImprovementProgress('');
    }
  };

  return (
    <PremiumGate feature="resumeImprovement">
      <div className="w-full">
        <button
          type="button"
          onClick={handleImproveResume}
          disabled={isImproving || !resumeFile}
          className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Improve with AI</h3>
            <p className="text-sm text-gray-600">Automatically enhance your resume for this job</p>
          </div>
        </button>
        
        {isImproving && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-700 font-medium">{improvementProgress}</span>
            </div>
          </div>
        )}
      </div>
    </PremiumGate>
  );
};

// Helper functions
async function improveResumeWithAPI(
  resumeFile: File,
  jobDescription: string,
  companyName: string,
  jobTitle: string
): Promise<string> {
  const formData = new FormData();
  formData.append('resumeFile', resumeFile);
  formData.append('jobDescription', jobDescription);
  formData.append('companyName', companyName);
  formData.append('jobTitle', jobTitle);

  const response = await fetch('/api/improve-resume', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to improve resume');
  }

  return result.improvedPdfUrl;
}
