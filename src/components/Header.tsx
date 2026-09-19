import React, { useEffect, useState } from 'react';
import { Language, ActiveTab, ThemeContrast } from '../types';
import { t } from '../translations';
import { Home, ArrowLeft, Heart, Sparkles, Shield, Pill, FileText, Compass, Users, Bot } from 'lucide-react';

interface HeaderProps {
  language: Language;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  contrast: ThemeContrast;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  activeTab,
  onSelectTab,
  contrast,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 30000);
    return () => clearInterval(timer);
  }, [language]);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return tr.morningGreet;
    if (hours < 17) return tr.afternoonGreet;
    return tr.eveningGreet;
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'scam-shield':
        return tr.scamShield;
      case 'medicines':
        return tr.medicines;
      case 'bills':
        return tr.bills;
      case 'how-to':
        return tr.howTo;
      case 'family':
        return tr.family;
      case 'companion':
        return tr.companion;
      default:
        return tr.home;
    }
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'scam-shield':
        return <Shield className="w-6 h-6 text-amber-500" />;
      case 'medicines':
        return <Pill className="w-6 h-6 text-emerald-500" />;
      case 'bills':
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'how-to':
        return <Compass className="w-6 h-6 text-purple-500" />;
      case 'family':
        return <Users className="w-6 h-6 text-rose-500" />;
      case 'companion':
        return <Bot className="w-6 h-6 text-amber-500" />;
      default:
        return <Heart className="w-6 h-6 text-amber-600" />;
    }
  };

  return (
    <div
      id="main-app-header"
      className={`border-b px-4 sm:px-8 py-4 transition-colors ${
        isHighContrast
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-[#FFFDF9] border-[#EAE3D2] text-stone-900'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Brand / Home Button & Greeting */}
        <div className="flex items-center gap-3 sm:gap-4">
          {activeTab !== 'home' ? (
            <button
              id="btn-back-to-home"
              type="button"
              onClick={() => onSelectTab('home')}
              className={`btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-base sm:text-lg border-2 shadow-xs cursor-pointer ${
                isHighContrast
                  ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                  : 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
              }`}
              aria-label="Go back to Home dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{tr.home}</span>
            </button>
          ) : (
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs border-2 ${
                isHighContrast
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-amber-500 text-white border-amber-400'
              }`}
            >
              <Heart className="w-7 h-7 fill-current" />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-700 dark:text-amber-400 font-serif">
                {tr.appName}
              </span>
              <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                {tr.tagline}
              </span>
            </div>
            <p className="text-sm sm:text-base text-stone-600 dark:text-slate-300 font-medium mt-0.5">
              {activeTab === 'home' ? getGreeting() : getTabTitle()}
            </p>
          </div>
        </div>

        {/* Right: Date, Time & Home shortcut */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t md:border-t-0 pt-2 md:pt-0 border-stone-200 dark:border-slate-800">
          <div className="text-left sm:text-right">
            <div className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-slate-100">
              {timeStr}
            </div>
            <div className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 font-medium">
              {dateStr}
            </div>
          </div>

          {activeTab !== 'home' && (
            <button
              id="btn-nav-home-icon"
              type="button"
              onClick={() => onSelectTab('home')}
              className={`p-3 rounded-2xl border-2 cursor-pointer ${
                isHighContrast
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
              }`}
              title={tr.home}
              aria-label={tr.home}
            >
              <Home className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb / Step Indicator when not on Home */}
      {activeTab !== 'home' && (
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-700 dark:text-slate-300 font-bold text-base sm:text-lg">
            {getTabIcon()}
            <span>{getTabTitle()}</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="text-amber-700 dark:text-amber-400 hover:underline font-bold text-sm sm:text-base flex items-center gap-1 cursor-pointer"
          >
            <span>&larr;</span>
            <span>{language === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Return to Home'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
