/**
 * RAG Pipeline TypeScript Interfaces
 */

import { DietaryTag } from '../../backend/src/models/types';

export interface DocumentChunk {
  id: string;
  restaurantId: string;
  restaurantName: string;
  dishName: string;
  category: string;
  price: number;
  calories: number;
  proteinGrams: number;
  dietaryTags: DietaryTag[];
  allergens: string[];
  chunkText: string;
  embedding?: number[];
  prepTimeMinutes: number;
  imageUrl: string;
}

export interface HybridSearchResult {
  chunk: DocumentChunk;
  score: number;
  denseScore: number;
  lexicalScore: number;
  dietaryBoost: number;
  explanation: string;
}

export interface RecommendationRequest {
  userId?: string;
  query?: string;
  dietaryFilters?: DietaryTag[];
  allergens?: string[];
  maxPrice?: number;
  limit?: number;
}

export interface RecommendationResponse {
  recommendations: HybridSearchResult[];
  latencyBreakdown: {
    embeddingMs: number;
    vectorSearchMs: number;
    rerankingMs: number;
    totalMs: number;
  };
  contextSummary: string;
  evaluationMetrics: {
    ndcgScore: number;
    contextRelevance: number;
    groundednessScore: number;
  };
}

export interface SemanticCluster {
  clusterId: string;
  title: string;
  description: string;
  ticketCount: number;
  averageSentiment: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  sampleTickets: {
    id: string;
    text: string;
    sentimentScore: number;
    createdAt: string;
  }[];
  recommendedAction: string;
}
