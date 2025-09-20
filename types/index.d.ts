interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    imagePath: string;
    resumePath: string;
    feedback: Feedback;
    // Enhanced fields for job applications
    personalInfo?: {
        name: string;
        email: string;
        phone: string;
        location: string;
        linkedin?: string;
        website?: string;
    };
    experience?: Experience[];
    education?: Education[];
    skills?: string[];
    summary?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface Feedback {
    overallScore: number;
    ATS: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
        }[];
    };
    toneAndStyle: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    content: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    structure: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
    skills: {
        score: number;
        tips: {
            type: "good" | "improve";
            tip: string;
            explanation: string;
        }[];
    };
}

// New types for job application platform
interface Experience {
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate?: string;
    description: string;
    achievements: string[];
    skills: string[];
}

interface Education {
    id: string;
    degree: string;
    institution: string;
    location: string;
    year: string;
    gpa?: string;
    relevantCoursework?: string[];
}

interface JobData {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    requirements: string[];
    requiredSkills: string[];
    preferredSkills: string[];
    salary?: {
        min: number;
        max: number;
        currency: string;
    };
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
    remote: boolean;
    industry: string;
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
    url: string;
    source: 'linkedin' | 'indeed' | 'glassdoor' | 'company' | 'other';
    postedDate: Date;
    applicationDeadline?: Date;
}

interface JobApplication {
    id: string;
    jobId: string;
    resumeId: string;
    status: 'draft' | 'applied' | 'under-review' | 'interview' | 'rejected' | 'accepted';
    appliedDate: Date;
    customizedResume?: string; // PDF URL
    coverLetter?: string; // PDF URL
    notes?: string;
    followUpDate?: Date;
    responseReceived?: boolean;
    interviewScheduled?: Date;
    rejectionReason?: string;
}

interface ApplicationSettings {
    maxApplicationsPerDay: number;
    maxApplicationsPerWeek: number;
    preferredJobTypes: string[];
    preferredLocations: string[];
    salaryMin?: number;
    remoteOnly: boolean;
    autoApply: boolean;
    emailNotifications: boolean;
    linkedInIntegration: boolean;
    gmailIntegration: boolean;
}

interface JobSearchFilters {
    keywords: string[];
    location: string;
    remote: boolean;
    salaryMin?: number;
    salaryMax?: number;
    experienceLevel: string[];
    employmentType: string[];
    industry: string[];
    companySize: string[];
    postedWithin: number; // days
}

interface ResumeCustomization {
    emphasizeSkills: string[];
    addKeywords: string[];
    reorderSections: boolean;
    highlightRelevantExperience: boolean;
    optimizeForATS: boolean;
    customSummary?: string;
}
