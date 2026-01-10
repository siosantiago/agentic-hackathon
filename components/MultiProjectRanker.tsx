'use client';

import { useState } from 'react';

interface Project {
  title: string;
  description: string;
  dueDate: string;
  complexity: string;
  estimatedHours?: number;
  tags: string[];
}

export default function MultiProjectRanker() {
  const [projects, setProjects] = useState<Project[]>([
    {
      title: '',
      description: '',
      dueDate: '',
      complexity: 'medium',
      tags: [],
    },
  ]);
  const [ranking, setRanking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addProject = () => {
    setProjects([
      ...projects,
      {
        title: '',
        description: '',
        dueDate: '',
        complexity: 'medium',
        tags: [],
      },
    ]);
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRanking(null);

    try {
      const response = await fetch('/api/rank-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects }),
      });

      const data = await response.json();
      if (data.success) {
        setRanking(data.ranking);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to rank projects');
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[rank - 1] || `#${rank}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 font-bold';
    if (score >= 50) return 'text-yellow-600 font-semibold';
    return 'text-gray-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          🏆 Multi-Project Prioritizer
        </h1>
        <p className="text-gray-600 mb-6">
          Submit multiple projects and get a ranked list based on your interest, difficulty, and context
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {projects.map((project, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Project {index + 1}
                  </h3>
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProject(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={project.title}
                      onChange={(e) => updateProject(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Machine Learning Assignment"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      required
                      value={project.description}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Describe the project..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      required
                      value={project.dueDate}
                      onChange={(e) => updateProject(index, 'dueDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complexity
                    </label>
                    <select
                      value={project.complexity}
                      onChange={(e) => updateProject(index, 'complexity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Low (~3h)</option>
                      <option value="medium">Medium (~8h)</option>
                      <option value="high">High (~16h)</option>
                      <option value="very-high">Very High (~30h)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={addProject}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              + Add Another Project
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? 'Analyzing...' : '🎯 Rank Projects'}
            </button>
          </div>
        </form>
      </div>

      {ranking && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            📊 Your Top 3 Priority Projects
          </h2>

          <div className="space-y-6">
            {ranking.topProjects.map((item: any, i: number) => (
              <div
                key={i}
                className={`border-l-4 p-6 rounded-lg ${
                  i === 0
                    ? 'border-yellow-400 bg-yellow-50'
                    : i === 1
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-orange-400 bg-orange-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {getMedalEmoji(item.rank)} {item.title}
                    </h3>
                    <p className={`text-2xl ${getScoreColor(item.priorityScore)}`}>
                      {item.priorityScore}/100
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                    {item.decision}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Interest</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {item.scoreBreakdown.interestScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Difficulty</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {item.scoreBreakdown.difficultyScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Urgency</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {item.scoreBreakdown.urgencyScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Context</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {item.scoreBreakdown.contextRelevanceScore}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Reasoning:</strong> {item.reasoning}
                  </p>
                  <p className="text-sm text-indigo-600">
                    <strong>Recommendation:</strong> {item.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>💡 Summary:</strong> {ranking.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
