const buildDiscordSummaryPrompts = ({ channelName, isDm, format, conversation }) => {
  const contextLabel = isDm
    ? 'Direct Message conversation'
    : `Channel: ${channelName || 'Unnamed channel'}`;

  const systemPrompt = `
You are an assistant summarizing Discord-style chat conversations for users who were away.
You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no extra text.

The JSON object must have exactly these two fields:
  "summary": the conversation summary (${format === 'bullets' ? '3-7 concise bullet points, each starting with "- "' : '1-3 short paragraphs'})
  "topics": an array of 2-5 short topic tags extracted from the conversation (e.g. ["project deadline", "bug fix", "design review"])

Example response format:
{"summary":"${format === 'bullets' ? '- Point one\\n- Point two' : 'A paragraph summarizing the chat.'}","topics":["topic one","topic two"]}
`;

  const userPrompt = `
${contextLabel}
Format: ${format}

Here is the recent conversation history the user missed:

${conversation}

Respond with only the JSON object described above.
`;

  return {
    systemPrompt: systemPrompt.trim(),
    userPrompt: userPrompt.trim(),
  };
};

module.exports = {
  buildDiscordSummaryPrompts,
};

