import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  'Smiles': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😎', '🤓', '🧐', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
  'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🫀', '🫁', '🧠', '👀', '👁️', '👅', '👄'],
  'Hearts & Fire': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥', '✨', '🌟', '💫', '💥', '💢', '💯'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🦭', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘'],
  'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸'],
};

const EMOJI_KEYWORDS: Record<string, string[]> = {
  love: ['❤️', '😍', '🥰', '😘', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❤️‍🔥', '🌹', '👩‍❤️‍👨'],
  heart: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  fire: ['🔥', '💥', '✨', '🌟', '💫', '⚡', '💯'],
  hot: ['🔥', '🥵', '🌶️'],
  smile: ['😀', '😃', '😄', '😁', '😊', '🙂', '😉', '😌', '🥰', '😍', '😋'],
  happy: ['😀', '😃', '😄', '😁', '😆', '🥳', '😊', '✨', '🎉'],
  laugh: ['😂', '🤣', '😆', '😅'],
  lol: ['😂', '🤣', '😆'],
  cry: ['😢', '😭', '🥺', '😥', '😓'],
  sad: ['😢', '😭', '😞', '😔', '😟', '😕', '🙁', '🥺', '💔'],
  cool: ['😎', '🤙', '🕶️', '✨', '🔥'],
  clap: ['👏', '🙌', '🎉'],
  ok: ['👌', '👍', '✔️', '✅', '🆗'],
  yes: ['👍', '👌', '🙌', '💯', '✅'],
  no: ['👎', '🙅', '❌', '🚫'],
  hand: ['👋', '✋', '🤚', '🖐️', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤙', '👍', '👎', '✊', '👊', '👏', '🙌', '🤝', '🙏'],
  pray: ['🙏', '🤲', '😇'],
  food: ['🍎', '🍕', '🍔', '🍟', '🥪', '🌮', '🍜', '🍱', '🍣', '🍩', '🍫', '🍦', '☕', '🍺'],
  cat: ['🐱', '🐈', '😹', '😻', '😸'],
  dog: ['🐶', '🐕', '🐩', '🐾'],
  star: ['⭐', '🌟', '✨', '💫', '🤩'],
  party: ['🥳', '🎉', '🎊', '🍾', '🍻', '🎈'],
  kiss: ['😘', '😗', '😙', '😚', '💋'],
  wink: ['😉', '😜', '🤪'],
  sleep: ['😴', '🥱', '💤', '😪'],
  tired: ['🥱', '😫', '😩', '😴'],
  angry: ['😠', '😡', '🤬', '😤', '💢'],
  shock: ['😱', '😮', '😲', '🤯', '😳'],
  wow: ['😮', '😲', '🤯', '🤩', '✨'],
  100: ['💯'],
  money: ['💰', '💵', '🤑', '💸'],
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Smiles');
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const activeEmojis = q
    ? Array.from(
        new Set([
          ...Object.entries(EMOJI_KEYWORDS).flatMap(([keyword, emojis]) =>
            keyword.includes(q) || q.includes(keyword) ? emojis : []
          ),
          ...Object.values(EMOJI_CATEGORIES)
            .flat()
            .filter((emoji) => emoji.includes(q)),
        ])
      )
    : EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];

  return (
    <div
      className="card fade-in-up"
      style={{
        position: 'absolute',
        bottom: '76px',
        left: '12px',
        width: '320px',
        maxHeight: '380px',
        padding: '12px',
        zIndex: 50,
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div className="input-wrapper" style={{ flex: 1, marginRight: '8px' }}>
          <Search size={14} className="input-icon-left" />
          <input
            type="text"
            className="input-field has-left-icon"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '6px 12px 6px 32px', fontSize: '0.85rem' }}
            autoFocus
          />
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {!search && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '6px',
            marginBottom: '8px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'var(--color-primary-light)' : 'transparent',
                color: selectedCategory === cat ? 'var(--color-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          overflowY: 'auto',
          maxHeight: '220px',
          padding: '4px',
        }}
      >
        {activeEmojis.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => onSelectEmoji(emoji)}
            style={{
              fontSize: '1.4rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              padding: '4px',
              transition: 'transform 0.1s ease',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.transform = 'scale(1.2)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.transform = 'scale(1)')}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
