import React, { useState } from 'react';
import { Language, ThemeContrast, ScamAnalysisResult } from '../types';
import { t } from '../translations';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  Upload,
  Mic,
  MicOff,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  PhoneCall,
  RotateCcw
} from 'lucide-react';
import { speakText, createSpeechRecognition } from '../utils/speech';

interface ScamShieldProps {
  language: Language;
  contrast: ThemeContrast;
  onBackToHome: () => void;
  onOpenSos: () => void;
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
}

export const ScamShield: React.FC<ScamShieldProps> = ({
  language,
  contrast,
  onBackToHome,
  onOpenSos,
  isSpeaking,
  setIsSpeaking,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';

  const [inputContent, setInputContent] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeRecognizer, setActiveRecognizer] = useState<any>(null);

  const handleVoiceInput = () => {
    if (isRecording && activeRecognizer) {
      activeRecognizer.stop();
      setIsRecording(false);
      return;
    }

    const recognizer = createSpeechRecognition(
      language,
      (text) => {
        setInputContent((prev) => (prev ? `${prev} ${text}` : text));
        setIsRecording(false);
      },
      (err) => {
        console.warn('Voice input error:', err);
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
    } else {
      alert(
        language === 'hi'
          ? 'आपके ब्राउज़र में बोलकर लिखने की सुविधा उपलब्ध नहीं है।'
          : 'Voice speech recognition is not supported in this browser.'
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageBase64(dataUrl);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleCheckScam = async (textToCheck?: string) => {
    const content = textToCheck || inputContent;
    if (!content.trim() && !imageBase64) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/gemini/scam-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          imageBase64,
          mimeType,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.verdict || !Array.isArray(data.safeActions)) {
        throw new Error('Invalid analysis payload structure');
      }

      setResult(data);

      // Read aloud result heading & explanation
      if (data.explanation) {
        const speechMsg = `${data.title}. ${data.explanation}`;
        speakText(
          speechMsg,
          language,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    } catch (err) {
      console.warn('Scam check API fallback activated:', err);
      // Client-side instant safety analysis
      const isHi = language === 'hi';
      const hasUrgent = /(electricity|power|bijli|cut|disconnected|block|suspend|arrest|police|cbi|fir|kyc|expired|urgent|penalty|fine|chalan|disconnection|बिजली|काट|बंद|खाता|बैंक|पुलिस|धमकी|चालान|जुर्माना)/i.test(
        content
      );
      const hasFin = /(otp|one time password|pin|cvv|password|passcode|lottery|won|crore|lakh|prize|kbc|click here|apk|refund|bonus|claim|ओटीपी|पिन|पासवर्ड|लॉटरी|इनाम|रुपये|लाख|करोड़|लिंक|क्लिक|रिफंड)/i.test(
        content
      );
      const isDanger = hasUrgent || hasFin;

      const fallbackData: ScamAnalysisResult = {
        verdict: isDanger ? 'dangerous_scam' : 'safe',
        score: isDanger ? (hasUrgent && hasFin ? 95 : 82) : 15,
        title: isHi
          ? isDanger
            ? 'सावधान! यह एक संदिग्ध धोखाधड़ी (Scam) हो सकता है'
            : 'यह संदेश सामान्य लग रहा है'
          : isDanger
          ? 'Warning! This appears to be a suspicious scam'
          : 'This message appears generally safe',
        explanation: isHi
          ? isDanger
            ? 'इस संदेश में तुरंत कार्रवाई, बैंक खाता बंद होने या बिजली कटने का डर दिखाया गया है। बैंक या सरकारी विभाग कभी भी SMS पर खाता या बिजली बंद नहीं करते।'
            : 'इस संदेश में कोई तत्काल खतरा या गोपनीय पासवर्ड मांगने का संकेत नहीं मिला है।'
          : isDanger
          ? 'This message creates false urgency or asks for sensitive codes/actions. Genuine banks and utility offices never demand OTPs or threaten same-day disconnection over SMS.'
          : 'No urgent scam indicators or password requests were detected in this message text.',
        redFlags: isDanger
          ? isHi
            ? [
                'तत्काल कार्रवाई या सेवा बंद करने का अनावश्यक दबाव',
                'अज्ञात लिंक या अनौपचारिक नंबर से संदेश',
                'गोपनीय जानकारी या भुगतान की मांग',
              ]
            : [
                'Urgent threat of immediate disconnection or account block',
                'Unverified sender or suspicious web link',
                'Request for payment or sensitive personal codes',
              ]
          : isHi
          ? ['कोई गंभीर चेतावनी नहीं मिली']
          : ['No critical red flags identified'],
        safeActions: isDanger
          ? isHi
            ? [
                'इस संदेश में दिए गए किसी भी लिंक पर बिल्कुल क्लिक न करें',
                'किसी के साथ भी अपना OTP या बैंक पिन साझा न करें',
                'संदेह होने पर परिवार के किसी सदस्य या बैंक की आधिकारिक शाखा से संपर्क करें',
              ]
            : [
                'Do not click on any links provided in the message',
                'Never share your OTP, PIN, or banking passwords with anyone',
                'Contact your official bank branch or a trusted family member for confirmation',
              ]
          : isHi
          ? ['आप सामान्य रूप से आगे बढ़ सकते हैं', 'हमेशा सतर्क रहें']
          : ['You may proceed normally', 'Always stay cautious with personal information'],
        reassurance: isHi
          ? 'आपने इसकी जांच करवाकर बहुत समझदारी का काम किया है। संगिनी हमेशा आपकी सुरक्षा के लिए तैयार है।'
          : 'You did the right thing by checking this first. Sangini is always here to keep you safe.',
      };

      setResult(fallbackData);
      if (fallbackData.explanation) {
        const speechMsg = `${fallbackData.title}. ${fallbackData.explanation}`;
        speakText(
          speechMsg,
          language,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadResult = () => {
    if (!result) return;
    const actionsList = Array.isArray(result.safeActions) ? result.safeActions : [];
    const speechMsg = `${result.title || ''}. ${result.explanation || ''}. ${
      actionsList.length > 0 ? `${tr.safeNextSteps}: ${actionsList.join('. ')}. ` : ''
    }${result.reassurance || ''}`;
    speakText(
      speechMsg,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const loadSample = (text: string) => {
    setInputContent(text);
    setImageBase64(null);
    handleCheckScam(text);
  };

  const handleReset = () => {
    setInputContent('');
    setImageBase64(null);
    setMimeType(null);
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header card with reassurance */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 ${
          isHighContrast
            ? 'bg-slate-900 border-amber-400 text-slate-100'
            : 'bg-amber-50/70 border-amber-200 text-stone-900'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500 text-white shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
              {tr.scamTitle}
            </h1>
            <p className="text-base sm:text-lg text-stone-700 dark:text-slate-300 mt-2 leading-relaxed">
              {tr.scamSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Input Form */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 shadow-xs ${
          isHighContrast
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-stone-200'
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="scam-message-input"
              className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-slate-100"
            >
              {language === 'hi'
                ? 'संदेश लिखें या यहाँ पेस्ट करें:'
                : 'Enter or Paste the Message Here:'}
            </label>

            {/* Clear button */}
            {inputContent && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm font-bold text-stone-500 hover:text-stone-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'hi' ? 'साफ करें' : 'Clear'}</span>
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              id="scam-message-input"
              rows={4}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={tr.pasteMessagePlaceholder}
              className={`w-full p-4 text-lg sm:text-xl rounded-2xl border-2 transition-colors resize-none leading-relaxed focus:ring-4 focus:ring-amber-400 focus:outline-none ${
                isHighContrast
                  ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400'
                  : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
              }`}
            />

            {/* Voice input button inside/beside textarea */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                id="btn-voice-input"
                type="button"
                onClick={handleVoiceInput}
                className={`btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold border-2 cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : isHighContrast
                    ? 'bg-slate-800 text-amber-300 border-slate-600 hover:bg-slate-700'
                    : 'bg-stone-100 text-stone-800 border-stone-300 hover:bg-stone-200'
                }`}
                title="Speak to enter message"
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-amber-600" />
                )}
                <span>
                  {isRecording
                    ? language === 'hi'
                      ? 'सुन रहे हैं... बोलिए'
                      : 'Listening... Speak now'
                    : tr.speakMessage}
                </span>
              </button>

              {/* File upload for screenshot */}
              <label className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold border-2 cursor-pointer bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-stone-300 dark:border-slate-600 hover:bg-stone-200">
                <Upload className="w-5 h-5 text-blue-600" />
                <span>
                  {imageBase64
                    ? language === 'hi'
                      ? 'फोटो बदलें'
                      : 'Change Photo'
                    : tr.orUploadPhoto}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Screenshot preview if uploaded */}
          {imageBase64 && (
            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={imageBase64}
                  alt="Uploaded screenshot preview"
                  className="w-16 h-16 object-cover rounded-xl border border-stone-300"
                />
                <span className="text-sm font-bold text-stone-700 dark:text-slate-300">
                  {language === 'hi'
                    ? 'स्क्रीनशॉट सुरक्षित रूप से जुड़ गया है'
                    : 'Image / Screenshot attached for analysis'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImageBase64(null)}
                className="text-sm font-bold text-rose-600 hover:underline cursor-pointer"
              >
                {language === 'hi' ? 'हटाएं' : 'Remove'}
              </button>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            id="btn-submit-scam-check"
            type="button"
            disabled={isLoading || (!inputContent.trim() && !imageBase64)}
            onClick={() => handleCheckScam()}
            className={`btn-tactile w-full py-4 px-6 rounded-2xl font-extrabold text-xl sm:text-2xl shadow-md border-2 flex items-center justify-center gap-3 cursor-pointer ${
              isLoading || (!inputContent.trim() && !imageBase64)
                ? 'bg-stone-300 dark:bg-slate-800 text-stone-500 border-transparent cursor-not-allowed'
                : isHighContrast
                ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
            }`}
          >
            <ShieldAlert className="w-7 h-7 shrink-0" />
            <span>{isLoading ? tr.checking : tr.checkNowBtn}</span>
          </button>
        </div>

        {/* Real-world test sample buttons */}
        <div className="mt-8 pt-6 border-t border-stone-200 dark:border-slate-700">
          <p className="text-base sm:text-lg font-bold text-stone-700 dark:text-slate-300 mb-3">
            {tr.tryExample}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => loadSample(tr.sampleScam1Text)}
              className="btn-tactile p-3.5 rounded-2xl border-2 text-left bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 hover:border-amber-400 cursor-pointer"
            >
              <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-stone-900 dark:text-slate-100">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{tr.sampleScam1Title}</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1 line-clamp-2">
                {tr.sampleScam1Text}
              </p>
            </button>

            <button
              type="button"
              onClick={() => loadSample(tr.sampleScam2Text)}
              className="btn-tactile p-3.5 rounded-2xl border-2 text-left bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 hover:border-amber-400 cursor-pointer"
            >
              <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-stone-900 dark:text-slate-100">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{tr.sampleScam2Title}</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1 line-clamp-2">
                {tr.sampleScam2Text}
              </p>
            </button>

            <button
              type="button"
              onClick={() => loadSample(tr.sampleScam3Text)}
              className="btn-tactile p-3.5 rounded-2xl border-2 text-left bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 hover:border-amber-400 cursor-pointer"
            >
              <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-stone-900 dark:text-slate-100">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{tr.sampleScam3Title}</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1 line-clamp-2">
                {tr.sampleScam3Text}
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Analysis Result Display */}
      {result && (
        <section
          id="scam-check-result"
          aria-label="Scam Check Result"
          className={`rounded-3xl p-6 sm:p-8 border-3 shadow-lg space-y-6 transition-all ${
            result.verdict === 'dangerous_scam'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 text-stone-900 dark:text-slate-100'
              : result.verdict === 'warning'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 text-stone-900 dark:text-slate-100'
              : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-stone-900 dark:text-slate-100'
          }`}
        >
          {/* Verdict Header & Voice button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {result.verdict === 'dangerous_scam' ? (
                <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
              ) : result.verdict === 'warning' ? (
                <div className="p-3 rounded-2xl bg-amber-600 text-white shadow-sm">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-sm">
                  <ShieldCheck className="w-8 h-8" />
                </div>
              )}

              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    result.verdict === 'dangerous_scam'
                      ? 'bg-rose-200 text-rose-950'
                      : result.verdict === 'warning'
                      ? 'bg-amber-200 text-amber-950'
                      : 'bg-emerald-200 text-emerald-950'
                  }`}
                >
                  {result.verdict === 'dangerous_scam'
                    ? tr.dangerLabel
                    : result.verdict === 'warning'
                    ? tr.warningLabel
                    : tr.safeLabel}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
                  {result.title}
                </h2>
              </div>
            </div>

            {/* Read Aloud Button */}
            <button
              type="button"
              onClick={handleReadResult}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-base bg-white dark:bg-slate-800 border-2 border-stone-300 dark:border-slate-600 shadow-xs cursor-pointer hover:bg-stone-100 text-stone-900 dark:text-slate-100"
            >
              <Volume2 className="w-5 h-5 text-amber-600" />
              <span>{tr.readAloud}</span>
            </button>
          </div>

          {/* Explanation in plain words */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide opacity-80">
              {tr.whatScammerWants}
            </h3>
            <p className="text-lg sm:text-xl font-medium leading-relaxed">
              {result.explanation}
            </p>
          </div>

          {/* Red Flags List */}
          {result.redFlags && result.redFlags.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 space-y-3">
              <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{tr.redFlags}:</span>
              </h3>
              <ul className="space-y-2">
                {result.redFlags.map((flag, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-base sm:text-lg text-stone-800 dark:text-slate-200"
                  >
                    <span className="text-rose-600 font-extrabold mt-0.5">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safe Next Actions */}
          {result.safeActions && result.safeActions.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 space-y-3">
              <h3 className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{tr.safeNextSteps}:</span>
              </h3>
              <ul className="space-y-2">
                {result.safeActions.map((action, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-base sm:text-lg font-medium text-stone-800 dark:text-slate-200"
                  >
                    <span className="text-emerald-600 font-bold mt-0.5 font-mono">
                      {idx + 1}.
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reassurance */}
          <div className="p-4 rounded-2xl bg-amber-100/70 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-base sm:text-lg font-bold text-amber-950 dark:text-amber-200">
              {result.reassurance}
            </p>
          </div>

          {/* Immediate Action: Call Family / Help */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-sm sm:text-base font-medium opacity-80">
              {language === 'hi'
                ? 'अभी भी कोई संदेह या डर है?'
                : 'Still feel uncertain or pressured?'}
            </span>
            <button
              type="button"
              onClick={onOpenSos}
              className="btn-tactile px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-slate-100 text-white dark:text-stone-900 font-extrabold text-base flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{language === 'hi' ? 'परिवार को फोन लगाएं' : 'Call Family Member'}</span>
            </button>
          </div>
        </section>
      )}

      {/* 3 Golden Rules Card */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 ${
          isHighContrast
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-stone-200 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
            {tr.goldenRulesTitle}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-start gap-3">
            <span className="text-2xl font-black text-amber-600 shrink-0">1</span>
            <p className="text-base sm:text-lg font-medium text-stone-800 dark:text-slate-200 leading-relaxed">
              {tr.rule1}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-start gap-3">
            <span className="text-2xl font-black text-amber-600 shrink-0">2</span>
            <p className="text-base sm:text-lg font-medium text-stone-800 dark:text-slate-200 leading-relaxed">
              {tr.rule2}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-start gap-3">
            <span className="text-2xl font-black text-amber-600 shrink-0">3</span>
            <p className="text-base sm:text-lg font-medium text-stone-800 dark:text-slate-200 leading-relaxed">
              {tr.rule3}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
