'use client'; // This directive is needed for client-side React features

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Terminal, 
  Code, 
  Shield, 
  Zap, 
  GitBranch, 
  CheckCircle, 
  ArrowRight, 
  Users, 
  BarChart3,
  Download,
  Globe,
  RefreshCw,
  Star,
  Play,
  ChevronRight,
  ExternalLink,
  StarIcon,
  HeartHandshakeIcon
} from 'lucide-react';
import Timeline from './Timeline';
import Stars from './Stars';
import About from './About';

export default function HomePage() {
  // Counter states for stats
  const [displayDevelopers, setDisplayDevelopers] = useState(0);
  const [displayReviews, setDisplayReviews] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Initialize counter animation
  useEffect(() => {
    if (!hasAnimated) {
      animateCounter(0, 12847, setDisplayDevelopers, 2000);
      animateCounter(0, 45923, setDisplayReviews, 2000);
      setHasAnimated(true);
    }
  }, [hasAnimated]);

  // Counter animation function
  const animateCounter = (
    start: number,
    end: number,
    setter: React.Dispatch<React.SetStateAction<number>>,
    duration: number
  ) => {
    const startTime = Date.now();
    const range = end - start;
    
    const updateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(start + range * easedProgress);
      
      setter(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    requestAnimationFrame(updateCounter);
  };

  const features = [
    {
      icon: <Terminal className="w-6 h-6" />,
      title: "CLI Integration",
      description: "Seamlessly integrate code reviews into your local development workflow with our powerful CLI tool."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Web Dashboard",
      description: "Review and manage code changes through an intuitive web interface with real-time collaboration."
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: "One-Click Apply",
      description: "Apply suggested changes directly from the dashboard and accept them via CLI with a single command."
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: "Smart Git Integration",
      description: "Automatically commit approved changes with AI-generated commit messages that follow best practices."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Security Focused",
      description: "Advanced security analysis to catch vulnerabilities before they reach production."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Performance Insights",
      description: "Get actionable performance recommendations to optimize your code efficiency."
    }
  ];

  const workflow = [
    {
      step: "01",
      title: "Install CLI",
      description: "Install Raincheck CLI tool and connect to your project",
      command: "npm install -g raincheck-cli"
    },
    {
      step: "02", 
      title: "Run Review",
      description: "Initiate code review from your terminal",
      command: "raincheck review all"
    },
    {
      step: "03",
      title: "Review Dashboard",
      description: "View and manage suggestions in the web dashboard",
      command: "raincheck dashboard --open"
    },
    {
      step: "04",
      title: "Apply & Commit",
      description: "Accept changes and commit with AI-generated messages",
      command: "raincheck apply <hashcode>"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <Stars />
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Code Reviews Into
            <br />
            <span className="text-blue-400">Local Pipeline</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Integrate AI-powered code reviews into your local development workflow. 
            Review in the browser, apply changes via CLI, and commit with intelligent messages.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {/* hover:bg-blue-700 */}
            <button className="bg-blue-600 hover:bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Install CLI Tool (Under Development)
            </button>
            <button className="border border-gray-700 hover:border-yellow-500 text-gray-300 hover:text-yellow-400 px-8 py-4 rounded-lg text-lg font-semibold transition-all flex items-center justify-center gap-2">
              <StarIcon className="w-5 h-5" />
                <Link href='/instantreview'>Try MVP </Link>
            </button>
          </div>

          {/* Stats */}
          {/* <div className="flex justify-center gap-8 mb-16">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 min-w-[140px]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Developers</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">
                {displayDevelopers.toLocaleString()}+
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 min-w-[140px]">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Reviews</span>
              </div>
              <div className="text-3xl font-bold text-green-400">
                {displayReviews.toLocaleString()}+
              </div>
            </div>
          </div> */}
        </div>

        {/* Demo Terminal */}
        <div className="max-w-4xl mx-auto relative">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transform -translate-y-1/2 top-1/2 animate-pulse" />
          
          {/* Floating Terminal */}
          <div className="relative bg-gray-900 rounded-lg border border-gray-800 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 animate-float">
            <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-gray-400 text-sm ml-4">terminal</span>
            </div>
            <div className="p-6 font-mono text-sm">
              <div className="text-green-400">$ raincheck review --branch feature/user-auth</div>
              <div className="text-gray-400 mt-2">🔍 Analyzing code changes...</div>
              <div className="text-gray-400">🛡️  Security check passed</div>
              <div className="text-gray-400">⚡ Performance optimizations found</div>
              <div className="text-gray-400">📝 Code quality suggestions ready</div>
              <div className="text-blue-400 mt-2">✨ Review complete! View dashboard: https://app.raincheck.dev/r/abc123</div>
              <div className="text-green-400 mt-4">$ raincheck apply 44ash54h</div>
              <div className="text-gray-400 mt-2">✅ Applied 3 suggestions</div>
              <div className="text-gray-400">🤖 Generated commit: "feat: optimize user authentication with input validation"</div>
              <div className="text-gray-400">🎉 Changes committed successfully!</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-blue-400 mb-4">Powerful Features</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need for seamless code reviews in your development workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-all transform hover:scale-105">
              <div className="text-blue-400 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-blue-400 mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <Timeline />

      {/* Workflow Section */}
      <section id="workflow" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-blue-400 mb-4">How Raincheck Works</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Four simple steps to transform your code review process
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {workflow.map((step, index) => (
            <div key={index} className="flex flex-col md:flex-row items-start gap-6 mb-12 last:mb-0">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {step.step}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-blue-400 mb-2">{step.title}</h3>
                <p className="text-gray-400 mb-4">{step.description}</p>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <code className="text-green-400 font-mono">{step.command}</code>
                </div>
              </div>
              {/* {index < workflow.length - 1 && (
                <div className="hidden md:block">
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </div>
              )} */}
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      {/* <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-blue-400 mb-4">Trusted by Developers</h2>
          <div className="flex justify-center items-center gap-2 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
            <span className="text-gray-400 text-lg ml-2">4.9/5 from 1,200+ reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah Chen",
              role: "Senior Developer at TechCorp",
              content: "Raincheck has completely transformed our code review process. The CLI integration is seamless and the AI-generated commit messages are surprisingly accurate."
            },
            {
              name: "Mike Rodriguez", 
              role: "DevOps Engineer at StartupXYZ",
              content: "The web dashboard makes collaboration so much easier. Our team can review and apply changes without context switching between tools."
            },
            {
              name: "Alex Thompson",
              role: "Tech Lead at InnovateInc",
              content: "Security insights are top-notch. Raincheck caught several vulnerabilities that our manual reviews missed. It's like having an expert on the team."
            }
          ].map((testimonial, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
              <div>
                <div className="font-semibold text-blue-400">{testimonial.name}</div>
                <div className="text-gray-400 text-sm">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-2xl border border-blue-500/30 p-12 text-center">
          <h2 className="text-4xl font-bold text-blue-400 mb-4">Ready to Transform Your Code Reviews?</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join our waitlist to be the first to streamline your development environment workflow with Raincheck
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2">
              <HeartHandshakeIcon className="w-5 h-5" />
                <Link href='https://getwaitlist.com/waitlist/29359'>Join Waitlist</Link>
            </button>
            <button className="border border-gray-700 hover:border-blue-500 text-gray-300 hover:text-blue-400 px-8 py-4 rounded-lg text-lg font-semibold transition-all flex items-center justify-center gap-2">
              <ExternalLink className="w-5 h-5" />
              <Link href='/docs'>View Documentation</Link>
            </button>
          </div>
          
          <p className="text-gray-500 text-sm mt-4">We promise no spam emails</p>
        </div>
      </section>

      {/* About Section */}
      <About />

      {/* Footer */}
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
                <a href="#pricing" className="text-gray-400 hover:text-blue-400 transition-colors block text-sm">Pricing</a>
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
    </div>
  );
}