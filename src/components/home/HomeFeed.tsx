import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCw,
  Heart,
  Share2,
  Flame,
  Coffee,
  Lightbulb,
  Compass,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { OutlinedButton } from '../common/OutlinedButton';
import { BrandHeader } from '../common/BrandHeader';
import { NativeFeedAd } from '../ads/NativeFeedAd';

interface PostItem {
  id: string;
  category: 'thoughts' | 'lifestyle' | 'motivation' | 'wellness';
  tag: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  timeAgo: string;
  gradient: string;
}

const FEED_DATABASE: PostItem[] = [
  {
    id: 'p1',
    category: 'thoughts',
    tag: 'Daily Thought',
    title: 'Mindset & Growth',
    content: 'कठिन परिस्थितियाँ प्रतिभा को तराशती हैं और आराम उसे सुस्त कर देता है। हर सुबह एक नया अवसर है अपने सपनों को हकीकत में बदलने का।',
    author: 'Swami Vivekananda',
    likes: 142,
    timeAgo: 'Just now',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  },
  {
    id: 'p2',
    category: 'lifestyle',
    tag: 'Healthy Living',
    title: 'The 20-Minute Digital Sunset',
    content: 'सोने से 20 मिनट पहले मोबाइल और स्क्रीन से दूरी बनाएं। इससे Melatonin हॉर्मोन एक्टिव होता है, गहरी नींद आती है और अगली सुबह ऊर्जा दोगुनी रहती है।',
    author: 'Wellness Coach',
    likes: 98,
    timeAgo: '10m ago',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #2DD4BF 100%)',
  },
  {
    id: 'p3',
    category: 'motivation',
    tag: 'Daily Spark',
    title: 'Small Steps Create Great Destinies',
    content: 'You do not have to be extreme, just consistent. 1% improvement every day makes you 37 times better by the end of the year.',
    author: 'James Clear',
    likes: 312,
    timeAgo: '25m ago',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  },
  {
    id: 'p4',
    category: 'wellness',
    tag: 'Peace of Mind',
    title: 'Mindful Breathing in Stress',
    content: 'जब भी मन अशांत हो, 4 सेकंड गहरी सांस लें, 4 सेकंड रोकें और 6 सेकंड में धीरे-धीरे छोड़ें (4-4-6 Box Breathing)। आपका नर्वस सिस्टम तुरंत शांत हो जाएगा।',
    author: 'Mindfulness Hub',
    likes: 87,
    timeAgo: '40m ago',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  },
  {
    id: 'p5',
    category: 'lifestyle',
    tag: 'Modern Productivity',
    title: 'The Two-Minute Rule',
    content: 'अगर कोई काम 2 मिनट से कम समय में हो सकता है (जैसे ईमेल का जवाब, पानी पीना, टेबल साफ करना), तो उसे बाद के लिए न टालें—तुरंत पूरा करें।',
    author: 'Productivity Labs',
    likes: 204,
    timeAgo: '1h ago',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
  },
  {
    id: 'p6',
    category: 'thoughts',
    tag: 'Inspirational',
    title: 'Believe in Your Timing',
    content: 'फूल कभी दूसरे फूल से मुकाबला नहीं करता, वह बस अपनी मस्ती में खिलता है। अपनी तुलना दूसरों से बंद करें, आपकी यात्रा अनूठी है।',
    author: 'Anonymous',
    likes: 275,
    timeAgo: '2h ago',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
  },
  {
    id: 'p7',
    category: 'motivation',
    tag: 'Success Mindset',
    title: 'Courage to Begin',
    content: 'शुरुआत करने के लिए आपका महान होना ज़रूरी नहीं है, लेकिन महान होने के लिए आपकी शुरुआत करना ज़रूरी है। आज ही पहला कदम उठाएं।',
    author: 'Les Brown',
    likes: 189,
    timeAgo: '3h ago',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
  },
  {
    id: 'p8',
    category: 'lifestyle',
    tag: 'Hydration & Health',
    title: 'Water First Thing in the Morning',
    content: 'सुबह उठते ही एक गिलास गुनगुना पानी पीने से मेटाबॉलिज्म 24% तेज होता है और शरीर से टॉक्सिन्स बाहर निकलते हैं। स्वस्थ दिन की बेहतरीन शुरुआत!',
    author: 'Holistic Health',
    likes: 165,
    timeAgo: '4h ago',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
  },
];

interface HomeFeedProps {
  onStartChat: () => void;
  onExploreUsers: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ onStartChat, onExploreUsers }) => {
  const { profile } = useAuth();
  const { t, language } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'thoughts' | 'lifestyle' | 'motivation'>('all');
  const [posts, setPosts] = useState<PostItem[]>(FEED_DATABASE);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Shuffle feed on refresh to simulate live dynamic daily thoughts
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const shuffled = [...FEED_DATABASE].sort(() => 0.5 - Math.random());
      setPosts(shuffled);
      setIsRefreshing(false);
    }, 450);
  };

  useEffect(() => {
    // Initial random shuffle so every visit brings fresh insight
    const shuffled = [...FEED_DATABASE].sort(() => 0.5 - Math.random());
    setPosts(shuffled);
  }, []);

  const toggleLike = (id: string) => {
    setLikedPosts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'lifestyle') return p.category === 'lifestyle' || p.category === 'wellness';
    return p.category === selectedCategory;
  });

  const getTodayDateString = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    };
    return new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', options);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--bg-app)',
        overflowY: 'auto',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <BrandHeader size="sm" showSubtitle={false} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRefresh}
            className="refresh-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title={t('refresh_feed')}
          >
            <RotateCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            <span>{t('refresh_feed')}</span>
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Welcome & Daily Hero Card */}
        <div
          className="card fade-in-up"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ✨ {getTodayDateString()}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ChatBase Daily
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {language === 'hi' ? `नमस्ते, ${profile?.display_name || 'दोस्त'}! 🌟` : `Welcome, ${profile?.display_name || 'Friend'}! 🌟`}
          </h2>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {language === 'hi'
              ? 'हर दिन कुछ नया सीखें, स्वस्थ विचार अपनाएं और अपनों से सुरक्षित रूप से जुड़े रहें।'
              : 'Discover positive thoughts, daily lifestyle inspiration, and stay connected with real people.'}
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <OutlinedButton variant="primary" size="sm" onClick={onStartChat} icon={<MessageCircle size={15} />}>
              {t('start_chat')}
            </OutlinedButton>
            <OutlinedButton variant="secondary" size="sm" onClick={onExploreUsers} icon={<Compass size={15} />}>
              {t('find_people')}
            </OutlinedButton>
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}
        >
          {[
            { id: 'all', label: t('all'), icon: <Sparkles size={14} /> },
            { id: 'thoughts', label: t('thoughts'), icon: <Lightbulb size={14} /> },
            { id: 'lifestyle', label: t('lifestyle'), icon: <Coffee size={14} /> },
            { id: 'motivation', label: t('motivation'), icon: <Flame size={14} /> },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                border: selectedCategory === cat.id ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)',
                background: selectedCategory === cat.id ? 'var(--color-primary-light)' : 'var(--bg-card)',
                color: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Feed Posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '30px' }}>
          {filteredPosts.map((post, idx) => {
            const isLiked = likedPosts[post.id];
            return (
              <React.Fragment key={post.id}>
                <div
                  className="card feed-card"
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                }}
              >
                {/* Post Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {post.tag}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {post.timeAgo}</span>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {post.author}
                  </span>
                </div>

                {/* Post Title & Content */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {post.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {post.content}
                </p>

                {/* Post Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <button
                    onClick={() => toggleLike(post.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isLiked ? '#EF4444' : 'var(--text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    <Heart size={16} fill={isLiked ? '#EF4444' : 'none'} />
                    <span>{post.likes + (isLiked ? 1 : 0)}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: post.title, text: post.content });
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
              {/* Sponsored Ad Under Each Content Post */}
              <NativeFeedAd index={idx} />
            </React.Fragment>
          );
        })}
      </div>
      </div>
    </div>
  );
};
