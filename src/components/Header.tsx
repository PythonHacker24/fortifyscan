import { Code, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div> */}
            <span className="text-3xl font-bold text-blue-400">Raincheck</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-gray-400 hover:text-blue-400 transition-colors">Features</Link>
            <Link href="/#workflow" className="text-gray-400 hover:text-blue-400 transition-colors">How it Works</Link>
            <Link href="/#pricing" className="text-gray-400 hover:text-blue-400 transition-colors">Pricing</Link>
            <Link href="/instantreview" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              Free Code Review <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
} 