import React, { useState } from 'react';
import { Language, ActiveTab, ThemeContrast, Medicine } from '../types';
import { t } from '../translations';
import {
  ShieldAlert,
  Pill,
  FileText,
  Compass,
  Users,
  Bot,
  CheckCircle2,
  Volume2,
  Heart,
  Droplets,
  Footprints,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  SunMedium,
  Newspaper,
} from 'lucide-react';
import { speakText } from '../utils/speech';

interface HomeDashboardProps {
  language: Language;
  onSelectTab: (tab: ActiveTab) => void;
  contrast: ThemeContrast;
  medicines: Medicine[];
  onToggleMedicine: (id: string) => void;
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  language,
  onSelectTab,
  contrast,
  medicines,
  onToggleMedicine,
  isSpeaking,
  setIsSpeaking,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const pendingMeds = medicines.filter((m) => !m.takenToday);
  const takenMedsCount = medicines.filter((m) => m.takenToday).length;

  const handleReadMorningBriefing = () => {
    const medSummary =
      pendingMeds.length > 0
        ? language === 'hi'
          ? `आज आपकी ${pendingMeds.length} दवाइयां बाकी हैं।`
          : `You have ${pendingMeds.length} pending medicines scheduled today.`
        : language === 'hi'
        ? 'आज आपने अपनी सभी दवाइयां समय पर ले ली हैं। बहुत बढ़िया!'
        : 'You have taken all your scheduled medicines today. Wonderful!';

    const speechContent =
      language === 'hi'
        ? `नमस्ते जी! शुभ प्रभात। आज का दिन आपके लिए सुखद और मंगलमय हो। ${medSummary} एक ताज़ा गिलास गुनगुना पानी पीना न भूलें। किसी भी काम में संगिनी आपकी मदद के लिए तैयार है।`
        : `Good morning, respected elder. May your day be filled with peace and good health. ${medSummary} Remember to drink a glass of warm water and take things gently today. Sangini is right here whenever you need anything.`;

    speakText(
      speechContent,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleSelectMood = (moodKey: string, feedback: string) => {
    setSelectedMood(moodKey);
    speakText(
      feedback,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8">
      {/* Top Proactive Caring Morning Briefing Card */}
      <section
        aria-label="Daily Morning Care Card"
        className={`rounded-3xl p-6 sm:p-8 border-2 shadow-sm transition-all ${
          isHighContrast
            ? 'bg-slate-900 border-amber-400 text-slate-100'
            : 'bg-gradient-to-r from-[#FFF9F0] via-[#FAF5EB] to-[#FFF3E6] border-[#EADFCB] text-stone-900'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold bg-amber-200 dark:bg-amber-950 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <SunMedium className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>Sangini • {tr.tagline}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif text-stone-900 dark:text-slate-50">
              {tr.greetingSubtitle}
            </h1>

            <p className="text-base sm:text-xl text-stone-700 dark:text-slate-200 leading-relaxed">
              {language === 'hi'
                ? `आज की स्थिति: ${medicines.length} में से ${takenMedsCount} दवाइयां पूरी हो चुकी हैं। कोई भी नया संदेश आया हो, तो पहले सुरक्षा जांच जरूर करें।`
                : `Status: ${takenMedsCount} of ${medicines.length} medicines taken. If you received any unfamiliar message or SMS today, check it here safely first.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="btn-listen-briefing"
              type="button"
              onClick={handleReadMorningBriefing}
              className={`btn-tactile inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-extrabold text-lg sm:text-xl shadow-md border-2 cursor-pointer ${
                isHighContrast
                  ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                  : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
              }`}
              aria-label="Listen to today's audio briefing"
            >
              <Volume2 className="w-6 h-6 shrink-0" />
              <span>{language === 'hi' ? 'आज की बात बोलकर सुनें' : 'Listen to Briefing'}</span>
            </button>
          </div>
        </div>

        {/* Proactive Anticipation Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-stone-500 dark:text-slate-400">
                {language === 'hi' ? 'स्वास्थ्य सलाह' : 'Gentle Habit'}
              </p>
              <p className="text-sm sm:text-base font-bold text-stone-800 dark:text-slate-200">
                {tr.hydrationTip}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-stone-500 dark:text-slate-400">
                {language === 'hi' ? 'हल्का व्यायाम' : 'Daily Movement'}
              </p>
              <p className="text-sm sm:text-base font-bold text-stone-800 dark:text-slate-200">
                {tr.walkTip}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-stone-500 dark:text-slate-400">
                {language === 'hi' ? 'दवाई स्थिति' : 'Medication Status'}
              </p>
              <p className="text-sm sm:text-base font-bold text-stone-800 dark:text-slate-200">
                {pendingMeds.length === 0
                  ? language === 'hi'
                    ? 'सभी दवाइयां पूरी हैं!'
                    : 'All doses completed!'
                  : language === 'hi'
                  ? `${pendingMeds.length} खुराक अभी बाकी हैं`
                  : `${pendingMeds.length} tablet(s) remaining`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wellness & Emotion Check-in */}
      <section
        aria-label="Daily Emotion Check"
        className={`rounded-3xl p-6 border-2 transition-all ${
          isHighContrast
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-stone-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
              {tr.howAreYouFeeling}
            </h2>
          </div>
          <span className="text-sm text-stone-500 dark:text-slate-400 font-medium">
            {language === 'hi'
              ? 'एक विकल्प छूकर बताएं'
              : 'Tap one option to let Sangini know'}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              key: 'great',
              label: tr.moodGreat,
              icon: <Smile className="w-6 h-6 text-emerald-600" />,
              feedback: tr.moodFeedbackGreat,
              bg: 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
            },
            {
              key: 'good',
              label: tr.moodGood,
              icon: <SunMedium className="w-6 h-6 text-amber-600" />,
              feedback: tr.moodFeedbackGood,
              bg: 'hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40',
            },
            {
              key: 'okay',
              label: tr.moodOkay,
              icon: <Meh className="w-6 h-6 text-blue-600" />,
              feedback: tr.moodFeedbackOkay,
              bg: 'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40',
            },
            {
              key: 'low',
              label: tr.moodLow,
              icon: <Frown className="w-6 h-6 text-rose-600" />,
              feedback: tr.moodFeedbackLow,
              bg: 'hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40',
            },
          ].map((item) => {
            const isSelected = selectedMood === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelectMood(item.key, item.feedback)}
                className={`btn-tactile p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2 cursor-pointer transition-all ${item.bg} ${
                  isSelected
                    ? 'border-amber-500 bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 font-extrabold shadow-sm'
                    : isHighContrast
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                {item.icon}
                <span className="text-base sm:text-lg font-bold">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {selectedMood && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-base sm:text-lg text-stone-800 dark:text-slate-200 font-medium">
              {selectedMood === 'great' && tr.moodFeedbackGreat}
              {selectedMood === 'good' && tr.moodFeedbackGood}
              {selectedMood === 'okay' && tr.moodFeedbackOkay}
              {selectedMood === 'low' && tr.moodFeedbackLow}
            </p>
          </div>
        )}
      </section>

      {/* Primary Navigation Tiles (6 Core Pillar Tasks for Seniors) */}
      <section aria-label="Main Everyday Tasks">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-slate-100 font-serif">
            {tr.quickActions}
          </h2>
          <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300">
            {language === 'hi'
              ? 'बड़ा बटन दबाएं और जो काम करना है उस पर सीधे जाएं'
              : 'Tap any large card below to get immediate assistance'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 0. Daily News & Updates */}
          <button
            id="card-nav-daily-news"
            type="button"
            onClick={() => onSelectTab('news')}
            className={`btn-tactile p-6 rounded-3xl border-2 text-left flex flex-col justify-between gap-4 cursor-pointer transition-all hover:shadow-lg ${
              isHighContrast
                ? 'bg-slate-900 border-amber-400 hover:border-amber-300'
                : 'bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-stone-50 border-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-2xl bg-amber-600 text-white shadow-sm">
                <Newspaper className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300">
                {language === 'hi' ? 'आज का बुलेटिन' : "Today's Digest"}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                {tr.news}
              </h3>
              <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 mt-1">
                {tr.newsDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-base sm:text-lg">
              <span>{language === 'hi' ? 'समाचार पढ़ें या सुनें' : 'Read or Listen to News'}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* 1. Scam Shield */}
          <button
            id="card-nav-scam-shield"
            type="button"
            onClick={() => onSelectTab('scam-shield')}
            className={`btn-tactile p-6 rounded-3xl border-2 text-left flex flex-col justify-between gap-4 cursor-pointer transition-all hover:shadow-lg ${
              isHighContrast
                ? 'bg-slate-900 border-amber-400 hover:border-amber-300'
                : 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-sm">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300">
                {language === 'hi' ? 'सुरक्षा कवच' : 'Safety Check'}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                {tr.scamShield}
              </h3>
              <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 mt-1">
                {tr.scamShieldDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-base sm:text-lg">
              <span>{language === 'hi' ? 'संदेश जांचें' : 'Check Message Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* 2. Medicines */}
          <button
            id="card-nav-medicines"
            type="button"
            onClick={() => onSelectTab('medicines')}
            className={`btn-tactile p-6 rounded-3xl border-2 text-left flex flex-col justify-between gap-4 cursor-pointer transition-all hover:shadow-lg ${
              isHighContrast
                ? 'bg-slate-900 border-emerald-400 hover:border-emerald-300'
                : 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-sm">
                <Pill className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300">
                {pendingMeds.length > 0
                  ? `${pendingMeds.length} ${language === 'hi' ? 'बाकी' : 'Pending'}`
                  : language === 'hi'
                  ? 'सब पूरी'
                  : 'All Taken'}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                {tr.medicines}
              </h3>
              <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 mt-1">
                {tr.medicinesDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 text-base sm:text-lg">
              <span>{language === 'hi' ? 'दवाई का समय देखें' : 'View Schedule'}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* 3. Bills & Documents */}
          <button
            id="card-nav-bills"
            type="button"
            onClick={() => onSelectTab('bills')}
            className={`btn-tactile p-6 rounded-3xl border-2 text-left flex flex-col justify-between gap-4 cursor-pointer transition-all hover:shadow-lg ${
              isHighContrast
                ? 'bg-slate-900 border-blue-400 hover:border-blue-300'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200 hover:border-blue-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-blue-200 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300">
                {language === 'hi' ? 'सरल सारांश' : 'Instant 4 Points'}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                {tr.bills}
              </h3>
              <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 mt-1">
                {tr.billsDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 text-base sm:text-lg">
              <span>{language === 'hi' ? 'बिल समझें' : 'Simplify Document'}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* 4. Easy How-To Guides */}
          <button
            id="card-nav-how-to"
            type="button"
            onClick={() => onSelectTab('how-to')}
            className={`btn-tactile p-6 rounded-3xl border-2 text-left flex flex-col justify-between gap-4 cursor-pointer transition-all hover:shadow-lg ${
              isHighContrast
                ? 'bg-slate-900 border-purple-400 hover:border-purple-300'
                : 'bg-gradient-to-br from-purple-50 to-pink-50/50 border-purple-200 hover:border-purple-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-2xl bg-purple-600 text-white shadow-sm">
                <Compass className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-purple-200 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-300">
                {language === 'hi' ? 'कदम-दर-कदम' : 'Step-by-Step'}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                {tr.howTo}
              </h3>
              <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 mt-1">
                {tr.howToDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-400 text-base sm:text-lg">
              <span>{language === 'hi' ? 'मार्गदर्शिका खोलें' : 'View Guides'}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* 5. Family & Help */}
          <button
            id="card-nav-family"
            type="button"
            onClick={() => onSelectTab('family')}
            className={`btn-tactile p-6 rounded-3xl border-2 text-left flex flex-col justify-between gap-4 cursor-pointer transition-all hover:shadow-lg ${
              isHighContrast
                ? 'bg-slate-900 border-rose-400 hover:border-rose-300'
                : 'bg-gradient-to-br from-rose-50 to-orange-50/50 border-rose-200 hover:border-rose-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-2xl bg-rose-600 text-white shadow-sm">
                <Users className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-rose-200 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-300">
                {language === 'hi' ? '1-टैप कॉल' : '1-Tap Call'}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                {tr.family}
              </h3>
              <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 mt-1">
                {tr.familyDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400 text-base sm:text-lg">
              <span>{language === 'hi' ? 'बच्चों को फोन लगाएं' : 'Contact Family'}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* 6. Sangini AI Friend */}
          <button
            id="card-nav-companion"
            type="button"
            onClick={() => onSelectTab('companion')}
            className={`btn-tactile p-6 rounded-3xl border-2 text-left flex flex-col justify-between gap-4 cursor-pointer transition-all hover:shadow-lg ${
              isHighContrast
                ? 'bg-slate-900 border-amber-400 hover:border-amber-300'
                : 'bg-gradient-to-br from-amber-50 to-yellow-50/50 border-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-sm">
                <Bot className="w-8 h-8" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300">
                {language === 'hi' ? 'बोलकर पूछें' : 'Voice & Chat'}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                {tr.companion}
              </h3>
              <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 mt-1">
                {tr.companionDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-base sm:text-lg">
              <span>{language === 'hi' ? 'संगिनी से बात करें' : 'Talk with Sangini'}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </section>

      {/* Today's Quick Pill Checklist Section */}
      <section
        aria-label="Today's Pill Checklist"
        className={`rounded-3xl p-6 sm:p-8 border-2 ${
          isHighContrast
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-stone-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Pill className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-slate-100 font-serif">
                {tr.medsScheduled}
              </h2>
            </div>
            <p className="text-base text-stone-600 dark:text-slate-300 mt-1">
              {language === 'hi'
                ? 'दवाई लेने के बाद "दवाई ले ली" बटन दबाकर टिक लगाएं।'
                : 'Tap "Mark as Taken" after taking your dose.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('medicines')}
            className="text-emerald-700 dark:text-emerald-400 font-bold text-base sm:text-lg hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'hi' ? 'पूरी सूची देखें' : 'View Full Schedule'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {medicines.map((med) => (
            <div
              key={med.id}
              className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                med.takenToday
                  ? isHighContrast
                    ? 'bg-slate-800/80 border-emerald-500/60 opacity-80'
                    : 'bg-emerald-50/60 border-emerald-200 opacity-90'
                  : isHighContrast
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    med.takenToday
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-slate-100">
                      {language === 'hi' ? med.hindiName : med.name}
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300">
                      {med.timeLabel}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-stone-600 dark:text-slate-300 mt-0.5">
                    {med.dosage} &bull; {med.notes}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleMedicine(med.id)}
                className={`btn-tactile px-5 py-3 rounded-xl font-extrabold text-base sm:text-lg border-2 flex items-center justify-center gap-2 cursor-pointer ${
                  med.takenToday
                    ? 'bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-slate-200 border-stone-300 dark:border-slate-600'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-sm'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{med.takenToday ? tr.undoTaken : tr.markAsTaken}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Reassurance Banner */}
      <section
        aria-label="Security Reassurance Banner"
        className={`rounded-3xl p-6 border-2 flex flex-col sm:flex-row items-center gap-4 ${
          isHighContrast
            ? 'bg-amber-950/40 border-amber-400 text-amber-200'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
      >
        <div className="p-3 rounded-2xl bg-amber-500 text-white shrink-0">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-extrabold">
            {language === 'hi'
              ? 'याद रखें: बैंक या सरकार कभी फोन पर OTP नहीं मांगते'
              : 'Golden Reminder: Banks and officials never call asking for your OTP'}
          </h3>
          <p className="text-sm sm:text-base opacity-90">
            {language === 'hi'
              ? 'अगर कोई आपको बिजली काटने या खाता बंद होने की धमकी दे, तो बिना डरे संगिनी पर आकर संदेश जांचें।'
              : 'If anyone creates urgency threatening power disconnection or account freeze, pause and test the message on Sangini first.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectTab('scam-shield')}
          className="btn-tactile sm:ml-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base shadow-xs shrink-0 cursor-pointer"
        >
          {language === 'hi' ? 'संदेश जांचें' : 'Check a Message'}
        </button>
      </section>

      {/* Brand Signoff & Reassurance */}
      <footer className="text-center py-6 border-t border-stone-200 dark:border-slate-800 space-y-2">
        <p className="text-lg sm:text-xl font-bold font-serif text-amber-800 dark:text-amber-400">
          संगिनी (Sangini) — {tr.tagline}
        </p>
        <p className="text-sm text-stone-500 dark:text-slate-400 max-w-xl mx-auto">
          {language === 'hi'
            ? 'आपके हर डिजिटल कार्य, दवाई की याद और सुरक्षा में एक सच्चा और स्नेही साथी।'
            : 'Your devoted, caring digital friend for daily safety, medicine care, and peaceful living.'}
        </p>
      </footer>
    </div>
  );
};
