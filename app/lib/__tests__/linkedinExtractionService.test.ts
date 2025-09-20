import { LinkedInExtractionService } from '../linkedinExtractionService';

// Mock cheerio
jest.mock('cheerio', () => ({
  load: jest.fn(() => ({
    text: jest.fn(() => 'Mock job description'),
    first: jest.fn(() => ({
      text: jest.fn(() => 'Mock Company Name')
    }))
  }))
}));

// Mock fetch
global.fetch = jest.fn();

describe('LinkedInExtractionService', () => {
  let service: LinkedInExtractionService;

  beforeEach(() => {
    service = new LinkedInExtractionService();
    jest.clearAllMocks();
  });

  describe('extractJobData', () => {
    it('should extract job data from LinkedIn URL', async () => {
      const mockHtml = '<html><body>Mock HTML content</body></html>';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      });

      const result = await service.extractJobData('https://www.linkedin.com/jobs/view/1234567890');

      expect(result).toHaveProperty('companyName');
      expect(result).toHaveProperty('jobTitle');
      expect(result).toHaveProperty('jobDescription');
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.extractJobData('https://www.linkedin.com/jobs/view/1234567890'))
        .rejects.toThrow('Failed to extract job data from LinkedIn');
    });

    it('should handle non-200 responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });

      await expect(service.extractJobData('https://www.linkedin.com/jobs/view/1234567890'))
        .rejects.toThrow('Failed to extract job data from LinkedIn');
    });
  });
});
