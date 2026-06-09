import { type OpenAIReviewConfig } from './config.js';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_SYSTEM_PROMPT =
  'You are a senior frontend code reviewer. Keep output short, practical, and structured.';

type OpenAIChatChoice = {
  message: {
    content: string;
  };
};

type OpenAIChatResponse = {
  choices?: OpenAIChatChoice[];
};

const createOpenAIRequestBody = (prompt: string, config: OpenAIReviewConfig): string =>
  JSON.stringify({
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    messages: [
      {
        role: 'system',
        content: OPENAI_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

export const extractOpenAIReviewText = (response: OpenAIChatResponse): string => {
  const firstChoice = response.choices?.[0];
  if (!firstChoice?.message?.content) {
    return '';
  }

  return firstChoice.message.content.trim();
};

export const generateOpenAIReview = async (
  prompt: string,
  config: OpenAIReviewConfig,
  apiKey: string,
): Promise<string> => {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: createOpenAIRequestBody(prompt, config),
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });

  if (!response.ok) {
    const message = `OpenAI API error: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const openAIReview = extractOpenAIReviewText(payload);
  if (!openAIReview) {
    throw new Error('OpenAI API response had no review content.');
  }

  return openAIReview;
};

export { OPENAI_CHAT_COMPLETIONS_URL, OPENAI_SYSTEM_PROMPT };
