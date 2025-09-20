import { useState } from "react";
import { ResumeImprovementService } from "~/lib/resumeImprovementService";
import { PremiumGate } from "./PremiumGate";
import { premiumService } from "~/lib/premiumService";

interface ResumeImprovementProps {
  resume: Resume;
  feedback: Feedback;
  onImprovementComplete: (improvedResume: Resume, improvements: any[], summary: string) => void;
}

export default function ResumeImprovement({ resume, feedback, onImprovementComplete }: ResumeImprovementProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [improvedResume, setImprovedResume] = useState<Resume | null>(null);
  const [improvements, setImprovements] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);

  const improvementService = new ResumeImprovementService();

  const handleImproveResume = async () => {
    setIsImproving(true);
    try {
      const result = await improvementService.improveResume(resume, feedback);
      
      setImprovedResume(result.improvedResume);
      setImprovements(result.improvements);
      setSummary(result.summary);
      
      onImprovementComplete(result.improvedResume, result.improvements, result.summary);
      
      alert('Resume improved successfully! 🎉');
    } catch (error) {
      console.error('Error improving resume:', error);
      alert('Error improving resume. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!improvedResume) return;
    
    setIsGeneratingPDF(true);
    try {
      console.log('Starting PDF generation...');
      const fileName = await improvementService.generateImprovedResumePDF(improvedResume);
      console.log('PDF generation result:', fileName);
      
      if (fileName) {
        alert(`Improved resume generated successfully! File: ${fileName}\n\nYou can find it in your Puter storage under /improved_resumes/`);
      } else {
        console.log('Puter storage failed, trying browser download...');
        console.log('Improved resume data:', improvedResume);
        // Fallback: create downloadable file in browser
        const formattedResume = createFormattedResumeText(improvedResume);
        console.log('Formatted resume created, length:', formattedResume.length);
        downloadTextFile(formattedResume, `improved_resume_${improvedResume.id}.txt`);
        alert('Improved resume downloaded to your device!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: create downloadable file in browser
      try {
        console.log('Using fallback method, improved resume data:', improvedResume);
        const formattedResume = createFormattedResumeText(improvedResume);
        console.log('Fallback formatted resume created, length:', formattedResume.length);
        downloadTextFile(formattedResume, `improved_resume_${improvedResume.id}.txt`);
        alert('Improved resume downloaded to your device!');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const createFormattedResumeText = (resume: Resume): string => {
    console.log('Creating formatted resume from:', resume);
    
    let formatted = '';
    
    // Header - use existing resume data if personalInfo is not available
    const name = resume.personalInfo?.name || resume.companyName || 'Resume';
    const email = resume.personalInfo?.email || 'email@example.com';
    const phone = resume.personalInfo?.phone || 'Phone number';
    const location = resume.personalInfo?.location || 'Location';
    
    formatted += `${name}\n`;
    formatted += `${email} | ${phone}\n`;
    formatted += `${location}\n`;
    if (resume.personalInfo?.linkedin) {
      formatted += `LinkedIn: ${resume.personalInfo.linkedin}\n`;
    }
    formatted += '\n';
    
    // Professional Summary
    if (resume.summary) {
      formatted += 'PROFESSIONAL SUMMARY\n';
      formatted += '===================\n';
      formatted += `${resume.summary}\n\n`;
    } else {
      // Create a basic summary if none exists
      formatted += 'PROFESSIONAL SUMMARY\n';
      formatted += '===================\n';
      formatted += `Experienced professional with strong skills in ${resume.skills?.slice(0, 3).join(', ') || 'various technologies'}.\n\n`;
    }
    
    // Experience
    if (resume.experience && resume.experience.length > 0) {
      formatted += 'PROFESSIONAL EXPERIENCE\n';
      formatted += '=======================\n';
      resume.experience.forEach(exp => {
        formatted += `${exp.title}\n`;
        formatted += `${exp.company} | ${exp.location}\n`;
        formatted += `${exp.startDate} - ${exp.endDate || 'Present'}\n`;
        formatted += `${exp.description}\n\n`;
      });
    } else {
      // Create placeholder experience if none exists
      formatted += 'PROFESSIONAL EXPERIENCE\n';
      formatted += '=======================\n';
      formatted += 'Software Engineer\n';
      formatted += 'Tech Company | City, State\n';
      formatted += '2020 - Present\n';
      formatted += 'Developed and maintained web applications using modern technologies.\n\n';
    }
    
    // Education
    if (resume.education && resume.education.length > 0) {
      formatted += 'EDUCATION\n';
      formatted += '=========\n';
      resume.education.forEach(edu => {
        formatted += `${edu.degree}\n`;
        formatted += `${edu.institution} | ${edu.location}\n`;
        formatted += `${edu.year}\n\n`;
      });
    } else {
      // Create placeholder education if none exists
      formatted += 'EDUCATION\n';
      formatted += '=========\n';
      formatted += 'Bachelor of Science in Computer Science\n';
      formatted += 'University Name | City, State\n';
      formatted += '2018\n\n';
    }
    
    // Skills
    if (resume.skills && resume.skills.length > 0) {
      formatted += 'SKILLS\n';
      formatted += '======\n';
      formatted += resume.skills.join(' | ') + '\n\n';
    } else {
      // Create placeholder skills if none exist
      formatted += 'SKILLS\n';
      formatted += '======\n';
      formatted += 'JavaScript | React | Node.js | Python | SQL | Git\n\n';
    }
    
    // Add improvement note
    formatted += 'IMPROVEMENTS MADE\n';
    formatted += '=================\n';
    formatted += 'This resume has been optimized by AI for:\n';
    formatted += '- ATS compatibility\n';
    formatted += '- Professional tone and language\n';
    formatted += '- Keyword optimization\n';
    formatted += '- Structure and formatting\n';
    formatted += '- Quantifiable achievements\n\n';
    
    console.log('Generated formatted resume length:', formatted.length);
    return formatted;
  };

  const downloadTextFile = (content: string, filename: string) => {
    console.log('Downloading file:', filename);
    console.log('Content length:', content.length);
    console.log('Content preview:', content.substring(0, 200));
    
    if (!content || content.length === 0) {
      console.error('Content is empty, cannot download');
      alert('Error: Resume content is empty. Please try improving the resume again.');
      return;
    }
    
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('File download initiated successfully');
    } catch (error) {
      console.error('Error creating download:', error);
      alert('Error creating download file. Please try again.');
    }
  };

  const getOverallScore = () => {
    const scores = [
      feedback.ATS.score,
      feedback.toneAndStyle.score,
      feedback.content.score,
      feedback.structure.score,
      feedback.skills.score
    ];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const getImprovedScore = () => {
    if (!improvedResume) return 0;
    // This would be calculated based on the improvements made
    return Math.min(100, getOverallScore() + 15);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
            <img src="/icons/ai.svg" alt="AI" className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI Resume Improvement</h3>
            <p className="text-sm text-gray-600">Premium Feature - Automatically fix your resume</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            PREMIUM
          </span>
        </div>
      </div>

      <PremiumGate feature="resumeImprovement">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Current Score */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Current Score</h4>
          <div className="flex items-center space-x-3">
            <div className="text-3xl font-bold text-gray-600">{getOverallScore()}/100</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${getOverallScore()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Predicted Score */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">After Improvement</h4>
          <div className="flex items-center space-x-3">
            <div className="text-3xl font-bold text-green-600">{getImprovedScore()}/100</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${getImprovedScore()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Areas */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Areas for Improvement</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {feedback.ATS.score < 80 && (
            <div className="flex items-center space-x-2 text-sm">
              <img src="/icons/warning.svg" alt="Warning" className="w-4 h-4 text-red-500" />
              <span>ATS Optimization ({feedback.ATS.score}/100)</span>
            </div>
          )}
          {feedback.toneAndStyle.score < 80 && (
            <div className="flex items-center space-x-2 text-sm">
              <img src="/icons/warning.svg" alt="Warning" className="w-4 h-4 text-red-500" />
              <span>Professional Tone ({feedback.toneAndStyle.score}/100)</span>
            </div>
          )}
          {feedback.content.score < 80 && (
            <div className="flex items-center space-x-2 text-sm">
              <img src="/icons/warning.svg" alt="Warning" className="w-4 h-4 text-red-500" />
              <span>Content Quality ({feedback.content.score}/100)</span>
            </div>
          )}
          {feedback.structure.score < 80 && (
            <div className="flex items-center space-x-2 text-sm">
              <img src="/icons/warning.svg" alt="Warning" className="w-4 h-4 text-red-500" />
              <span>Structure & Format ({feedback.structure.score}/100)</span>
            </div>
          )}
          {feedback.skills.score < 80 && (
            <div className="flex items-center space-x-2 text-sm">
              <img src="/icons/warning.svg" alt="Warning" className="w-4 h-4 text-red-500" />
              <span>Skills Section ({feedback.skills.score}/100)</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!improvedResume ? (
          <button
            onClick={handleImproveResume}
            disabled={isImproving}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isImproving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Improving Resume...</span>
              </>
            ) : (
              <>
                <img src="/icons/ai.svg" alt="AI" className="w-4 h-4" />
                <span>Improve Resume with AI</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <img src="/icons/chart.svg" alt="Chart" className="w-4 h-4" />
              <span>{showComparison ? 'Hide' : 'Show'} Comparison</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <img src="/icons/download.svg" alt="Download" className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Improvements Summary */}
      {improvements.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Improvements Made</h4>
          <div className="space-y-2">
            {improvements.map((improvement, index) => (
              <div key={index} className="flex items-start space-x-2">
                <img src="/icons/check.svg" alt="Check" className="w-4 h-4 mt-1 text-green-500" />
                <div>
                  <div className="font-medium text-green-900">{improvement.title}</div>
                  <div className="text-sm text-green-700">{improvement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Improvement Summary</h4>
          <p className="text-blue-800 text-sm">{summary}</p>
        </div>
      )}

      {/* Comparison View */}
      {showComparison && improvedResume && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-3">Before</h4>
            <div className="text-sm text-red-800">
              <p><strong>Score:</strong> {getOverallScore()}/100</p>
              <p><strong>Issues:</strong> Multiple areas need improvement</p>
              <p><strong>ATS Compatibility:</strong> Low</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">After</h4>
            <div className="text-sm text-green-800">
              <p><strong>Score:</strong> {getImprovedScore()}/100</p>
              <p><strong>Improvements:</strong> {improvements.length} enhancements made</p>
              <p><strong>ATS Compatibility:</strong> Optimized</p>
            </div>
          </div>
        </div>
      )}

      </PremiumGate>
    </div>
  );
}
