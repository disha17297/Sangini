import React, { useState, useEffect } from 'react';
import {
  Language,
  TextSize,
  ThemeContrast,
  ActiveTab,
  Medicine,
} from './types';
import { t } from './translations';
import { initialMedicines } from './data';
import { stopSpeech } from './utils/speech';

// Components
import { AccessibilityBar } from './components/AccessibilityBar';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { ScamShield } from './components/ScamShield';
import { MedicineTracker } from './components/MedicineTracker';
import { DocumentExplainer } from './components/DocumentExplainer';
import { HowToGuides } from './components/HowToGuides';
import { FamilyConnect } from './components/FamilyConnect';
import { CompanionChat } from './components/CompanionChat';

// Icons
import {
  Home,
  Shield,
  Pill,
  FileText,
  Compass,
  Users,
  Bot,
  PhoneCall,
  X,
  AlertTriangle,
  Heart
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [textSize, setTextSize] = useState<TextSize>('large'); // default to large for senior readability!
  const [contrast, setContrast] = useState<ThemeContrast>('standard');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const tr = t[language];
  const isHighContrast = contrast === 'high';

  // Apply root CSS classes for text scale and contrast
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-normal', 'text-large', 'text-huge');
    root.classList.add(`text-${textSize}`);

    if (contrast === 'high') {
      root.classList.add('contrast-high');
    } else {
      root.classList.remove('contrast-high');
    }
  }, [textSize, contrast]);

  // Scroll to top on view change
  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleMedicine = (id: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, takenToday: !m.takenToday } : m))
    );
  };

  const handleAddMedicine = (newMed: Omit<Medicine, 'id' | 'takenToday'>) => {
    const med: Medicine = {
      ...newMed,
      id: `med-${Date.now()}`,
      takenToday: false,
    };
    setMedicines((prev) => [med, ...prev]);
  };

  const handleStopAudio = () => {
    stopSpeech();
    setIsSpeaking(false);
  };

  return (
    <div
      id="saathi-app-root"
      className={`min-h-screen flex flex-col font-sans transition-colors pb-24 md:pb-8 ${
        isHighContrast
          ? 'bg-slate-950 text-slate-100'
          : 'bg-[#FAF8F5] text-stone-900'
      }`}
    >
      {/* 1. Global Senior Accessibility Control Bar */}
      <AccessibilityBar
        language={language}
        onLanguageChange={setLanguage}
        textSize={textSize}
        onTextSizeChange={setTextSize}
        contrast={contrast}
        onContrastChange={setContrast}
        isSpeaking={isSpeaking}
        onOpenSos={() => setIsSosOpen(true)}
      />

      {/* 2. Top Header with warm greeting, current time and Home button */}
      <Header
        language={language}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        contrast={contrast}
      />

      {/* 3. Main View Router */}
      <main id="main-content-region" className="flex-1 w-full" tabIndex={-1}>
        {activeTab === 'home' && (
          <HomeDashboard
            language={language}
            onSelectTab={handleSelectTab}
            contrast={contrast}
            medicines={medicines}
            onToggleMedicine={handleToggleMedicine}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'scam-shield' && (
          <ScamShield
            language={language}
            contrast={contrast}
            onBackToHome={() => handleSelectTab('home')}
            onOpenSos={() => setIsSosOpen(true)}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'medicines' && (
          <MedicineTracker
            language={language}
            contrast={contrast}
            medicines={medicines}
            onToggleMedicine={handleToggleMedicine}
            onAddMedicine={handleAddMedicine}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'bills' && (
          <DocumentExplainer
            language={language}
            contrast={contrast}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'how-to' && (
          <HowToGuides
            language={language}
            contrast={contrast}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'family' && (
          <FamilyConnect
            language={language}
            contrast={contrast}
            onOpenSos={() => setIsSosOpen(true)}
          />
        )}

        {activeTab === 'companion' && (
          <CompanionChat
            language={language}
            contrast={contrast}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}
      </main>

      {/* 4. Bottom Navigation Bar (Optimized for Seniors: Big Touch Targets, Clear Text Labels) */}
      <nav
        aria-label="Bottom Navigation Bar"
        className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 py-2 px-2 sm:px-6 shadow-2xl transition-colors backdrop-blur-md ${
          isHighContrast
            ? 'bg-slate-900/95 border-slate-700 text-slate-200'
            : 'bg-white/95 border-stone-300 text-stone-700'
        }`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-around gap-1">
          <button
            type="button"
            onClick={() => handleSelectTab('home')}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] cursor-pointer transition-all ${
              activeTab === 'home'
                ? isHighContrast
                  ? 'text-amber-400 font-black scale-105'
                  : 'text-amber-700 font-black scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs sm:text-sm mt-0.5 tracking-tight">
              {tr.home}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('scam-shield')}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] cursor-pointer transition-all ${
              activeTab === 'scam-shield'
                ? isHighContrast
                  ? 'text-amber-400 font-black scale-105'
                  : 'text-amber-700 font-black scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Shield className="w-6 h-6" />
            <span className="text-xs sm:text-sm mt-0.5 tracking-tight">
              {language === 'hi' ? 'सुरक्षा' : 'Safety'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('medicines')}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] cursor-pointer transition-all ${
              activeTab === 'medicines'
                ? isHighContrast
                  ? 'text-emerald-400 font-black scale-105'
                  : 'text-emerald-700 font-black scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Pill className="w-6 h-6" />
            <span className="text-xs sm:text-sm mt-0.5 tracking-tight">
              {language === 'hi' ? 'दवाई' : 'Meds'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('bills')}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] cursor-pointer transition-all ${
              activeTab === 'bills'
                ? isHighContrast
                  ? 'text-blue-400 font-black scale-105'
                  : 'text-blue-700 font-black scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs sm:text-sm mt-0.5 tracking-tight">
              {language === 'hi' ? 'बिल' : 'Bills'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('how-to')}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] cursor-pointer transition-all ${
              activeTab === 'how-to'
                ? isHighContrast
                  ? 'text-purple-400 font-black scale-105'
                  : 'text-purple-700 font-black scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Compass className="w-6 h-6" />
            <span className="text-xs sm:text-sm mt-0.5 tracking-tight">
              {language === 'hi' ? 'मार्गदर्शन' : 'Guides'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('family')}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] cursor-pointer transition-all ${
              activeTab === 'family'
                ? isHighContrast
                  ? 'text-rose-400 font-black scale-105'
                  : 'text-rose-700 font-black scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs sm:text-sm mt-0.5 tracking-tight">
              {language === 'hi' ? 'परिवार' : 'Family'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('companion')}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] cursor-pointer transition-all ${
              activeTab === 'companion'
                ? isHighContrast
                  ? 'text-amber-400 font-black scale-105'
                  : 'text-amber-700 font-black scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Bot className="w-6 h-6" />
            <span className="text-xs sm:text-sm mt-0.5 tracking-tight">
              {language === 'hi' ? 'संगिनी' : 'Sangini'}
            </span>
          </button>
        </div>
      </nav>

      {/* 5. Emergency SOS Modal with Confirmation & Direct Helpline Numbers */}
      {isSosOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border-3 shadow-2xl space-y-6 ${
              isHighContrast
                ? 'bg-slate-900 border-red-500 text-slate-100'
                : 'bg-white border-red-500 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-red-200 dark:border-red-900">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-600 text-white animate-pulse">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
                  {tr.emergencySos}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSosOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-base sm:text-lg text-stone-700 dark:text-slate-300 leading-relaxed">
              {language === 'hi'
                ? 'क्या आपको तुरंत मदद की आवश्यकता है? नीचे दिए गए किसी भी आपातकालीन नंबर पर 1 टैप में तुरंत कॉल लगाएं:'
                : 'Do you need immediate assistance? Tap any of the verified emergency hotlines below to connect instantly:'}
            </p>

            <div className="space-y-3">
              <a
                href="tel:102"
                className="btn-tactile p-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg sm:text-xl flex items-center justify-between shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <PhoneCall className="w-6 h-6" />
                  <span>{language === 'hi' ? 'एम्बुलेंस (चिकित्सा आपातकाल)' : 'Ambulance (Medical)'}</span>
                </div>
                <span className="text-2xl font-mono">102</span>
              </a>

              <a
                href="tel:112"
                className="btn-tactile p-4 rounded-2xl bg-stone-900 dark:bg-slate-800 hover:bg-stone-800 text-white font-extrabold text-lg sm:text-xl flex items-center justify-between border-2 border-stone-700 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <PhoneCall className="w-6 h-6 text-amber-400" />
                  <span>{language === 'hi' ? 'अखिल भारतीय आपातकालीन नंबर' : 'National All-in-One Emergency'}</span>
                </div>
                <span className="text-2xl font-mono">112</span>
              </a>

              <a
                href="tel:14567"
                className="btn-tactile p-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-lg sm:text-xl flex items-center justify-between shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 fill-current" />
                  <span>{language === 'hi' ? 'वरिष्ठ नागरिक हेल्पलाइन (एल्डरलाइन)' : 'National Elderline (Seniors)'}</span>
                </div>
                <span className="text-2xl font-mono">14567</span>
              </a>

              <a
                href="tel:+919876543210"
                className="btn-tactile p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg sm:text-xl flex items-center justify-between shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  <span>{language === 'hi' ? 'राहुल (बेटा)' : 'Rahul (Son / Primary)'}</span>
                </div>
                <span className="text-lg font-mono">Call</span>
              </a>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSosOpen(false)}
                className="px-6 py-3 rounded-2xl border-2 border-stone-300 dark:border-slate-700 font-bold text-base cursor-pointer hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                {tr.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
