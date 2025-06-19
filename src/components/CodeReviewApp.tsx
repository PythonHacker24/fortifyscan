'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Code, 
  Shield, 
  Zap, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Users, 
  BarChart3,
  Search
} from 'lucide-react';
import Review from './Review';
import Stars from '@/components/Stars';

// Type definitions
interface Issue {
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  line?: number;
  suggestion: string;
}

interface CategoryData {
  score: number;
  issues: Issue[];
}

interface ReviewData {
  overall_score: number;
  security: CategoryData;
  performance: CategoryData;
  code_quality: CategoryData;
  maintainability: CategoryData;
  best_practices: CategoryData;
  suggestions: string[];
}

interface StatsData {
  visitors: number;
  analyses: number;
}

interface ApiError {
  message: string;
}

const CodeReviewApp: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Counter states
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [analysisCount, setAnalysisCount] = useState<number>(0);
  const [displayVisitorCount, setDisplayVisitorCount] = useState<number>(0);
  const [displayAnalysisCount, setDisplayAnalysisCount] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<boolean>(false);

  // Animation states
  const [showSearchAnimation, setShowSearchAnimation] = useState<boolean>(false);

  // Get the API URL from environment or default to localhost
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

  // Initialize counters and animate on first visit
  useEffect(() => {
    const initializeCounters = async (): Promise<void> => {
      try {
        setStatsError(false);
        
        // Fetch current counts from API
        const response = await fetch(`${API_URL}/api/stats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
        }
        
        const data: StatsData = await response.json();
        
        // Simulate visitor increment
        const newVisitorCount = (data.visitors || 0) + 1;
        const currentAnalysisCount = data.analyses || 0;
        
        // Update server counts
        const updateResponse = await fetch(`${API_URL}/api/stats`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          },
          body: JSON.stringify({ 
            visitors: newVisitorCount, 
            analyses: currentAnalysisCount 
          })
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update visitor count: ${updateResponse.status} ${updateResponse.statusText}`);
        }
        
        setVisitorCount(newVisitorCount);
        setAnalysisCount(currentAnalysisCount);
        
        // Animate counters
        animateCounter(0, newVisitorCount, setDisplayVisitorCount, 1500);
        animateCounter(0, currentAnalysisCount, setDisplayAnalysisCount, 1500);
        
      } catch (error) {
        console.error('Error initializing counters:', error);
        setStatsError(true);
        
        // Hide counters on error instead of showing dummy data
        setDisplayVisitorCount(0);
        setDisplayAnalysisCount(0);
      }
      
      setHasAnimated(true);
    };
    
    if (!hasAnimated) {
      initializeCounters();
    }
  }, [hasAnimated]);

  // Counter animation function
  const animateCounter = (
    start: number, 
    end: number, 
    setter: React.Dispatch<React.SetStateAction<number>>, 
    duration: number
  ): void => {
    const startTime = Date.now();
    const range = end - start;
    
    const updateCounter = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(start + range * easedProgress);
      
      setter(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    requestAnimationFrame(updateCounter);
  };

  // Code analysis API call
  const analyzeCode = async (codeInput: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setReviewData(null);
    setShowSearchAnimation(true);
    
    try {
      const response = await fetch(`${API_URL}/api/analyze-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify({ code: codeInput }),
      });
      
      if (!response.ok) {
        let errorMessage = `Analysis failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Use default error message if JSON parsing fails
        }
        
        throw new Error(errorMessage);
      }
      
      const data: ReviewData = await response.json();
      setReviewData(data);
      
      // Increment analysis counter
      if (!statsError) {
        try {
          const newAnalysisCount = analysisCount + 1;
          setAnalysisCount(newAnalysisCount);
          setDisplayAnalysisCount(newAnalysisCount);
          
          // Update server count
          const updateResponse = await fetch(`${API_URL}/api/stats`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
            },
            body: JSON.stringify({ 
              visitors: visitorCount, 
              analyses: newAnalysisCount 
            })
          });

          if (!updateResponse.ok) {
            throw new Error(`Failed to update analysis count: ${updateResponse.status} ${updateResponse.statusText}`);
          }
        } catch (statsUpdateError) {
          console.error('Failed to update analysis count:', statsUpdateError);
          // Don't fail the whole operation if stats update fails
        }
      }
      
    } catch (err) {
      console.error('Code analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setShowSearchAnimation(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newCode = e.target.value;
    setCode(newCode);
    
    if (newCode.trim()) {
      // Debounce API call
      if (window.codeTimeout) {
        clearTimeout(window.codeTimeout);
      }
      
      window.codeTimeout = setTimeout(() => {
        analyzeCode(newCode);
      }, 1000);
    } else {
      setReviewData(null);
      setError(null);
      setShowSearchAnimation(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-950';
      case 'medium': return 'text-yellow-400 bg-yellow-950';
      case 'low': return 'text-blue-400 bg-blue-950';
      default: return 'text-gray-400 bg-gray-800';
    }
  };

  const getSeverityIcon = (severity: string): React.ReactElement => {
    switch (severity) {
      case 'high':
        return <XCircle className="text-red-500" />;
      case 'medium':
        return <AlertTriangle className="text-yellow-500" />;
      case 'low':
        return <CheckCircle className="text-green-500" />;
      default:
        return <CheckCircle className="text-green-500" />;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
    const icons: Record<string, React.ReactElement> = {
      security: <Shield className="w-5 h-5" />,
      performance: <Zap className="w-5 h-5" />,
      code_quality: <Code className="w-5 h-5" />,
      maintainability: <FileText className="w-5 h-5" />,
      best_practices: <Users className="w-5 h-5" />
    };
    return icons[category] || <FileText className="w-5 h-5" />;
  };

  const SearchAnimation: React.FC = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="relative mb-6">
          <Search className="w-16 h-16 text-blue-400 mx-auto animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20"></div>
          <div className="absolute inset-2 rounded-full border-2 border-blue-400 animate-ping opacity-30 animation-delay-200"></div>
          <div className="absolute inset-4 rounded-full border-2 border-blue-400 animate-ping opacity-40 animation-delay-400"></div>
        </div>
        <p className="text-blue-400 font-semibold mb-2">Scanning your code...</p>
        <p className="text-gray-400 text-sm">Analyzing security, performance & quality</p>
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>
    </div>
  );

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: { liked: boolean; comment: string }): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <Stars />
      <style jsx>{`
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
      
      <div className="container mx-auto p-6">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 mb-2">Paste your code for instant review</h1>
            <p className="text-gray-400">Verify the quality of code you picked from LLMs, StackOverflow, etc. <br /> before you break production</p>
          </div>
          
          {/* Stats Counter - Only show if not in error state */}
          {!statsError && (
            <div className="flex gap-4">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 min-w-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Visitors</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {displayVisitorCount.toLocaleString()}
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 min-w-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Analyses</span>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {displayAnalysisCount.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Code Input */}
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Your Code
              </h2>
            </div>
            <div className="p-4 h-full">
              <textarea
                value={code}
                onChange={handleCodeChange}
                placeholder="Paste your code here for instant review..."
                className="w-full h-[calc(100%-2rem)] bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-100 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Right Panel - Review Results */}
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Code Review
              </h2>
            </div>
            <div className="p-4 h-full overflow-y-auto">
              {showSearchAnimation && (
                <SearchAnimation />
              )}

              {isLoading && !showSearchAnimation && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
                    <p className="text-gray-400">Analyzing your code...</p>
                  </div>
                </div>
              )}

              {error && !reviewData && !showSearchAnimation && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 mb-2">Analysis Failed</p>
                    <p className="text-gray-400 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {!code.trim() && !isLoading && !error && !showSearchAnimation && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Code className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Paste some code to get started</p>
                  </div>
                </div>
              )}

              {reviewData && !showSearchAnimation && (
                <div className="space-y-6">
                  {/* Overall Score */}
                  {reviewData.overall_score !== undefined && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-lg font-semibold text-blue-400 mb-2">Overall Score</h3>
                      <div className="text-3xl font-bold">
                        <span className={getScoreColor(reviewData.overall_score)}>
                          {reviewData.overall_score}/10
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {Object.entries(reviewData).filter(([key]) => 
                    ['security', 'performance', 'code_quality', 'maintainability', 'best_practices'].includes(key)
                  ).map(([category, data]) => (
                    data && (
                      <div key={category} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2 capitalize">
                            <CategoryIcon category={category} />
                            {category.replace('_', ' ')}
                          </h3>
                          {data.score !== undefined && (
                            <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>
                              {data.score}/10
                            </span>
                          )}
                        </div>
                        {data.issues && data.issues.length > 0 && (
                          <div className="space-y-3">
                            {data.issues.map((issue: Issue, index: number) => (
                              <div key={index} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                                <div className="flex items-center gap-2 mb-2">
                                  {getSeverityIcon(issue.severity)}
                                  <span className={`text-sm ${getSeverityColor(issue.severity)}`}>
                                    {issue.type}
                                  </span>
                                </div>
                                <p className="text-sm mb-2">{issue.description}</p>
                                {issue.suggestion && (
                                  <p className="text-sm text-gray-400">
                                    Suggestion: {issue.suggestion}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  ))}

                  {/* General Suggestions */}
                  {reviewData.suggestions && reviewData.suggestions.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-lg font-semibold text-blue-400 mb-3">General Suggestions</h3>
                      <div className="space-y-2">
                        {reviewData.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-300 text-sm">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Review component */}
        {reviewData && <Review onReviewSubmit={handleFeedbackSubmit} />}
      </div>
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    codeTimeout?: NodeJS.Timeout;
  }
}

export default CodeReviewApp;
