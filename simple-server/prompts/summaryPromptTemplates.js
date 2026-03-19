const buildDiscordSummaryPrompts = ({ channelName, format, conversation }) => {
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

  return {
    systemPrompt: systemPrompt.trim(),
    userPrompt: userPrompt.trim(),
  };
};

module.exports = {
  buildDiscordSummaryPrompts,
};

