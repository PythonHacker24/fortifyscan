export interface Issue {
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  line?: number;
  suggestion: string;
}

export interface CategoryData {
  score: number;
  issues: Issue[];
}

export interface ReviewData {
  overall_score: number;
  security: CategoryData;
  performance: CategoryData;
  code_quality: CategoryData;
  maintainability: CategoryData;
  best_practices: CategoryData;
  suggestions: string[];
}

export interface StatsData {
  visitors: number;
  analyses: number;
}

export interface ApiError {
  message: string;
}

export interface AnalyzeCodeRequest {
  code: string;
}

export interface UpdateStatsRequest {
  visitors: number;
  analyses: number;
}
