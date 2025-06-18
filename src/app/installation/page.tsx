'use client';

import React from 'react';
import { Terminal, Key, Mail, ArrowRight, Download, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function InstallationPage() {
  const steps = [
    {
      icon: <Terminal className="w-6 h-6" />,
      title: "Sign Up for Raincheck",
      description: "Create your account on Raincheck to get started with code reviews.",
      command: null
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: "Get Your API Key",
      description: "Navigate to your dashboard and copy your unique API key.",
      command: null
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Install the CLI Tool",
      description: "Install Raincheck CLI using our one-line installer (macOS and Linux supported).",
      command: "curl -sSL https://raw.githubusercontent.com/PythonHacker24/fortifyscan/main/cli.sh | bash"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Login to CLI",
      description: "Authenticate your CLI tool with your API key.",
      command: "raincheck login API_KEY"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Review a Single File",
      description: "Scan and review a specific file in your project.",
      command: "raincheck review file FILE_NAME"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Review All Files",
      description: "Scan and review all files in your project directory.",
      command: "raincheck review all"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Installation Guide for MVP I
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Follow these simple steps to get started with Raincheck CLI
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="mb-12 last:mb-0">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    {step.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-blue-400 mb-2">{step.title}</h3>
                  <p className="text-gray-400 mb-4">{step.description}</p>
                  {step.command && (
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                      <code className="text-green-400 font-mono">{step.command}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <Mail className="w-5 h-5" />
            <span>Need help? Contact us at </span>
            <a href="mailto:adityapatil24680@gmail.com" className="text-blue-400 hover:text-blue-300">
              adityapatil24680@gmail.com
            </a>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>
      <Footer/>
    </div>
  );
} 