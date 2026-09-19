import React from 'react';
import { Language, TextSize, ThemeContrast } from '../types';
import { t } from '../translations';
import { Languages, Type, Moon, Sun, Volume2, PhoneCall, VolumeX } from 'lucide-react';
import { stopSpeech } from '../utils/speech';

interface AccessibilityBarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  textSize: TextSize;
  onTextSizeChange: (size: TextSize) => void;
  contrast: ThemeContrast;
  onContrastChange: (contrast: ThemeContrast) => void;
  isSpeaking: boolean;
  onOpenSos: () => void;
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({
  language,
  onLanguageChange,
  textSize,
  onTextSizeChange,
  contrast,
  onContrastChange,
  isSpeaking,
  onOpenSos,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';

  return (
    <header
      id="accessibility-controls-bar"
      aria-label="Accessibility and Comfort Controls"
      className={`border-b py-2 px-3 sm:px-6 sticky top-0 z-40 transition-colors shadow-xs ${
        isHighContrast
          ? 'bg-slate-950 border-slate-700 text-slate-100'
          : 'bg-[#F7F4EE] border-[#E8E2D6] text-stone-800'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left: Language Toggle & Text Size */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Language Switch Button */}
          <button
            id="btn-language-toggle"
            type="button"
            onClick={() => onLanguageChange(language === 'en' ? 'hi' : 'en')}
            className={`btn-tactile inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-base sm:text-lg border-2 shadow-xs cursor-pointer ${
              isHighContrast
                ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                : 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
            }`}
            aria-label={`Switch language. Current: ${language === 'en' ? 'English' : 'Hindi'}`}
          >
            <Languages className="w-5 h-5 shrink-0" />
            <span className="font-semibold">
              {language === 'en' ? 'हिंदी (Hindi)' : 'English'}
            </span>
          </button>

          {/* Text Size (A- / A / A+) */}
          <div
            className={`inline-flex items-center rounded-full p-1 border-2 ${
              isHighContrast
                ? 'bg-slate-900 border-slate-700'
                : 'bg-white border-stone-300'
            }`}
            role="group"
            aria-label={tr.textSize}
          >
            <span className="text-xs sm:text-sm font-bold px-2 flex items-center gap-1 text-stone-600 dark:text-slate-300">
              <Type className="w-4 h-4" />
              <span className="hidden md:inline">{tr.textSize}:</span>
            </span>

            <button
              id="btn-text-size-normal"
              type="button"
              onClick={() => onTextSizeChange('normal')}
              className={`px-2.5 py-1 rounded-full font-bold text-sm sm:text-base cursor-pointer ${
                textSize === 'normal'
                  ? isHighContrast
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-stone-800 text-white font-black'
                  : 'hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200'
              }`}
              title="Normal text size (18px)"
            >
              A
            </button>
            <button
              id="btn-text-size-large"
              type="button"
              onClick={() => onTextSizeChange('large')}
              className={`px-2.5 py-1 rounded-full font-bold text-base sm:text-lg cursor-pointer ${
                textSize === 'large'
                  ? isHighContrast
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-stone-800 text-white font-black'
                  : 'hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200'
              }`}
              title="Large text size (21px)"
            >
              A+
            </button>
            <button
              id="btn-text-size-xlarge"
              type="button"
              onClick={() => onTextSizeChange('xlarge')}
              className={`px-2.5 py-1 rounded-full font-bold text-lg sm:text-xl cursor-pointer ${
                textSize === 'xlarge'
                  ? isHighContrast
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-stone-800 text-white font-black'
                  : 'hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200'
              }`}
              title="Extra large text size (24px)"
            >
              A++
            </button>
          </div>

          {/* Contrast Mode Toggle */}
          <button
            id="btn-contrast-toggle"
            type="button"
            onClick={() => onContrastChange(isHighContrast ? 'standard' : 'high')}
            className={`btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm sm:text-base font-semibold cursor-pointer ${
              isHighContrast
                ? 'bg-slate-800 border-amber-400 text-amber-300 hover:bg-slate-700'
                : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100'
            }`}
            title="Toggle contrast mode"
            aria-pressed={isHighContrast}
          >
            {isHighContrast ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>{tr.standardContrast}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-stone-600" />
                <span>{tr.highContrast}</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Audio Stop & Emergency SOS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isSpeaking && (
            <button
              id="btn-stop-speech"
              type="button"
              onClick={stopSpeech}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white font-bold text-sm sm:text-base shadow-sm animate-pulse cursor-pointer hover:bg-rose-700"
              title="Stop current voice read aloud"
            >
              <VolumeX className="w-4 h-4" />
              <span>{tr.stopAudio}</span>
            </button>
          )}

          {/* Emergency SOS Button */}
          <button
            id="btn-emergency-sos"
            type="button"
            onClick={onOpenSos}
            className="btn-tactile inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-sm sm:text-base shadow-md cursor-pointer border-2 border-red-400"
            aria-label="Emergency SOS button"
          >
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span className="tracking-wide uppercase font-extrabold">
              {tr.emergencySos}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
