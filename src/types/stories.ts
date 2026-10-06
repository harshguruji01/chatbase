export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  text: string;
  moodEmoji: string;
  gradient: string;
  createdAt: number;
  likesCount: number;
  isSelf?: boolean;
}

export const STORY_GRADIENTS = [
  'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
  'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
  'linear-gradient(135deg, #0EA5E9 0%, #2DD4BF 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
  'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
];

export const INITIAL_DEMO_STORIES: Story[] = [
  {
    id: 's_harsh',
    userId: 'harsh_admin',
    userName: 'HarshGuruJi',
    userAvatar: './chatbase.png',
    text: 'Building something legendary! 🚀 All new ChatBase web features are now live for you all.',
    moodEmoji: '🔥',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
    createdAt: Date.now() - 3600000 * 2,
    likesCount: 24,
  },
  {
    id: 's_priya',
    userId: 'u_priya',
    userName: 'Priya Sharma',
    userAvatar: null,
    text: 'Morning Chai ☕ & Code debugging. Have a productive day ahead friends!',
    moodEmoji: '☕',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
    createdAt: Date.now() - 3600000 * 4,
    likesCount: 15,
  },
  {
    id: 's_rahul',
    userId: 'u_rahul',
    userName: 'Rahul Verma',
    userAvatar: null,
    text: 'Life is 10% what happens to you and 90% how you react to it. ✨ Keep smiling!',
    moodEmoji: '✨',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #2DD4BF 100%)',
    createdAt: Date.now() - 3600000 * 6,
    likesCount: 19,
  },
  {
    id: 's_ananya',
    userId: 'u_ananya',
    userName: 'Ananya Roy',
    userAvatar: null,
    text: 'Weekend roadtrip in the hills! Network might be spotty but nature is healing. 🌿🌄',
    moodEmoji: '🌄',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    createdAt: Date.now() - 3600000 * 8,
    likesCount: 31,
  },
];
