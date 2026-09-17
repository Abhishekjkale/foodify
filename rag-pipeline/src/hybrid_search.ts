/**
 * Hybrid Search & Multi-Stage Re-Ranking Engine
 * Combines sparse lexical relevance (BM25 token overlap) with dense vector embeddings
 * and applies contextual business rules (dietary preferences, allergy safety, pricing).
 */

import { VectorStore } from './vector_store';
import { Embedder } from './embedder';
import { HybridSearchResult, RecommendationRequest } from './types';
import { Logger } from '../../backend/src/middleware/logger.middleware';

export class HybridSearchEngine {
  private logger = new Logger('HybridSearchEngine');

  constructor(
    private vectorStore: VectorStore,
    private embedder: Embedder
  ) {}

  private computeLexicalScore(query: string, text: string): number {
    if (!query.trim()) return 0.5; // neutral baseline if no text query provided
    const qTokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    if (qTokens.length === 0) return 0.5;

    const docText = text.toLowerCase();
    let matches = 0;
    for (const token of qTokens) {
      if (docText.includes(token)) {
        matches++;
      }
    }
    return Math.min(1.0, (matches / qTokens.length) * 1.25);
  }

  async search(request: RecommendationRequest): Promise<{
    results: HybridSearchResult[];
    latency: { embeddingMs: number; vectorSearchMs: number; rerankingMs: number; totalMs: number };
  }> {
    const t0 = Date.now();
    const query = request.query || 'delicious healthy nutritious dinner options';
    const limit = request.limit || 6;
    const dietaryFilters = request.dietaryFilters || [];
    const allergens = request.allergens || [];

    // Stage 1: Generate dense embedding
    const tEmbedStart = Date.now();
    const queryEmbedding = await this.embedder.embedText(query);
    const embeddingMs = Date.now() - tEmbedStart;

    // Stage 2: Dense Vector Retrieval with allergen hard-filtering
    const tVectorStart = Date.now();
    const vectorCandidates = await this.vectorStore.searchVectors(queryEmbedding, 16, allergens);
    const vectorSearchMs = Date.now() - tVectorStart;

    // Stage 3: Multi-Stage Hybrid Fusion & Contextual Reranking
    const tRerankStart = Date.now();
    const alpha = 0.65; // 65% dense semantic, 35% sparse lexical

    const scoredResults: HybridSearchResult[] = vectorCandidates.map(({ chunk, similarity }) => {
      const lexicalScore = this.computeLexicalScore(query, chunk.chunkText);

      // Compute dietary tag matches
      let dietaryMatches = 0;
      for (const tag of dietaryFilters) {
        if (chunk.dietaryTags.includes(tag)) {
          dietaryMatches++;
        }
      }

      // Boost calculation: 10% per matching user dietary constraint
      const dietaryBoost = dietaryMatches * 0.12;
      const combinedScore = (alpha * similarity) + ((1 - alpha) * lexicalScore) + dietaryBoost;
      const finalScore = Math.min(0.99, Math.max(0.01, combinedScore));

      // Construct explainable rationale for AI Product Manager transparency
      const reasons: string[] = [];
      if (similarity > 0.75) reasons.push('high semantic intent match');
      if (dietaryMatches > 0) reasons.push(`complies with ${dietaryMatches} of your dietary goals (${dietaryFilters.join(', ')})`);
      if (chunk.proteinGrams >= 20) reasons.push(`${chunk.proteinGrams}g high-protein macro profile`);
      if (chunk.price < 18) reasons.push('value-conscious pricing');
      if (reasons.length === 0) reasons.push('popular top-rated chef selection');

      const explanation = `Recommended because: ${reasons.join(', ')}.`;

      return {
        chunk,
        score: Math.round(finalScore * 1000) / 1000,
        denseScore: Math.round(similarity * 1000) / 1000,
        lexicalScore: Math.round(lexicalScore * 1000) / 1000,
        dietaryBoost: Math.round(dietaryBoost * 1000) / 1000,
        explanation
      };
    });

    // Sort by final combined score descending
    scoredResults.sort((a, b) => b.score - a.score);
    const rerankingMs = Date.now() - tRerankStart;
    const totalMs = Date.now() - t0;

    return {
      results: scoredResults.slice(0, limit),
      latency: {
        embeddingMs,
        vectorSearchMs,
        rerankingMs,
        totalMs
      }
    };
  }
}
