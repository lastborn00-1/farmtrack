import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AiService } from '@/features/ai/services/aiService';
import { Send, Bot, User, Sparkles, Copy, Check, Camera, X, ImageIcon, History } from 'lucide-react';
import { normalizeImageForAi } from '@/lib/image';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string; // base64 preview
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied!</span></>
      ) : (
        <><Copy className="w-3 h-3" /><span>Copy</span></>
      )}
    </button>
  );
}

const DEFAULT_WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello! I am PoultryPro AI 🐔\n\nI have full context on your farm — your houses, batches, bird counts, and more. Ask me anything:\n\n• "What is the ideal feed for 20-week Isa Browns?"\n• "My birds are not laying well, what could be wrong?"\n• "How many eggs should I expect from 500 birds?"\n• "Summarize my farm status"\n• 📷 Attach a photo of a sick bird for AI disease diagnosis\n\nHow can I help you today?',
};

export default function AiAssistantPage() {
  const { activeFarm } = useAuthStore();
  const [showHistory, setShowHistory] = useState(false);
  const [sessionMessages, setSessionMessages] = useState<Message[]>([DEFAULT_WELCOME]);
  const [historyMessages, setHistoryMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ai_chat_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [DEFAULT_WELCOME];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = showHistory ? historyMessages : sessionMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, isLoading, showHistory]);

  const handleClearHistory = () => {
    setHistoryMessages([DEFAULT_WELCOME]);
    setSessionMessages([DEFAULT_WELCOME]);
    localStorage.removeItem('ai_chat_history');
    setShowHistory(false);
  };

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAttachedImage(await normalizeImageForAi(file));
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || !activeFarm) return;

    const userContent = input.trim() || '🐔 Analyze this image of a sick bird and suggest the likely disease and treatment used in Nigeria.';
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      imageUrl: attachedImage?.previewUrl,
    };
    
    setSessionMessages(prev => [...prev, userMsg]);
    setHistoryMessages(prev => {
      const updated = [...prev, userMsg];
      localStorage.setItem('ai_chat_history', JSON.stringify(updated));
      return updated;
    });
    
    setInput('');
    const currentImage = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      let response: string;

      if (currentImage) {
        // Use multimodal image analysis
        const result = await AiService.analyzeDiseaseImage(currentImage.base64, currentImage.mimeType);
        response = `🔬 **AI Disease Analysis**\n\n**Likely Diagnosis:** ${result.diagnosis}\n\n**Recommended Medication:** ${result.medication}\n\n**Suggested Dosage:** ${result.dosage}\n\n---\n_Always consult with a licensed veterinarian to confirm the diagnosis before treatment._`;
      } else {
        response = await AiService.askAssistant(userContent, activeFarm.farmId);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };
      
      setSessionMessages(prev => [...prev, assistantMsg]);
      setHistoryMessages(prev => {
        const updated = [...prev, assistantMsg];
        localStorage.setItem('ai_chat_history', JSON.stringify(updated));
        return updated;
      });
    } catch (error: any) {
      console.error('AI error:', error);
      const errDetail = error?.message || '';
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I had trouble connecting. ${errDetail ? `(${errDetail})` : 'Please check your internet connection and try again.'}`,
      };
      setSessionMessages(prev => [...prev, errorMsg]);
      setHistoryMessages(prev => {
        const updated = [...prev, errorMsg];
        localStorage.setItem('ai_chat_history', JSON.stringify(updated));
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionChips = [
    'Summarize my farm',
    'Why are my birds not laying?',
    'Standard feed per 100 birds?',
    'Signs of Newcastle disease?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
              showHistory 
                ? 'bg-primary text-primary-foreground shadow-primary/20' 
                : 'bg-white dark:bg-zinc-800 text-muted-foreground hover:bg-muted border border-border'
            }`}
            title="Toggle Chat History"
          >
            <History className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Farm Assistant</h2>
            <p className="text-sm text-muted-foreground">{showHistory ? 'Viewing History' : 'Powered by Gemini 2.5 Flash'}</p>
          </div>
        </div>
        <button
          onClick={handleClearHistory}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 mobile-scroll">
          {activeMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-primary/10 text-primary' : 'gradient-primary text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Image preview if attached */}
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Attached"
                    className="w-48 h-36 object-cover rounded-xl mb-1 border border-border"
                  />
                )}
                <div className={`rounded-2xl p-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted/50 text-foreground rounded-tl-sm border border-border/50'
                }`}>
                  <div
                    className="whitespace-pre-wrap select-text"
                    style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                  >
                    {msg.content}
                  </div>
                </div>
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <CopyButton text={msg.content} />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-4 border border-border/50 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-dot" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-dot" style={{ animationDelay: '300ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-dot" style={{ animationDelay: '600ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips — show only before first user message */}
        {activeMessages.length === 1 && !showHistory && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {suggestionChips.map((chip) => (
              <button
                key={chip}
                onClick={() => setInput(chip)}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-primary/8 dark:bg-primary/15 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Image preview above input */}
        {attachedImage && (
          <div className="px-3 pb-1">
            <div className="relative inline-block">
              <img
                src={attachedImage.previewUrl}
                alt="Attached"
                className="w-24 h-20 object-cover rounded-xl border border-border"
              />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-1 left-1 right-1 text-[9px] text-white bg-black/50 rounded px-1 py-0.5 text-center truncate">
                <ImageIcon className="w-2.5 h-2.5 inline mr-0.5" />
                AI will analyze
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-border/50">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            {/* Camera / Image attach — two choices */}
            <div className="flex gap-1 flex-shrink-0">
              {/* Camera */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  onChange={handleImageAttach}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    attachedImage ? 'bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600' : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                  }`}
                  title="Take Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              {/* Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  onChange={handleImageAttach}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-muted/70 text-muted-foreground hover:bg-muted"
                  title="Upload Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={attachedImage ? 'Add a message or just send image...' : 'Ask about your farm...'}
              className="flex-1 rounded-xl bg-muted/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !attachedImage)}
              className="w-12 h-12 flex-shrink-0 rounded-xl gradient-primary text-white flex items-center justify-center disabled:opacity-50 touch-active shadow-md shadow-primary/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
