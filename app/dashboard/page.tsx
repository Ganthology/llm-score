'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useMemo } from 'react';
import DomainCard from '../../components/DomainCard';
import DashboardStats from '../../components/DashboardStats';
import { authClient } from '@/lib/auth-client';

interface Evaluation {
  _id: string;
  url: string;
  domain: string;
  overall_score: number;
  search_visibility_score: number;
  content_quality_score: number;
  technical_seo_score: number;
  ai_optimization_score: number;
  search_performance?: {
    keywords_analyzed: number;
    appearance_rate: number;
    top10_appearances: number;
  };
  created_at: number;
}

interface DomainStats {
  domain: string;
  totalEvaluations: number;
  latestScore: number;
  averageScore: number;
  improvement: number;
  firstEvaluated: number;
  lastEvaluated: number;
  evaluations: Evaluation[];
}

export default function Dashboard() {
  // Use Better Auth client session for faster access
  const { data: session, isPending } = authClient.useSession();
  
  // Debug: log the session structure
  console.log('Session object:', session);
  console.log('Is session pending:', isPending);
  
  // Better Auth session contains user info
  const userId = session?.user?.id;
  console.log('Extracted userId from session:', userId);
  console.log('Available session fields:', session ? Object.keys(session) : 'no session');
  console.log('Available user fields:', session?.user ? Object.keys(session.user) : 'no user');

  const groupedEvaluations = useQuery(
    api.evaluations.getEvaluationsByUserGroupedByDomain,
    userId ? { userId } : "skip"
  );

  console.log('Grouped evaluations:', groupedEvaluations);
  console.log('Is groupedEvaluations undefined?', groupedEvaluations === undefined);
  console.log('Is groupedEvaluations null?', groupedEvaluations === null);
  console.log('Type of groupedEvaluations:', typeof groupedEvaluations);

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    // If still loading, return null
    if (groupedEvaluations === undefined) return null;
    
    // If we have the result (even if empty), calculate stats
    if (groupedEvaluations === null || typeof groupedEvaluations !== 'object') {
      return {
        totalDomains: 0,
        totalEvaluations: 0,
        averageScore: 0,
        topScore: 0,
        recentActivity: 0,
      };
    }

    const domains = Object.keys(groupedEvaluations);
    const allEvaluations = Object.values(groupedEvaluations).flat();
    
    if (allEvaluations.length === 0) {
      return {
        totalDomains: 0,
        totalEvaluations: 0,
        averageScore: 0,
        topScore: 0,
        recentActivity: 0,
      };
    }

    const averageScore = allEvaluations.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / allEvaluations.length;
    const topScore = Math.max(...allEvaluations.map(evaluation => evaluation.overall_score));
    
    // Count evaluations from last 7 days
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentActivity = allEvaluations.filter(evaluation => evaluation.created_at > sevenDaysAgo).length;

    return {
      totalDomains: domains.length,
      totalEvaluations: allEvaluations.length,
      averageScore: Math.round(averageScore * 10) / 10,
      topScore,
      recentActivity,
    };
  }, [groupedEvaluations]);

  // Convert grouped evaluations to domain stats
  const domainStats: DomainStats[] = useMemo(() => {
    if (groupedEvaluations === undefined || groupedEvaluations === null || typeof groupedEvaluations !== 'object') {
      return [];
    }

    return Object.entries(groupedEvaluations).map(([domain, evaluations]) => {
      const sortedEvaluations = [...evaluations].sort((a, b) => b.created_at - a.created_at);
      const latest = sortedEvaluations[0];
      const oldest = sortedEvaluations[sortedEvaluations.length - 1];
      
      const avgScore = evaluations.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / evaluations.length;
      const improvement = evaluations.length > 1 ? latest.overall_score - oldest.overall_score : 0;

      return {
        domain,
        totalEvaluations: evaluations.length,
        latestScore: latest.overall_score,
        averageScore: Math.round(avgScore * 10) / 10,
        improvement: Math.round(improvement * 10) / 10,
        firstEvaluated: oldest.created_at,
        lastEvaluated: latest.created_at,
        evaluations: sortedEvaluations.slice(0, 5), // Show only 5 most recent
      };
    }).sort((a, b) => b.lastEvaluated - a.lastEvaluated); // Sort by most recently evaluated
  }, [groupedEvaluations]);

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-mono">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign in message if user is not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-mono">
        <div className="text-center">
          <h1 className="text-xl font-bold text-black mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your dashboard.</p>
          <a 
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  // Show loading while fetching evaluations
  if (groupedEvaluations === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-mono">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-mono">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">LLMScore Dashboard</h1>
          <p className="text-gray-600">Track your website performance and improvements over time</p>
        </div>

        {/* Dashboard Stats */}
        {dashboardStats && <DashboardStats stats={dashboardStats} />}

        {/* Domains Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black">Your Domains</h2>
            {domainStats.length > 0 && (
              <p className="text-sm text-gray-600">
                {domainStats.length} domain{domainStats.length !== 1 ? 's' : ''} analyzed
              </p>
            )}
          </div>

          {domainStats.length > 0 ? (
            <div className="grid gap-6">
              {domainStats.map((stats) => (
                <DomainCard key={stats.domain} stats={stats} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <div className="mb-4">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No evaluations yet</h3>
              <p className="text-gray-600 mb-6">Start by analyzing a website to see your performance metrics and track improvements over time.</p>
              <a 
                href="/" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
              >
                Analyze Your First Website
              </a>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-black mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="/"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">New Analysis</div>
                <div className="text-sm text-gray-500">Analyze a new website</div>
              </div>
            </a>
            
            <a 
              href="/dashboard"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Re-scan Domain</div>
                <div className="text-sm text-gray-500">Update existing analysis</div>
              </div>
            </a>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Export Data</div>
                <div className="text-sm text-gray-500">Download your reports</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}