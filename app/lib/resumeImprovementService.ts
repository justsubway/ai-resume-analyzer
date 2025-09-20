export interface ResumeImprovementRequest {
  resumeText: string;
  jobDescription: string;
  companyName: string;
  jobTitle: string;
}

export interface ResumeImprovementResponse {
  success: boolean;
  improvedText?: string;
  suggestions?: string[];
  error?: string;
}

export class ResumeImprovementService {
  async improveResume(request: ResumeImprovementRequest): Promise<ResumeImprovementResponse> {
    try {
      // For now, we'll use a simple text enhancement approach
      // In production, this would call an AI service like OpenAI or Puter
      const improvedText = this.enhanceResumeText(request);
      
      return {
        success: true,
        improvedText: improvedText,
        suggestions: this.extractSuggestions(request)
      };
    } catch (error) {
      console.error('Resume improvement error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private enhanceResumeText(request: ResumeImprovementRequest): string {
    let enhancedText = request.resumeText;
    
    // Extract key skills and requirements from job description
    const jobKeywords = this.extractKeywords(request.jobDescription);
    const companyName = request.companyName;
    const jobTitle = request.jobTitle;
    
    // Add a targeted professional summary if not present
    if (!enhancedText.toLowerCase().includes('professional summary') && 
        !enhancedText.toLowerCase().includes('objective')) {
      const summary = `PROFESSIONAL SUMMARY\nExperienced professional seeking the ${jobTitle} position at ${companyName}. ${this.generateSummaryContent(jobKeywords)}`;
      enhancedText = summary + '\n\n' + enhancedText;
    }
    
    // Enhance skills section
    enhancedText = this.enhanceSkillsSection(enhancedText, jobKeywords);
    
    // Add relevant keywords throughout the resume
    enhancedText = this.addKeywords(enhancedText, jobKeywords);
    
    return enhancedText;
  }

  private extractKeywords(jobDescription: string): string[] {
    const commonSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'Git',
      'WordPress', 'WooCommerce', 'PHP', 'UI/UX', 'MySQL', 'API', 'REST',
      'Agile', 'Scrum', 'Project Management', 'Leadership', 'Communication'
    ];
    
    const keywords: string[] = [];
    const lowerJobDesc = jobDescription.toLowerCase();
    
    commonSkills.forEach(skill => {
      if (lowerJobDesc.includes(skill.toLowerCase())) {
        keywords.push(skill);
      }
    });
    
    return keywords;
  }

  private generateSummaryContent(keywords: string[]): string {
    if (keywords.length === 0) {
      return 'Skilled professional with relevant experience and expertise.';
    }
    
    const topSkills = keywords.slice(0, 3).join(', ');
    return `Proficient in ${topSkills} with a strong track record of delivering results.`;
  }

  private enhanceSkillsSection(resumeText: string, keywords: string[]): string {
    // Look for existing skills section and enhance it
    const skillsRegex = /(SKILLS?|TECHNICAL SKILLS?|COMPETENCIES?)[:\s]*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]+|\n\n|$)/i;
    const match = resumeText.match(skillsRegex);
    
    if (match) {
      const existingSkills = match[2].trim();
      const newSkills = keywords.filter(skill => 
        !existingSkills.toLowerCase().includes(skill.toLowerCase())
      );
      
      if (newSkills.length > 0) {
        const enhancedSkills = existingSkills + '\n- ' + newSkills.join(', ');
        return resumeText.replace(skillsRegex, `$1:\n${enhancedSkills}`);
      }
    }
    
    return resumeText;
  }

  private addKeywords(resumeText: string, keywords: string[]): string {
    // Add keywords to experience descriptions where appropriate
    let enhancedText = resumeText;
    
    keywords.forEach(keyword => {
      // Look for bullet points that could benefit from this keyword
      const bulletRegex = /(^|\n)(\s*[-•]\s*)([^-\n]+)/gm;
      enhancedText = enhancedText.replace(bulletRegex, (match, prefix, bullet, content) => {
        if (!content.toLowerCase().includes(keyword.toLowerCase()) && 
            this.isRelevantKeyword(keyword, content)) {
          return `${prefix}${bullet}${content} using ${keyword}`;
        }
        return match;
      });
    });
    
    return enhancedText;
  }

  private isRelevantKeyword(keyword: string, content: string): boolean {
    // Simple relevance check - in production, this would be more sophisticated
    const techKeywords = ['JavaScript', 'Python', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'Git', 'WordPress', 'WooCommerce', 'PHP'];
    return techKeywords.includes(keyword) && 
           (content.toLowerCase().includes('develop') || 
            content.toLowerCase().includes('build') || 
            content.toLowerCase().includes('create'));
  }

  private extractSuggestions(request: ResumeImprovementRequest): string[] {
    const suggestions: string[] = [];
    const jobKeywords = this.extractKeywords(request.jobDescription);
    
    if (jobKeywords.length > 0) {
      suggestions.push(`Added relevant keywords: ${jobKeywords.slice(0, 3).join(', ')}`);
    }
    
    if (request.jobDescription.toLowerCase().includes('wordpress')) {
      suggestions.push('Enhanced WordPress experience visibility');
    }
    
    if (request.jobDescription.toLowerCase().includes('php')) {
      suggestions.push('Highlighted PHP development skills');
    }
    
    if (request.jobDescription.toLowerCase().includes('ui/ux')) {
      suggestions.push('Added UI/UX design experience');
    }
    
    return suggestions;
  }
}
