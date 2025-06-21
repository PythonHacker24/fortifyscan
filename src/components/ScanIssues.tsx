import React from 'react';
import { Shield, Zap, Code, FileText, Users, CheckCircle, AlertTriangle, XCircle, SparklesIcon } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';

// Type definitions (copied from CodeReviewApp.tsx)
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

function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'high': return 'text-red-400 bg-red-950';
    case 'medium': return 'text-yellow-400 bg-yellow-950';
    case 'low': return 'text-blue-400 bg-blue-950';
    default: return 'text-gray-400 bg-gray-800';
  }
}

function getSeverityIcon(severity: string): React.ReactElement {
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
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-yellow-400';
  return 'text-red-400';
}

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

function normalizeKeys(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const map: Record<string, string> = {
    BestPractices: 'best_practices',
    Maintainability: 'maintainability',
    CodeQuality: 'code_quality',
    Performance: 'performance',
    Security: 'security',
    Suggestions: 'suggestions',
    OverallScore: 'overall_score'
  };
  const newObj: any = {};
  for (const key in obj) {
    const mappedKey = map[key] || key;
    newObj[mappedKey] = obj[key];
  }
  return newObj;
}

interface ScanIssuesProps {
  reviewData: ReviewData | null;
  code: string;
}

export default function ScanIssues({ reviewData, code }: ScanIssuesProps) {
  if (!reviewData) return <div>No issues found.</div>;
  return (
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
      ).map(([category, data]: [string, CategoryData | undefined]) => (
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
            {Array.isArray(data.issues) && data.issues.length > 0 && (
              <div className="space-y-3">
                {data.issues.map((issue: Issue, index: number) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-3 border border-gray-600 relative">
                    {/* Fix Issue Button */}
                    <button
                      className="absolute -top-3 -left-3 flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold px-2 py-1 rounded shadow z-10"
                      style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                      title="Fix Issue"
                      onClick={async () => {
                        try {
                          const response = await fetch(`${API_URL}/api/issues/fix`, {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
                            },
                            body: JSON.stringify({
                              code,
                              suggestion: issue.suggestion,
                              problem: issue.description
                            })
                          });
                          if (!response.ok) throw new Error('Failed to fix issue');
                          alert('Issue fix request sent!');
                        } catch (err) {
                          alert('Failed to send fix request.');
                        }
                      }}
                    >
                      <SparklesIcon className="w-3 h-3 mr-1" /> Fix Issue
                    </button>
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
            {reviewData.suggestions.map((suggestion: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 