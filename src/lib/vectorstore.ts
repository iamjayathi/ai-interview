import { ResumeChunk, RoundType } from './types';
import { embedQuery, embedQueryWithFallback } from './embeddings';

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: ResumeChunk['type'];
    relevantRounds: RoundType[];
    keywords: string[];
  };
}

export interface VectorStoreAdapter {
  add(docs: VectorDocument[]): Promise<void>;
  search(queryEmbedding: number[], k: number, roundFilter?: RoundType): Promise<VectorDocument[]>;
}

export class InMemoryVectorStore implements VectorStoreAdapter {
  private docs: VectorDocument[] = [];

  async add(docs: VectorDocument[]): Promise<void> {
    this.docs.push(...docs);
  }

  async search(
    queryEmbedding: number[],
    k: number,
    roundFilter?: RoundType
  ): Promise<VectorDocument[]> {
    const pool = roundFilter
      ? this.docs.filter((d) => d.metadata.relevantRounds.includes(roundFilter))
      : this.docs;

    return pool
      .map((doc) => ({ doc, score: cosineSimilarity(queryEmbedding, doc.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(({ doc }) => doc);
  }

  get size() { return this.docs.length; }
}

export function createVectorStore(): VectorStoreAdapter {
  return new InMemoryVectorStore();
}

export async function storeFromChunks(chunks: ResumeChunk[]): Promise<VectorStoreAdapter> {
  const store = createVectorStore();
  const docs: VectorDocument[] = chunks
    .filter((c): c is ResumeChunk & { embedding: number[] } => !!c.embedding)
    .map((c) => ({
      id: c.id,
      content: c.content,
      embedding: c.embedding,
      metadata: {
        type: c.type,
        relevantRounds: c.relevantRounds,
        keywords: c.keywords,
      },
    }));
  await store.add(docs);
  return store;
}

export async function semanticSearch(
  store: VectorStoreAdapter,
  query: string,
  round: RoundType,
  k = 4
): Promise<string[]> {
  const qv = await embedQueryWithFallback(query);
  const results = await store.search(qv, k, round);
  return results.map((r) => r.content);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
