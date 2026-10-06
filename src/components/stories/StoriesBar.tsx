import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { type Story, INITIAL_DEMO_STORIES } from '../../types/stories';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { StoryViewerModal } from './StoryViewerModal';
import { CreateStoryModal } from './CreateStoryModal';
import { soundEffects } from '../../lib/soundEffects';

interface StoriesBarProps {
  onReplyToStory?: (story: Story, text: string) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ onReplyToStory }) => {
  const { profile } = useAuth();

  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem('chatbase_stories');
    if (saved) {
      try {
        const parsed: Story[] = JSON.parse(saved);
        // Filter out stories older than 24 hours
        const valid = parsed.filter((s) => Date.now() - s.createdAt < 24 * 3600 * 1000);
        return valid.length > 0 ? valid : INITIAL_DEMO_STORIES;
      } catch {}
    }
    return INITIAL_DEMO_STORIES;
  });

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('chatbase_stories', JSON.stringify(stories));
  }, [stories]);

  const handleOpenViewer = (index: number) => {
    soundEffects.play('pop');
    setSelectedStoryIndex(index);
    setViewerOpen(true);
  };

  const handleAddStory = (newStory: Story) => {
    setStories((prev) => [newStory, ...prev.filter((s) => s.id !== newStory.id)]);
  };

  // Check if self has active story
  const selfStory = stories.find((s) => s.isSelf || s.userId === profile?.id);

  return (
    <>
      <div
        className="stories-scroll-tray"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
        }}
      >
        {/* 1. Add Story / Self Story Avatar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            flexShrink: 0,
            width: '64px',
          }}
          onClick={() => {
            if (selfStory) {
              const idx = stories.findIndex((s) => s.id === selfStory.id);
              handleOpenViewer(idx >= 0 ? idx : 0);
            } else {
              soundEffects.play('click');
              setCreateOpen(true);
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              padding: '2.5px',
              borderRadius: '50%',
              background: selfStory
                ? 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)'
                : 'transparent',
              border: selfStory ? 'none' : '1.5px dashed var(--border-color)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Avatar src={profile?.avatar_url} name={profile?.display_name || 'Me'} size="md" />

            {!selfStory ? (
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                <Plus size={12} strokeWidth={3} />
              </div>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  fontSize: '0.8rem',
                  background: 'var(--bg-card)',
                  borderRadius: '50%',
                  padding: '1px',
                }}
              >
                {selfStory.moodEmoji}
              </div>
            )}
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '64px',
              textAlign: 'center',
            }}
          >
            {selfStory ? 'Your Story' : 'Add Status'}
          </span>
        </div>

        {/* 2. Other users' stories */}
        {stories
          .filter((s) => !s.isSelf && s.userId !== profile?.id)
          .map((story) => {
            const originalIndex = stories.findIndex((item) => item.id === story.id);
            return (
              <div
                key={story.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  width: '64px',
                }}
                onClick={() => handleOpenViewer(originalIndex)}
              >
                <div
                  style={{
                    position: 'relative',
                    padding: '2.5px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
                    boxShadow: '0 2px 10px rgba(99, 102, 241, 0.25)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Avatar src={story.userAvatar} name={story.userName} size="md" />

                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      fontSize: '0.85rem',
                      background: 'var(--bg-card)',
                      borderRadius: '50%',
                      padding: '1px',
                      lineHeight: 1,
                    }}
                  >
                    {story.moodEmoji}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '64px',
                    textAlign: 'center',
                  }}
                >
                  {story.userName.split(' ')[0]}
                </span>
              </div>
            );
          })}
      </div>

      {/* Story Viewer Modal */}
      <StoryViewerModal
        isOpen={viewerOpen}
        stories={stories}
        initialIndex={selectedStoryIndex}
        onClose={() => setViewerOpen(false)}
        onReply={onReplyToStory}
      />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onAddStory={handleAddStory}
      />
    </>
  );
};
