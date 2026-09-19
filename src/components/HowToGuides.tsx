import React, { useState } from 'react';
import { Language, ThemeContrast, StepGuide } from '../types';
import { t } from '../translations';
import { stepGuides } from '../data';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Volume2,
  AlertTriangle,
  Zap,
  Video,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { speakText } from '../utils/speech';

interface HowToGuidesProps {
  language: Language;
  contrast: ThemeContrast;
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
}

export const HowToGuides: React.FC<HowToGuidesProps> = ({
  language,
  contrast,
  isSpeaking,
  setIsSpeaking,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';

  const [activeGuide, setActiveGuide] = useState<StepGuide | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const getGuideIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-8 h-8 text-amber-500" />;
      case 'Video':
        return <Video className="w-8 h-8 text-emerald-500" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-8 h-8 text-rose-500" />;
      default:
        return <Compass className="w-8 h-8 text-purple-500" />;
    }
  };

  const handleStartGuide = (guide: StepGuide) => {
    setActiveGuide(guide);
    setCurrentStepIndex(0);
    readStepAloud(guide, 0);
  };

  const readStepAloud = (guide: StepGuide, stepIdx: number) => {
    const step = guide.steps[stepIdx];
    if (!step) return;

    const heading = language === 'hi' ? step.headingHi : step.headingEn;
    const desc = language === 'hi' ? step.descriptionHi : step.descriptionEn;
    const caution =
      language === 'hi' ? step.cautionHi || '' : step.cautionEn || '';

    const speech = `${tr.step} ${step.stepNumber} ${tr.of} ${guide.steps.length}. ${heading}. ${desc}. ${caution}`;
    speakText(
      speech,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleNextStep = () => {
    if (!activeGuide) return;
    if (currentStepIndex < activeGuide.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      readStepAloud(activeGuide, nextIdx);
    } else {
      // Completed!
      setActiveGuide(null);
      setCurrentStepIndex(0);
    }
  };

  const handlePrevStep = () => {
    if (!activeGuide) return;
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      readStepAloud(activeGuide, prevIdx);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header card */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 ${
          isHighContrast
            ? 'bg-slate-900 border-purple-400 text-slate-100'
            : 'bg-purple-50/70 border-purple-200 text-stone-900'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-600 text-white shadow-sm shrink-0">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
              {tr.howToTitle}
            </h1>
            <p className="text-base sm:text-lg text-stone-700 dark:text-slate-300 mt-2 leading-relaxed">
              {tr.howToSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* When a guide is ACTIVE: Interactive Step View */}
      {activeGuide ? (
        <section
          className={`rounded-3xl p-6 sm:p-8 border-3 shadow-lg space-y-6 transition-all ${
            isHighContrast
              ? 'bg-slate-900 border-purple-400 text-slate-100'
              : 'bg-white border-purple-300 text-stone-900'
          }`}
        >
          {/* Guide Title & Step Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-700">
            <div>
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                {language === 'hi' ? activeGuide.titleHi : activeGuide.titleEn}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                {tr.step} {currentStepIndex + 1} {tr.of} {activeGuide.steps.length}
              </h2>
            </div>

            {/* Read Step Aloud Button */}
            <button
              type="button"
              onClick={() => readStepAloud(activeGuide, currentStepIndex)}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-base bg-purple-50 dark:bg-slate-800 border-2 border-purple-300 dark:border-slate-600 text-purple-900 dark:text-purple-200 cursor-pointer hover:bg-purple-100"
            >
              <Volume2 className="w-5 h-5 text-purple-600" />
              <span>{tr.readStepAloud}</span>
            </button>
          </div>

          {/* Progress Dots / Bars */}
          <div
            className="flex items-center gap-2"
            role="progressbar"
            aria-valuenow={currentStepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={activeGuide.steps.length}
          >
            {activeGuide.steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-3 rounded-full flex-1 transition-all ${
                  idx <= currentStepIndex
                    ? 'bg-purple-600'
                    : 'bg-stone-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Current Step Content */}
          {(() => {
            const step = activeGuide.steps[currentStepIndex];
            return (
              <div className="space-y-5 py-2">
                <h3 className="text-xl sm:text-3xl font-extrabold text-stone-900 dark:text-slate-100">
                  {language === 'hi' ? step.headingHi : step.headingEn}
                </h3>

                <p className="text-lg sm:text-2xl text-stone-800 dark:text-slate-200 leading-relaxed font-medium">
                  {language === 'hi' ? step.descriptionHi : step.descriptionEn}
                </p>

                {/* Caution / Pro-Tip Callout */}
                {(step.cautionHi || step.cautionEn) && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700 flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-base sm:text-lg font-bold text-amber-950 dark:text-amber-200">
                      {language === 'hi' ? step.cautionHi : step.cautionEn}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Navigation Controls (Previous Step / Next Step / Back to All) */}
          <div className="pt-4 border-t border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={handlePrevStep}
              className={`btn-tactile px-6 py-3.5 rounded-2xl font-extrabold text-base sm:text-lg border-2 flex items-center justify-center gap-2 cursor-pointer ${
                currentStepIndex === 0
                  ? 'opacity-40 cursor-not-allowed border-stone-200 dark:border-slate-800'
                  : 'bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 border-stone-300 dark:border-slate-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{tr.previousStep}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGuide(null)}
              className="text-stone-500 hover:text-stone-800 dark:hover:text-slate-200 font-bold text-base text-center cursor-pointer order-last sm:order-none"
            >
              {tr.finishGuide}
            </button>

            <button
              id="btn-next-step"
              type="button"
              onClick={handleNextStep}
              className="btn-tactile px-7 py-4 rounded-2xl font-extrabold text-lg sm:text-xl bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-500 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {currentStepIndex === activeGuide.steps.length - 1
                  ? tr.finishGuide
                  : tr.nextStep}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      ) : (
        /* Guides Catalog View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {stepGuides.map((guide) => (
            <div
              key={guide.id}
              className={`p-6 sm:p-7 rounded-3xl border-2 flex flex-col justify-between gap-5 transition-all shadow-xs ${
                isHighContrast
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-stone-200 hover:border-purple-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {getGuideIcon(guide.iconName)}
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                    {guide.steps.length} {language === 'hi' ? 'आसान चरण' : 'Steps'}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                  {language === 'hi' ? guide.titleHi : guide.titleEn}
                </h3>

                <p className="text-base text-stone-600 dark:text-slate-300">
                  {language === 'hi'
                    ? guide.steps[0].descriptionHi
                    : guide.steps[0].descriptionEn}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleStartGuide(guide)}
                className="btn-tactile w-full py-3.5 px-5 rounded-2xl font-extrabold text-base sm:text-lg bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-500 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{tr.startGuide}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
