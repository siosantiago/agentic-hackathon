import TopProjects from '@/components/TopProjects';
import Link from 'next/link';

export default function TopProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Project Manager</h1>
              <div className="flex gap-4">
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
                <Link href="/rank" className="text-gray-600 hover:text-gray-900">
                  Rank Projects
                </Link>
                <Link href="/top-projects" className="text-blue-600 font-medium border-b-2 border-blue-600">
                  Top 3 Projects
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TopProjects />
      </main>
    </div>
  );
}
