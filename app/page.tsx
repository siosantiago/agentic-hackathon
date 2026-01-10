'use client';

import { useState } from 'react';
import StudentBoard from '@/components/StudentBoard';
import ProjectSubmissionForm from '@/components/ProjectSubmissionForm';
import { StudentBoardPayload } from '@/lib/project-manager-agent';

export default function Home() {
  const [boardData, setBoardData] = useState<StudentBoardPayload | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleProjectSubmit = async (projectData: any) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setBoardData(data.studentBoard);
    } catch (error) {
      console.error('Error analyzing project:', error);
      alert('Failed to analyze project. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Project Manager Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform ambitious ideas into actionable sprint tasks. The agent analyzes complexity, 
            checks due dates, and protects your time.
          </p>
          <div className="mt-6">
            <a
              href="/rank"
              className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              🏆 Rank Multiple Projects
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Project Submission */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              Submit Your Project
            </h2>
            <ProjectSubmissionForm 
              onSubmit={handleProjectSubmit} 
              isLoading={isAnalyzing}
            />
          </div>

          {/* Right: Quick Stats */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
              <h3 className="text-lg font-semibold mb-2">How It Works</h3>
              <ol className="space-y-3 text-blue-50">
                <li className="flex gap-3">
                  <span className="font-bold">1.</span>
                  <span>Submit your ambitious project idea</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">2.</span>
                  <span>Agent checks complexity & due dates</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold">3.</span>
                  <span>Get actionable sprint tasks instantly</span>
                </li>
              </ol>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
              <h3 className="text-lg font-semibold mb-2">Agent Capabilities</h3>
              <ul className="space-y-2 text-purple-50">
                <li>✅ Due date tracking with MongoDB</li>
                <li>✅ Smart task breakdown</li>
                <li>✅ Time feasibility analysis</li>
                <li>✅ Sprint capacity management</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Student Board */}
        {boardData && (
          <div className="mt-12">
            <StudentBoard data={boardData} />
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Analyzing Project...
              </h3>
              <p className="text-gray-600">
                The Project Manager is evaluating feasibility and creating your sprint plan.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
