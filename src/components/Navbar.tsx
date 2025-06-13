import { CirclePlusIcon, CircleUserIcon, GithubIcon, Heart, HeartHandshake } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="w-full h-16 border-b border-gray-800 bg-gray-950">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Raincheck</h1>

        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/PythonHacker24/fortifyscan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-100 transition-colors"
          >
            {/* <CircleUserIcon className="w-5 h-5" />
            <span>Log In</span> */}

            <GithubIcon className='w-5 h-5' />
              <span>GitHub</span>
          </Link>
          
          <Link
            href="https://getwaitlist.com/waitlist/29359"
            target="_blank"
            rel="noopener noreferrer"
            // className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-gray-100 transition-colors"
          >
            <HeartHandshake className='w-5 h-5' />
           <span>Join Waitlist</span>
          </Link>
        </div>
      </div>
    </nav>
  );
} 
