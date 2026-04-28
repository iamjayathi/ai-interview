import { HfInference } from '@huggingface/inference';

export type EmbeddingProvider = 'openai' | 'gemini' | 'huggingface' | 'keyword';

function detectProvider(): EmbeddingProvider {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.HF_API_KEY)     return 'huggingface';
  return 'keyword';
}

export function activeProvider(): EmbeddingProvider {
  return detectProvider();
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const provider = detectProvider();
  switch (provider) {
    case 'openai':      return embedWithOpenAI(texts);
    case 'gemini':      return embedWithGemini(texts);
    case 'huggingface': return embedWithHuggingFace(texts);
    default:            return embedWithKeywords(texts);
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  const vecs = await embedTexts([text]);
  return vecs[0];
}

const OPENAI_MODEL = 'text-embedding-3-small';

async function embedWithOpenAI(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: OPENAI_MODEL, input: texts }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.data as Array<{ embedding: number[] }>)
    .sort((a, b) => (a as unknown as { index: number }).index - (b as unknown as { index: number }).index)
    .map((d) => d.embedding);
}

const GEMINI_EMBED_MODEL = 'text-embedding-004';

async function embedWithGemini(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;

  return Promise.all(texts.map(async (text) => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBED_MODEL}:embedContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] }
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini embeddings ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.embedding.values as number[];
  }));
}

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

let _hf: HfInference | null = null;
function hf(): HfInference {
  if (!_hf) _hf = new HfInference(process.env.HF_API_KEY);
  return _hf;
}

async function embedWithHuggingFace(texts: string[]): Promise<number[][]> {
  const result = await hf().featureExtraction({
    model: HF_MODEL,
    inputs: texts,
  });
  return result as number[][];
}

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','was','are','were','be','been','have','has','had','do','does',
  'did','will','would','could','should','may','might','this','that','these',
  'those','i','we','you','he','she','it','they','my','our','their','its',
  'not','no','so','if','then','than','as','up','out','about','into','over',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function buildVocab(texts: string[]): string[] {
  const freq = new Map<string, number>();
  for (const text of texts) {
    for (const token of tokenize(text)) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 512)
    .map(([word]) => word);
}

let _vocab: string[] = [];

function embedWithKeywords(texts: string[]): number[][] {
  _vocab = buildVocab(texts);
  return texts.map((text) => textToVector(text, _vocab));
}

function textToVector(text: string, vocab: string[]): number[] {
  const tokens = tokenize(text);
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return vocab.map((word) => tf.get(word) ?? 0);
}

export async function embedQueryWithFallback(text: string): Promise<number[]> {
  const provider = detectProvider();
  if (provider !== 'keyword') return embedQuery(text);
  if (_vocab.length === 0) return embedQuery(text);
  return textToVector(text, _vocab);
}
