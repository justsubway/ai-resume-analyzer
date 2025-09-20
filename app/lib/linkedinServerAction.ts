import { LinkedInExtractionService } from './linkedinExtractionService';

export async function extractLinkedInJobData(url: string) {
  try {
    console.log('Server action: Starting LinkedIn extraction for:', url);

    // Validate LinkedIn URL
    const linkedinJobRegex = /^https:\/\/(www\.)?linkedin\.com\/jobs\/view\/\d+/;
    if (!linkedinJobRegex.test(url)) {
      throw new Error('Invalid LinkedIn job URL');
    }

    const extractionService = new LinkedInExtractionService();
    const jobData = await extractionService.extractJobData(url);

    console.log('Server action: Successfully extracted job data:', {
      companyName: jobData.companyName,
      jobTitle: jobData.jobTitle,
      descriptionLength: jobData.jobDescription?.length || 0
    });

    return {
      success: true,
      companyName: jobData.companyName,
      jobTitle: jobData.jobTitle,
      jobDescription: jobData.jobDescription,
      location: jobData.location,
      employmentType: jobData.employmentType,
      experienceLevel: jobData.experienceLevel,
      skills: jobData.skills,
    };
  } catch (error) {
    console.error('Server action: LinkedIn extraction error:', error);
    
    let errorMessage = 'Failed to extract job data from LinkedIn';
    if (error instanceof Error) {
      if (error.message.includes('proxy service')) {
        errorMessage = 'Unable to access LinkedIn job posting. Please try again or enter the information manually.';
      } else if (error.message.includes('extract job data')) {
        errorMessage = 'Could not extract job details from this LinkedIn posting. The page structure may have changed.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
