import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface TimelineItem {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  date?: string;
}

const timelineItems: TimelineItem[] = [
  {
    title: "Initial Feed-Based Development",
    description: "Basic code review functionality on web app for getting the feel of the product",
    status: "completed",
    date: "June 2025"
  },
  {
    title: "Basic Review CLI Tool Development",
    description: "Building the basic command-line interface for local integration with just code reviews",
    status: "completed",
    date: "June 2025"
  },
  {
    title: "Complete Web Dashboard",
    description: "Building a complete web dashboard for code reviews and interactive fixing",
    status: "in-progress",
    date: "To be announced ..."
  },
  {
    title: "CLI tool upgraded to fix issues",
    description: "CLI tool will fix the issues and improve code quality on demand",
    status: "upcoming",
    date: "To be announced ..."
  },
  {
    title: "Complete Raincheck Launch",
    description: "Launching the complete product with CLI integrated with web dashboard",
    status: "upcoming",
    date: "To be announced ..."
  }
];

export default function Timeline() {
  return (
    <div className="container mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-blue-400 mb-4">Development Timeline</h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Track our progress as we build and improve Raincheck
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {timelineItems.map((item, index) => (
          <div key={index} className="relative pl-8 pb-12 last:pb-0">
            {/* Vertical Line */}
            {index !== timelineItems.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-800" />
            )}

            {/* Timeline Icon */}
            <div className="absolute left-0 top-1">
              {item.status === 'completed' && (
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
              )}
              {item.status === 'in-progress' && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400 animate-spin" />
                </div>
              )}
              {item.status === 'upcoming' && (
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <Circle className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-blue-400">{item.title}</h3>
                <span className="text-sm text-gray-500">{item.date}</span>
              </div>
              <p className="text-gray-400">{item.description}</p>
              {item.status === 'in-progress' && (
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-400">
                  <Clock className="w-4 h-4" />
                  <span>Currently in development</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 