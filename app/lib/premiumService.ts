import { isOwnerAccount } from '../config/ownerAccounts';

export interface PremiumStatus {
  isPremium: boolean;
  isOwner: boolean;
  subscriptionType: 'free' | 'premium' | 'owner';
  features: {
    detailedAnalysis: boolean;
    resumeImprovement: boolean;
    jobApplications: boolean;
  };
}

export class PremiumService {
  private static instance: PremiumService;
  private currentUser: string | null = null;

  private constructor() {}

  static getInstance(): PremiumService {
    if (!PremiumService.instance) {
      PremiumService.instance = new PremiumService();
    }
    return PremiumService.instance;
  }

  // Safe getter for the instance
  static getInstanceSafe(): PremiumService | null {
    try {
      return PremiumService.getInstance();
    } catch (error) {
      console.warn('PremiumService not available:', error);
      return null;
    }
  }

  setCurrentUser(email: string | null) {
    this.currentUser = email;
  }

  getCurrentUser(): string | null {
    return this.currentUser;
  }

  // Method to set user from Puter.js user object
  setUserFromPuter(user: any) {
    if (user && user.username) {
      this.currentUser = user.username;
    } else if (user && user.email) {
      this.currentUser = user.email;
    } else {
      this.currentUser = null;
    }
  }

  getPremiumStatus(): PremiumStatus {
    const isOwner = this.currentUser ? isOwnerAccount(this.currentUser) : false;
    const isPremium = isOwner; // For now, only owners have premium access

    return {
      isPremium,
      isOwner,
      subscriptionType: isOwner ? 'owner' : 'free',
      features: {
        detailedAnalysis: isPremium,
        resumeImprovement: isPremium,
        jobApplications: isPremium,
      },
    };
  }

  canAccessFeature(feature: keyof PremiumStatus['features']): boolean {
    const status = this.getPremiumStatus();
    return status.features[feature];
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    // Clear any stored user data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_email');
      localStorage.removeItem('premium_status');
    }
  }
}

// Safe export that handles server-side rendering
export const premiumService = (() => {
  try {
    return PremiumService.getInstance();
  } catch (error) {
    console.warn('PremiumService not available in this environment:', error);
    return null;
  }
})();
