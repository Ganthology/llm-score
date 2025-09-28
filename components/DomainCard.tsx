'use client';

import { useState } from 'react';

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

interface DomainCardProps {
  stats: DomainStats;
}

export default function DomainCard({ stats }: DomainCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return '↗';
    if (improvement < 0) return '↘';
    return '→';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
      {/* Domain Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-black">{stats.domain}</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-mono border ${getScoreColor(stats.latestScore)}`}>
            {stats.latestScore}/10
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-gray-700 font-mono text-sm"
        >
          {expanded ? '▲' : '▼'} {stats.totalEvaluations} scan{stats.totalEvaluations !== 1 ? 's' : ''}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Average</div>
          <div className="font-mono font-bold">{stats.averageScore}/10</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Improvement</div>
          <div className={`font-mono font-bold ${getImprovementColor(stats.improvement)}`}>
            {getImprovementIcon(stats.improvement)} {Math.abs(stats.improvement)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">First Scan</div>
          <div className="text-xs font-mono">{new Date(stats.firstEvaluated).toLocaleDateString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Latest Scan</div>
          <div className="text-xs font-mono">{new Date(stats.lastEvaluated).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Expanded History */}
      {expanded && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Scan History</h4>
          <div className="space-y-3">
            {stats.evaluations.map((evaluation) => (
              <div key={evaluation._id} className="border border-gray-100 rounded p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-mono ${getScoreColor(evaluation.overall_score)}`}>
                      {evaluation.overall_score}/10
                    </span>
                    <span className="text-sm text-gray-600 truncate max-w-xs">
                      {evaluation.url}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(evaluation.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Search:</span>
                    <span className="font-mono ml-1">{evaluation.search_visibility_score}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Content:</span>
                    <span className="font-mono ml-1">{evaluation.content_quality_score}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Technical:</span>
                    <span className="font-mono ml-1">{evaluation.technical_seo_score}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-500">AI:</span>
                    <span className="font-mono ml-1">{evaluation.ai_optimization_score}/10</span>
                  </div>
                </div>

                {evaluation.search_performance && (
                  <div className="mt-2 text-xs text-gray-600">
                    Keywords: {evaluation.search_performance.keywords_analyzed} |
                    Appearance: {Math.round(evaluation.search_performance.appearance_rate * 100)}% |
                    Top 10: {evaluation.search_performance.top10_appearances}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}