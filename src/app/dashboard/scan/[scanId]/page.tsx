"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, use } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Stars from "@/components/Stars";
import ScanIssues from "@/components/ScanIssues";

export default function ScanDetailsPage({ params }) {
  // Unwrap params if it's a Promise (for future Next.js compatibility)
  const unwrappedParams = typeof params.then === 'function' ? React.use(params) : params;
  const searchParams = useSearchParams();
  const apiKey = searchParams.get("apiKey");
  const scanId = unwrappedParams.scanId;
  const [scan, setScan] = useState(null);
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
      }
      setLoading(false);
    };
    fetchScan();
  }, [apiKey, scanId]);

  if (loading) return <div>Loading...</div>;
  if (!scan) return <div>Scan not found.</div>;

  // Parse analysisResult if it's a string
  let reviewData = scan.analysisResult;
  if (typeof reviewData === 'string') {
    try {
      reviewData = JSON.parse(reviewData);
    } catch (e) {
      reviewData = null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <Stars />
      {/* Left: Code */}
      <div className="w-1/2 p-8 border-r border-gray-800">
        <h2 className="text-xl font-bold mb-4">Code</h2>
        <pre className="bg-gray-800 rounded-lg p-4 text-sm overflow-x-auto">{scan.code}</pre>
      </div>
      {/* Right: Issues */}
      <div className="w-1/2 p-8">
        <h2 className="text-xl font-bold mb-4">Issues</h2>
        <pre className="mb-4 bg-gray-900 rounded p-2 text-xs text-gray-400 overflow-x-auto">{JSON.stringify(reviewData, null, 2)}</pre>
        <ScanIssues reviewData={reviewData} />
      </div>
    </div>
  );
} 