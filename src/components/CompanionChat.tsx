import React, { useState, useRef, useEffect } from 'react';
import { Language, ThemeContrast, ChatMessage } from '../types';
import { t } from '../translations';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  User,
  RotateCcw
} from 'lucide-react';
import { speakText, createSpeechRecognition } from '../utils/speech';

interface CompanionChatProps {
  language: Language;
  contrast: ThemeContrast;
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
}

export const CompanionChat: React.FC<CompanionChatProps> = ({
  language,
  contrast,
  isSpeaking,
  setIsSpeaking,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'saathi',
      text:
        language === 'hi'
          ? 'प्रणाम! मैं आपकी दैनिक संगिनी हूँ। कोई भी प्रश्न हो, किसी बात की चिंता हो, या बस थोड़ी बातचीत करनी हो—मुझसे बेझिझक पूछिए।'
          : 'Namaste and warm greetings! I am Sangini, your patient daily companion. You can ask me anything—from checking a message, understanding daily chores, or just having a warm conversation.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeRecognizer, setActiveRecognizer] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = textToSend || inputText;
    if (!messageContent.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageContent.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build history
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const response = await fetch('/api/gemini/companion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          language,
          conversationHistory: history,
        }),
      });

      const data = await response.json();
      const saathiMsg: ChatMessage = {
        id: `saathi-${Date.now()}`,
        sender: 'saathi',
        text: data.reply || tr.networkError,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, saathiMsg]);

      // Read Sangini's reply aloud automatically for low-effort accessibility
      speakText(
        saathiMsg.text,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    } catch (err) {
      console.error('Companion chat failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isRecording && activeRecognizer) {
      activeRecognizer.stop();
      setIsRecording(false);
      return;
    }

    const recognizer = createSpeechRecognition(
      language,
      (text) => {
        setInputText(text);
        setIsRecording(false);
        handleSendMessage(text);
      },
      (err) => {
        console.warn('Speech error:', err);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (recognizer) {
      setActiveRecognizer(recognizer);
      setIsRecording(true);
      recognizer.start();
    }
  };

  const handleReadMessage = (text: string) => {
    speakText(
      text,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const samplePrompts =
    language === 'hi'
      ? [
          'क्या बिजली विभाग रात में बिजली काटने का फोन करता है?',
          'मुझे एक प्रेरणादायक छोटी कहानी सुनाइए।',
          'वरिष्ठ नागरिकों के लिए आसान व्यायाम कौन से हैं?',
          'व्हाट्सएप पर फोटो कैसे भेजी जाती है?',
        ]
      : [
          'Does the electricity board ever call asking for payment at night?',
          'Tell me a gentle, heartwarming short story.',
          'What are 3 simple seated exercises for seniors?',
          'How do I send a photo on WhatsApp step-by-step?',
        ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header card */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 ${
          isHighContrast
            ? 'bg-slate-900 border-amber-400 text-slate-100'
            : 'bg-amber-50/70 border-amber-200 text-stone-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-sm shrink-0">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
                {tr.companionTitle}
              </h1>
              <p className="text-base sm:text-lg text-stone-700 dark:text-slate-300 mt-1">
                {tr.companionSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  id: 'welcome',
                  sender: 'saathi',
                  text:
                    language === 'hi'
                      ? 'प्रणाम! मैं आपकी संगिनी हूँ। मुझसे जो पूछना चाहें, पूछिए।'
                      : 'Namaste! I am Sangini. Please ask me anything.',
                  timestamp: new Date().toISOString(),
                },
              ])
            }
            className="text-xs sm:text-sm font-bold text-stone-500 hover:text-stone-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{language === 'hi' ? 'नई बात शुरू करें' : 'Reset Chat'}</span>
          </button>
        </div>
      </section>

      {/* Message Feed */}
      <section
        className={`rounded-3xl p-6 border-2 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4 ${
          isHighContrast
            ? 'bg-slate-900 border-slate-700'
            : 'bg-stone-50/80 border-stone-200'
        }`}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-stone-800 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[85%] p-4 sm:p-5 rounded-3xl border-2 space-y-2 ${
                  isUser
                    ? 'bg-amber-600 text-white border-amber-500 rounded-tr-xs'
                    : isHighContrast
                    ? 'bg-slate-800 text-slate-100 border-slate-700 rounded-tl-xs'
                    : 'bg-white text-stone-900 border-stone-200 rounded-tl-xs shadow-xs'
                }`}
              >
                <p className="text-base sm:text-xl font-medium leading-relaxed whitespace-pre-wrap">
                  {m.text}
                </p>

                {!isUser && (
                  <button
                    type="button"
                    onClick={() => handleReadMessage(m.text)}
                    className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{tr.readAloud}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
              <span
                className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                style={{ animationDelay: '0.4s' }}
              />
              <span className="text-sm font-bold text-stone-600 dark:text-slate-300 ml-1">
                {language === 'hi' ? 'संगिनी विचार कर रही है...' : 'Sangini is thinking...'}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </section>

      {/* Suggested Quick Questions */}
      <div className="space-y-2">
        <span className="text-sm font-bold text-stone-500 dark:text-slate-400">
          {language === 'hi' ? 'पूछने के लिए सुझाव:' : 'Tap to ask directly:'}
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="px-3.5 py-2 rounded-2xl text-sm sm:text-base font-semibold bg-white dark:bg-slate-800 hover:bg-amber-100 text-stone-800 dark:text-slate-200 border border-stone-300 dark:border-slate-700 shadow-xs cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar with Large Mic & Send Button */}
      <div
        className={`p-3 sm:p-4 rounded-3xl border-2 flex items-center gap-2 sm:gap-3 ${
          isHighContrast
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-stone-300 shadow-xs'
        }`}
      >
        {/* Big Mic Button */}
        <button
          id="btn-chat-mic"
          type="button"
          onClick={handleVoiceInput}
          className={`btn-tactile p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-center cursor-pointer ${
            isRecording
              ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300'
          }`}
          title={tr.speakMessage}
        >
          {isRecording ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder={tr.companionPlaceholder}
          className={`flex-1 p-3.5 sm:p-4 text-lg sm:text-xl rounded-2xl border-2 focus:ring-4 focus:ring-amber-400 focus:outline-none ${
            isHighContrast
              ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400'
              : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400'
          }`}
        />

        <button
          id="btn-chat-send"
          type="button"
          disabled={isLoading || !inputText.trim()}
          onClick={() => handleSendMessage()}
          className={`btn-tactile p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-center shadow-xs cursor-pointer ${
            isLoading || !inputText.trim()
              ? 'bg-stone-200 dark:bg-slate-800 text-stone-400 border-transparent cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
          }`}
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
