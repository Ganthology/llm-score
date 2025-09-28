'use client';

interface DashboardStatsProps {
  stats: {
    totalDomains: number;
    totalEvaluations: number;
    averageScore: number;
    topScore: number;
    recentActivity: number; // evaluations in last 7 days
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-black font-mono">{stats.totalDomains}</div>
        <div className="text-xs text-gray-600">Domains Analyzed</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-black font-mono">{stats.totalEvaluations}</div>
        <div className="text-xs text-gray-600">Total Scans</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className={`text-2xl font-bold font-mono ${getScoreColor(stats.averageScore)}`}>
          {stats.averageScore}/10
        </div>
        <div className="text-xs text-gray-600">Average Score</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className={`text-2xl font-bold font-mono ${getScoreColor(stats.topScore)}`}>
          {stats.topScore}/10
        </div>
        <div className="text-xs text-gray-600">Best Score</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600 font-mono">{stats.recentActivity}</div>
        <div className="text-xs text-gray-600">Scans (7 days)</div>
      </div>
    </div>
  );
}