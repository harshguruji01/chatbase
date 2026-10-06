// GuruJi AI Assistant Engine for ChatBase
// Provides intelligent chat responses, message drafting, translation, and wisdom

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export const AI_QUICK_PROMPTS = [
  {
    icon: '✨',
    label: 'Daily Motivation',
    labelHi: 'दैनिक प्रेरणा',
    prompt: 'मुझे आज के लिए एक प्रेरणादायक और सकारात्मक विचार बताएं।',
  },
  {
    icon: '✍️',
    label: 'Draft Message',
    labelHi: 'मैसेज ड्राफ्ट',
    prompt: 'Help me draft a polite and friendly greeting message for a new friend.',
  },
  {
    icon: '🌐',
    label: 'English to Hindi',
    labelHi: 'अनुवाद करें',
    prompt: 'How do you say "Looking forward to connecting with you and sharing great ideas" in Hindi and Hinglish?',
  },
  {
    icon: '🚀',
    label: 'Cool Bio Ideas',
    labelHi: 'प्रोफाइल बायो',
    prompt: 'Suggest 3 attractive and aesthetic short bios for my ChatBase profile.',
  },
  {
    icon: '💡',
    label: 'Icebreakers',
    labelHi: 'चैट शुरू करने के तरीके',
    prompt: 'Give me 3 fun and natural icebreakers to start a conversation.',
  },
  {
    icon: '💻',
    label: 'Coding & Tech',
    labelHi: 'टेक सहायता',
    prompt: 'What are the top web development trends and tips for building high-performance apps?',
  },
];

export async function generateAIResponse(
  prompt: string,
  _history?: AIMessage[],
  userName: string = 'Friend'
): Promise<string> {
  const q = prompt.toLowerCase().trim();

  // Artificial short delay to simulate natural thinking/typing
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

  if (q.includes('प्रेरणा') || q.includes('motivation') || q.includes('quote') || q.includes('thought')) {
    const quotes = [
      `🌟 **सफलता का नियम**: "अगर आप उन बातों की चिंता छोड़ दें जो आपके बस में नहीं हैं, तो आपकी पूरी ऊर्जा उन चीज़ों पर लगेगी जिन्हें आप बदल सकते हैं।"\n\nयाद रखें ${userName}, हर बड़ा सफर एक छोटे कदम से शुरू होता है। आज आप जो भी सीख रहे हैं, वह कल आपके बहुत काम आएगा! 🚀`,
      `✨ **Thought of the Day for ${userName}**:\n"Your only limit is your mind. When you believe you can, you're already halfway there."\n\nखुद पर भरोसा रखें और निरंतरता (Consistency) बनाए रखें। छोटी-छोटी दैनिक आदतें ही बड़ा मुकाम तय करती हैं! 💫`,
      `🔥 **HarshGuruJi Mindset**:\n"मुश्किलें प्रतिभा को तराशती हैं और आराम उसे सुस्त कर देता है।"\nआज किसी एक नए लक्ष्य पर 30 मिनट बिना किसी डिस्ट्रैक्शन के काम करके देखें — फर्क खुद महसूस होगा!`,
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  if (q.includes('draft') || q.includes('greeting') || q.includes('मैसेज') || q.includes('hello') || q.includes('hi')) {
    return `यहाँ आपके लिए 3 आकर्षक मैसेज ड्राफ्ट हैं जिन्हें आप तुरंत कॉपी करके भेज सकते हैं:\n\n1. **Casual & Friendly**:\n> "Hey! Saw your profile on ChatBase, thought I'd say hello. Hope you're having an awesome week! 👋"\n\n2. **Hinglish Warm Vibe**:\n> "नमस्ते! ChatBase पर आपकी प्रोफाइल देखी, लगा कनेक्ट करना चाहिए। सब कैसा चल रहा है? ✨"\n\n3. **Professional & Respectful**:\n> "Hello ${userName}! Glad to connect with you here on ChatBase. Looking forward to good conversations."\n\nआप इनमें से किसी को भी कस्टमाइज़ कर सकते हैं!`;
  }

  if (q.includes('bio') || q.includes('बायो') || q.includes('profile')) {
    return `यहाँ आपकी ChatBase प्रोफाइल के लिए बेहतरीन बायो आइडियाज हैं:\n\n1. **Tech & Builder Vibe**:\n> "Creating things that matter. 💻 | Lifelong learner | Always up for great conversations ✨"\n\n2. **Positive & Aesthetic**:\n> "Curious mind & positive energy. 🌿 Let's talk ideas, tech & life."\n\n3. **Hinglish Trendy**:\n> "जिंदगी को सादगी और सपनों को शिद्दत से जीने का शौक। ☕🚀 Connect & chat!"\n\nआप अपनी पसंद अनुसार इमोजी बदलकर इसे अपनी प्रोफाइल में सेट कर सकते हैं!`;
  }

  if (q.includes('icebreaker') || q.includes('बात शुरू') || q.includes('start chat')) {
    return `नए लोगों से बातचीत शुरू करने के लिए 3 बेहतरीन Icebreakers:\n\n1. "Hey! What's one project or goal that's keeping you excited these days?" 🎯\n2. "नमस्ते! अगर आपको इस वीकेंड कोई एक नई जगह एक्सप्लोर करनी हो, तो वो कौन सी होगी?" ✈️\n3. "Quick question: Chai or Coffee while working?" ☕😄\n\nये सवाल बहुत सहज होते हैं और सामने वाले को बात आगे बढ़ाने का मौका देते हैं!`;
  }

  if (q.includes('translate') || q.includes('हिंदी') || q.includes('अनुवाद')) {
    return `**Translation & Options:**\n\n*English:* "Looking forward to connecting with you and sharing great ideas."\n\n*Hindi (शुद्ध हिंदी):*\n> "आपसे जुड़ने और बेहतरीन विचारों को साझा करने की प्रतीक्षा रहेगी।"\n\n*Hinglish (नेचुरल चैट स्टाइल):*\n> "Aapse connect karke naye ideas share karne ke liye bohot excited hoon! ✨"`;
  }

  if (q.includes('code') || q.includes('programming') || q.includes('tech') || q.includes('react') || q.includes('web')) {
    return `🚀 **Web & App Development Best Practices**:\n\n1. **Performance First**: Lazy load routes, use lightweight SVGs, and avoid heavy third-party bundles.\n2. **State Management**: Keep state as close to where it's used as possible.\n3. **Accessibility & Responsive**: Always test keyboard navigation and touch hitboxes on real mobile viewports.\n4. **Realtime UX**: Add optimistic UI updates and subtle audio/haptic feedback for a super snappy feel!\n\nअगर आपको किसी स्पेसिफिक कोड या बग में मदद चाहिए, तो बस यहाँ कोड पेस्ट करें! 💻`;
  }

  // General intelligent response
  return `नमस्ते ${userName}! 👋 मैं **GuruJi AI** हूँ — ChatBase का स्मार्ट असिस्टेंट।\n\nमैं आपकी कैसे मदद कर सकता हूँ:\n- ✍️ दोस्तों को भेजने के लिए बेहतरीन मैसेज ड्राफ्ट करना\n- 🌐 हिंदी और इंग्लिश में अनुवाद व व्याकरण सुधारना\n- 🌟 दैनिक प्रेरणा और ज्ञानवर्धक विचार साझा करना\n- 💡 प्रोफाइल बायो और चैट आइसब्रेकर्स सुझाना\n\nआप मुझसे कुछ भी पूछ सकते हैं या ऊपर दिए गए क्विक प्रॉम्प्ट्स को टैप कर सकते हैं! ✨`;
}
