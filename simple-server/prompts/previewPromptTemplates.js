const buildDiscordPreviewPrompts = ({ channelName, isDm, unreadCount, conversation }) => {
  const contextLabel = isDm
    ? 'Direct Message conversation'
    : `Channel: ${channelName || 'Unnamed channel'}`;

  // Scale the requested bullet count to the volume of unread messages.
  // Tiny conversations (< 5 msgs) get at most 1-2 bullets; larger ones get more.
  const maxBullets = isDm
    ? Math.min(Math.max(1, Math.floor(unreadCount / 2)), 3)
    : Math.min(Math.max(1, Math.floor(unreadCount / 2)), 5);

  const systemPrompt = `You are an assistant generating concise "what you missed" previews for a ${isDm ? 'private Direct Message conversation' : 'Discord-style chat channel'}.

Rules:
- Output ONLY real, informative bullet points — one per line, each starting with "- ".
- Only include a bullet if it conveys a concrete fact, topic, question, or decision from the conversation.
- Do NOT pad with observations like "no one responded", "the channel is quiet", "only X messages were sent", or "the conversation is inactive".
- If the messages are purely social greetings (hi, hello, etc.) with no substance, output a single bullet: "- ${isDm ? 'A greeting was exchanged.' : 'A brief greeting was exchanged.'}"
- Scale the number of bullets to the content: fewer messages → fewer bullets. Maximum ${maxBullets} bullet${maxBullets !== 1 ? 's' : ''}.`;

  const userPrompt = `${contextLabel}
Unread messages: ${unreadCount}

${conversation}

Write up to ${maxBullets} bullet point${maxBullets !== 1 ? 's' : ''} summarizing only meaningful content from the above.`;

  return {
    systemPrompt: systemPrompt.trim(),
    userPrompt: userPrompt.trim(),
  };
};

module.exports = {
  buildDiscordPreviewPrompts,
};

