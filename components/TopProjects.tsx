'use client';

import { useEffect, useState } from 'react';

interface Project {
  rank: number;
  name: string;
  priority_score: number;
  complexity: string;
  due_date: string;
  estimated_hours: number;
  decision: string;
  rationale?: string;
  first_step?: string;
}

interface TopProjectsData {
  timestamp: string;
  model: string;
  total_projects_analyzed: number;
  top_3_projects: Project[];
}

export default function TopProjects() {
  const [data, setData] = useState<TopProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/top-projects');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load projects');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/top-projects', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        // Wait a bit then refetch
        setTimeout(() => {
          fetchProjects();
          setRefreshing(false);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading top projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Projects</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchProjects}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">Top 3 Ranked Projects</h2>
            <p className="text-blue-100">
              Analyzed by Multi-Agent Workflow • {data.total_projects_analyzed} projects
            </p>
            <p className="text-sm text-blue-200 mt-2">
              Last updated: {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
          <button
            onClick={triggerRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Rankings
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Model Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-medium">AI Model:</span>
          <code className="bg-gray-200 px-2 py-1 rounded text-xs">{data.model}</code>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {data.top_3_projects.map((project, index) => (
          <div
            key={index}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            {/* Rank Badge */}
            <div className="flex items-start gap-4">
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold
                ${project.rank === 1 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' : ''}
                ${project.rank === 2 ? 'bg-gray-100 text-gray-700 ring-2 ring-gray-300' : ''}
                ${project.rank === 3 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' : ''}
              `}>
                {project.rank}
              </div>

              <div className="flex-1">
                {/* Project Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {project.name}
                </h3>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500 block">Priority Score</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {project.priority_score.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Complexity</span>
                    <span className="text-lg font-semibold capitalize text-gray-700">
                      {project.complexity}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Due Date</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {new Date(project.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 block">Est. Hours</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {project.estimated_hours}h
                    </span>
                  </div>
                </div>

                {/* Decision Badge */}
                <div className="flex items-center gap-2">
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${project.decision === 'EXECUTE_NOW' ? 'bg-green-100 text-green-800' : ''}
                    ${project.decision === 'BREAK_DOWN' ? 'bg-blue-100 text-blue-800' : ''}
                    ${project.decision === 'DEFER' ? 'bg-yellow-100 text-yellow-800' : ''}
                  `}>
                    {project.decision.replace('_', ' ')}
                  </span>
                </div>

                {/* Rationale & First Step (if available) */}
                {project.rationale && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-gray-700"><strong>Rationale:</strong> {project.rationale}</p>
                  </div>
                )}
                {project.first_step && (
                  <div className="mt-2 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-gray-700"><strong>First Step:</strong> {project.first_step}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        <p>Rankings generated by LangGraph + DeepSeek v3.2 via Fireworks AI</p>
        <p>Data stored in MongoDB Atlas</p>
      </div>
    </div>
  );
}
