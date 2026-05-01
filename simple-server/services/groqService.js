const https = require('https');

const { buildDiscordSummaryPrompts } = require('../prompts/summaryPromptTemplates');
const { buildDiscordPreviewPrompts } = require('../prompts/previewPromptTemplates');

const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com';
const GROQ_SUMMARY_MODEL = process.env.GROQ_MODEL_SUMMARY || 'llama-3.3-70b-versatile';
const GROQ_PREVIEW_MODEL = process.env.GROQ_MODEL_PREVIEW || 'llama-3.1-8b-instant';

const GROQ_TIMEOUT_MS = 15000; // 15 seconds — kill the request if Groq doesn't respond

const callGroqChat = (payload) => {
  return new Promise((resolve, reject) => {
    // Read key at call time so late-set env vars (e.g. during test setup) are always picked up
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return reject(new Error('Groq API key is not configured'));
    }

    const data = JSON.stringify(payload);
    const url = new URL('/openai/v1/chat/completions', GROQ_BASE_URL);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${apiKey}`
      }
    };

    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    const req = https.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => { body += chunk; });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const message = parsed.error && parsed.error.message
              ? parsed.error.message
              : `Groq API error (status ${res.statusCode})`;
            return settle(reject, new Error(message));
          }
          settle(resolve, parsed);
        } catch (error) {
          settle(reject, error);
        }
      });
    });

    const timer = setTimeout(() => {
      req.destroy();
      settle(reject, new Error('Groq API request timed out after 15 seconds'));
    }, GROQ_TIMEOUT_MS);

    req.on('error', (error) => { settle(reject, error); });

    req.write(data);
    req.end();
  });
};

const buildConversationSnippet = (messages, maxMessages) => {
  const sliced = messages.slice(-maxMessages);
  return sliced.map((m) => {
    // m.timestamp is a JS Date from node-postgres; convert to a readable ISO string
    const raw = m.timestamp || m.created_at;
    const timestamp = raw instanceof Date
      ? raw.toISOString().replace('T', ' ').substring(0, 16) // "2025-04-24 14:30"
      : String(raw);
    const author = m.username || m.display_name || 'User';
    return `[${timestamp}] ${author}: ${m.content}`;
  }).join('\n');
};

// Attempt to extract a JSON object from a string that may contain surrounding text/fences.
const extractJson = (raw) => {
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    console.warn('[groqService] extractJson: no JSON braces found in model response — falling back to raw text');
    return null;
  }
  try {
    return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
  } catch {
    console.warn('[groqService] extractJson: JSON.parse failed — falling back to raw text. Response snippet:', raw.slice(0, 120));
    return null;
  }
};

const generateChannelSummary = async ({ channelName, isDm = false, messages, options = {} }) => {
  const maxMessages = options.maxMessages || 50;
  const format = options.format === 'bullets' ? 'bullets' : 'paragraph';

  const conversation = buildConversationSnippet(messages, maxMessages);

  const { systemPrompt, userPrompt } = buildDiscordSummaryPrompts({
    channelName,
    isDm,
    format,
    conversation,
  });

  const response = await callGroqChat({
    model: GROQ_SUMMARY_MODEL,
    temperature: 0.4,
    max_tokens: 600,
    // Ask the model to return a JSON object — supported by llama-3.x models on Groq
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt.trim() },
      { role: 'user', content: userPrompt.trim() }
    ]
  });

  const content = response.choices &&
    response.choices[0] &&
    response.choices[0].message &&
    response.choices[0].message.content;

  if (!content) {
    throw new Error('Groq response did not include summary content');
  }

  // Parse JSON; fall back gracefully if the model ignores the format instruction
  const parsed = extractJson(content);
  const summary = (parsed && typeof parsed.summary === 'string')
    ? parsed.summary.trim()
    : content.trim();

  const topics = (parsed && Array.isArray(parsed.topics))
    ? parsed.topics
        .filter((t) => typeof t === 'string' && t.trim())
        .map((t) => t.trim())
        .slice(0, 5)
    : [];

  return {
    summary,
    topics,
    format,
    model: GROQ_SUMMARY_MODEL
  };
};

const generateChannelPreview = async ({ channelName, isDm = false, messages, unreadCount, maxHighlights = 5 }) => {
  const conversation = buildConversationSnippet(messages, maxHighlights * 10);

  const { systemPrompt, userPrompt } = buildDiscordPreviewPrompts({
    channelName,
    isDm,
    unreadCount,
    conversation,
  });

  const response = await callGroqChat({
    model: GROQ_PREVIEW_MODEL,
    temperature: 0.5,
    max_tokens: 256,
    messages: [
      { role: 'system', content: systemPrompt.trim() },
      { role: 'user', content: userPrompt.trim() }
    ]
  });

  const content = response.choices &&
    response.choices[0] &&
    response.choices[0].message &&
    response.choices[0].message.content;

  if (!content) {
    throw new Error('Groq response did not include preview content');
  }

  // Split into bullet lines; keep it simple and robust to different formats.
  const highlights = content
    .split('\n')
    .map((line) => line.trim().replace(/^[\-\*\d\.\)]\s*/, ''))
    .filter((line) => line.length > 0)
    .slice(0, maxHighlights);

  return {
    highlights,
    model: GROQ_PREVIEW_MODEL
  };
};

module.exports = {
  generateChannelSummary,
  generateChannelPreview
};

