const buildDiscordPreviewPrompts = ({ channelName, unreadCount, conversation }) => {
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

  return {
    systemPrompt: systemPrompt.trim(),
    userPrompt: userPrompt.trim(),
  };
};

module.exports = {
  buildDiscordPreviewPrompts,
};

