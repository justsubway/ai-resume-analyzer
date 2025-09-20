import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export class WebScrapingService {
  private browser: any;
  private isInitialized: boolean = false;

  async initialize() {
    if (this.isInitialized) return;

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.isInitialized = true;
  }

  async searchJobs(filters: JobSearchFilters): Promise<JobData[]> {
    await this.initialize();

    const jobs: JobData[] = [];

    try {
      // Search multiple job sites in parallel
      const searchPromises = [
        this.searchLinkedInJobs(filters),
        this.searchIndeedJobs(filters),
        this.searchXrisiEfkairiaJobs(filters),
        this.searchKarieraJobs(filters),
        this.searchSkywalkerJobs(filters)
      ];

      const results = await Promise.allSettled(searchPromises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          jobs.push(...result.value);
        } else {
          console.error('Job search failed:', result.reason);
        }
      });

      // Remove duplicates and sort by relevance
      const uniqueJobs = this.removeDuplicates(jobs);
      const sortedJobs = this.sortByRelevance(uniqueJobs, filters);

      return sortedJobs;

    } catch (error) {
      console.error('Error searching for jobs:', error);
      throw error;
    }
  }

  private async searchLinkedInJobs(filters: JobSearchFilters): Promise<JobData[]> {
    const page = await this.browser.newPage();
    const jobs: JobData[] = [];

    try {
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Build LinkedIn search URL
      const searchUrl = this.buildLinkedInSearchUrl(filters);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for job listings to load
      await page.waitForSelector('[data-job-id]', { timeout: 15000 });

      // Extract job data
      const jobElements = await page.$$('[data-job-id]');
      
      for (const element of jobElements.slice(0, 20)) {
        try {
          const jobData = await this.extractLinkedInJobData(element, page);
          if (jobData) {
            jobs.push(jobData);
          }
        } catch (error) {
          console.error('Error extracting LinkedIn job:', error);
        }
      }

    } catch (error) {
      console.error('Error scraping LinkedIn jobs:', error);
    } finally {
      await page.close();
    }

    return jobs;
  }

  private async searchIndeedJobs(filters: JobSearchFilters): Promise<JobData[]> {
    const page = await this.browser.newPage();
    const jobs: JobData[] = [];

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const searchUrl = this.buildIndeedSearchUrl(filters);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForSelector('[data-jk]', { timeout: 15000 });

      const jobElements = await page.$$('[data-jk]');
      
      for (const element of jobElements.slice(0, 20)) {
        try {
          const jobData = await this.extractIndeedJobData(element, page);
          if (jobData) {
            jobs.push(jobData);
          }
        } catch (error) {
          console.error('Error extracting Indeed job:', error);
        }
      }

    } catch (error) {
      console.error('Error scraping Indeed jobs:', error);
    } finally {
      await page.close();
    }

    return jobs;
  }

  private async searchXrisiEfkairiaJobs(filters: JobSearchFilters): Promise<JobData[]> {
    const page = await this.browser.newPage();
    const jobs: JobData[] = [];

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const searchUrl = this.buildXrisiEfkairiaSearchUrl(filters);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for job listings
      await page.waitForSelector('.job-item, .job-listing, .vacancy-item', { timeout: 15000 });

      const jobElements = await page.$$('.job-item, .job-listing, .vacancy-item');
      
      for (const element of jobElements.slice(0, 20)) {
        try {
          const jobData = await this.extractXrisiEfkairiaJobData(element, page);
          if (jobData) {
            jobs.push(jobData);
          }
        } catch (error) {
          console.error('Error extracting Xrisi Efkairia job:', error);
        }
      }

    } catch (error) {
      console.error('Error scraping Xrisi Efkairia jobs:', error);
    } finally {
      await page.close();
    }

    return jobs;
  }

  private async searchKarieraJobs(filters: JobSearchFilters): Promise<JobData[]> {
    const page = await this.browser.newPage();
    const jobs: JobData[] = [];

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const searchUrl = this.buildKarieraSearchUrl(filters);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForSelector('.job-item, .vacancy-item, .job-card', { timeout: 15000 });

      const jobElements = await page.$$('.job-item, .vacancy-item, .job-card');
      
      for (const element of jobElements.slice(0, 20)) {
        try {
          const jobData = await this.extractKarieraJobData(element, page);
          if (jobData) {
            jobs.push(jobData);
          }
        } catch (error) {
          console.error('Error extracting Kariera job:', error);
        }
      }

    } catch (error) {
      console.error('Error scraping Kariera jobs:', error);
    } finally {
      await page.close();
    }

    return jobs;
  }

  private async searchSkywalkerJobs(filters: JobSearchFilters): Promise<JobData[]> {
    const page = await this.browser.newPage();
    const jobs: JobData[] = [];

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const searchUrl = this.buildSkywalkerSearchUrl(filters);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForSelector('.job-item, .vacancy-item, .job-listing', { timeout: 15000 });

      const jobElements = await page.$$('.job-item, .vacancy-item, .job-listing');
      
      for (const element of jobElements.slice(0, 20)) {
        try {
          const jobData = await this.extractSkywalkerJobData(element, page);
          if (jobData) {
            jobs.push(jobData);
          }
        } catch (error) {
          console.error('Error extracting Skywalker job:', error);
        }
      }

    } catch (error) {
      console.error('Error scraping Skywalker jobs:', error);
    } finally {
      await page.close();
    }

    return jobs;
  }

  // URL Builders
  private buildLinkedInSearchUrl(filters: JobSearchFilters): string {
    const baseUrl = 'https://www.linkedin.com/jobs/search/';
    const params = new URLSearchParams();

    if (filters.keywords.length > 0) {
      params.append('keywords', filters.keywords.join(' '));
    }

    if (filters.location) {
      params.append('location', filters.location);
    }

    if (filters.remote) {
      params.append('f_WT', '2');
    }

    if (filters.experienceLevel.length > 0) {
      const experienceMap = {
        'entry': '1',
        'mid': '2',
        'senior': '3',
        'executive': '4'
      };
      const experienceCodes = filters.experienceLevel.map(level => experienceMap[level]).filter(Boolean);
      if (experienceCodes.length > 0) {
        params.append('f_E', experienceCodes.join(','));
      }
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private buildIndeedSearchUrl(filters: JobSearchFilters): string {
    const baseUrl = 'https://www.indeed.com/jobs';
    const params = new URLSearchParams();

    if (filters.keywords.length > 0) {
      params.append('q', filters.keywords.join(' '));
    }

    if (filters.location) {
      params.append('l', filters.location);
    }

    if (filters.remote) {
      params.append('sc', '0kf:remote');
    }

    if (filters.salaryMin) {
      params.append('salary', filters.salaryMin.toString());
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private buildXrisiEfkairiaSearchUrl(filters: JobSearchFilters): string {
    const baseUrl = 'https://www.xrisi-efkairia.gr/jobs';
    const params = new URLSearchParams();

    if (filters.keywords.length > 0) {
      params.append('search', filters.keywords.join(' '));
    }

    if (filters.location) {
      params.append('location', filters.location);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private buildKarieraSearchUrl(filters: JobSearchFilters): string {
    const baseUrl = 'https://www.kariera.gr/jobs';
    const params = new URLSearchParams();

    if (filters.keywords.length > 0) {
      params.append('q', filters.keywords.join(' '));
    }

    if (filters.location) {
      params.append('location', filters.location);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private buildSkywalkerSearchUrl(filters: JobSearchFilters): string {
    const baseUrl = 'https://www.skywalker.gr/jobs';
    const params = new URLSearchParams();

    if (filters.keywords.length > 0) {
      params.append('search', filters.keywords.join(' '));
    }

    if (filters.location) {
      params.append('location', filters.location);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // Job Data Extractors
  private async extractLinkedInJobData(element: any, page: any): Promise<JobData | null> {
    try {
      const jobId = await element.evaluate((el: any) => el.getAttribute('data-job-id'));
      const title = await element.$eval('h3', (el: any) => el.textContent?.trim());
      const company = await element.$eval('[data-test="job-company-name"]', (el: any) => el.textContent?.trim());
      const location = await element.$eval('[data-test="job-location"]', (el: any) => el.textContent?.trim());
      const url = await element.$eval('a', (el: any) => el.href);

      if (!jobId || !title || !company) return null;

      return {
        id: `linkedin_${jobId}`,
        title,
        company,
        location: location || 'Not specified',
        description: '',
        requirements: [],
        requiredSkills: [],
        preferredSkills: [],
        employmentType: 'full-time',
        remote: location?.toLowerCase().includes('remote') || false,
        industry: '',
        experienceLevel: 'mid',
        url,
        source: 'linkedin',
        postedDate: new Date()
      };
    } catch (error) {
      console.error('Error extracting LinkedIn job data:', error);
      return null;
    }
  }

  private async extractIndeedJobData(element: any, page: any): Promise<JobData | null> {
    try {
      const jobId = await element.evaluate((el: any) => el.getAttribute('data-jk'));
      const title = await element.$eval('h2 a span', (el: any) => el.textContent?.trim());
      const company = await element.$eval('[data-testid="company-name"]', (el: any) => el.textContent?.trim());
      const location = await element.$eval('[data-testid="job-location"]', (el: any) => el.textContent?.trim());
      const url = await element.$eval('h2 a', (el: any) => el.href);

      if (!jobId || !title || !company) return null;

      return {
        id: `indeed_${jobId}`,
        title,
        company,
        location: location || 'Not specified',
        description: '',
        requirements: [],
        requiredSkills: [],
        preferredSkills: [],
        employmentType: 'full-time',
        remote: location?.toLowerCase().includes('remote') || false,
        industry: '',
        experienceLevel: 'mid',
        url,
        source: 'indeed',
        postedDate: new Date()
      };
    } catch (error) {
      console.error('Error extracting Indeed job data:', error);
      return null;
    }
  }

  private async extractXrisiEfkairiaJobData(element: any, page: any): Promise<JobData | null> {
    try {
      const title = await element.$eval('h3, .job-title, .vacancy-title', (el: any) => el.textContent?.trim());
      const company = await element.$eval('.company-name, .employer, .company', (el: any) => el.textContent?.trim());
      const location = await element.$eval('.location, .job-location, .city', (el: any) => el.textContent?.trim());
      const url = await element.$eval('a', (el: any) => el.href);

      if (!title || !company) return null;

      return {
        id: `xrisi_efkairia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        company,
        location: location || 'Not specified',
        description: '',
        requirements: [],
        requiredSkills: [],
        preferredSkills: [],
        employmentType: 'full-time',
        remote: false,
        industry: '',
        experienceLevel: 'mid',
        url: url || '#',
        source: 'other',
        postedDate: new Date()
      };
    } catch (error) {
      console.error('Error extracting Xrisi Efkairia job data:', error);
      return null;
    }
  }

  private async extractKarieraJobData(element: any, page: any): Promise<JobData | null> {
    try {
      const title = await element.$eval('h3, .job-title, .vacancy-title', (el: any) => el.textContent?.trim());
      const company = await element.$eval('.company-name, .employer, .company', (el: any) => el.textContent?.trim());
      const location = await element.$eval('.location, .job-location, .city', (el: any) => el.textContent?.trim());
      const url = await element.$eval('a', (el: any) => el.href);

      if (!title || !company) return null;

      return {
        id: `kariera_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        company,
        location: location || 'Not specified',
        description: '',
        requirements: [],
        requiredSkills: [],
        preferredSkills: [],
        employmentType: 'full-time',
        remote: false,
        industry: '',
        experienceLevel: 'mid',
        url: url || '#',
        source: 'other',
        postedDate: new Date()
      };
    } catch (error) {
      console.error('Error extracting Kariera job data:', error);
      return null;
    }
  }

  private async extractSkywalkerJobData(element: any, page: any): Promise<JobData | null> {
    try {
      const title = await element.$eval('h3, .job-title, .vacancy-title', (el: any) => el.textContent?.trim());
      const company = await element.$eval('.company-name, .employer, .company', (el: any) => el.textContent?.trim());
      const location = await element.$eval('.location, .job-location, .city', (el: any) => el.textContent?.trim());
      const url = await element.$eval('a', (el: any) => el.href);

      if (!title || !company) return null;

      return {
        id: `skywalker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        company,
        location: location || 'Not specified',
        description: '',
        requirements: [],
        requiredSkills: [],
        preferredSkills: [],
        employmentType: 'full-time',
        remote: false,
        industry: '',
        experienceLevel: 'mid',
        url: url || '#',
        source: 'other',
        postedDate: new Date()
      };
    } catch (error) {
      console.error('Error extracting Skywalker job data:', error);
      return null;
    }
  }

  // Utility methods
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

  private sortByRelevance(jobs: JobData[], filters: JobSearchFilters): JobData[] {
    return jobs.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, filters);
      const bScore = this.calculateRelevanceScore(b, filters);
      return bScore - aScore;
    });
  }

  private calculateRelevanceScore(job: JobData, filters: JobSearchFilters): number {
    let score = 0;

    const jobText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
    
    filters.keywords.forEach(keyword => {
      if (jobText.includes(keyword.toLowerCase())) {
        score += 2;
      }
    });

    if (filters.location && job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      score += 3;
    }

    if (filters.remote && job.remote) {
      score += 2;
    }

    if (filters.salaryMin && job.salary && job.salary.min >= filters.salaryMin) {
      score += 1;
    }

    return score;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.isInitialized = false;
    }
  }
}

