/**
 * Embedding Service for Foodify RAG Pipeline
 * Integrates with Google GenAI SDK (gemini-embedding-2-preview) with resilient fallback.
 */

import { GoogleGenAI } from '@google/genai';
import { Logger } from '../../backend/src/middleware/logger.middleware';

export class Embedder {
  private logger = new Logger('RAG-Embedder');
  private ai: GoogleGenAI | null = null;
  private readonly dimension = 768;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        this.logger.info('Gemini GenAI client initialized for embedding generation.');
      } catch (err) {
        this.logger.warn('Failed to initialize Gemini GenAI client; utilizing deterministic vector engine.');
      }
    } else {
      this.logger.info('Running with deterministic high-dimensional embedding engine.');
    }
  }

  async embedText(text: string): Promise<number[]> {
    if (this.ai) {
      try {
        const response = await this.ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: text
        });

        if (response?.embeddings?.[0]?.values) {
          return response.embeddings[0].values;
        }
      } catch (err) {
        this.logger.warn(`Gemini embedding call failed, falling back to local engine: ${err}`);
      }
    }

    return this.generateDeterministicEmbedding(text);
  }

  /**
   * Deterministic 768-dimensional normalized unit vector generated via pseudo-random seeded distribution.
   * Ensures identical texts yield identical vectors with realistic cosine similarity distribution.
   */
  private generateDeterministicEmbedding(text: string): number[] {
    const vector = new Array(this.dimension).fill(0);
    const normalized = text.toLowerCase().trim();
    
    // Seed PRNG from string characters
    let seed = 0;
    for (let i = 0; i < normalized.length; i++) {
      seed = (seed << 5) - seed + normalized.charCodeAt(i);
      seed |= 0;
    }

    // Token frequency dispersion across dimensions
    const words = normalized.split(/\W+/).filter(Boolean);
    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      let hash = 5381;
      for (let i = 0; i < word.length; i++) {
        hash = (hash * 33) ^ word.charCodeAt(i);
      }
      const targetDim = Math.abs(hash) % this.dimension;
      vector[targetDim] += 1.0;
      vector[(targetDim + 37) % this.dimension] += 0.5;
      vector[(targetDim + 127) % this.dimension] -= 0.3;
    }

    // Add baseline seeded noise
    let s = Math.abs(seed);
    for (let i = 0; i < this.dimension; i++) {
      s = (s * 16807) % 2147483647;
      vector[i] += ((s / 2147483647) - 0.5) * 0.15;
    }

    // L2 normalize
    let sumSquares = 0;
    for (let i = 0; i < this.dimension; i++) {
      sumSquares += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSquares) || 1.0;
    for (let i = 0; i < this.dimension; i++) {
      vector[i] = vector[i] / norm;
    }

    return vector;
  }
}
