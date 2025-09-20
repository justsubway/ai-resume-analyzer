import type { Route } from "./+types/jobs";
import { useState, useEffect } from "react";
import { usePuterStore } from "../lib/puter";
import { JobScrapingService, AutoApplyService, DocumentGenerationService } from "../lib/jobServices";
import { Link, useNavigate } from "react-router";
// Using simple text/icons instead of lucide-react for compatibility

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Job Search & Auto-Apply - Resumind" },
    { name: "description", content: "Find and apply to jobs automatically with AI-powered resume customization" },
  ];
}

export default function Jobs() {
  const { auth, kv, isLoading } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate('/auth');
    }
  }, [auth.isAuthenticated, isLoading, navigate]);

  const [searchFilters, setSearchFilters] = useState<JobSearchFilters>({
    keywords: ['software engineer', 'developer', 'programmer'],
    location: '',
    remote: true,
    experienceLevel: ['mid', 'senior'],
    employmentType: ['full-time'],
    industry: [],
    companySize: [],
    postedWithin: 7
  });

  const [applicationSettings, setApplicationSettings] = useState<ApplicationSettings>({
    maxApplicationsPerDay: 10,
    maxApplicationsPerWeek: 50,
    preferredJobTypes: ['full-time'],
    preferredLocations: [],
    remoteOnly: false,
    autoApply: false,
    emailNotifications: true,
    linkedInIntegration: false,
    gmailIntegration: false
  });

  const jobScrapingService = new JobScrapingService();
  const autoApplyService = new AutoApplyService(applicationSettings);
  const documentService = new DocumentGenerationService();

  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/jobs');
  }, [auth.isAuthenticated]);

  useEffect(() => {
    loadResumes();
    loadApplications();
  }, []);

  const loadResumes = async () => {
    try {
      const resumes = (await kv.list('resume:*', true)) as KVItem[];
      const parsedResumes = resumes?.map((resume) => JSON.parse(resume.value) as Resume);
      setResumes(parsedResumes || []);
      if (parsedResumes && parsedResumes.length > 0) {
        setSelectedResume(parsedResumes[0]);
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
    }
  };

  const loadApplications = async () => {
    try {
      const apps = await autoApplyService.getApplications();
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const handleSearchJobs = async () => {
    if (!selectedResume) {
      alert('Please select a resume first');
      return;
    }

    setIsSearching(true);
    try {
      const foundJobs = await jobScrapingService.searchJobs(searchFilters);
      setJobs(foundJobs);
    } catch (error) {
      console.error('Error searching jobs:', error);
      alert('Error searching for jobs. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyToJob = async (job: JobData) => {
    if (!selectedResume) {
      alert('Please select a resume first');
      return;
    }

    setIsApplying(true);
    try {
      const customizations: ResumeCustomization = {
        emphasizeSkills: job.requiredSkills.slice(0, 5),
        addKeywords: job.requiredSkills.slice(0, 3),
        reorderSections: true,
        highlightRelevantExperience: true,
        optimizeForATS: true
      };

      const application = await autoApplyService.applyToJob(job, selectedResume, customizations);
      setApplications(prev => [...prev, application]);
      
      // Remove job from list
      setJobs(prev => prev.filter(j => j.id !== job.id));
      
      alert(`Successfully applied to ${job.title} at ${job.company}!`);
    } catch (error) {
      console.error('Error applying to job:', error);
      alert(`Failed to apply to ${job.title}: ${error}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleAutoApply = async () => {
    if (!selectedResume) {
      alert('Please select a resume first');
      return;
    }

    if (jobs.length === 0) {
      alert('No jobs found. Please search for jobs first.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to apply to ${jobs.length} jobs? This will use ${jobs.length} of your daily applications.`
    );

    if (!confirmed) return;

    setIsApplying(true);
    try {
      const customizations: ResumeCustomization = {
        emphasizeSkills: [],
        addKeywords: searchFilters.keywords,
        reorderSections: true,
        highlightRelevantExperience: true,
        optimizeForATS: true
      };

      const newApplications = await autoApplyService.applyToMultipleJobs(
        jobs.slice(0, applicationSettings.maxApplicationsPerDay),
        selectedResume,
        customizations
      );

      setApplications(prev => [...prev, ...newApplications]);
      setJobs(prev => prev.slice(applicationSettings.maxApplicationsPerDay));
      
      alert(`Successfully applied to ${newApplications.length} jobs!`);
    } catch (error) {
      console.error('Error auto-applying:', error);
      alert(`Auto-apply failed: ${error}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDownloadResume = async (resume: Resume) => {
    try {
      const fileName = await documentService.generateResumeDocument(resume);
      if (fileName) {
        alert(`Resume generated successfully! File: ${fileName}`);
      } else {
        alert('Failed to generate resume document');
      }
    } catch (error) {
      console.error('Error generating resume document:', error);
      alert('Error generating resume document');
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Job Application Platform</h1>
              <p className="text-gray-600">Find and apply to jobs automatically with customized resumes</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Resume Selection & Search */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Resume</h2>
              <div className="space-y-2">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => setSelectedResume(resume)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedResume?.id === resume.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {resume.personalInfo?.name || resume.companyName || 'Resume'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {resume.personalInfo?.email || 'No email'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Score: {resume.feedback.overallScore}/100
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Job Search</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <span>🔍</span>
                  <span>Filters</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={searchFilters.keywords.join(', ')}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="software engineer, developer, react"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={searchFilters.location}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      location: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New York, NY"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remote"
                    checked={searchFilters.remote}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      remote: e.target.checked
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remote" className="ml-2 block text-sm text-gray-700">
                    Remote only
                  </label>
                </div>

                <button
                  onClick={handleSearchJobs}
                  disabled={isSearching || !selectedResume}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>🔍</span>
                  <span>{isSearching ? 'Searching...' : 'Search Jobs'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Job Listings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Found Jobs ({jobs.length})
                  </h2>
                  {jobs.length > 0 && (
                    <button
                      onClick={handleAutoApply}
                      disabled={isApplying || !selectedResume}
                      className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <span>📤</span>
                      <span>{isApplying ? 'Applying...' : `Auto-Apply to All (${jobs.length})`}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {jobs.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500">No jobs found. Try adjusting your search filters.</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <span>📍</span>
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>💼</span>
                              <span>{job.employmentType}</span>
                            </div>
                            {job.remote && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Remote
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Job
                          </a>
                          <button
                            onClick={() => handleApplyToJob(job)}
                            disabled={isApplying || !selectedResume}
                            className="bg-blue-600 text-white py-1 px-3 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Applications History */}
            {applications.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Applications ({applications.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {applications.slice(0, 10).map((application) => (
                    <div key={application.id} className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {jobs.find(j => j.id === application.jobId)?.title || 'Unknown Job'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {jobs.find(j => j.id === application.jobId)?.company || 'Unknown Company'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Applied: {new Date(application.appliedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          application.status === 'applied' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'under-review' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'interview' ? 'bg-purple-100 text-purple-800' :
                          application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
