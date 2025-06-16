'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950/80">
      <div className="container mx-auto px-6 py-12" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl font-bold text-blue-400">Raincheck</span>
            </div>
            <p className="text-gray-400 text-sm">
              Streamlining code reviews for local development environments.
            </p>
          </div>
          
          <div>
            <h4 className="text-blue-400 font-semibold mb-4">Product</h4>
            <div className="space-y-2">
              <a href="#features" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">Features</a>
              <a href="/pricing" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">Pricing</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">Documentation (in progress)</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">API (in progress)</a>
            </div>
          </div>
          
          <div>
            <h4 className="text-blue-400 font-semibold mb-4">Company</h4>
            <div className="space-y-2">
              <a href="https://minimalistbook.com" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">About</a>
              <a href="https://minimalistbook.com" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">Blog</a>
              <a href="https://www.linkedin.com/in/aditya-patil-260a631b2/" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">Careers</a>
              <a href="https://minimalistbook.com" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">Contact</a>
            </div>
          </div>
          
          <div>
            <h4 className="text-blue-400 font-semibold mb-4">Connect</h4>
            <div className="space-y-2">
              <a href="https://x.com/AdityaPati79454" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">Twitter</a>
              <a href="https://github.com/PythonHacker24" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">GitHub</a>
              <a href="https://discord.gg/f8bKmwqWkn" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">Discord</a>
              <a href="https://www.linkedin.com/in/aditya-patil-260a631b2/" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">LinkedIn</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Raincheck. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 