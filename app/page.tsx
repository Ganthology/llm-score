'use client';

import { useState } from 'react';
import { AuthGuard } from '../components/AuthGuard';
import { AuthButton } from '../components/AuthButton';

interface LinkResult {
  url: string;
  title?: string;
  description?: string;
}

interface FileCheck {
  path: string;
  exists: boolean;
  content?: string;
  error?: string;
}

interface EvaluationResult {
  overall_score: number;
  search_visibility: {
    score: number;
    reasoning: string;
  };
  content_quality: {
    score: number;
    reasoning: string;
  };
  technical_seo: {
    score: number;
    reasoning: string;
  };
  ai_optimization: {
    score: number;
    reasoning: string;
  };
  recommendations: string[];
  search_performance?: {
    keywords_analyzed: number;
    keywords: string[];
    keyword_source: string;
    total_searches: number;
    appearance_rate: number;
    top10_appearances: number;
    average_position: number;
    search_insights: string[];
  };
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LinkResult[] | null>(null);
  const [fileChecks, setFileChecks] = useState<FileCheck[] | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);
    setFileChecks(null);
    setEvaluation(null);

    // Auto-prepend https:// if missing
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }

    try {
      // Call all APIs simultaneously
      const [mapResponse, filesResponse] = await Promise.allSettled([
        fetch('/api/map', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: processedUrl }),
        }),
        fetch('/api/check-files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: processedUrl }),
        }),
      ]);

      // Get results from map and files APIs first
      let siteMap = null;
      let aiFiles = null;

      if (mapResponse.status === 'fulfilled') {
        const mapData = await mapResponse.value.json();
        if (mapResponse.value.ok) {
          setResults(mapData.links);
          siteMap = mapData.links;
        } else {
          setError(`Map error: ${mapData.error}`);
        }
      } else {
        setError(`Map failed: ${mapResponse.reason}`);
      }

      if (filesResponse.status === 'fulfilled') {
        const filesData = await filesResponse.value.json();
        if (filesResponse.value.ok) {
          setFileChecks(filesData.files);
          aiFiles = filesData.files;
        } else {
          console.error('Files check error:', filesData.error);
        }
      } else {
        console.error('Files check failed:', filesResponse.reason);
      }

      // Now call evaluation API with the collected data
      if (siteMap && aiFiles) {
        const evalResponse = await fetch('/api/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: processedUrl, siteMap, aiFiles }),
        });

        if (evalResponse.ok) {
          const evalData = await evalResponse.json();
          setEvaluation(evalData.evaluation);
        } else {
          console.error('Evaluation failed');
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-mono">
        <div className="max-w-2xl w-full bg-white border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-black">LLMScore</h1>
              <div className="flex items-center gap-4">
                <AuthButton />
                <a
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-black font-mono underline"
                >
                  View Dashboard →
                </a>
              </div>
            </div>
            <p className="text-base text-gray-800 leading-relaxed">
              Is your website LLM friendly? Get your LLM score now
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          <div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              className="w-full px-4 py-3 border border-gray-300 bg-white text-black placeholder-gray-500 focus:border-black focus:outline-none transition-colors font-mono text-sm"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 font-mono mt-1">
              https:// will be added automatically
            </p>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-3 px-6 border border-black hover:border-gray-800 disabled:border-gray-400 transition-colors duration-200 font-mono text-sm disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing Website...' : 'Analyze Website'}
          </button>
        </form>

        {error && (
          <div className="mb-6 p-4 border border-red-300 bg-red-50 text-red-800 text-sm">
            Error: {error}
          </div>
        )}

        {evaluation && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold text-black mb-4">
              LLM Score Evaluation
            </h2>

            {/* Overall Score */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-black font-mono">Overall Score</h3>
                <div className="text-right">
                  <div className={`text-3xl font-bold font-mono ${
                    evaluation.overall_score >= 8 ? 'text-green-600' :
                    evaluation.overall_score >= 6 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {evaluation.overall_score}/10
                  </div>
                  <div className="text-xs text-gray-600 font-mono">
                    {evaluation.overall_score >= 8 ? 'Excellent' :
                     evaluation.overall_score >= 6 ? 'Good' :
                     evaluation.overall_score >= 4 ? 'Needs Work' : 'Poor'}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 border border-gray-200 rounded">
                <h4 className="font-bold text-black font-mono mb-2">Search Visibility</h4>
                <div className="text-2xl font-bold font-mono text-blue-600 mb-2">
                  {evaluation.search_visibility.score}/10
                </div>
                <p className="text-xs text-gray-700 font-mono leading-relaxed">
                  {evaluation.search_visibility.reasoning.substring(0, 200)}...
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded">
                <h4 className="font-bold text-black font-mono mb-2">Content Quality</h4>
                <div className="text-2xl font-bold font-mono text-green-600 mb-2">
                  {evaluation.content_quality.score}/10
                </div>
                <p className="text-xs text-gray-700 font-mono">
                  {evaluation.content_quality.reasoning}
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded">
                <h4 className="font-bold text-black font-mono mb-2">Technical SEO</h4>
                <div className="text-2xl font-bold font-mono text-purple-600 mb-2">
                  {evaluation.technical_seo.score}/10
                </div>
                <p className="text-xs text-gray-700 font-mono">
                  {evaluation.technical_seo.reasoning}
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded">
                <h4 className="font-bold text-black font-mono mb-2">AI Optimization</h4>
                <div className="text-2xl font-bold font-mono text-orange-600 mb-2">
                  {evaluation.ai_optimization.score}/10
                </div>
                <p className="text-xs text-gray-700 font-mono">
                  {evaluation.ai_optimization.reasoning}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-bold text-blue-800 font-mono mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {evaluation.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start text-sm text-blue-700 font-mono">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Search Performance Details */}
            {evaluation.search_performance && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-bold text-black mb-4">
                  Search Performance Analysis
                </h2>

                {/* Search Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center">
                    <div className="text-lg font-bold font-mono text-gray-800">
                      {evaluation.search_performance.keywords_analyzed}
                    </div>
                    <div className="text-xs text-gray-600 font-mono">Keywords Analyzed</div>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center">
                    <div className="text-lg font-bold font-mono text-gray-800">
                      {Math.round(evaluation.search_performance.appearance_rate * 100)}%
                    </div>
                    <div className="text-xs text-gray-600 font-mono">Appearance Rate</div>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center">
                    <div className="text-lg font-bold font-mono text-gray-800">
                      {evaluation.search_performance.top10_appearances}
                    </div>
                    <div className="text-xs text-gray-600 font-mono">Top 10 Results</div>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-center">
                    <div className="text-lg font-bold font-mono text-gray-800">
                      {evaluation.search_performance.average_position.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 font-mono">Avg Position</div>
                  </div>
                </div>

              {/* Keywords Used */}
              <div className="mb-6">
                <h3 className="font-bold text-black font-mono mb-3">
                  Keywords Analyzed
                  <span className="ml-2 text-xs text-gray-600 font-mono">
                    ({evaluation.search_performance.keyword_source === 'content_analysis' ? 'generated from website content' : 'generated from domain analysis'})
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {evaluation.search_performance.keywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

                {/* Search Insights */}
                <div>
                  <h3 className="font-bold text-black font-mono mb-3">Search Results Details</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4 max-h-48 overflow-y-auto">
                    {evaluation.search_performance.search_insights.map((insight, index) => (
                      <div key={index} className="text-sm text-gray-700 font-mono mb-1">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {results && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold text-black mb-4">
              Website Map ({results.length} links found)
            </h2>

            {/* SEO Issues Summary */}
            {(() => {
              // Only check HTML pages for SEO issues, exclude static assets
              const htmlPages = results.filter(link => {
                const url = link.url || '';
                const excludeExtensions = ['.txt', '.md', '.css', '.js', '.json', '.xml', '.csv', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.mp3', '.mp4', '.pdf', '.zip', '.exe', '.bin'];
                const hasExcludedExtension = excludeExtensions.some(ext => url.toLowerCase().endsWith(ext));
                const isAssetUrl = /\/(assets?|static|media|images?|css|js|files?|downloads?)\//i.test(url);
                return !hasExcludedExtension && !isAssetUrl;
              });

              const missingTitles = htmlPages.filter(link => !link.title).length;
              const missingDescriptions = htmlPages.filter(link => !link.description).length;
              const hasIssues = missingTitles > 0 || missingDescriptions > 0;

              if (htmlPages.length === 0) {
                return (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-800 font-mono">
                      ℹ️ No HTML pages detected for SEO evaluation (only static assets found).
                    </p>
                  </div>
                );
              }

              return hasIssues ? (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                  <h3 className="text-sm font-bold text-amber-800 font-mono mb-2">SEO Optimization Opportunities (HTML pages only):</h3>
                  <ul className="text-xs text-amber-700 font-mono space-y-1">
                    {missingTitles > 0 && (
                      <li>• {missingTitles} of {htmlPages.length} HTML pages missing titles (add &lt;title&gt; tags)</li>
                    )}
                    {missingDescriptions > 0 && (
                      <li>• {missingDescriptions} of {htmlPages.length} HTML pages missing meta descriptions</li>
                    )}
                  </ul>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-800 font-mono">
                    ✅ All {htmlPages.length} HTML pages have proper titles and meta descriptions!
                  </p>
                </div>
              );
            })()}

            <div className="max-h-96 overflow-y-auto space-y-3">
              {results.map((link, index) => {
                const url = link.url || '';
                const excludeExtensions = ['.txt', '.md', '.css', '.js', '.json', '.xml', '.csv', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.mp3', '.mp4', '.pdf', '.zip', '.exe', '.bin'];
                const hasExcludedExtension = excludeExtensions.some(ext => url.toLowerCase().endsWith(ext));
                const isAssetUrl = /\/(assets?|static|media|images?|css|js|files?|downloads?)\//i.test(url);
                const isHtmlPage = !hasExcludedExtension && !isAssetUrl;

                const hasTitle = !!link.title;
                const hasDescription = !!link.description;
                const needsOptimization = isHtmlPage && (!hasTitle || !hasDescription);

                return (
                  <div key={index} className={`border p-3 hover:bg-gray-50 transition-colors ${needsOptimization ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:text-gray-600 font-mono text-sm break-all flex-1"
                      >
                        {link.url}
                      </a>
                    {isHtmlPage && needsOptimization && (
                      <div className="ml-2 flex flex-col gap-1">
                          {!hasTitle && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-mono whitespace-nowrap">
                              No Title
                            </span>
                          )}
                          {!hasDescription && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono whitespace-nowrap">
                              No Description
                            </span>
                          )}
                        </div>
                      )}

                    {!isHtmlPage && (
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono whitespace-nowrap">
                        Asset
                      </span>
                    )}
                    </div>

                    {link.title && (
                      <p className="text-gray-600 text-xs mt-1 font-mono">
                        {link.title}
                      </p>
                    )}
                    {link.description && (
                      <p className="text-gray-500 text-xs mt-1 font-mono overflow-hidden">
                        {link.description.length > 100 ? `${link.description.substring(0, 100)}...` : link.description}
                      </p>
                    )}

                    {isHtmlPage && needsOptimization && (
                      <div className="mt-2 text-xs text-gray-600 font-mono">
                        ⚠️ Needs SEO optimization
                      </div>
                    )}

                    {isHtmlPage && !needsOptimization && (
                      <div className="mt-2 text-xs text-green-600 font-mono">
                        ✅ SEO optimized
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {fileChecks && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold text-black mb-4">
              AI Optimization Files
            </h2>
            <div className="space-y-4">
              {fileChecks.map((file, index) => (
                <div key={index} className="border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold">
                      {file.path}
                    </span>
                    <span className={`font-mono text-xs px-2 py-1 rounded ${
                      file.exists
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {file.exists ? 'EXISTS' : 'NOT FOUND'}
                    </span>
                  </div>

                  {file.exists && file.content && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1 font-mono">Content Preview:</p>
                      <pre className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-800 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                        {file.content}
                      </pre>
                    </div>
                  )}

                  {file.error && (
                    <p className="text-xs text-red-600 font-mono mt-2">
                      Error: {file.error}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800 font-mono">
                💡 <strong>AI Optimization Tip:</strong> These files help AI agents and LLMs understand how to interact with your website. Consider adding them for better AI compatibility.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </AuthGuard>
  );
}