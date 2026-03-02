import React from 'react';

interface CustomEmojiPickerProps {
  onEmojiClick: (emoji: string) => void;
}

// Top 30 most commonly used emojis
const COMMON_EMOJIS = [
  '😀', '😂', '😍', '😊', '😎',
  '😢', '😭', '😡', '😱', '🥰',
  '👍', '👎', '👏', '🙏', '💪',
  '✌️', '👌', '🤝', '💯', '❤️',
  '🔥', '⭐', '✨', '🎉', '🎊',
  '💀', '👀', '🤔', '😅', '🙌'
];

export const CustomEmojiPicker: React.FC<CustomEmojiPickerProps> = ({ onEmojiClick }) => {
  return (
    <div className="bg-[#0a1628] border border-[#1e3248] rounded-xl shadow-2xl p-3 w-[300px]">
      <div className="mb-2">
        <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Reactions</h3>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {COMMON_EMOJIS.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiClick(emoji)}
            className="size-10 flex items-center justify-center text-2xl hover:bg-[#1a2d45] rounded-lg transition-colors"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};