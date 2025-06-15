import { Megaphone } from 'lucide-react';
import Link from 'next/link';

export default function Announcement() {
  return (
    <div className="bg-blue-600/10 border-b border-blue-500/20">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
          <Megaphone className="w-4 h-4" />
          <p>Raincheck is under development and MVP testing phase. Your support through is appreciated!</p>
        </div>
      </div>
    </div>
  );
} 