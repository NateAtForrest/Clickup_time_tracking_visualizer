export interface TimeEntry {
  id: string;
  task: {
    id: string;
    name: string;
    project?: {
      id: string;
      name: string;
      budget?: number;
      hourly_rate?: number;
    };
  };
  wid: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  billable: boolean;
  start: string;
  end: string;
  duration: number;
  description: string;
  tags: string[];
  source: string;
  at: string;
  cost?: number;
}

export interface TimeTrackingStats {
  totalHours: number;
  billableHours: number;
  totalCost: number;
  billableCost: number;
  projectDistribution: ProjectStats[];
  teamDistribution: TeamStats[];
  dailyStats: DailyStats[];
  budgetStatus: BudgetStatus[];
}

export interface ProjectStats {
  name: string;
  hours: number;
  cost: number;
  budget?: number;
  progress: number;
  billableHours: number;
}

export interface TeamStats {
  userId: number;
  username: string;
  hours: number;
  capacity: number;
  utilizationRate: number;
  projects: string[];
}

export interface DailyStats {
  date: string;
  hours: number;
  billableHours: number;
  cost: number;
}

export interface BudgetStatus {
  projectId: string;
  projectName: string;
  budget: number;
  spent: number;
  remaining: number;
  progress: number;
  status: 'on-track' | 'at-risk' | 'over-budget';
}