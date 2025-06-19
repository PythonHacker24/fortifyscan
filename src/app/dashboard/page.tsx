'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Copy, Check, RefreshCw, Home, Scan } from 'lucide-react';
import Stars from '@/components/Stars';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase'; // adjust if needed
import { doc, getDoc } from 'firebase/firestore';
import ScanIssues from "@/components/ScanIssues";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState('get-started');
  const [scans, setScans] = useState<any[]>([]);
  const [isScansLoading, setIsScansLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    fetchApiKey();
  }, [user, router]);

  useEffect(() => {
    if (apiKey) {
      setIsScansLoading(true);
      fetchScans(apiKey)
        .then(scans => {
          console.log('Fetched scans:', scans);
          setScans(scans);
        })
        .finally(() => setIsScansLoading(false));
    }
  }, [apiKey]);

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

  const fetchScans = async (apiKey: string) => {
    try {
      const db = getFirestore(app);
      const docRef = doc(db, 'code_scans', apiKey);
      const docSnap = await getDoc(docRef);
  
      if (!docSnap.exists()) {
        return [];
      }
  
      const data = docSnap.data();
      // Each field is a scan, key is scanID
      const scansArray = Object.entries(data).map(([scanID, scanData]: [string, any]) => ({
        id: scanID,
        ...scanData,
      }));
  
      // Sort by timestamp (latest first)
      scansArray.sort((a, b) => {
        // If timestamp is a Firestore Timestamp object
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return bTime - aTime;
      });
  
      return scansArray;
    } catch (error) {
      console.error('Error fetching scans:', error);
      return [];
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

  const renderContent = () => {
    switch (activeSection) {
      case 'get-started':
        return (
          <div className="space-y-8">
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

            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">Getting Started for MVP Stage I</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-blue-400 font-medium mb-2">1. Install the CLI</h3>
                  <code className="block bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
                    curl -sSL https://raw.githubusercontent.com/PythonHacker24/fortifyscan/main/cli.sh | bash 
                  </code>
                </div>
                <div>
                  <h3 className="text-blue-400 font-medium mb-2">2. Configure your API key</h3>
                  <code className="block bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
                    raincheck login YOUR_API_KEY
                  </code>
                </div>
                <div>
                  <h3 className="text-blue-400 font-medium mb-2">3. Start reviewing code</h3>
                  <code className="block bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
                    raincheck review all
                  </code>
                </div>
              </div>
            </div>
          </div>
        );
      case 'scans':
        return (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-100">Recent Scans</h2>
              <button
                onClick={async () => {
                  setIsScansLoading(true);
                  const newScans = await fetchScans(apiKey!);
                  setScans(newScans);
                  setIsScansLoading(false);
                }}
                disabled={isScansLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reload scans"
              >
                <RefreshCw className={`w-4 h-4 ${isScansLoading ? 'animate-spin' : ''}`} />
                {isScansLoading ? 'Reloading...' : 'Reload'}
              </button>
            </div>
            {isScansLoading ? (
              <div>Loading scans...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-800">
                      <th className="pb-4 text-gray-400 font-medium">Scan ID</th>
                      <th className="pb-4 text-gray-400 font-medium">Date</th>
                      <th className="pb-4 text-gray-400 font-medium">Issues Found</th>
                      <th className="pb-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map(scan => {
                      const analysis = scan.analysisResult || {};
                      const categories = [
                        analysis.security,
                        analysis.performance,
                        analysis.code_quality,
                        analysis.maintainability,
                        analysis.best_practices
                      ];
                      const totalIssues = categories.reduce((sum, cat) => sum + (Array.isArray(cat?.issues) ? cat.issues.length : 0), 0);
                      return (
                        <tr key={scan.id} className="border-b border-gray-800">
                          <td className="py-4 text-gray-300">{scan.id}</td>
                          <td className="py-4 text-gray-300">
                            {scan.timestamp
                              ? new Date(scan.timestamp.seconds * 1000).toLocaleString()
                              : "-"}
                          </td>
                          <td className="py-4 text-gray-300">{totalIssues}</td>
                          <td className="py-4">
                            <button
                              className="text-blue-400 hover:text-blue-300"
                              onClick={() => router.push(`/dashboard/scan/${scan.id}?apiKey=${apiKey}`)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Stars />
      <div className="flex">
        {/* Side Panel */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-blue-400 mb-8">Dashboard</h1>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection('get-started')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === 'get-started'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                <Home className="w-5 h-5" />
                Get Started
              </button>
              <button
                onClick={() => setActiveSection('scans')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === 'scans'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                <Scan className="w-5 h-5" />
                Scans
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
} 