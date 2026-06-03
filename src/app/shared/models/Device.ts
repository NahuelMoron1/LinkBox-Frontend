export type SubscriptionStatus = 'inactive' | 'active' | 'suspended' | 'expired';

export interface DeviceInfo {
  id: string;
  clientName: string;
  plan: 'basic' | 'pro' | 'ultimate';
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: string | null;
  sessionsSavedThisMonth: number;
}

export interface PlanInfo {
  plan: 'basic' | 'pro' | 'ultimate';
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: string | null;
  features: {
    liveTelemetry: boolean;
    saveData: boolean;
    historicalData: boolean;
    autoSave?: boolean;
    unlimited?: boolean;
    sessionsPerMonth?: number;
    sessionsSaved?: number;
    sessionsRemaining?: number;
  };
}
