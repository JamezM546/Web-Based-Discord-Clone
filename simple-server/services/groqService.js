const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com';
const GROQ_SUMMARY_MODEL = process.env.GROQ_MODEL_SUMMARY || 'llama-3.1-70b-versatile';
const GROQ_PREVIEW_MODEL = process.env.GROQ_MODEL_PREVIEW || 'llama-3.1-8b-instant';

if (!GROQ_API_KEY) {
  // Intentionally log a warning instead of throwing so the rest of the API still works.
  console.warn('GROQ_API_KEY is not set. Summary and preview features will be disabled until it is configured.');
}

const callGroqChat = (payload) => {
  return new Promise((resolve, reject) => {
    if (!GROQ_API_KEY) {
      return reject(new Error('Groq API key is not configured'));
    }

    const data = JSON.stringify(payload);
    const url = new URL('/openai/v1/chat/completions', GROQ_BASE_URL);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${GROQ_API_KEY}`
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const message = parsed.error && parsed.error.message
              ? parsed.error.message
              : `Groq API error (status ${res.statusCode})`;
            return reject(new Error(message));
          }
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

const buildConversationSnippet = (messages, maxMessages) => {
  const sliced = messages.slice(-maxMessages);
  return sliced.map((m) => {
    const timestamp = m.timestamp || m.created_at;
    const author = m.username || m.display_name || 'User';
    return `[${timestamp}] ${author}: ${m.content}`;
  }).join('\n');
};

const generateChannelSummary = async ({ channelName, messages, options = {} }) => {
  const maxMessages = options.maxMessages || 50;
  const format = options.format === 'bullets' ? 'bullets' : 'paragraph';

  const conversation = buildConversationSnippet(messages, maxMessages);

  const systemPrompt = `
You are an assistant summarizing Discord-style chat conversations for users who were away.
Provide accurate, concise summaries that are easy to skim.
If the requested format is "bullets", use 3-7 bullet points.
If the format is "paragraph", use 1-3 short paragraphs.
`;

  const userPrompt = `
Channel: ${channelName || 'Unnamed channel'}
Format: ${format}

Here is the recent conversation history the user missed:

${conversation}

Summarize what happened so the user can quickly catch up.
`;

  const response = await callGroqChat({
    model: GROQ_SUMMARY_MODEL,
    temperature: 0.4,
    max_tokens: 512,
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

  return {
    summary: content.trim(),
    format,
    model: GROQ_SUMMARY_MODEL
  };
};

const generateChannelPreview = async ({ channelName, messages, unreadCount, maxHighlights = 5 }) => {
  const conversation = buildConversationSnippet(messages, maxHighlights * 10);

  const systemPrompt = `
You are an assistant generating very short "what you missed" previews for a Discord-style chat channel.
Output 3-5 concise bullet points highlighting only the most important events, decisions, or threads.
Each highlight should be a single sentence.
Avoid redundant or trivial chatter.
`;

  const userPrompt = `
Channel: ${channelName || 'Unnamed channel'}
Unread messages: ${unreadCount}

Here is a sample of the unread conversation:

${conversation}

Generate 3-5 bullet point highlights summarizing what the user missed.
`;

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

