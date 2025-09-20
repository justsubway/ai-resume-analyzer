import { usePuterStore } from "./puter";
import { SimpleWebScrapingService } from "./simpleWebScrapingService";

// Job Scraping Service
export class JobScrapingService {
  private puterStore = usePuterStore.getState();
  private webScrapingService = new SimpleWebScrapingService();

  async searchJobs(filters: JobSearchFilters): Promise<JobData[]> {
    try {
      // Use web scraping to get real job data
      const scrapedJobs = await this.webScrapingService.searchJobs(filters);
      
      // Also use AI to find additional jobs that might not be scraped
      const aiJobs = await this.searchJobsWithAI(filters);
      
      // Combine and deduplicate results
      const allJobs = [...scrapedJobs, ...aiJobs];
      const uniqueJobs = this.removeDuplicates(allJobs);
      
      return uniqueJobs;
    } catch (error) {
      console.error('Error searching for jobs:', error);
      // Fallback to AI-only search if web scraping fails
      return await this.searchJobsWithAI(filters);
    }
  }

  private async searchJobsWithAI(filters: JobSearchFilters): Promise<JobData[]> {
    try {
      const searchPrompt = `Find job listings for the following criteria:
        Keywords: ${filters.keywords.join(', ')}
        Location: ${filters.location || 'Any'}
        Remote: ${filters.remote ? 'Yes' : 'No'}
        Experience Level: ${filters.experienceLevel.join(', ')}
        Employment Type: ${filters.employmentType.join(', ')}
        
        Return a JSON array of job objects with the following structure:
        {
          "id": "unique_id",
          "title": "Job Title",
          "company": "Company Name",
          "location": "Location",
          "description": "Job Description",
          "requirements": ["requirement1", "requirement2"],
          "requiredSkills": ["skill1", "skill2"],
          "preferredSkills": ["skill3", "skill4"],
          "employmentType": "full-time",
          "remote": true/false,
          "industry": "Industry",
          "experienceLevel": "mid",
          "url": "job_url",
          "source": "ai",
          "postedDate": "2024-01-01"
        }`;

      const response = await this.puterStore.ai.chat(searchPrompt);
      
      if (response && typeof response === 'object' && 'content' in response) {
        const content = response.content;
        if (Array.isArray(content)) {
          return content.map((job: any) => ({
            ...job,
            postedDate: new Date(job.postedDate || new Date()),
            id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }));
        }
      }

      return [];
    } catch (error) {
      console.error('Error with AI job search:', error);
      return [];
    }
  }

  private removeDuplicates(jobs: JobData[]): JobData[] {
    const seen = new Set();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async getJobDetails(jobId: string): Promise<JobData | null> {
    try {
      // Get job details from storage or AI
      const jobData = await this.puterStore.kv.get(`job:${jobId}`);
      if (jobData) {
        return JSON.parse(jobData);
      }
      return null;
    } catch (error) {
      console.error('Error getting job details:', error);
      return null;
    }
  }
}

// Auto Apply Service
export class AutoApplyService {
  private puterStore = usePuterStore.getState();
  private settings: ApplicationSettings;

  constructor(settings: ApplicationSettings) {
    this.settings = settings;
  }

  async applyToJob(job: JobData, resume: Resume, customizations: ResumeCustomization): Promise<JobApplication> {
    try {
      // Generate customized resume using AI
      const customizedResume = await this.customizeResumeForJob(resume, job, customizations);
      
      // Generate cover letter using AI
      const coverLetter = await this.generateCoverLetter(resume, job);
      
      // Create application record
      const application: JobApplication = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: job.id,
        resumeId: resume.id,
        status: 'applied',
        appliedDate: new Date(),
        notes: `Applied via ${job.source} with customized resume`
      };

      // Save application to storage
      await this.puterStore.kv.set(`application:${application.id}`, JSON.stringify(application));
      
      // Save customized resume
      if (customizedResume) {
        await this.puterStore.kv.set(`customized_resume:${application.id}`, JSON.stringify(customizedResume));
        application.customizedResume = `customized_resume:${application.id}`;
      }

      // Save cover letter
      if (coverLetter) {
        await this.puterStore.kv.set(`cover_letter:${application.id}`, coverLetter);
        application.coverLetter = `cover_letter:${application.id}`;
      }

      return application;
    } catch (error) {
      console.error('Error applying to job:', error);
      throw error;
    }
  }

  async applyToMultipleJobs(
    jobs: JobData[],
    resume: Resume,
    customizations: ResumeCustomization
  ): Promise<JobApplication[]> {
    const applications: JobApplication[] = [];
    const errors: string[] = [];

    for (const job of jobs.slice(0, this.settings.maxApplicationsPerDay)) {
      try {
        const application = await this.applyToJob(job, resume, customizations);
        applications.push(application);

        // Add delay between applications
        await this.delay(2000 + Math.random() * 3000);
      } catch (error) {
        errors.push(`Failed to apply to ${job.title} at ${job.company}: ${error}`);
        console.error(`Error applying to ${job.title}:`, error);
      }
    }

    if (errors.length > 0) {
      console.warn('Some applications failed:', errors);
    }

    return applications;
  }

  private async customizeResumeForJob(
    resume: Resume,
    job: JobData,
    customizations: ResumeCustomization
  ): Promise<Resume | null> {
    try {
      const prompt = `Customize this resume for the job "${job.title}" at "${job.company}":
        
        Job Requirements: ${job.requirements.join(', ')}
        Required Skills: ${job.requiredSkills.join(', ')}
        Job Description: ${job.description}
        
        Resume to customize: ${JSON.stringify(resume)}
        
        Customization preferences:
        - Emphasize skills: ${customizations.emphasizeSkills.join(', ')}
        - Add keywords: ${customizations.addKeywords.join(', ')}
        - Reorder sections: ${customizations.reorderSections}
        - Highlight relevant experience: ${customizations.highlightRelevantExperience}
        - Optimize for ATS: ${customizations.optimizeForATS}
        
        Return the customized resume as a JSON object with the same structure as the original resume.`;

      const response = await this.puterStore.ai.chat(prompt);
      
      if (response && typeof response === 'object' && 'content' in response) {
        const content = response.content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0] as Resume;
        }
      }

      return null;
    } catch (error) {
      console.error('Error customizing resume:', error);
      return null;
    }
  }

  private async generateCoverLetter(resume: Resume, job: JobData): Promise<string | null> {
    try {
      const prompt = `Generate a professional cover letter for this job application:
        
        Job: ${job.title} at ${job.company}
        Job Description: ${job.description}
        Required Skills: ${job.requiredSkills.join(', ')}
        
        Resume Information:
        Name: ${resume.personalInfo?.name || 'Applicant'}
        Experience: ${resume.experience?.map(exp => exp.title).join(', ') || 'Various roles'}
        Skills: ${resume.skills?.join(', ') || 'Various skills'}
        
        Write a compelling cover letter that:
        1. Addresses the hiring manager
        2. Highlights relevant experience and skills
        3. Shows enthusiasm for the role
        4. Is professional and concise
        5. Ends with a call to action
        
        Return only the cover letter text, no additional formatting.`;

      const response = await this.puterStore.ai.chat(prompt);
      
      if (response && typeof response === 'object' && 'content' in response) {
        const content = response.content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0] as string;
        }
      }

      return null;
    } catch (error) {
      console.error('Error generating cover letter:', error);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getApplications(): Promise<JobApplication[]> {
    try {
      const applications = await this.puterStore.kv.list('application:*', true) as any[];
      return applications.map(app => JSON.parse(app.value));
    } catch (error) {
      console.error('Error getting applications:', error);
      return [];
    }
  }

  async updateApplicationStatus(applicationId: string, status: JobApplication['status']): Promise<void> {
    try {
      const applicationData = await this.puterStore.kv.get(`application:${applicationId}`);
      if (applicationData) {
        const application = JSON.parse(applicationData);
        application.status = status;
        await this.puterStore.kv.set(`application:${applicationId}`, JSON.stringify(application));
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  }
}

// Document Generation Service
export class DocumentGenerationService {
  private puterStore = usePuterStore.getState();

  async generateResumeDocument(resume: Resume): Promise<string | null> {
    try {
      // Use AI to generate a well-formatted resume text
      const prompt = `Convert this resume data into a well-formatted text resume:
        
        ${JSON.stringify(resume)}
        
        Format it as a professional resume with proper sections:
        1. Header (Name, Contact Info)
        2. Professional Summary
        3. Experience (with dates and descriptions)
        4. Education
        5. Skills
        
        Return only the formatted text, no markdown or special formatting.`;

      const response = await this.puterStore.ai.chat(prompt);
      
      if (response && typeof response === 'object' && 'content' in response) {
        const content = response.content;
        if (Array.isArray(content) && content.length > 0) {
          const resumeText = content[0] as string;
          
          // Save the formatted resume
          const fileName = `resume_${resume.id}_${Date.now()}.txt`;
          await this.puterStore.fs.write(`/resumes/${fileName}`, resumeText);
          
          return fileName;
        }
      }

      return null;
    } catch (error) {
      console.error('Error generating resume document:', error);
      return null;
    }
  }

  async generateCoverLetterDocument(coverLetter: string): Promise<string | null> {
    try {
      const fileName = `cover_letter_${Date.now()}.txt`;
      await this.puterStore.fs.write(`/cover_letters/${fileName}`, coverLetter);
      return fileName;
    } catch (error) {
      console.error('Error generating cover letter document:', error);
      return null;
    }
  }
}
