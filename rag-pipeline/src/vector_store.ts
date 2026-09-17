/**
 * Pgvector-compatible Vector Store & In-Memory Index
 */

import { DocumentChunk } from './types';
import { Embedder } from './embedder';
import { Logger } from '../../backend/src/middleware/logger.middleware';

export class VectorStore {
  private logger = new Logger('VectorStore');
  private chunks: DocumentChunk[] = [];
  private embedder: Embedder;

  constructor(embedder: Embedder) {
    this.embedder = embedder;
  }

  async initializeIndex(rawChunks: DocumentChunk[]): Promise<void> {
    const startTime = Date.now();
    this.logger.info(`Initializing vector store with ${rawChunks.length} chunks...`);

    for (const chunk of rawChunks) {
      if (!chunk.embedding) {
        chunk.embedding = await this.embedder.embedText(chunk.chunkText);
      }
      this.chunks.push(chunk);
    }

    this.logger.info(`Vector store initialized successfully in ${Date.now() - startTime}ms`, {
      indexedChunks: this.chunks.length
    });
  }

  cosineSimilarity(v1: number[], v2: number[]): number {
    let dot = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }
    if (norm1 === 0 || norm2 === 0) return 0;
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  async searchVectors(
    queryEmbedding: number[],
    topK = 8,
    filterAllergens: string[] = []
  ): Promise<{ chunk: DocumentChunk; similarity: number }[]> {
    const lowerAllergens = filterAllergens.map(a => a.toLowerCase());

    const scored = this.chunks
      .filter(chunk => {
        // Exclude fatal allergens
        if (lowerAllergens.length > 0) {
          const itemAllergens = chunk.allergens.map(a => a.toLowerCase());
          return !lowerAllergens.some(userAllergen => itemAllergens.includes(userAllergen));
        }
        return true;
      })
      .map(chunk => {
        const sim = chunk.embedding ? this.cosineSimilarity(queryEmbedding, chunk.embedding) : 0;
        return {
          chunk,
          similarity: Math.max(0, Math.min(1, sim))
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, topK);
  }

  getAllChunks(): DocumentChunk[] {
    return this.chunks;
  }
}
