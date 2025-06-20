"use client";

import React, { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Stars from "@/components/Stars";
import ScanIssues from "@/components/ScanIssues";

// Type definitions (copied for consistency)
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

interface ScanData {
  code?: string;
  analysisResult?: ReviewData | string; // analysisResult can be object or stringified JSON
  [key: string]: any; // Allows for other properties on the scan object
}

// Define PageProps to correctly handle params as a Promise for build-time compatibility
interface ScanDetailsPageProps {
  params: Promise<{ scanId: string }>; // params is expected as a Promise by Next.js build
}

function normalizeKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(normalizeKeys);
  }
  if (!obj || typeof obj !== 'object') return obj;
  const map: Record<string, string> = {
    BestPractices: 'best_practices',
    Maintainability: 'maintainability',
    CodeQuality: 'code_quality',
    Performance: 'performance',
    Security: 'security',
    Suggestions: 'suggestions',
    OverallScore: 'overall_score',
    Score: 'score',
    Issues: 'issues',
    Type: 'type',
    Severity: 'severity',
    Description: 'description',
    Line: 'line',
    Suggestion: 'suggestion'
  };
  const newObj: any = {};
  for (const key in obj) {
    const mappedKey = map[key] || key;
    newObj[mappedKey] = normalizeKeys(obj[key]);
  }
  return newObj;
}

export default function ScanDetailsPage({ params }: ScanDetailsPageProps) {
  // Use React.use to unwrap the params Promise
  const resolvedParams = use(params);

  const { scanId } = resolvedParams;

  const searchParams = useSearchParams();
  const apiKey = searchParams.get("apiKey");
  const [scan, setScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiKey || !scanId) return;
    const fetchScan = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const docRef = doc(db, "code_scans", apiKey);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScan({ id: scanId, ...data[scanId] });
      } else {
        console.warn("No API key document found for:", apiKey);
        setScan(null);
      }
      setLoading(false);
    };
    fetchScan();
  }, [apiKey, scanId]);

  if (loading) return <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">Loading scan details...</div>;
  if (!scan) return <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">Scan or API Key not found.</div>;

  let reviewData: ReviewData | null = null;
  if (scan.analysisResult) {
    if (typeof scan.analysisResult === 'string') {
      try {
        reviewData = JSON.parse(scan.analysisResult);
      } catch (e) {
        console.error("Failed to parse analysisResult string:", e);
        reviewData = null;
      }
    } else {
      reviewData = scan.analysisResult as ReviewData;
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <Stars />
      {/* Left: Code */}
      <div className="w-1/2 p-8 border-r border-gray-800">
        <h2 className="text-xl font-bold mb-4">Code</h2>
        <div className="bg-gray-800 rounded-lg p-4 text-sm overflow-x-auto" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <code>
            {String(scan.code || '')
              .split('\n')
              .map((line, idx) => (
                <div key={idx} style={{ display: 'flex' }}>
                  <span style={{ color: '#6b7280', minWidth: 32, textAlign: 'right', userSelect: 'none', marginRight: 12 }}>
                    {idx + 1}
                  </span>
                  <pre style={{ margin: 0, padding: 0, background: 'none', display: 'inline', fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', whiteSpace: 'pre' }}>
                    {line || '\u00A0'}
                  </pre>
                </div>
              ))}
          </code>
        </div>
      </div>
      {/* Right: Issues */}
      <div className="w-1/2 p-8">
        <h2 className="text-xl font-bold mb-4">Review</h2>
        {reviewData ? (
          <>
            <ScanIssues reviewData={normalizeKeys(reviewData)} />
          </>
        ) : (
          <p className="text-gray-400">No detailed review data available for this scan.</p>
        )}
      </div>
    </div>
  );
} 