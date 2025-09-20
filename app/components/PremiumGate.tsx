import React from 'react';
import { premiumService } from '../lib/premiumService';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: keyof import('../lib/premiumService').PremiumStatus['features'];
  fallback?: React.ReactNode;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  children, 
  feature, 
  fallback 
}) => {
  // Safe access to premium service with fallback
  const canAccess = premiumService?.canAccessFeature?.(feature) || false;

  if (canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="premium-gate">
      <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Premium Feature
        </h3>
        <p className="text-gray-600 mb-6">
          This feature is available with a premium subscription. 
          Upgrade now to unlock detailed analysis and more!
        </p>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
};
