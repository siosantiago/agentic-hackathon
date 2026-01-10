'use client';

import { StudentBoardPayload } from '@/lib/project-manager-agent';
import { format } from 'date-fns';

interface StudentBoardProps {
  data: StudentBoardPayload;
}

export default function StudentBoard({ data }: StudentBoardProps) {
  const capacityPercentage = (data.currentWeek.allocatedHours / data.currentWeek.availableHours) * 100;
  const remainingHours = data.currentWeek.availableHours - data.currentWeek.allocatedHours;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            📊 Student Board
          </h2>
          <span className="text-sm text-gray-500">
            {format(new Date(data.timestamp), 'PPp')}
          </span>
        </div>

        {/* Current Week Status */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Week {data.currentWeek.week}, {data.currentWeek.year} - Sprint Capacity
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available Hours:</span>
              <span className="font-bold">{data.currentWeek.availableHours}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Allocated:</span>
              <span className="font-bold">{data.currentWeek.allocatedHours.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-bold text-green-600">{remainingHours.toFixed(1)}h</span>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    capacityPercentage > 80
                      ? 'bg-red-500'
                      : capacityPercentage > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {capacityPercentage.toFixed(0)}% capacity
              </p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {data.warnings.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <h4 className="font-semibold text-red-800 mb-2">Warnings</h4>
            <ul className="space-y-1">
              {data.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-red-700">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {data.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-blue-700">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Project Analysis */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Project Analysis: {data.projectAnalysis.title}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Decision Badge */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Decision</label>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                data.projectAnalysis.decision === 'EXECUTE_NOW'
                  ? 'bg-green-100 text-green-800'
                  : data.projectAnalysis.decision === 'BREAK_DOWN'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {data.projectAnalysis.decision.replace('_', ' ')}
            </span>
          </div>

          {/* Complexity */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Complexity</label>
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 capitalize">
              {data.projectAnalysis.complexity}
            </span>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Estimated Hours</label>
            <p className="text-2xl font-bold text-gray-900">
              {data.projectAnalysis.estimatedHours}h
            </p>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Due Date</label>
            <p className="text-lg font-semibold text-gray-900">
              {format(new Date(data.projectAnalysis.dueDate), 'PPP')}
            </p>
            <p className="text-sm text-gray-500">
              ({data.projectAnalysis.feasibility.daysUntilDue} days away)
            </p>
          </div>
        </div>

        {/* Reasoning */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-2">Agent Reasoning</h4>
          <p className="text-gray-700">{data.projectAnalysis.reasoning}</p>
        </div>

        {/* Contextual Insights */}
        {data.projectAnalysis.contextualInsights && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Contextual Insights (from MongoDB)</h4>
            
            {/* Related Concepts */}
            {data.projectAnalysis.contextualInsights.relatedConcepts.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 block mb-2">Related Concepts</label>
                <div className="flex flex-wrap gap-2">
                  {data.projectAnalysis.contextualInsights.relatedConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {data.projectAnalysis.contextualInsights.recentActivity.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 block mb-2">Recent Activity</label>
                <ul className="text-sm text-gray-700 space-y-1">
                  {data.projectAnalysis.contextualInsights.recentActivity.map((activity, idx) => (
                    <li key={idx}>• {activity}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upcoming Deadlines */}
            {data.projectAnalysis.contextualInsights.upcomingDeadlines.length > 0 && (
              <div>
                <label className="text-sm text-gray-600 block mb-2">Upcoming Deadlines</label>
                <ul className="text-sm text-gray-700 space-y-2">
                  {data.projectAnalysis.contextualInsights.upcomingDeadlines.map((deadline, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-amber-50 p-2 rounded">
                      <span>{deadline.title}</span>
                      <span className="font-semibold text-amber-800">
                        {deadline.daysAway} days
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sprint Tasks */}
      {data.sprintTasks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            📋 Sprint Tasks ({data.sprintTasks.length})
          </h3>

          <div className="space-y-4">
            {data.sprintTasks.map((task, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900 flex-1">
                    {task.title}
                  </h4>
                  <span
                    className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold ${
                      task.priority === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3">{task.description}</p>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>⏱️ {task.estimatedHours}h</span>
                  <span>📅 Week {task.sprintWeek}, {task.sprintYear}</span>
                  <span className="capitalize">Status: {task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
