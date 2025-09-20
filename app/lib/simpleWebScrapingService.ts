import * as cheerio from 'cheerio';

export class SimpleWebScrapingService {
  
  async searchJobs(filters: JobSearchFilters): Promise<JobData[]> {
    const jobs: JobData[] = [];

    try {
      // Search multiple job sites in parallel
      const searchPromises = [
        this.searchIndeedJobs(filters),
        this.searchXrisiEfkairiaJobs(filters),
        this.searchKarieraJobs(filters),
        this.searchSkywalkerJobs(filters),
        this.searchErgasiaJobs(filters)
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

  private async searchIndeedJobs(filters: JobSearchFilters): Promise<JobData[]> {
    try {
      const searchUrl = this.buildIndeedSearchUrl(filters);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const jobs: JobData[] = [];

      $('[data-jk]').each((index, element) => {
        if (index >= 20) return false; // Limit to 20 jobs

        try {
          const $el = $(element);
          const jobId = $el.attr('data-jk');
          const title = $el.find('h2 a span').text().trim();
          const company = $el.find('[data-testid="company-name"]').text().trim();
          const location = $el.find('[data-testid="job-location"]').text().trim();
          const url = $el.find('h2 a').attr('href');

          if (jobId && title && company) {
            jobs.push({
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
              url: url ? `https://www.indeed.com${url}` : '#',
              source: 'indeed',
              postedDate: new Date()
            });
          }
        } catch (error) {
          console.error('Error parsing Indeed job:', error);
        }
      });

      return jobs;
    } catch (error) {
      console.error('Error scraping Indeed jobs:', error);
      return [];
    }
  }

  private async searchXrisiEfkairiaJobs(filters: JobSearchFilters): Promise<JobData[]> {
    try {
      const searchUrl = this.buildXrisiEfkairiaSearchUrl(filters);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const jobs: JobData[] = [];

      $('.job-item, .job-listing, .vacancy-item, .job-card').each((index, element) => {
        if (index >= 20) return false;

        try {
          const $el = $(element);
          const title = $el.find('h3, .job-title, .vacancy-title').text().trim();
          const company = $el.find('.company-name, .employer, .company').text().trim();
          const location = $el.find('.location, .job-location, .city').text().trim();
          const url = $el.find('a').attr('href');

          if (title && company) {
            jobs.push({
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
              url: url ? (url.startsWith('http') ? url : `https://www.xrisi-efkairia.gr${url}`) : '#',
              source: 'other',
              postedDate: new Date()
            });
          }
        } catch (error) {
          console.error('Error parsing Xrisi Efkairia job:', error);
        }
      });

      return jobs;
    } catch (error) {
      console.error('Error scraping Xrisi Efkairia jobs:', error);
      return [];
    }
  }

  private async searchKarieraJobs(filters: JobSearchFilters): Promise<JobData[]> {
    try {
      const searchUrl = this.buildKarieraSearchUrl(filters);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const jobs: JobData[] = [];

      $('.job-item, .vacancy-item, .job-card, .job-listing').each((index, element) => {
        if (index >= 20) return false;

        try {
          const $el = $(element);
          const title = $el.find('h3, .job-title, .vacancy-title').text().trim();
          const company = $el.find('.company-name, .employer, .company').text().trim();
          const location = $el.find('.location, .job-location, .city').text().trim();
          const url = $el.find('a').attr('href');

          if (title && company) {
            jobs.push({
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
              url: url ? (url.startsWith('http') ? url : `https://www.kariera.gr${url}`) : '#',
              source: 'other',
              postedDate: new Date()
            });
          }
        } catch (error) {
          console.error('Error parsing Kariera job:', error);
        }
      });

      return jobs;
    } catch (error) {
      console.error('Error scraping Kariera jobs:', error);
      return [];
    }
  }

  private async searchSkywalkerJobs(filters: JobSearchFilters): Promise<JobData[]> {
    try {
      const searchUrl = this.buildSkywalkerSearchUrl(filters);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const jobs: JobData[] = [];

      $('.job-item, .vacancy-item, .job-listing, .job-card').each((index, element) => {
        if (index >= 20) return false;

        try {
          const $el = $(element);
          const title = $el.find('h3, .job-title, .vacancy-title').text().trim();
          const company = $el.find('.company-name, .employer, .company').text().trim();
          const location = $el.find('.location, .job-location, .city').text().trim();
          const url = $el.find('a').attr('href');

          if (title && company) {
            jobs.push({
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
              url: url ? (url.startsWith('http') ? url : `https://www.skywalker.gr${url}`) : '#',
              source: 'other',
              postedDate: new Date()
            });
          }
        } catch (error) {
          console.error('Error parsing Skywalker job:', error);
        }
      });

      return jobs;
    } catch (error) {
      console.error('Error scraping Skywalker jobs:', error);
      return [];
    }
  }

  private async searchErgasiaJobs(filters: JobSearchFilters): Promise<JobData[]> {
    try {
      const searchUrl = this.buildErgasiaSearchUrl(filters);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const jobs: JobData[] = [];

      $('.job-item, .vacancy-item, .job-listing, .job-card').each((index, element) => {
        if (index >= 20) return false;

        try {
          const $el = $(element);
          const title = $el.find('h3, .job-title, .vacancy-title').text().trim();
          const company = $el.find('.company-name, .employer, .company').text().trim();
          const location = $el.find('.location, .job-location, .city').text().trim();
          const url = $el.find('a').attr('href');

          if (title && company) {
            jobs.push({
              id: `ergasia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
              url: url ? (url.startsWith('http') ? url : `https://www.ergasia.gr${url}`) : '#',
              source: 'other',
              postedDate: new Date()
            });
          }
        } catch (error) {
          console.error('Error parsing Ergasia job:', error);
        }
      });

      return jobs;
    } catch (error) {
      console.error('Error scraping Ergasia jobs:', error);
      return [];
    }
  }

  // URL Builders
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

  private buildErgasiaSearchUrl(filters: JobSearchFilters): string {
    const baseUrl = 'https://www.ergasia.gr/jobs';
    const params = new URLSearchParams();

    if (filters.keywords.length > 0) {
      params.append('search', filters.keywords.join(' '));
    }

    if (filters.location) {
      params.append('location', filters.location);
    }

    return `${baseUrl}?${params.toString()}`;
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
}

