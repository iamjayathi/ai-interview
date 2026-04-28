interface LLMConfig {
  url:     string;
  headers: Record<string, string>;
  model:   string;
  name:    string;
}

export function getLLMConfig(): LLMConfig {
  const cerebras = process.env.CEREBRAS_API_KEY;
  const groq     = process.env.GROQ_API_KEY;
  const gemini   = process.env.GEMINI_API_KEY;

  if (cerebras) {
    return {
      name:    'Cerebras',
      url:     'https://api.cerebras.ai/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cerebras}` },
      model:   process.env.CEREBRAS_MODEL || 'llama3.1-8b',
    };
  }

  if (groq) {
    return {
      name:    'Groq',
      url:     'https://api.groq.com/openai/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groq}` },
      model:   process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    };
  }

  if (gemini) {
    return {
      name:    'Gemini',
      url:     'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gemini}` },
      model:   process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    };
  }

  const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  return {
    name:    'Ollama',
    url:     `${ollamaBase}/v1/chat/completions`,
    headers: { 'Content-Type': 'application/json' },
    model:   process.env.OLLAMA_MODEL || 'llama3.2',
  };
}

export async function ollamaChat<T>(
  systemPrompt: string,
  userMessage: string,
  temperature = 0.4,
): Promise<T> {
  const { url, headers, model, name } = getLLMConfig();

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature,
      stream: false,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${name} LLM ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const keys = Object.keys(parsed);
    if (keys.length === 1 && typeof parsed[keys[0]] === 'object' && parsed[keys[0]] !== null) {
      console.log(`[LLM] unwrapping nested key "${keys[0]}" from ${name} response`);
      return parsed[keys[0]] as T;
    }
  }

  return parsed as T;
}
