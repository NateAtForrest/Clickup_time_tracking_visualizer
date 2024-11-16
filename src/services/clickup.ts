import { TimeEntry, TimeTrackingStats, ProjectStats, TeamStats, BudgetStatus } from '../types';
import { format, subDays, parseISO } from 'date-fns';

const CLIENT_ID = 'MKZ7HGU6CMM6GIYUIGS98R4442ZTPP79';
const CLIENT_SECRET = '250TIBV61RWONPW3CV7UX9GVL6XLHNWER2J2CRL17E2GP5FR6VX6MT95BU2BEVCS';
const API_BASE_URL = 'https://api.clickup.com/api/v2';

const DEFAULT_HOURLY_RATE = 150;
const WORK_HOURS_PER_DAY = 8;

export async function getAccessToken(code: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `https://www.${window.location.host}/auth/callback`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

export async function fetchTimeEntries(accessToken: string): Promise<TimeEntry[]> {
  try {
    const startDate = subDays(new Date(), 30).getTime();
    const endDate = new Date().getTime();

    const response = await fetch(
      `${API_BASE_URL}/team/time_entries?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: {
          'Authorization': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch time entries');
    }

    const data = await response.json();
    return data.data.map((entry: TimeEntry) => ({
      ...entry,
      cost: calculateEntryCost(entry),
    }));
  } catch (error) {
    console.error('Error fetching time entries:', error);
    throw error;
  }
}

function calculateEntryCost(entry: TimeEntry): number {
  const hours = entry.duration / (1000 * 60 * 60);
  const rate = entry.task?.project?.hourly_rate || DEFAULT_HOURLY_RATE;
  return hours * rate;
}

function calculateBudgetStatus(
  projectName: string,
  totalCost: number,
  budget: number | undefined
): BudgetStatus {
  const budgetAmount = budget || 0;
  const progress = budgetAmount > 0 ? (totalCost / budgetAmount) * 100 : 0;
  
  let status: 'on-track' | 'at-risk' | 'over-budget' = 'on-track';
  if (progress >= 100) {
    status = 'over-budget';
  } else if (progress >= 80) {
    status = 'at-risk';
  }

  return {
    projectId: projectName,
    projectName,
    budget: budgetAmount,
    spent: totalCost,
    remaining: Math.max(0, budgetAmount - totalCost),
    progress,
    status,
  };
}

function calculateTeamStats(entries: TimeEntry[]): TeamStats[] {
  const teamMap = new Map<number, TeamStats>();

  entries.forEach(entry => {
    const userId = entry.user.id;
    const hours = entry.duration / (1000 * 60 * 60);
    
    const existing = teamMap.get(userId) || {
      userId,
      username: entry.user.username,
      hours: 0,
      capacity: WORK_HOURS_PER_DAY * 20,
      utilizationRate: 0,
      projects: [],
    };

    existing.hours += hours;
    if (entry.task?.project?.name && !existing.projects.includes(entry.task.project.name)) {
      existing.projects.push(entry.task.project.name);
    }

    existing.utilizationRate = (existing.hours / existing.capacity) * 100;
    teamMap.set(userId, existing);
  });

  return Array.from(teamMap.values());
}

export function processTimeEntries(entries: TimeEntry[]): TimeTrackingStats {
  const projectMap = new Map<string, ProjectStats>();
  const dailyMap = new Map<string, { hours: number; billableHours: number; cost: number }>();
  let totalHours = 0;
  let billableHours = 0;
  let totalCost = 0;
  let billableCost = 0;

  entries.forEach(entry => {
    const hours = entry.duration / (1000 * 60 * 60);
    const date = format(parseISO(entry.start), 'MMM dd');
    const cost = entry.cost || 0;
    
    totalHours += hours;
    totalCost += cost;
    
    if (entry.billable) {
      billableHours += hours;
      billableCost += cost;
    }

    const projectName = entry.task?.project?.name || 'Unassigned';
    const existing = projectMap.get(projectName) || {
      name: projectName,
      hours: 0,
      cost: 0,
      budget: entry.task?.project?.budget,
      progress: 0,
      billableHours: 0,
    };

    existing.hours += hours;
    existing.cost += cost;
    if (entry.billable) existing.billableHours += hours;
    existing.progress = existing.budget ? (existing.cost / existing.budget) * 100 : 0;
    
    projectMap.set(projectName, existing);

    const dailyStats = dailyMap.get(date) || { hours: 0, billableHours: 0, cost: 0 };
    dailyStats.hours += hours;
    dailyStats.cost += cost;
    if (entry.billable) dailyStats.billableHours += hours;
    dailyMap.set(date, dailyStats);
  });

  const projectStats = Array.from(projectMap.values());
  const budgetStatus = projectStats.map(project => 
    calculateBudgetStatus(project.name, project.cost, project.budget)
  );

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    billableHours: Math.round(billableHours * 10) / 10,
    totalCost: Math.round(totalCost),
    billableCost: Math.round(billableCost),
    projectDistribution: projectStats,
    teamDistribution: calculateTeamStats(entries),
    dailyStats: Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      hours: Math.round(stats.hours * 10) / 10,
      billableHours: Math.round(stats.billableHours * 10) / 10,
      cost: Math.round(stats.cost),
    })),
    budgetStatus,
  };
}