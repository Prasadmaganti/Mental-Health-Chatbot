'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Send, 
  Trash2, 
  Info, 
  AlertTriangle, 
  PhoneCall, 
  Sparkles, 
  Menu, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  Sun,
  Moon,
  Plus,
  MessageSquare
} from 'lucide-react';
import mentalHealthData from '../data/mental_health_data.json';

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isCrisis?: boolean;
  helplines?: string[];
  showConfettiOption?: boolean;
  completedCoping?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

export default function Home() {
  // --- States ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [backendMode, setBackendMode] = useState<'connected' | 'local'>('local');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Helper to parse date strings back to Date objects ---
  const parseSessions = (sessionsJson: string): ChatSession[] => {
    try {
      const parsed = JSON.parse(sessionsJson);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp),
        messages: Array.isArray(s.messages)
          ? s.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          : []
      }));
    } catch (e) {
      console.error("Failed to parse sessions", e);
      return [];
    }
  };

  // --- Initialize App ---
  useEffect(() => {
    // Attempt backend health check
    checkBackendHealth();
    
    // Always show the safety disclaimer on fresh page loads
    setHasAcceptedTerms(false);

    // Load dark mode preference
    const darkModePref = localStorage.getItem('lumina_dark_mode') === 'true';
    setIsDarkMode(darkModePref);
    if (darkModePref) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Load sessions from localStorage
    const saved = localStorage.getItem('lumina_chat_sessions');
    if (saved) {
      const parsedSessions = parseSessions(saved);
      if (parsedSessions.length > 0) {
        setSessions(parsedSessions);
        // Load the most recent session
        const active = parsedSessions[0];
        setSessionId(active.id);
        setMessages(active.messages);
        return;
      }
    }

    // Default first session if none exists
    const initialSessionId = `session_${Math.random().toString(36).substring(2, 11)}`;
    const initialMessages: Message[] = [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello, I'm Lumina, your mental health support companion. I'm here to provide a safe space, listen to your concerns, and guide you through supportive coping exercises. \n\nHow are you feeling today? You can write freely, or select one of the common concern areas below to start.",
        timestamp: new Date()
      }
    ];
    const initialSession: ChatSession = {
      id: initialSessionId,
      title: 'New Conversation',
      messages: initialMessages,
      timestamp: new Date()
    };
    setSessions([initialSession]);
    setSessionId(initialSessionId);
    setMessages(initialMessages);
    localStorage.setItem('lumina_chat_sessions', JSON.stringify([initialSession]));
  }, []);

  // --- Sync messages to session history ---
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;

    setSessions(prevSessions => {
      // Find index of current session
      const index = prevSessions.findIndex(s => s.id === sessionId);
      let updatedSessions = [...prevSessions];

      if (index !== -1) {
        // Update existing session
        const currentSession = prevSessions[index];
        let title = currentSession.title;
        
        // If title is "New Conversation", try to update it using the first user message
        if (title === 'New Conversation') {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.content.length > 28 
              ? firstUserMsg.content.substring(0, 25) + '...'
              : firstUserMsg.content;
          }
        }

        updatedSessions[index] = {
          ...currentSession,
          messages,
          title,
          timestamp: new Date()
        };
      } else {
        // If for some reason the session doesn't exist, create it
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg 
          ? (firstUserMsg.content.length > 28 ? firstUserMsg.content.substring(0, 25) + '...' : firstUserMsg.content)
          : 'New Conversation';

        updatedSessions.unshift({
          id: sessionId,
          title,
          messages,
          timestamp: new Date()
        });
      }

      // Sort sessions to put the most recently active session at the top
      updatedSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Save to localStorage
      localStorage.setItem('lumina_chat_sessions', JSON.stringify(updatedSessions));
      return updatedSessions;
    });
  }, [messages, sessionId]);

  // --- Session Management Actions ---
  const createNewChat = () => {
    const newSessionId = `session_${Math.random().toString(36).substring(2, 11)}`;
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hello, I'm Lumina, your mental health support companion. I'm here to provide a safe space, listen to your concerns, and guide you through supportive coping exercises. \n\nHow are you feeling today? You can write freely, or select one of the common concern areas below to start.",
      timestamp: new Date()
    };
    
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      messages: [welcomeMsg],
      timestamp: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    setSessionId(newSessionId);
    setMessages([welcomeMsg]);
  };

  const loadChatSession = (session: ChatSession) => {
    setSessionId(session.id);
    setMessages(session.messages);
    setIsSidebarOpen(false);
  };

  const deleteChatSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this conversation?")) {
      const updated = sessions.filter(s => s.id !== idToDelete);
      setSessions(updated);
      localStorage.setItem('lumina_chat_sessions', JSON.stringify(updated));

      if (sessionId === idToDelete) {
        if (updated.length > 0) {
          setSessionId(updated[0].id);
          setMessages(updated[0].messages);
        } else {
          const newSessionId = `session_${Math.random().toString(36).substring(2, 11)}`;
          const welcomeMsg: Message = {
            id: 'welcome',
            role: 'assistant',
            content: "Hello, I'm Lumina, your mental health support companion. I'm here to provide a safe space, listen to your concerns, and guide you through supportive coping exercises. \n\nHow are you feeling today? You can write freely, or select one of the common concern areas below to start.",
            timestamp: new Date()
          };
          const newSession: ChatSession = {
            id: newSessionId,
            title: 'New Conversation',
            messages: [welcomeMsg],
            timestamp: new Date()
          };
          setSessions([newSession]);
          setSessionId(newSessionId);
          setMessages([welcomeMsg]);
          localStorage.setItem('lumina_chat_sessions', JSON.stringify([newSession]));
        }
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch('http://localhost:8000/health');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'healthy') {
          setBackendMode('connected');
          return;
        }
      }
      setBackendMode('local');
    } catch {
      setBackendMode('local');
    }
  };

  const acceptTerms = () => {
    setHasAcceptedTerms(true);
  };

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('lumina_dark_mode', String(nextMode));
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const localCrisisCheck = (text: string) => {
    const textLower = text.toLowerCase();
    
    const patterns = {
      suicide: [/su[ic]+id/i, /suisid/i, /kill myself/i, /end my life/i, /want to die/i, /hang myself/i, /slit my wrists/i, /better off dead/i, /don't want to live/i, /wish i were dead/i],
      self_harm: [/self[- ]harm/i, /cut myself/i, /cutting myself/i, /hurt myself/i, /burn myself/i, /burning myself/i, /mutilat/i],
      abuse: [/abuse/i, /domestic violence/i, /physically hurt/i, /beaten/i, /beating me/i, /sexual assault/i, /raped/i, /hit me/i],
      violence: [/kill them/i, /hurt them/i, /stab/i, /shoot/i, /weapon/i, /attack someone/i, /assault them/i, /m[ui]rd[eu]r/i, /unauthori[sz]ed activit/i, /dangerous thing/i, /commit a crime/i, /bomb/i, /terrorist/i],
      emergency: [/overdose/i, /poison/i, /chok/i, /bleeding/i, /heart attack/i, /emergency/i, /ambulance/i, /call 911/i, /call 999/i]
    };

    for (const [category, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(textLower)) {
          return { isCrisis: true, category };
        }
      }
    }
    return { isCrisis: false, category: '' };
  };

  const getLocalCrisisResponse = (category: string) => {
    const helplines = {
      suicide: ["National Suicide Prevention Lifeline: Call or text 988", "Crisis Text Line: Text HOME to 741741"],
      self_harm: ["Crisis Text Line: Text HOME to 741741", "National Suicide Prevention Lifeline: Call or text 988"],
      abuse: ["National Domestic Violence Hotline: 1-800-799-7233", "Crisis Text Line: Text HOME to 741741"],
      violence: ["National Crisis Support: 988", "If there is immediate danger, call local police."],
      emergency: ["Emergency: Call 911/999/112.", "Go to the nearest hospital immediately."]
    };

    const messagesList = {
      suicide: "You're not alone. Please reach out to professional services available 24/7.",
      self_harm: "Your safety is important. Please connect with someone who can help support you right now.",
      abuse: "You deserve to be safe. Please reach out to dedicated organizations for support.",
      violence: "Please stop and take a breath. Safety is critical. Reach out for help.",
      emergency: "This is a medical emergency. Please contact emergency services immediately."
    };

    return {
      reply: messagesList[category as keyof typeof messagesList] || "Please contact emergency services.",
      helplines: helplines[category as keyof typeof helplines] || ["Contact local emergency lines."]
    };
  };

  const generateLocalResponse = (message: string): { reply: string } => {
    const msgLower = message.toLowerCase();
    const categories = mentalHealthData.categories;

    const keywords = {
      stress_and_anxiety: ["stress", "anxi", "anxious", "overwhelm", "worry", "panick", "panic"],
      loneliness: ["lonely", "loneliness", "isolated", "alone", "disconnect"],
      academic_pressure: ["academic", "study", "studies", "gpa", "grade", "homework", "assignment", "pressure"],
      exam_anxiety: ["exam", "test", "quiz", "finals"],
      sleep_issues: ["sleep", "insomnia", "awake", "night", "tired"],
      low_self_esteem: ["esteem", "worthless", "hate myself", "critic", "not good enough"],
      relationship_problems: ["relationship", "partner", "argument", "breakup"],
      career_confusion: ["career", "job", "major", "stuck"],
      homesickness: ["home", "homesick", "miss", "family"],
      social_media_comparison: ["social media", "instagram", "tiktok", "compare"]
    };

    let matchedKey = '';
    let maxMatches = 0;

    for (const [key, wordList] of Object.entries(keywords)) {
      let currentMatches = 0;
      for (const word of wordList) {
        if (msgLower.includes(word)) currentMatches += 1;
      }
      if (currentMatches > maxMatches) {
        maxMatches = currentMatches;
        matchedKey = key;
      }
    }

    if (matchedKey && matchedKey in categories) {
      const data = categories[matchedKey as keyof typeof categories];
      const randomStrategy = data.coping_strategies[Math.floor(Math.random() * data.coping_strategies.length)];
      const strategyFormatted = randomStrategy.includes(':') ? randomStrategy.split(':')[0] : randomStrategy;

      const categorySuggestions: { [key: string]: string } = {
        stress_and_anxiety: "Stepping away from screens for a few minutes can help reset your mind.",
        loneliness: "Try reaching out to a friend or joining a community with shared hobbies.",
        academic_pressure: "Try chunking your workload into smaller tasks and setting a firm daily stop time.",
        exam_anxiety: "Skip difficult questions first to build momentum, and return to them later.",
        sleep_issues: "Keep your phone out of reach and do a screen-free wind-down routine before bed.",
        low_self_esteem: "Try keeping a daily wins log of 3 small things you did well today.",
        relationship_problems: "Use 'I feel' statements to communicate your boundaries calmly without blaming.",
        career_confusion: "Audit your transferrable skills and try small, low-risk learning experiments.",
        homesickness: "Decorate your new room with photos of loved ones to create a sense of comfort.",
        social_media_comparison: "Unfollow or mute accounts that make you feel inadequate or self-critical."
      };
      
      const suggestion = categorySuggestions[matchedKey] || "Take a deep breath and give yourself some grace.";

      return {
        reply: `I hear you, and your feelings are completely valid. 🫂💛 Here is my suggestion and a quick exercise to try:\n\n💡 **Suggestion**: ${suggestion}\n\n💪 **Exercise**: **${strategyFormatted}**\n\nTake a moment for yourself. I'm here if you want to share more. 🌸`
      };
    }

    return {
      reply: "I'm here to support you. 💙 Tell me what's on your mind, or mention if you want help with stress, loneliness, sleep, relationships, or school."
    };
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    
    const text = customText || inputText;
    if (!text.trim() || isLoading) return;

    if (!customText) setInputText('');

    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const clientCrisis = localCrisisCheck(text);
    if (clientCrisis.isCrisis) {
      const crisisData = getLocalCrisisResponse(clientCrisis.category);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}_crisis`,
          role: 'assistant',
          content: crisisData.reply,
          timestamp: new Date(),
          isCrisis: true,
          helplines: crisisData.helplines
        }]);
        setIsLoading(false);
      }, 600);
      return;
    }

    if (backendMode === 'connected') {
      try {
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: sessionId })
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(prev => [...prev, {
            id: `msg_${Date.now()}_a`,
            role: 'assistant',
            content: data.reply,
            timestamp: new Date(),
            isCrisis: data.is_crisis,
            helplines: data.helplines
          }]);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        setBackendMode('local');
      }
    }

    setTimeout(() => {
      const localResult = generateLocalResponse(text);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: localResult.reply,
        timestamp: new Date()
      }]);
      setIsLoading(false);
    }, 800);
  };

  const clearSession = async () => {
    if (confirm("Are you sure you want to clear your current conversation?")) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello, I'm Lumina. I've cleared our previous conversation. I'm here to listen whenever you're ready to share.",
        timestamp: new Date()
      }]);
      
      if (backendMode === 'connected') {
        try {
          await fetch('http://localhost:8000/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          });
        } catch (err) { console.error(err); }
      }
      
      setSessionId(`session_${Math.random().toString(36).substring(2, 11)}`);
    }
  };

  // --- Sidebar Helpline Definitions ---
  const crisisHelplines = [
    { name: "Emergency Response", num: "911 / 999 / 112", desc: "For immediate threat to life" },
    { name: "988 Suicide & Crisis Lifeline", num: "988", desc: "Call or text 24/7 (US & Canada)" },
    { name: "Crisis Text Line", num: "Text HOME to 741741", desc: "24/7 Text support with counselors" },
    { name: "National Domestic Violence", num: "1-800-799-7233", desc: "Safe, confidential support (US)" },
    { name: "Samaritans (UK)", num: "116 123", desc: "24/7 Listening ear (Call free)" },
    { name: "RAINN Sexual Assault", num: "1-800-656-4673", desc: "Assault response network (US)" }
  ];

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* --- Onboarding Modal --- */}
      {!hasAcceptedTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
          <div className={`w-full max-w-2xl overflow-hidden glass-panel rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-white/40'}`}>
            <div className="p-8 pb-4 text-center">
              <div className="mx-auto w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Heart className="w-8 h-8 fill-current animate-pulse" />
              </div>
              <h1 className={`text-3xl font-extrabold tracking-tight font-display ${isDarkMode ? 'text-white' : 'text-brand-950'}`}>
                Welcome to Lumina
              </h1>
              <p className={`mt-2 text-sm max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Your empathetic mental health first response assistant, offering guidance and coping strategies.
              </p>
            </div>

            <div className={`px-8 py-2 overflow-y-auto space-y-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <div className={`p-4 border rounded-2xl flex items-start gap-3 ${isDarkMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' : 'bg-amber-50/80 border-amber-200/60 text-amber-800'}`}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Critical Disclaimer</h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    Lumina is an AI support assistant. It is **NOT** a licensed therapist, clinical service, or emergency resource. Lumina cannot diagnose medical conditions, prescribe treatments, or substitute professional medical advice.
                  </p>
                </div>
              </div>

              <div>
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>How Lumina Can Help:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {Object.values(mentalHealthData.categories).map((cat: any) => (
                    <li key={cat.name} className={`flex items-center gap-2 p-2 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/50 border-slate-100'}`}>
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full shrink-0"></span>
                      <span>{cat.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`p-4 border rounded-2xl text-xs space-y-1 ${isDarkMode ? 'bg-brand-950/20 border-brand-900/30' : 'bg-brand-50/50 border-brand-100'}`}>
                <p className="font-medium">Safety Features & Crisis Handling:</p>
                <p className="leading-relaxed opacity-80">
                  Lumina implements active **crisis keyword interception**. If indicators of self-harm, suicide, or abuse are detected, Lumina immediately pauses normal operations and redirects you to professional emergency numbers.
                </p>
              </div>
            </div>

            <div className={`p-8 pt-4 border-t flex flex-col gap-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className="text-center text-xs opacity-60">
                By clicking "I Accept & Begin", you acknowledge you have read and agreed to these terms.
              </p>
              <button
                onClick={acceptTerms}
                className="w-full py-4 px-6 bg-gradient-to-r from-brand-600 to-calm-600 hover:from-brand-700 hover:to-calm-700 text-white rounded-2xl font-semibold shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all duration-200"
              >
                <span>I Accept & Begin</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Top Disclaimer Banner --- */}
      <div className="w-full bg-brand-950 text-white py-2 px-4 text-center text-xs font-medium flex items-center justify-center gap-2 relative z-30 select-none">
        <Info className="w-4 h-4 text-brand-300 shrink-0" />
        <span>
          Lumina is an AI emotional first responder, not a therapist. For immediate medical help, please call <strong>911</strong> or contact <strong>988</strong>.
        </span>
      </div>

      {/* --- Header / Top Bar --- */}
      <header className={`border-b backdrop-blur-md py-4 px-6 flex items-center justify-between relative z-20 shrink-0 transition-colors duration-200 ${isDarkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/80 border-slate-200/80 text-slate-900'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl transition-colors md:hidden ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            title="Toggle Sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-400 to-calm-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-extrabold tracking-tight font-display text-lg leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Lumina</h1>
              <span className={`w-2 h-2 rounded-full ${backendMode === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            </div>
            <p className="text-[10px] opacity-70 mt-0.5">
              {backendMode === 'connected' ? 'FastAPI Connected (Secure API)' : 'Local Safe Emulation Mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl transition-all border ${isDarkMode ? 'text-amber-400 border-slate-800 hover:bg-slate-800' : 'text-slate-600 border-slate-200 hover:bg-slate-100'}`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button 
            onClick={clearSession}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border border-transparent ${isDarkMode ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}
            title="Clear Chat Session"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        </div>
      </header>

      {/* --- Main App Layout --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* --- Left Sidebar (Chat History, New Chat, & Crisis Support) --- */}
        <aside className={`
          absolute md:static inset-y-0 left-0 z-40 w-80 p-5 flex flex-col gap-5 transform transition-transform duration-300 ease-in-out select-none border-r transition-colors duration-200
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-0 hidden'}
          ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200/80 text-slate-800'}
          md:translate-x-0 md:flex
        `}>
          {/* Header of Sidebar (New Chat Option) */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={createNewChat}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-calm-600 hover:from-brand-700 hover:to-calm-700 transition-all duration-200 shadow-sm hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className={`p-2 rounded-xl border md:hidden ${isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat History Section */}
          <div className="flex flex-col shrink-0 min-h-[120px] overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Conversations
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                {sessions.length}
              </span>
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1 max-h-[40vh] md:max-h-[30vh]">
              {sessions.length === 0 ? (
                <div className={`p-4 rounded-xl border border-dashed text-center text-xs ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                  No recent chats
                </div>
              ) : (
                sessions.map(s => {
                  const isActive = s.id === sessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => loadChatSession(s)}
                      className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                        isActive
                          ? (isDarkMode ? 'bg-slate-800 border-slate-700 text-white font-medium' : 'bg-brand-50 border-brand-100 text-brand-900 font-medium')
                          : (isDarkMode ? 'bg-slate-900/40 border-transparent hover:bg-slate-850 hover:border-slate-800 text-slate-300' : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-700')
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                        <span className="text-xs truncate">{s.title}</span>
                      </div>
                      <button
                        onClick={(e) => deleteChatSession(e, s.id)}
                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-650 ${isDarkMode ? 'hover:bg-red-950/30 hover:text-red-400 text-slate-400' : 'text-slate-500'}`}
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <hr className={`shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-150'}`} />

          {/* Crisis Support Section */}
          <div className="flex flex-col shrink-0 gap-3">
            <div className="flex items-center justify-between">
              <h2 className={`font-bold font-display flex items-center gap-2 text-sm tracking-wide uppercase ${isDarkMode ? 'text-brand-300' : 'text-brand-950'}`}>
                <PhoneCall className="w-4 h-4 text-brand-500" />
                <span>Crisis Support</span>
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 min-h-[150px]">
            <div className="space-y-3">
              <div className={`p-3 border rounded-xl text-xs leading-relaxed flex gap-2 ${isDarkMode ? 'bg-red-950/20 border-red-900/30 text-red-300' : 'bg-red-50/50 border-red-100 text-red-800'}`}>
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>
                  If you are experiencing a life-threatening crisis, please do not use this chat. Utilize the helplines below immediately.
                </span>
              </div>
              
              <div className="space-y-2">
                {crisisHelplines.map((hl) => (
                  <div 
                    key={hl.name} 
                    className={`p-3.5 border rounded-xl transition-all duration-200 flex flex-col gap-1 group ${
                      isDarkMode 
                        ? 'bg-slate-850 border-slate-800 hover:bg-brand-950/20 hover:border-brand-800' 
                        : 'bg-slate-50 border-slate-100 hover:bg-brand-50/30 hover:border-brand-200/50'
                    }`}
                  >
                    <h4 className={`font-bold text-xs tracking-tight transition-colors ${isDarkMode ? 'text-slate-100 group-hover:text-brand-300' : 'text-slate-900 group-hover:text-brand-700'}`}>
                      {hl.name}
                    </h4>
                    <p className="text-[10px] opacity-70">
                      {hl.desc}
                    </p>
                    <a 
                      href={`tel:${hl.num.replace(/[^\d+]/g, '')}`} 
                      className={`mt-1.5 self-start text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border shadow-sm transition-all ${
                        isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-brand-300 hover:bg-brand-950/40 hover:border-brand-800' 
                          : 'bg-white border-slate-200/60 text-brand-600 hover:bg-brand-100/50'
                      }`}
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>{hl.num}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Persistent Sidebar Terms Disclaimer Link */}
          <div className={`border-t pt-4 text-[10px] opacity-65 leading-normal select-none shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <p>
              By continuing, you acknowledge you are accepting our <span className="font-semibold">First Response terms</span>. If you need clinical counseling, please seek professional care.
            </p>
          </div>
        </aside>

        {/* --- Chat Section --- */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* Scrollable Messages Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Quick Helper Greeting Banner */}
            <div className={`max-w-2xl mx-auto p-5 rounded-2xl border shadow-sm flex items-start gap-4 mb-4 select-none ${
              isDarkMode 
                ? 'bg-slate-900/40 border-slate-800/80 text-slate-300' 
                : 'bg-white/80 border-white/50 text-slate-700'
            }`}>
              <div className="p-2.5 bg-brand-100 text-brand-600 rounded-xl shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div className="space-y-1 text-xs">
                <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>How to use Lumina</h3>
                <p className={`leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Feel free to talk about anxiety, stress, sleep issues, academic pressures, or relationship questions. Lumina is programmed to guide you through breathing, journaling, grounding, and cognitive reframing.
</p>
              </div>
            </div>

            {/* Messages Listing */}
            <div className="max-w-2xl mx-auto space-y-5">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-center gap-1.5 mb-1 text-[10px] select-none ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="font-medium">
                      {msg.role === 'user' ? 'You' : 'Lumina'}
                    </span>
                    <span>•</span>
                    <span>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={`
                    max-w-[85%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-none' 
                      : msg.isCrisis 
                        ? (isDarkMode ? 'bg-red-950/20 border border-red-900/40 text-red-200 rounded-tl-none font-medium' : 'bg-red-50 border border-red-200 text-red-950 rounded-tl-none font-medium')
                        : (isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none' : 'bg-white border border-slate-200/70 text-slate-800 rounded-tl-none')
                    }
                  `}>
                    {msg.content}

                    {/* Crisis Specific Helplines block inside chat */}
                    {msg.isCrisis && msg.helplines && (
                      <div className={`mt-4 pt-3 border-t space-y-2 select-none ${isDarkMode ? 'border-red-900/30' : 'border-red-200/50'}`}>
                        <p className={`font-bold text-xs ${isDarkMode ? 'text-red-300' : 'text-red-900'}`}>Direct Emergency Resources:</p>
                        <div className="grid grid-cols-1 gap-2">
                          {msg.helplines.map((hl, i) => (
                            <div key={i} className={`border p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white/90 border-red-200 text-slate-800'}`}>
                              <span>{hl}</span>
                              <a 
                                href={`tel:${hl.replace(/[^\d+]/g, '')}`} 
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] hover:bg-red-700 flex items-center gap-1 shadow-sm transition-all"
                              >
                                <PhoneCall className="w-2.5 h-2.5" />
                                <span>Call Now</span>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              ))}

              {/* Typing state indicator */}
              {isLoading && (
                <div className="flex flex-col items-start select-none">
                  <div className={`flex items-center gap-1 mb-1 text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="font-medium">Lumina</span>
                    <span>•</span>
                    <span>typing...</span>
                  </div>
                  <div className={`border p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/70'}`}>
                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-full dot-bounce-1" />
                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-full dot-bounce-2" />
                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-full dot-bounce-3" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick starter suggest panel - Hidden if history is long */}
          {messages.length <= 2 && (
            <div className="px-6 pb-2 w-full max-w-2xl mx-auto select-none">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Quick Starters</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "Stress & Anxiety", icon: "💨", text: "I'm feeling really stressed and overwhelmed today." },
                  { label: "Loneliness", icon: "🏠", text: "I feel very lonely and isolated right now." },
                  { label: "Exam Anxiety", icon: "📝", text: "I am having extreme panic about my upcoming exams." },
                  { label: "Sleep Issues", icon: "🌙", text: "I can't fall asleep, my mind is racing at night." },
                  { label: "Low Self-Esteem", icon: "⭐", text: "I am feeling extremely insecure and critical of myself." },
                  { label: "Homesickness", icon: "🌍", text: "I recently moved and I miss my home and family so much." }
                ].map((st) => (
                  <button
                    key={st.label}
                    onClick={() => handleSendMessage(undefined, st.text)}
                    className={`p-2.5 border text-left text-xs rounded-xl shadow-xs transition-all duration-200 flex flex-col gap-1 hover:scale-[1.01] ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700' 
                        : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    <span className="text-lg">{st.icon}</span>
                    <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Panel */}
          <div className={`p-6 bg-gradient-to-t border-t shrink-0 ${isDarkMode ? 'from-slate-900 border-slate-800/40' : 'from-slate-100 border-slate-200/50'} to-transparent`}>
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isLoading ? "Lumina is typing..." : "Talk to Lumina... (e.g. I feel stressed out)"}
                  disabled={isLoading}
                  className={`w-full pl-5 pr-14 py-4 rounded-2xl shadow-sm text-sm focus:outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-brand-600 focus:ring-1 focus:ring-brand-600' 
                      : 'glass-input border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="absolute right-2.5 p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:scale-100"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Persistent Disclaimer Banner */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 leading-normal select-none px-1">
                <span>
                  By using Lumina, you consent to our safety guidelines.
                </span>
                <span className="flex items-center gap-1">
                  <span>Powering emotional first aid</span>
                  <Heart className="w-3.5 h-3.5 text-brand-500 fill-current" />
                </span>
              </div>
            </div>
          </div>

        </main>

      </div>
    </div>
  );
}
