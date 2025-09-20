import { type ActionFunctionArgs } from 'react-router';
import { LinkedInExtractionService } from '~/lib/linkedinExtractionService';

export const meta = () => ([
  { title: 'LinkedIn Extract API' },
]);

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate LinkedIn URL
    const linkedinJobRegex = /^https:\/\/(www\.)?linkedin\.com\/jobs\/view\/\d+/;
    if (!linkedinJobRegex.test(url)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid LinkedIn job URL' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const extractionService = new LinkedInExtractionService();
    const jobData = await extractionService.extractJobData(url);

    console.log('API: Successfully extracted job data:', {
      companyName: jobData.companyName,
      jobTitle: jobData.jobTitle,
      descriptionLength: jobData.jobDescription?.length || 0
    });

    const responseData = {
      success: true,
      companyName: jobData.companyName,
      jobTitle: jobData.jobTitle,
      jobDescription: jobData.jobDescription,
      location: jobData.location,
      employmentType: jobData.employmentType,
      experienceLevel: jobData.experienceLevel,
      skills: jobData.skills,
    };

    console.log('API: Returning response:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('LinkedIn extraction error:', error);
    
    // Provide more user-friendly error messages
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
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Default export for the route
export default function LinkedInExtractAPI() {
  return null; // This is an API route, no UI needed
}
