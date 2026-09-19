import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Language,
  ThemeContrast,
  NewsArticle,
  NewsCategory,
} from '../types';
import { t } from '../translations';
import {
  CURATED_NEWS_DATA,
  TODAY_DATE_STR,
  TODAY_DATE_STR_HI,
} from '../data/newsData';
import {
  Newspaper,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Printer,
  Bell,
  BellRing,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  WifiOff,
  Clock,
  ArrowRight,
  Maximize2,
  X,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Share2,
} from 'lucide-react';

interface DailyNewsProps {
  language: Language;
  contrast: ThemeContrast;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

const REGION_OPTIONS = [
  { id: 'All', labelEn: 'All India (National)', labelHi: 'अखिल भारतीय (राष्ट्रीय)' },
  { id: 'Delhi NCR', labelEn: 'Delhi NCR', labelHi: 'दिल्ली-एनसीआर' },
  { id: 'Mumbai', labelEn: 'Mumbai / MMR', labelHi: 'मुंबई / उपनगर' },
  { id: 'Lucknow', labelEn: 'Lucknow & UP', labelHi: 'लखनऊ व उत्तर प्रदेश' },
  { id: 'Jaipur', labelEn: 'Jaipur & Rajasthan', labelHi: 'जयपुर व राजस्थान' },
  { id: 'Bengaluru', labelEn: 'Bengaluru & South', labelHi: 'बेंगलुरु व दक्षिण' },
];

export const DailyNews: React.FC<DailyNewsProps> = ({
  language,
  contrast,
  isSpeaking,
  setIsSpeaking,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';

  // 1. Filter and Region State
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // 2. Offline & Persistence Cache
  const [articles, setArticles] = useState<NewsArticle[]>(CURATED_NEWS_DATA);
  const [lastCachedTime, setLastCachedTime] = useState<string>('');
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(true);

  // 3. Reader Mode State (Modal for large, distraction-free reading)
  const [readerArticle, setReaderArticle] = useState<NewsArticle | null>(null);
  const [readerFontSize, setReaderFontSize] = useState<'large' | 'xlarge' | 'huge'>('xlarge');

  // 4. Audio Reader State
  const [activeReadingId, setActiveReadingId] = useState<string | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.88); // Elder-friendly gentle pace
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 5. Daily Morning Notification Setting
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sangini_news_reminder') === 'true';
  });
  const [reminderFeedback, setReminderFeedback] = useState<string>('');

  // 6. Initialize and cache articles in localStorage for offline accessibility
  useEffect(() => {
    try {
      const cached = localStorage.getItem('sangini_daily_news_cache');
      const cachedTime = localStorage.getItem('sangini_news_cache_time');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setArticles(parsed);
        }
      } else {
        localStorage.setItem('sangini_daily_news_cache', JSON.stringify(CURATED_NEWS_DATA));
      }
      setLastCachedTime(cachedTime || (language === 'hi' ? 'आज सुबह 7:00 बजे' : 'Today, 7:00 AM'));
      setIsOfflineReady(true);
    } catch {
      setArticles(CURATED_NEWS_DATA);
    }
  }, [language]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [setIsSpeaking]);

  // Handle Speech Reader for an individual article or full bulletin
  const speakText = (text: string, articleId?: string) => {
    if (!('speechSynthesis' in window)) {
      alert(language === 'hi' ? 'आपके ब्राउज़र में आवाज़ की सुविधा उपलब्ध नहीं है।' : 'Audio reading is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    if (activeReadingId === (articleId || 'bulletin') && !isAudioPaused && isSpeaking) {
      // Pause
      window.speechSynthesis.pause();
      setIsAudioPaused(true);
      return;
    }

    if (activeReadingId === (articleId || 'bulletin') && isAudioPaused) {
      // Resume
      window.speechSynthesis.resume();
      setIsAudioPaused(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsAudioPaused(false);
      setActiveReadingId(articleId || 'bulletin');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsAudioPaused(false);
      setActiveReadingId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsAudioPaused(false);
      setActiveReadingId(null);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsAudioPaused(false);
    setActiveReadingId(null);
  };

  // Read entire bulletin
  const handleReadFullBulletin = () => {
    const headerIntro = language === 'hi'
      ? `प्रणाम। प्रस्तुत है संगिनी दैनिक समाचार बुलेटिन। ${TODAY_DATE_STR_HI}। आज के मुख्य समाचार:`
      : `Namaste. Here is today's Sangini Daily News bulletin for ${TODAY_DATE_STR}. Top stories for you:`;

    const storiesText = filteredArticles
      .map((item, idx) => {
        const title = language === 'hi' ? item.titleHi : item.title;
        const summary = language === 'hi' ? item.summaryHi : item.summary;
        const takeaway = language === 'hi' ? item.takeawayHi : item.takeaway;
        return `${language === 'hi' ? `समाचार ${idx + 1}:` : `Story ${idx + 1}:`} ${title}. ${summary}. ${language === 'hi' ? 'आपके लिए विशेष सलाह:' : 'Takeaway for you:'} ${takeaway}`;
      })
      .join('. ');

    speakText(`${headerIntro} ${storiesText}`, 'bulletin');
  };

  // Daily notification toggle
  const handleToggleReminder = async () => {
    if (!reminderEnabled) {
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore error
        }
      }
      localStorage.setItem('sangini_news_reminder', 'true');
      setReminderEnabled(true);
      setReminderFeedback(
        language === 'hi'
          ? '✓ सुबह 8:00 बजे का समाचार रिमाइंडर सक्रिय हो गया है!'
          : '✓ Daily 8:00 AM Morning News reminder is now active!'
      );
    } else {
      localStorage.setItem('sangini_news_reminder', 'false');
      setReminderEnabled(false);
      setReminderFeedback(
        language === 'hi'
          ? 'रिमाइंडर बंद कर दिया गया है।'
          : 'Morning reminder has been turned off.'
      );
    }

    setTimeout(() => setReminderFeedback(''), 4000);
  };

  // Filtered articles based on category and prioritized by region
  const filteredArticles = useMemo(() => {
    let list = [...articles];

    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // Regional prioritization: if region selected, elevate matching regional stories
    if (selectedRegion !== 'All') {
      list.sort((a, b) => {
        const aMatches = a.region.toLowerCase().includes(selectedRegion.toLowerCase());
        const bMatches = b.region.toLowerCase().includes(selectedRegion.toLowerCase());
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    return list;
  }, [articles, selectedCategory, selectedRegion]);

  // Separate critical alert articles for prominent top banner
  const criticalAlerts = useMemo(() => {
    return articles.filter((a) => a.isImportantAlert);
  }, [articles]);

  // Reader mode print handler
  const handlePrintArticle = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Header & Dated Digest Banner */}
      <section
        aria-label="Daily News Header"
        className={`rounded-3xl p-6 sm:p-8 border-2 shadow-xs transition-all ${
          isHighContrast
            ? 'bg-slate-900 border-amber-400 text-slate-100'
            : 'bg-gradient-to-r from-[#FFFBF2] via-[#FAF5EB] to-[#FFF6E9] border-[#EADFCB] text-stone-900'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                <Calendar className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? TODAY_DATE_STR_HI : TODAY_DATE_STR}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{tr.offlineReady}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सुबह 8:00 बजे का निश्चित बुलेटिन' : '8:00 AM Fixed Digest'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif text-stone-900 dark:text-slate-50">
              {tr.newsHeaderTitle}
            </h1>

            <p className="text-base sm:text-lg text-stone-700 dark:text-slate-200 leading-relaxed">
              {tr.newsSubtitle}
            </p>

            {/* Reassurance note: No infinite scroll */}
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 italic">
              {tr.noInfiniteScrollNote}
            </p>
          </div>

          {/* Audio Reader & Routine Reminder Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {activeReadingId === 'bulletin' && isSpeaking ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakText('', 'bulletin')}
                  className="btn-tactile flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-base shadow-md bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                  aria-label="Pause Voice"
                >
                  {isAudioPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  <span>{isAudioPaused ? tr.resumeAudio : tr.pauseAudio}</span>
                </button>
                <button
                  type="button"
                  onClick={stopAudio}
                  className="p-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                  title="Stop"
                  aria-label="Stop audio"
                >
                  <VolumeX className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-listen-daily-bulletin"
                type="button"
                onClick={handleReadFullBulletin}
                className={`btn-tactile inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-extrabold text-base sm:text-lg shadow-md border-2 cursor-pointer transition-all ${
                  isHighContrast
                    ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                    : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
                }`}
              >
                <Volume2 className="w-6 h-6 shrink-0" />
                <span>{tr.listenAllHeadlines}</span>
              </button>
            )}

            {/* Speech speed selector for seniors */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-xs font-bold">
              <span className="text-stone-600 dark:text-slate-300">
                {language === 'hi' ? 'बोलने की गति:' : 'Voice Speed:'}
              </span>
              <div className="inline-flex rounded-lg overflow-hidden border border-stone-300">
                <button
                  type="button"
                  onClick={() => setSpeechRate(0.8)}
                  className={`px-2.5 py-1 text-xs cursor-pointer ${
                    speechRate < 0.85 ? 'bg-amber-500 text-white font-black' : 'bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-300'
                  }`}
                >
                  {tr.speechRateSlower} (0.8x)
                </button>
                <button
                  type="button"
                  onClick={() => setSpeechRate(1.0)}
                  className={`px-2.5 py-1 text-xs cursor-pointer ${
                    speechRate >= 0.95 ? 'bg-amber-500 text-white font-black' : 'bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-300'
                  }`}
                >
                  {tr.speechRateNormal} (1.0x)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "Important for you" Alerts Callout Box */}
      {criticalAlerts.length > 0 && (
        <section
          aria-label="Important for You Critical Alerts"
          className={`rounded-3xl p-5 sm:p-6 border-2 shadow-xs transition-all ${
            isHighContrast
              ? 'bg-amber-950/40 border-amber-400 text-amber-100'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              {tr.importantAlertsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalAlerts.map((alert) => (
              <div
                key={`alert-${alert.id}`}
                className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-amber-200 dark:border-amber-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300">
                    {language === 'hi' ? alert.categoryLabelHi : alert.categoryLabel}
                  </span>
                  <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
                    {language === 'hi' ? alert.dateLabelHi : alert.dateLabel}
                  </span>
                </div>

                <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-slate-100 leading-snug">
                  {language === 'hi' ? alert.titleHi : alert.title}
                </h3>

                <p className="text-sm text-stone-700 dark:text-slate-300 leading-normal">
                  {language === 'hi' ? alert.takeawayHi : alert.takeaway}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-stone-200/60 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setReaderArticle(alert)}
                    className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300 hover:underline font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    <span>{tr.readFullArticle}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      speakText(
                        `${language === 'hi' ? alert.titleHi : alert.title}. ${language === 'hi' ? alert.fullStoryHi : alert.fullStory}`,
                        alert.id
                      )
                    }
                    className="p-2 rounded-xl text-stone-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700 cursor-pointer"
                    title={tr.listenThisArticle}
                    aria-label={tr.listenThisArticle}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Controls: Category Filters & Regional Priority Selector */}
      <section
        aria-label="News Filters and Regional Settings"
        className={`rounded-3xl p-5 sm:p-6 border-2 shadow-xs space-y-5 ${
          isHighContrast
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-stone-200'
        }`}
      >
        {/* Category Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-stone-600 dark:text-slate-300 uppercase tracking-wide">
              {language === 'hi' ? 'विषय चुनें:' : 'Select Topic:'}
            </span>
            <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">
              {filteredArticles.length} {tr.totalStoriesBadge}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all' as NewsCategory, label: tr.newsFilterAll },
              { id: 'important' as NewsCategory, label: tr.newsFilterImportant },
              { id: 'schemes' as NewsCategory, label: tr.newsFilterSchemes },
              { id: 'health' as NewsCategory, label: tr.newsFilterHealth },
              { id: 'local' as NewsCategory, label: tr.newsFilterLocal },
              { id: 'weather' as NewsCategory, label: tr.newsFilterWeather },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`btn-tactile px-4 py-2.5 rounded-2xl font-bold text-sm sm:text-base border-2 cursor-pointer transition-all ${
                    isSelected
                      ? isHighContrast
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-xs'
                        : 'bg-amber-600 text-white border-amber-500 font-black shadow-xs'
                      : isHighContrast
                      ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-500'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Local / Regional News Priority Selector */}
        <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm sm:text-base font-bold text-stone-800 dark:text-slate-200">
              {tr.regionSelectLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {REGION_OPTIONS.map((reg) => {
              const isSelected = selectedRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setSelectedRegion(reg.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-400 font-black'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 border-stone-200 dark:border-slate-700 hover:bg-stone-200'
                  }`}
                >
                  {language === 'hi' ? reg.labelHi : reg.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gentle Morning Notification Routine Bar */}
        <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${reminderEnabled ? 'bg-amber-500 text-white' : 'bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-slate-300'}`}>
              {reminderEnabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-slate-100">
                {tr.routineReminderTitle}
              </p>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {tr.routineReminderSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reminderFeedback && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                {reminderFeedback}
              </span>
            )}
            <button
              type="button"
              onClick={handleToggleReminder}
              className={`btn-tactile px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border cursor-pointer ${
                reminderEnabled
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-300'
                  : 'bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200 border-stone-300 hover:bg-stone-100'
              }`}
            >
              {reminderEnabled ? tr.disableReminderBtn : tr.enableReminderBtn}
            </button>
          </div>
        </div>
      </section>

      {/* 4. Curated Stories List (Large, Readable Headlines with 1-Line Summaries) */}
      <section aria-label="Stories Feed" className="space-y-4">
        {filteredArticles.map((article, index) => {
          const isReadingThis = activeReadingId === article.id && isSpeaking;
          const isRegionalMatch =
            selectedRegion !== 'All' &&
            article.region.toLowerCase().includes(selectedRegion.toLowerCase());

          return (
            <article
              key={article.id}
              className={`rounded-3xl p-6 sm:p-7 border-2 transition-all hover:shadow-md ${
                isReadingThis
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-400'
                  : isHighContrast
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex flex-col gap-3">
                {/* Meta header: Category, Region & Clear Date/Time label */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border border-stone-300 dark:border-slate-700">
                      {language === 'hi' ? article.categoryLabelHi : article.categoryLabel}
                    </span>

                    {isRegionalMatch && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300">
                        <MapPin className="w-3 h-3" />
                        <span>{language === 'hi' ? article.regionHi : article.region}</span>
                      </span>
                    )}

                    <span className="text-xs font-bold text-stone-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? article.dateLabelHi : article.dateLabel}</span>
                    </span>
                  </div>

                  <span className="text-xs text-stone-400 font-medium">
                    {language === 'hi' ? article.sourceHi : article.source}
                  </span>
                </div>

                {/* Headline (Large & High Contrast for Senior Legibility) */}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 dark:text-slate-50 leading-tight">
                  {language === 'hi' ? article.titleHi : article.title}
                </h2>

                {/* 1-2 line plain language summary */}
                <p className="text-base sm:text-xl text-stone-700 dark:text-slate-200 leading-relaxed font-medium">
                  {language === 'hi' ? article.summaryHi : article.summary}
                </p>

                {/* Senior Takeaway Callout */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-300">
                      {tr.seniorTakeaway}{' '}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200">
                      {language === 'hi' ? article.takeawayHi : article.takeaway}
                    </span>
                  </div>
                </div>

                {/* Actions: Reader Mode / Listen Aloud */}
                <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setReaderArticle(article)}
                    className={`btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-sm sm:text-base border cursor-pointer ${
                      isHighContrast
                        ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-stone-100 text-stone-800 border-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>{tr.readFullArticle}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isReadingThis ? (
                      <button
                        type="button"
                        onClick={stopAudio}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm bg-red-600 text-white cursor-pointer"
                      >
                        <VolumeX className="w-4 h-4" />
                        <span>{tr.stopAudioReader}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          speakText(
                            `${language === 'hi' ? article.titleHi : article.title}. ${language === 'hi' ? article.fullStoryHi : article.fullStory}. ${language === 'hi' ? article.takeawayHi : article.takeaway}`,
                            article.id
                          )
                        }
                        className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm sm:text-base text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-slate-800 border border-amber-300 dark:border-amber-800 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>{tr.listenThisArticle}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* 5. Senior Reader Mode Modal (Distraction-Free, Adjustable Large Font, Print-Friendly) */}
      {readerArticle && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            id="printable-reader-article"
            className={`w-full max-w-3xl rounded-3xl p-6 sm:p-10 border-2 shadow-2xl space-y-6 my-auto ${
              isHighContrast
                ? 'bg-slate-900 border-amber-400 text-slate-100'
                : 'bg-[#FFFDF9] border-stone-300 text-stone-900'
            }`}
          >
            {/* Modal Controls: Close, Text Size Adjuster, Print */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-stone-500 dark:text-slate-400 uppercase">
                  {language === 'hi' ? 'अक्षर आकार:' : 'Text Size:'}
                </span>
                <div className="inline-flex rounded-xl overflow-hidden border border-stone-300 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setReaderFontSize('large')}
                    className={`px-3 py-1.5 text-sm cursor-pointer ${
                      readerFontSize === 'large'
                        ? 'bg-amber-500 text-white font-black'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setReaderFontSize('xlarge')}
                    className={`px-3 py-1.5 text-base font-bold cursor-pointer ${
                      readerFontSize === 'xlarge'
                        ? 'bg-amber-500 text-white font-black'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    onClick={() => setReaderFontSize('huge')}
                    className={`px-3 py-1.5 text-lg font-black cursor-pointer ${
                      readerFontSize === 'huge'
                        ? 'bg-amber-500 text-white font-black'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    A++
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintArticle}
                  className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-slate-700 font-bold text-sm hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                  title={tr.printArticle}
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">{tr.printArticle}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReaderArticle(null)}
                  className="p-2.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Close reader"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Article Content in Selected Font Size */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300">
                  {language === 'hi' ? readerArticle.categoryLabelHi : readerArticle.categoryLabel}
                </span>
                <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
                  {language === 'hi' ? readerArticle.dateLabelHi : readerArticle.dateLabel}
                </span>
              </div>

              <h2
                className={`font-black text-stone-900 dark:text-slate-50 leading-snug font-serif ${
                  readerFontSize === 'large'
                    ? 'text-2xl sm:text-3xl'
                    : readerFontSize === 'xlarge'
                    ? 'text-3xl sm:text-4xl'
                    : 'text-3xl sm:text-5xl'
                }`}
              >
                {language === 'hi' ? readerArticle.titleHi : readerArticle.title}
              </h2>

              {/* Takeaway Box */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-stone-900 dark:text-slate-100">
                <span className="text-xs font-black uppercase tracking-wide text-amber-800 dark:text-amber-300 block mb-1">
                  {tr.seniorTakeaway}
                </span>
                <p className="text-base sm:text-lg font-bold">
                  {language === 'hi' ? readerArticle.takeawayHi : readerArticle.takeaway}
                </p>
              </div>

              {/* Full Story Paragraphs */}
              <div
                className={`whitespace-pre-line leading-relaxed text-stone-800 dark:text-slate-200 ${
                  readerFontSize === 'large'
                    ? 'text-lg sm:text-xl'
                    : readerFontSize === 'xlarge'
                    ? 'text-xl sm:text-2xl'
                    : 'text-2xl sm:text-3xl font-medium'
                }`}
              >
                {language === 'hi' ? readerArticle.fullStoryHi : readerArticle.fullStory}
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-slate-800 text-xs text-stone-500 dark:text-slate-400">
                <span>{language === 'hi' ? 'स्रोत:' : 'Source:'} </span>
                <span className="font-bold">{language === 'hi' ? readerArticle.sourceHi : readerArticle.source}</span>
              </div>
            </div>

            {/* Bottom Actions inside Reader Mode */}
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  speakText(
                    `${language === 'hi' ? readerArticle.titleHi : readerArticle.title}. ${language === 'hi' ? readerArticle.fullStoryHi : readerArticle.fullStory}`,
                    readerArticle.id
                  )
                }
                className="btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-base bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
                <span>{tr.listenThisArticle}</span>
              </button>

              <button
                type="button"
                onClick={() => setReaderArticle(null)}
                className="px-6 py-3 rounded-2xl font-bold text-base border-2 border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {tr.closeReader}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
