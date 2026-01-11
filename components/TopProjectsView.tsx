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

export default function TopProjectsView() {
  const [data, setData] = useState<TopProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopProjects();
  }, []);

  const fetchTopProjects = async () => {
    try {
      const response = await fetch('/api/top-projects');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }
      const jsonData = await response.json();
      // The API returns { success: true, data: {...} }, so we need to extract data.data
      setData(jsonData.data || jsonData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading top projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Projects</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-2">
            Make sure to run: <code className="bg-red-100 px-2 py-1 rounded">python run_integrated_workflow.py</code>
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.top_3_projects || data.top_3_projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-yellow-800 font-semibold mb-2">No Projects Found</h2>
          <p className="text-yellow-600">No ranked projects available yet.</p>
          <p className="text-sm text-yellow-500 mt-2">
            Run the workflow to generate projects: <code className="bg-yellow-100 px-2 py-1 rounded">python run_integrated_workflow.py</code>
          </p>
        </div>
      </div>
    );
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'EXECUTE_NOW':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'BREAK_DOWN':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'DEFER':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎯 Top 3 Ranked Projects
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold">AI Model:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {data.model}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Analyzed:</span>
            <span>{data.total_projects_analyzed} projects</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Updated:</span>
            <span>{new Date(data.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-6">
        {data.top_3_projects.map((project) => (
          <div
            key={project.rank}
            className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
              project.rank === 1
                ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-white'
                : project.rank === 2
                ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-white'
                : 'border-orange-300 bg-gradient-to-br from-orange-50 to-white'
            }`}
          >
            {/* Rank Badge */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-xl ${
                    project.rank === 1
                      ? 'bg-yellow-400 text-yellow-900'
                      : project.rank === 2
                      ? 'bg-gray-400 text-gray-900'
                      : 'bg-orange-400 text-orange-900'
                  }`}
                >
                  #{project.rank}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {project.name}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getComplexityColor(
                        project.complexity
                      )}`}
                    >
                      {project.complexity.toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDecisionColor(
                        project.decision
                      )}`}
                    >
                      {project.decision.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Priority Score */}
              <div className="text-right">
                <div className="text-sm text-gray-500 font-medium">
                  Priority Score
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {project.priority_score}
                </div>
                <div className="text-xs text-gray-500">/ 100</div>
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-sm font-semibold text-gray-600">
                  📅 Due Date
                </div>
                <div className="text-lg font-medium text-gray-900">
                  {new Date(project.due_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-600">
                  ⏱️ Estimated Hours
                </div>
                <div className="text-lg font-medium text-gray-900">
                  {project.estimated_hours}h
                </div>
              </div>
            </div>

            {/* Rationale & First Step */}
            {(project.rationale || project.first_step) && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                {project.rationale && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      💡 Rationale
                    </div>
                    <p className="text-sm text-gray-700">
                      {project.rationale}
                    </p>
                  </div>
                )}
                {project.first_step && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      🚀 First Step
                    </div>
                    <p className="text-sm text-gray-700">
                      {project.first_step}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={fetchTopProjects}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh Projects
        </button>
      </div>
    </div>
  );
}
