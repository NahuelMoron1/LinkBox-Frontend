export interface DeviceInfo {
  id: string;
  clientName: string;
  plan: 'basic' | 'pro' | 'ultimate';
  subscriptionStatus: 'active' | 'suspended' | 'expired';
  subscriptionEndDate: string | null;
  sessionsSavedThisMonth: number;
}

export interface PlanInfo {
  plan: 'basic' | 'pro' | 'ultimate';
  subscriptionStatus: 'active' | 'suspended' | 'expired';
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
