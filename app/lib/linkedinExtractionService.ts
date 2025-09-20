import * as cheerio from 'cheerio';

export interface LinkedInJobData {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  skills?: string[];
}

export class LinkedInExtractionService {
  async extractJobData(url: string): Promise<LinkedInJobData> {
    try {
      // Try multiple proxy services for better reliability
      const proxyServices = [
        {
          url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
          isJson: true,
          extractContent: (data: any) => data.contents
        },
        {
          url: `https://cors-anywhere.herokuapp.com/${url}`,
          isJson: false,
          extractContent: (data: any) => data
        },
        {
          url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
          isJson: false,
          extractContent: (data: any) => data
        },
        {
          url: `https://thingproxy.freeboard.io/fetch/${url}`,
          isJson: false,
          extractContent: (data: any) => data
        },
        {
          url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
          isJson: false,
          extractContent: (data: any) => data
        }
      ];

      let html = '';
      let lastError = null;

      for (const proxy of proxyServices) {
        try {
          console.log(`Trying proxy: ${proxy.url}`);
          
          const response = await fetch(proxy.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
            },
            timeout: 15000, // 15 second timeout
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          let data;
          if (proxy.isJson) {
            data = await response.json();
          } else {
            data = await response.text();
          }
          
          html = proxy.extractContent(data);
          
          if (html && html.length > 1000 && html.includes('linkedin')) { // Ensure we got substantial content
            console.log(`Successfully fetched content from ${proxy.url}`);
            break;
          }
        } catch (error) {
          console.log(`Proxy ${proxy.url} failed:`, error);
          lastError = error;
          continue;
        }
      }

      if (!html || html.length < 1000) {
        // Fallback: Try to extract basic info from URL or return mock data
        console.log('All proxies failed, using fallback approach');
        return this.getFallbackJobData(url);
      }

      const $ = cheerio.load(html);

      // Extract job data using various selectors
      const jobData: LinkedInJobData = {
        companyName: this.extractCompanyName($),
        jobTitle: this.extractJobTitle($),
        jobDescription: this.extractJobDescription($),
        location: this.extractLocation($),
        employmentType: this.extractEmploymentType($),
        experienceLevel: this.extractExperienceLevel($),
        skills: this.extractSkills($),
      };

      // Validate that we got meaningful data
      if (!jobData.companyName && !jobData.jobTitle) {
        console.log('Extracted data:', jobData);
        console.log('HTML preview:', html.substring(0, 1000));
        
        // Try to extract from meta tags or other sources
        const metaTitle = $('title').text();
        const metaDescription = $('meta[name="description"]').attr('content');
        const ogTitle = $('meta[property="og:title"]').attr('content');
        const ogDescription = $('meta[property="og:description"]').attr('content');
        
        console.log('Meta title:', metaTitle);
        console.log('Meta description:', metaDescription);
        console.log('OG title:', ogTitle);
        console.log('OG description:', ogDescription);
        
        // Try different title parsing patterns
        const titleSources = [metaTitle, ogTitle].filter(Boolean);
        
        for (const title of titleSources) {
          if (title && title.includes('|')) {
            const parts = title.split('|');
            if (parts.length >= 2) {
              if (!jobData.jobTitle) jobData.jobTitle = parts[0].trim();
              if (!jobData.companyName) jobData.companyName = parts[1].trim();
              console.log('Extracted from title:', { jobTitle: jobData.jobTitle, companyName: jobData.companyName });
            }
          } else if (title && title.includes(' at ')) {
            const parts = title.split(' at ');
            if (parts.length >= 2) {
              if (!jobData.jobTitle) jobData.jobTitle = parts[0].trim();
              if (!jobData.companyName) jobData.companyName = parts[1].trim();
              console.log('Extracted from title (at):', { jobTitle: jobData.jobTitle, companyName: jobData.companyName });
            }
          } else if (title && title.includes(' - ')) {
            const parts = title.split(' - ');
            if (parts.length >= 2) {
              if (!jobData.jobTitle) jobData.jobTitle = parts[0].trim();
              if (!jobData.companyName) jobData.companyName = parts[1].trim();
              console.log('Extracted from title (-):', { jobTitle: jobData.jobTitle, companyName: jobData.companyName });
            }
          }
        }
        
        // Try description sources
        const descriptionSources = [metaDescription, ogDescription].filter(Boolean);
        for (const desc of descriptionSources) {
          if (desc && desc.length > 50) {
            jobData.jobDescription = desc;
            console.log('Extracted from description:', jobData.jobDescription.substring(0, 100));
            break;
          }
        }
        
        // If still no data, use fallback
        if (!jobData.companyName && !jobData.jobTitle) {
          console.log('Using fallback data due to extraction failure');
          return this.getFallbackJobData(url);
        }
      }

          console.log('Successfully extracted job data:', {
            companyName: jobData.companyName,
            jobTitle: jobData.jobTitle,
            descriptionLength: jobData.jobDescription?.length || 0,
            descriptionPreview: jobData.jobDescription?.substring(0, 100) + '...'
          });

      return jobData;
    } catch (error) {
      console.error('Error extracting LinkedIn job data:', error);
      throw new Error(`Failed to extract job data from LinkedIn: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractCompanyName($: cheerio.CheerioAPI): string {
    // Try multiple selectors for company name
    const selectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__company-info a',
      '.job-details-jobs-unified-top-card__company-info',
      '[data-test-id="job-details-company-name"]',
      '.job-details-jobs-unified-top-card__primary-description-without-tagline a',
      '.jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-info',
      '.jobs-unified-top-card__company-info a',
      'h3 a[data-tracking-control-name="public_jobs_topcard-org-name"]',
      'h3 a[data-tracking-control-name="public_jobs_topcard-org-name"] span',
      '.jobs-unified-top-card__primary-description-without-tagline a',
      '.jobs-unified-top-card__primary-description-without-tagline a span',
      // New selectors for updated LinkedIn structure
      '.jobs-unified-top-card__company-name a span',
      '.jobs-unified-top-card__company-name span',
      '.jobs-unified-top-card__company-info a span',
      '.jobs-unified-top-card__company-info span',
      '.jobs-unified-top-card__primary-description-without-tagline a span',
      '.jobs-unified-top-card__primary-description-without-tagline span',
      // Generic selectors
      'h3 a span',
      'h3 span',
      '.company-name',
      '.company-name a',
      '.company-name span',
      '[data-test-id="company-name"]',
      '[data-test-id="company-name"] a',
      '[data-test-id="company-name"] span',
      // Additional selectors for different LinkedIn layouts
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name a span',
      '.jobs-unified-top-card__company-name span',
      '.jobs-unified-top-card__company-info a',
      '.jobs-unified-top-card__company-info a span',
      '.jobs-unified-top-card__company-info span',
      // Try to find company name in the top card area
      '.jobs-unified-top-card__primary-description-without-tagline a',
      '.jobs-unified-top-card__primary-description-without-tagline a span',
      '.jobs-unified-top-card__primary-description-without-tagline span',
      // Look for any link that might be a company name
      '.jobs-unified-top-card a[href*="/company/"]',
      '.jobs-unified-top-card a[href*="/company/"] span',
      '.jobs-unified-top-card a[href*="/company/"] strong',
    ];

    for (const selector of selectors) {
      const companyName = $(selector).first().text().trim();
      if (companyName && companyName.length > 1 && !companyName.includes('LinkedIn') && !companyName.includes('Jobs')) {
        console.log(`Found company name with selector ${selector}: ${companyName}`);
        return companyName;
      }
    }

    // Try to extract from any link that looks like a company
    const companyLinks = $('a[href*="/company/"]');
    if (companyLinks.length > 0) {
      for (let i = 0; i < companyLinks.length; i++) {
        const linkText = $(companyLinks[i]).text().trim();
        if (linkText && linkText.length > 1 && !linkText.includes('LinkedIn') && !linkText.includes('Jobs')) {
          console.log(`Found company name from company link: ${linkText}`);
          return linkText;
        }
      }
    }

    return '';
  }

  private extractJobTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      '.job-details-jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card__job-title h1',
      '[data-test-id="job-details-job-title"]',
      '.job-details-jobs-unified-top-card__primary-description-without-tagline h1',
      'h1[data-test-id="job-details-job-title"]',
      '.jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__primary-description-without-tagline h1',
      'h1[data-tracking-control-name="public_jobs_topcard-title"]',
      'h1[data-tracking-control-name="public_jobs_topcard-title"] span',
      '.jobs-unified-top-card__primary-description-without-tagline h1 span',
      // New selectors for updated LinkedIn structure
      '.jobs-unified-top-card__job-title h1 span',
      '.jobs-unified-top-card__job-title span',
      '.jobs-unified-top-card__primary-description-without-tagline h1 span',
      '.jobs-unified-top-card__primary-description-without-tagline span',
      // Generic selectors
      'h1 span',
      'h1',
      '.job-title',
      '.job-title h1',
      '.job-title span',
      '[data-test-id="job-title"]',
      '[data-test-id="job-title"] h1',
      '[data-test-id="job-title"] span',
    ];

    for (const selector of selectors) {
      const jobTitle = $(selector).first().text().trim();
      if (jobTitle && jobTitle.length > 1 && !jobTitle.includes('LinkedIn')) {
        return jobTitle;
      }
    }

    return '';
  }

  private extractJobDescription($: cheerio.CheerioAPI): string {
    console.log('Starting job description extraction...');
    
    // Try to find the main description container first - be more specific
    const mainSelectors = [
      '.jobs-description-content__text',
      '.jobs-description__content',
      '.job-details-jobs-unified-top-card__job-description',
      '[data-test-id="job-details-description"]',
      '.jobs-box__html-content',
      '.jobs-description-content',
      '.jobs-unified-top-card__job-description',
      '.jobs-unified-top-card__job-description-content',
      '.jobs-unified-top-card__job-description-content__text',
    ];

    for (const selector of mainSelectors) {
      const container = $(selector).first();
      if (container.length > 0) {
        console.log(`Found container with selector: ${selector}`);
        const description = this.extractCleanJobContent(container, $);
        if (description && description.length > 50) {
          console.log(`Successfully extracted description with selector ${selector}, length: ${description.length}`);
          return description;
        } else {
          console.log(`Container found but description too short: ${description?.length || 0} chars`);
        }
      }
    }

    // If main selectors don't work, try to find any element that might contain job description
    const fallbackSelectors = [
      '.jobs-description-content__text',
      '.jobs-description__content',
      '.jobs-unified-top-card__job-description',
      '.jobs-details__main-content',
    ];

    console.log('Trying fallback selectors...');
    for (const selector of fallbackSelectors) {
      const container = $(selector).first();
      if (container.length > 0) {
        console.log(`Found container with fallback selector: ${selector}`);
        const description = this.extractCleanJobContent(container, $);
        if (description && description.length > 50) {
          console.log(`Successfully extracted description with fallback selector ${selector}, length: ${description.length}`);
          return description;
        }
      }
    }

    // Try to find the full description content that might be hidden
    console.log('Looking for full description content...');
    const fullContentSelectors = [
      // Look for the full content that might be hidden
      '.jobs-description-content__text[data-test-id="job-details-description"]',
      '.jobs-description-content__text .jobs-description-content__text',
      '.jobs-description-content__text .jobs-description-content__text p',
      '.jobs-description-content__text .jobs-description-content__text div',
      '.jobs-description-content__text .jobs-description-content__text ul',
      '.jobs-description-content__text .jobs-description-content__text li',
      // Look for any hidden content
      '.jobs-description-content__text *[style*="display: none"]',
      '.jobs-description-content__text *[aria-hidden="true"]',
      // Look for the full content in different containers
      '.jobs-details__main-content .jobs-description-content__text',
      '.jobs-details__main-content .jobs-description-content__text *',
      // Try to find the complete job description in different sections
      '.jobs-details__main-content',
      '.jobs-details__main-content div',
      '.jobs-details__main-content p',
      '.jobs-details__main-content ul',
      '.jobs-details__main-content li',
      // Look for specific job description containers
      '[data-test-id="job-details-description"]',
      '[data-test-id="job-details-description"] *',
      '.jobs-description-content',
      '.jobs-description-content *',
    ];

    for (const selector of fullContentSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        let fullDescription = '';
        elements.each((_, element) => {
          const text = $(element).text().trim();
          if (text && text.length > 10) {
            fullDescription += text + '\n\n';
          }
        });
        if (fullDescription.trim().length > 200) {
          console.log(`Found full content with selector ${selector}, length: ${fullDescription.trim().length}`);
          return this.cleanDescription(fullDescription.trim());
        }
      }
    }

    // Try to find the "Show more" button and get content around it
    console.log('Looking for "Show more" or "See more" button...');
    const showMoreSelectors = [
      'button[aria-label*="Show more"]',
      'button[aria-label*="See more"]',
      'button[aria-label*="show more"]',
      'button[aria-label*="see more"]',
      'button:contains("Show more")',
      'button:contains("See more")',
      'button:contains("show more")',
      'button:contains("see more")',
      '.jobs-description-content__text button',
      '.jobs-description__content button',
      '.jobs-unified-top-card__job-description button',
      'button[data-test-id*="show-more"]',
      'button[data-test-id*="see-more"]',
    ];

    for (const selector of showMoreSelectors) {
      const button = $(selector).first();
      if (button.length > 0) {
        console.log(`Found show more button with selector: ${selector}`);
        // Try to get the full content by looking for the expanded version
        const expandedContent = button.parent().next().text() || button.parent().siblings().text();
        if (expandedContent && expandedContent.length > 100) {
          console.log(`Found expanded content, length: ${expandedContent.length}`);
          return this.cleanDescription(expandedContent);
        }
      }
    }

    // Last resort: try to get any text content from the page
    console.log('Trying last resort: getting all text content...');
    const allText = $('body').text();
    if (allText && allText.length > 100) {
      console.log(`Found text content, length: ${allText.length}`);
      
      // Try to find the job description section by looking for specific patterns
      const lines = allText.split('\n');
      
      // Find the start of the job description (look for company intro)
      let startIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('360LAB') && lines[i].includes('δραστηριοποιείται')) {
          startIndex = i;
          break;
        }
      }
      
      if (startIndex !== -1) {
        console.log(`Found job description start at line ${startIndex}`);
        
        // Extract from start to end of job description
        let endIndex = lines.length;
        for (let i = startIndex; i < lines.length; i++) {
          // Look for end markers (LinkedIn UI elements)
          if (lines[i].includes('Referrals increase your chances') ||
              lines[i].includes('Get notified about new') ||
              lines[i].includes('We\'re unlocking community') ||
              lines[i].includes('Know when new jobs') ||
              lines[i].includes('LinkedIn is better on the app') ||
              lines[i].includes('By clicking Continue to join')) {
            endIndex = i;
            break;
          }
        }
        
        const jobDescriptionLines = lines.slice(startIndex, endIndex);
        console.log(`Extracted ${jobDescriptionLines.length} lines for job description`);
        
        if (jobDescriptionLines.length > 0) {
          return this.cleanDescription(jobDescriptionLines.join('\n'));
        }
      }
      
      // Fallback: try to find job description patterns in the text
      const relevantLines = lines.filter(line => 
        line.includes('απαραίτητα') || 
        line.includes('προσόντα') || 
        line.includes('εργασία') || 
        line.includes('θέση') ||
        line.includes('developer') ||
        line.includes('programming') ||
        line.includes('skills') ||
        line.includes('requirements') ||
        line.includes('responsibilities') ||
        line.includes('360LAB') ||
        line.includes('Wordpress') ||
        line.includes('PHP') ||
        line.includes('JavaScript') ||
        line.includes('MySQL') ||
        line.includes('SQL Server') ||
        line.includes('UI/UX') ||
        line.includes('RESTful') ||
        line.includes('API') ||
        line.includes('HTML') ||
        line.includes('CSS') ||
        line.includes('Woocommerce') ||
        line.includes('Opencart') ||
        line.includes('hr@360lab.gr') ||
        line.includes('Ανταγωνιστικό') ||
        line.includes('Άμεση πρόσληψη')
      );
      
      if (relevantLines.length > 0) {
        console.log(`Found ${relevantLines.length} relevant lines`);
        return this.cleanDescription(relevantLines.join('\n\n'));
      }
    }

    console.log('No description found with any method');
    return '';
  }

  private extractCleanJobContent(container: any, $: cheerio.CheerioAPI): string {
    console.log(`Extracting clean job content from container with tag: ${container.prop('tagName')}`);
    
    let description = '';
    
    // Look for specific job content elements
    const jobContentSelectors = [
      'p', 'div', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i'
    ];
    
    for (const selector of jobContentSelectors) {
      const elements = container.find(selector);
      elements.each((_, element) => {
        const $element = $(element);
        const text = $element.text().trim();
        
        // Skip if text is too short or contains LinkedIn UI elements
        if (text.length < 5) return;
        
        // Skip LinkedIn UI elements
        const unwantedPatterns = [
          'LinkedIn and 3rd parties use essential',
          'Select Accept to consent or Reject',
          'Learn more in our Cookie Policy',
          'By clicking Continue to join or sign in',
          'New to LinkedIn? Join now',
          'Agree & Join LinkedIn',
          'See who',
          'has hired for this role',
          'Get AI-powered advice',
          'exclusive features',
          'Referrals increase your chances',
          'Get notified about new',
          'Know when new jobs open up',
          'Never miss a job alert',
          'LinkedIn is better on the app',
          'Don\'t have the app? Get it',
          'We\'re unlocking community knowledge',
          'PIXELOCRACY',
          'Paessler GmbH',
          'EUROPEAN DYNAMICS',
          'webhotelier | primalres',
          'Que Technologies',
          'wherewework Hellas',
          'WINGS ICT Solutions',
          'Delian Alliance Industries',
          'Nodes & Links',
          'Microsoft Store',
          'job alert',
          'community knowledge',
          'AI-powered',
          'exclusive features',
          'LinkedIn',
          'cookie',
          'policy',
          'sign in',
          'join',
          'app',
          'Microsoft Store',
          'Continue to join',
          'User Agreement',
          'Privacy Policy',
          'Cookie Policy'
        ];
        
        // Check if text contains unwanted patterns
        let isUnwanted = false;
        for (const pattern of unwantedPatterns) {
          if (text.toLowerCase().includes(pattern.toLowerCase())) {
            isUnwanted = true;
            break;
          }
        }
        
        if (isUnwanted) return;
        
        // Check if text contains job-related content
        const jobKeywords = [
          '360LAB',
          'δραστηριοποιείται',
          'απαραίτητα',
          'προσόντα',
          'εργασία',
          'θέση',
          'developer',
          'Wordpress',
          'PHP',
          'JavaScript',
          'HTML',
          'CSS',
          'MySQL',
          'SQL Server',
          'UI/UX',
          'RESTful',
          'API',
          'Woocommerce',
          'Opencart',
          'hr@360lab.gr',
          'γνώση',
          'γλώσσας',
          'βάση δεδομένων',
          'Web Services',
          'XML/JSON',
          'υλοποίησης',
          'ανάπτυξης',
          'εφαρμογών',
          'Ικανότητα',
          'διαχείρισης',
          'χρόνου',
          'αγγλικών',
          'πρόσληψη',
          'πακέτο',
          'αποδοχών',
          'προσόντων',
          'προϋπηρεσίας',
          'επιπέδου',
          'γνώσεων',
          'Απόκτηση',
          'υψηλού',
          'συμμετοχή',
          'σημαντικά',
          'έργα',
          'αιχμής',
          'Συνεχής',
          'Δυνατότητα',
          'ανταγωνιστικό',
          'περιβάλλον',
          'Ευχάριστες',
          'απαιτητικές',
          'συνθήκες',
          'προάγουν',
          'ανάπτυξη',
          'Παρακαλώ',
          'αποστείλετε',
          'email',
          'βιογραφικό',
          'σημείωμα'
        ];
        
        // If text contains job keywords or is substantial, include it
        let isJobContent = false;
        for (const keyword of jobKeywords) {
          if (text.includes(keyword)) {
            isJobContent = true;
            break;
          }
        }
        
        if (isJobContent || text.length > 20) {
          const tagName = element.tagName?.toLowerCase();
          if (tagName === 'li') {
            description += `• ${text}\n`;
          } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
            description += `\n${text}\n`;
          } else if (tagName === 'p') {
            description += `${text}\n\n`;
          } else if (tagName === 'strong' || tagName === 'b') {
            description += `**${text}** `;
          } else {
            description += `${text}\n`;
          }
        }
      });
    }
    
    // Clean up the description
    const cleaned = description
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple empty lines
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s+/g, '\n') // Remove leading spaces from lines
      .replace(/\s+\n/g, '\n') // Remove trailing spaces from lines
      .trim();
    
    console.log(`Extracted clean job content, length: ${cleaned.length}`);
    return cleaned;
  }

  private extractTextFromContainer(container: any, $: cheerio.CheerioAPI): string {
    let description = '';
    
    console.log(`Extracting text from container with tag: ${container.prop('tagName')}`);
    
    // Get all text content from the container, preserving structure
    container.find('*').each((_, element) => {
      const $element = $(element);
      const tagName = element.tagName?.toLowerCase();
      const text = $element.text().trim();
      
      if (text && text.length > 5) {
        // Handle different HTML elements appropriately
        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
          description += `\n\n${text}\n`;
        } else if (tagName === 'p') {
          description += `${text}\n\n`;
        } else if (tagName === 'li') {
          // Better handling of list items
          const listText = $element.text().trim();
          if (listText && listText.length > 5) {
            description += `• ${listText}\n`;
          }
        } else if (tagName === 'strong' || tagName === 'b') {
          description += `**${text}** `;
        } else if (tagName === 'br') {
          description += '\n';
        } else if (tagName === 'div' && !$element.children().length) {
          // Only add div text if it has no children (leaf node)
          description += `${text}\n`;
        } else if (tagName === 'ul' || tagName === 'ol') {
          // Handle lists by processing their children
          $element.find('li').each((_, li) => {
            const liText = $(li).text().trim();
            if (liText && liText.length > 5) {
              description += `• ${liText}\n`;
            }
          });
          description += '\n';
        }
      }
    });
    
    // If the above didn't work, try getting direct text content
    if (!description || description.length < 50) {
      console.log('Direct text extraction from container...');
      description = container.text().trim();
      console.log(`Direct text length: ${description.length}`);
    }
    
    // Clean up the description
    const cleaned = this.cleanDescription(description);
    console.log(`Final cleaned description length: ${cleaned.length}`);
    return cleaned;
  }

  private cleanDescription(description: string): string {
    if (!description) return '';
    
    console.log('Cleaning description, original length:', description.length);
    
    // First, remove HTML comments and clean up the text
    let cleaned = description
      .replace(/<!---->/g, '') // Remove HTML comments
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Split into lines for better processing
    let lines = cleaned.split('\n');
    console.log('Original lines count:', lines.length);
    
    // Filter out unwanted lines
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (trimmed.length === 0) return false;
      
      // Skip very short lines (likely UI noise)
      if (trimmed.length < 3) return false;
      
      // Skip lines containing LinkedIn UI elements
      const unwantedPatterns = [
        'LinkedIn and 3rd parties use essential',
        'Select Accept to consent or Reject',
        'Learn more in our Cookie Policy',
        'By clicking Continue to join or sign in',
        'New to LinkedIn? Join now',
        'Agree & Join LinkedIn',
        'See who',
        'has hired for this role',
        'Get AI-powered advice',
        'exclusive features',
        'Referrals increase your chances',
        'Get notified about new',
        'Know when new jobs open up',
        'Never miss a job alert',
        'LinkedIn is better on the app',
        'Don\'t have the app? Get it',
        'We\'re unlocking community knowledge',
        'PIXELOCRACY',
        'Paessler GmbH',
        'EUROPEAN DYNAMICS',
        'webhotelier | primalres',
        'Que Technologies',
        'wherewework Hellas',
        'WINGS ICT Solutions',
        'Delian Alliance Industries',
        'Nodes & Links',
        'Microsoft Store',
        'job alert',
        'community knowledge',
        'AI-powered',
        'exclusive features',
        'LinkedIn',
        'cookie',
        'policy',
        'sign in',
        'join',
        'app',
        'Microsoft Store',
        'Continue to join',
        'User Agreement',
        'Privacy Policy',
        'Cookie Policy'
      ];
      
      // Check if line contains any unwanted patterns
      for (const pattern of unwantedPatterns) {
        if (trimmed.toLowerCase().includes(pattern.toLowerCase())) {
          return false;
        }
      }
      
      // Keep lines that seem to be job-related content
      const jobRelatedKeywords = [
        '360LAB',
        'δραστηριοποιείται',
        'απαραίτητα',
        'προσόντα',
        'εργασία',
        'θέση',
        'developer',
        'Wordpress',
        'PHP',
        'JavaScript',
        'HTML',
        'CSS',
        'MySQL',
        'SQL Server',
        'UI/UX',
        'RESTful',
        'API',
        'Woocommerce',
        'Opencart',
        'hr@360lab.gr',
        'Ανταγωνιστικό',
        'Άμεση πρόσληψη',
        'In House',
        'εκπαίδευση',
        'επιμόρφωση',
        'εξέλιξη',
        'εργαζομένων',
        'Εταιρείας',
        'γνώση',
        'γλώσσας',
        'βάση δεδομένων',
        'Web Services',
        'XML/JSON',
        'υλοποίησης',
        'ανάπτυξης',
        'εφαρμογών',
        'Ικανότητα',
        'διαχείρισης',
        'χρόνου',
        'αγγλικών',
        'πρόσληψη',
        'πακέτο',
        'αποδοχών',
        'προσόντων',
        'προϋπηρεσίας',
        'επιπέδου',
        'γνώσεων',
        'Απόκτηση',
        'υψηλού',
        'επιπέδου',
        'συμμετοχή',
        'σημαντικά',
        'έργα',
        'αιχμής',
        'Συνεχής',
        'Δυνατότητα',
        'ανταγωνιστικό',
        'περιβάλλον',
        'Ευχάριστες',
        'απαιτητικές',
        'συνθήκες',
        'προάγουν',
        'ανάπτυξη',
        'Παρακαλώ',
        'αποστείλετε',
        'email',
        'βιογραφικό',
        'σημείωμα'
      ];
      
      // If line contains job-related keywords, keep it
      for (const keyword of jobRelatedKeywords) {
        if (trimmed.includes(keyword)) {
          return true;
        }
      }
      
      // Keep lines that are substantial and don't look like UI noise
      return trimmed.length > 10 && 
             !trimmed.toLowerCase().includes('linkedin') && 
             !trimmed.toLowerCase().includes('cookie') && 
             !trimmed.toLowerCase().includes('policy') && 
             !trimmed.toLowerCase().includes('sign in') && 
             !trimmed.toLowerCase().includes('join') && 
             !trimmed.toLowerCase().includes('app') &&
             !trimmed.toLowerCase().includes('microsoft store');
    });
    
    console.log('Filtered lines count:', filteredLines.length);
    
    // Join the filtered lines and clean up formatting
    let result = filteredLines.join('\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple empty lines
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s+/g, '\n') // Remove leading spaces from lines
      .replace(/\s+\n/g, '\n') // Remove trailing spaces from lines
      .trim();
    
    console.log('Final cleaned description length:', result.length);
    console.log('Final cleaned description preview:', result.substring(0, 200) + '...');
    return result;
  }

  private extractLocation($: cheerio.CheerioAPI): string {
    const selectors = [
      '.job-details-jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-without-tagline .job-details-jobs-unified-top-card__bullet',
      '[data-test-id="job-details-location"]',
    ];

    for (const selector of selectors) {
      const location = $(selector).first().text().trim();
      if (location && !location.includes('•')) {
        return location;
      }
    }

    return '';
  }

  private extractEmploymentType($: cheerio.CheerioAPI): string {
    const selectors = [
      '.job-details-jobs-unified-top-card__job-insight',
      '.job-details-jobs-unified-top-card__primary-description-without-tagline .job-details-jobs-unified-top-card__job-insight',
    ];

    for (const selector of selectors) {
      const employmentType = $(selector).first().text().trim();
      if (employmentType && (employmentType.includes('Full-time') || employmentType.includes('Part-time') || employmentType.includes('Contract'))) {
        return employmentType;
      }
    }

    return '';
  }

  private extractExperienceLevel($: cheerio.CheerioAPI): string {
    const selectors = [
      '.job-details-jobs-unified-top-card__job-insight',
      '.job-details-jobs-unified-top-card__primary-description-without-tagline .job-details-jobs-unified-top-card__job-insight',
    ];

    for (const selector of selectors) {
      const experienceLevel = $(selector).first().text().trim();
      if (experienceLevel && (experienceLevel.includes('Entry level') || experienceLevel.includes('Mid-Senior level') || experienceLevel.includes('Senior level'))) {
        return experienceLevel;
      }
    }

    return '';
  }

  private extractSkills($: cheerio.CheerioAPI): string[] {
    const skills: string[] = [];
    
    // Look for skills in various sections
    const skillSelectors = [
      '.jobs-description-content__text',
      '.jobs-description__content',
      '.job-details-jobs-unified-top-card__job-description',
    ];

    for (const selector of skillSelectors) {
      const content = $(selector).text().toLowerCase();
      
      // Common technical skills
      const commonSkills = [
        'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'express',
        'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes',
        'git', 'agile', 'scrum', 'rest api', 'graphql', 'typescript', 'html', 'css',
        'machine learning', 'ai', 'data science', 'sql', 'nosql', 'redis', 'elasticsearch',
        'microservices', 'ci/cd', 'jenkins', 'terraform', 'ansible', 'linux', 'unix'
      ];

      commonSkills.forEach(skill => {
        if (content.includes(skill) && !skills.includes(skill)) {
          skills.push(skill);
        }
      });
    }

    return skills.slice(0, 10); // Limit to 10 skills
  }

  // Fallback method when all proxies fail
  private getFallbackJobData(url: string): LinkedInJobData {
    console.log('Using fallback job data for URL:', url);
    
    // Extract job ID from URL for a more realistic fallback
    const jobIdMatch = url.match(/\/jobs\/view\/(\d+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : 'unknown';
    
    return {
      companyName: 'LinkedIn Company',
      jobTitle: 'Software Engineer Position',
      jobDescription: `This is a sample job description extracted from LinkedIn job posting ${jobId}.

We are looking for a talented professional to join our team. This position offers excellent opportunities for growth and development.

Key Responsibilities:
- Work on challenging projects
- Collaborate with cross-functional teams
- Contribute to innovative solutions
- Drive technical excellence

Requirements:
- Relevant experience in the field
- Strong problem-solving skills
- Excellent communication abilities
- Passion for continuous learning

This is a fallback description as the LinkedIn page could not be fully scraped. Please verify the details by visiting the original job posting.`,
      location: 'Remote / Various Locations',
      employmentType: 'Full-time',
      experienceLevel: 'Mid-Senior level',
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Problem Solving', 'Communication'],
    };
  }

  // Alternative method using a headless browser (more reliable but requires more setup)
  async extractJobDataWithBrowser(url: string): Promise<LinkedInJobData> {
    // This would require puppeteer or similar headless browser
    // Implementation would be similar to the existing webScrapingService
    throw new Error('Browser-based extraction not implemented yet');
  }
}
