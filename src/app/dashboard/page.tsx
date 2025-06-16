'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Copy, Check, RefreshCw } from 'lucide-react';
import Stars from '@/components/Stars';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    fetchApiKey();
  }, [user, router]);

  const fetchApiKey = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/key`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API key');
      }

      const data = await response.json();
      setApiKey(data.apiKey);
    } catch (error) {
      console.error('Error fetching API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewApiKey = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/key/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate new API key');
      }

      const data = await response.json();
      setApiKey(data.apiKey);
    } catch (error) {
      console.error('Error generating new API key:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <Stars />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading your API key...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Stars />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-400 mb-8">Dashboard</h1>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100">Your API Key</h2>
              <button
                onClick={generateNewApiKey}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Generate New Key'}
              </button>
            </div>

            <div className="relative">
              <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 break-all">
                {apiKey || 'No API key generated yet'}
              </div>
              {apiKey && (
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-blue-400 transition-colors"
                  title="Copy to clipboard"
                >
                  {isCopied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Use this API key to authenticate with raincheck CLI. Keep it secure and never share it publicly.
            </p>
          </div>

          <div className="mt-8 bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Getting Started</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-blue-400 font-medium mb-2">1. Install the CLI</h3>
                <code className="block bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
                  npm install -g raincheck-cli
                </code>
              </div>
              <div>
                <h3 className="text-blue-400 font-medium mb-2">2. Configure your API key</h3>
                <code className="block bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
                  raincheck config set-api-key YOUR_API_KEY
                </code>
              </div>
              <div>
                <h3 className="text-blue-400 font-medium mb-2">3. Start reviewing code</h3>
                <code className="block bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
                  raincheck review --branch feature/new-feature
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 