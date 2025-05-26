import { NextRequest, NextResponse } from 'next/server';
import type { AnalyzeCodeRequest, ReviewData, ApiError } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeCodeRequest = await request.json();
    const { code } = body;
    
    if (!code || !code.trim()) {
      const error: ApiError = { message: 'Code is required' };
      return NextResponse.json(error, { status: 400 });
    }

    // TODO: Implement your code analysis logic here
    const analysisResult: ReviewData = await analyzeCodeWithYourService(code);
    
    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Code analysis error:', error);
    const apiError: ApiError = { message: 'Internal server error' };
    return NextResponse.json(apiError, { status: 500 });
  }
}

async function analyzeCodeWithYourService(code: string): Promise<ReviewData> {
  // Replace with your actual backend URL and logic
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  
  const response = await fetch(`${backendUrl}/analyze`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_KEY || ''}`,
    },
    body: JSON.stringify({ code })
  });
  
  if (!response.ok) {
    throw new Error(`Backend analysis failed: ${response.status}`);
  }
  
  const result: ReviewData = await response.json();
  return result;
}
