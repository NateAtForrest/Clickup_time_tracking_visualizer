import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Clock, DollarSign, Briefcase, BarChart2, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, Users
} from 'lucide-react';
import { TimeTrackingStats } from '../types';
import { fetchTimeEntries, processTimeEntries } from '../services/clickup';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: string, color: string }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const BudgetStatusIndicator = ({ status }: { status: string }) => {
  const colors = {
    'on-track': 'bg-green-100 text-green-800',
    'at-risk': 'bg-yellow-100 text-yellow-800',
    'over-budget': 'bg-red-100 text-red-800',
  };

  const icons = {
    'on-track': CheckCircle,
    'at-risk': AlertTriangle,
    'over-budget': XCircle,
  };

  const Icon = icons[status as keyof typeof icons];
  const colorClass = colors[status as keyof typeof colors];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      <Icon className="w-4 h-4 mr-1" />
      {status.replace('-', ' ').toUpperCase()}
    </span>
  );
};

export default function TimeTrackingDashboard() {
  const [view, setView] = useState<'overview' | 'team' | 'projects' | 'budgets'>('overview');

  const { data: stats, isLoading, error, refetch } = useQuery<TimeTrackingStats>({
    queryKey: ['timeTracking'],
    queryFn: async () => {
      const token = localStorage.getItem('clickup_token');
      if (!token) throw new Error('No auth token found');
      const entries = await fetchTimeEntries(token);
      return processTimeEntries(entries);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading time tracking data...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error?.message || 'Failed to load data'}</p>
          <button
            onClick={() => refetch()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Clock}
          title="Total Hours"
          value={`${stats.totalHours}h`}
          color="bg-blue-500"
        />
        <StatCard
          icon={DollarSign}
          title="Billable Amount"
          value={`$${stats.billableCost}`}
          color="bg-green-500"
        />
        <StatCard
          icon={Briefcase}
          title="Active Projects"
          value={stats.projectDistribution.length.toString()}
          color="bg-purple-500"
        />
        <StatCard
          icon={Users}
          title="Team Members"
          value={stats.teamDistribution.length.toString()}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Daily Time Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="billableHours" name="Billable Hours" fill="#10b981" stackId="a" />
                <Bar dataKey="hours" name="Total Hours" fill="#6366f1" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Project Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.projectDistribution}
                  dataKey="hours"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stats.projectDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );

  const renderTeam = () => (
    <div className="grid gap-6">
      {stats.teamDistribution.map(member => (
        <div key={member.userId} className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{member.username}</h3>
              <p className="text-gray-500">{member.projects.length} projects</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{Math.round(member.hours)}h</p>
              <p className="text-sm text-gray-500">of {member.capacity}h capacity</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  member.utilizationRate > 100
                    ? 'bg-red-600'
                    : member.utilizationRate > 80
                    ? 'bg-yellow-600'
                    : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(member.utilizationRate, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(member.utilizationRate)}% utilization
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBudgets = () => (
    <div className="grid gap-6">
      {stats.budgetStatus.map(budget => (
        <div key={budget.projectId} className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{budget.projectName}</h3>
              <BudgetStatusIndicator status={budget.status} />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${budget.spent}</p>
              <p className="text-sm text-gray-500">of ${budget.budget} budget</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                budget.progress >= 100
                  ? 'bg-red-600'
                  : budget.progress >= 80
                  ? 'bg-yellow-600'
                  : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(budget.progress, 100)}%` }}
            ></div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <span>Remaining: ${budget.remaining}</span>
            <span>{Math.round(budget.progress)}% used</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking Dashboard</h1>
          <button
            onClick={() => refetch()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Data</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <nav className="flex divide-x divide-gray-200">
            {(['overview', 'team', 'projects', 'budgets'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={`
                  flex-1 px-4 py-3 text-sm font-medium
                  ${view === tab
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {view === 'overview' && renderOverview()}
        {view === 'team' && renderTeam()}
        {view === 'budgets' && renderBudgets()}
      </div>
    </div>
  );
}