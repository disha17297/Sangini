import React, { useState } from 'react';
import { Language, ThemeContrast, DocumentAnalysisResult } from '../types';
import { t } from '../translations';
import {
  FileText,
  Upload,
  Volume2,
  CheckCircle,
  Calendar,
  AlertCircle,
  Sparkles,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { speakText } from '../utils/speech';

interface DocumentExplainerProps {
  language: Language;
  contrast: ThemeContrast;
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
}

export const DocumentExplainer: React.FC<DocumentExplainerProps> = ({
  language,
  contrast,
  isSpeaking,
  setIsSpeaking,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';

  const [inputContent, setInputContent] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);

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

  const handleSimplifyDoc = async (textToProcess?: string) => {
    const content = textToProcess || inputContent;
    if (!content.trim() && !imageBase64) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/gemini/simplify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          imageBase64,
          mimeType,
          language,
        }),
      });
      const data = await response.json();
      setResult(data);

      const speech = `${data.whatIsThis}. ${data.easyExplanation}. ${data.summary}`;
      speakText(
        speech,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    } catch (err) {
      console.error('Failed to simplify document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadResult = () => {
    if (!result) return;
    const speech = `${result.whatIsThis}. ${result.summary}. ${language === 'hi' ? 'देय राशि' : 'Amount to pay'}: ${
      result.amountToPay
    }. ${language === 'hi' ? 'अंतिम तारीख' : 'Due date'}: ${result.dueDate}. ${result.actionSteps.join(
      '. '
    )}. ${result.easyExplanation}`;
    speakText(
      speech,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const loadSample = (sampleText: string) => {
    setInputContent(sampleText);
    setImageBase64(null);
    handleSimplifyDoc(sampleText);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header Overview Card */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 ${
          isHighContrast
            ? 'bg-slate-900 border-blue-400 text-slate-100'
            : 'bg-blue-50/70 border-blue-200 text-stone-900'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-sm shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
              {tr.billsTitle}
            </h1>
            <p className="text-base sm:text-lg text-stone-700 dark:text-slate-300 mt-2 leading-relaxed">
              {tr.billsSubtitle}
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
              htmlFor="doc-input-textarea"
              className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-slate-100"
            >
              {language === 'hi'
                ? 'बिल या कागज़ का पाठ यहाँ लिखें:'
                : 'Enter or Paste Document Text:'}
            </label>

            {inputContent && (
              <button
                type="button"
                onClick={() => {
                  setInputContent('');
                  setImageBase64(null);
                  setResult(null);
                }}
                className="text-sm font-bold text-stone-500 hover:text-stone-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'hi' ? 'साफ करें' : 'Clear'}</span>
              </button>
            )}
          </div>

          <textarea
            id="doc-input-textarea"
            rows={4}
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder={tr.pasteDocPlaceholder}
            className={`w-full p-4 text-lg sm:text-xl rounded-2xl border-2 transition-colors resize-none leading-relaxed focus:ring-4 focus:ring-blue-400 focus:outline-none ${
              isHighContrast
                ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400'
                : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
            }`}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold border-2 cursor-pointer bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-stone-300 dark:border-slate-600 hover:bg-stone-200">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>
                {imageBase64
                  ? language === 'hi'
                    ? 'कागज़ की फोटो बदलें'
                    : 'Change Photo'
                  : tr.orUploadBillPhoto}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {imageBase64 && (
            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={imageBase64}
                  alt="Uploaded document preview"
                  className="w-16 h-16 object-cover rounded-xl border border-stone-300"
                />
                <span className="text-sm font-bold text-stone-700 dark:text-slate-300">
                  {language === 'hi'
                    ? 'कागज़ की तस्वीर जुड़ गई है'
                    : 'Document photo attached for simplification'}
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

          <button
            id="btn-simplify-doc"
            type="button"
            disabled={isLoading || (!inputContent.trim() && !imageBase64)}
            onClick={() => handleSimplifyDoc()}
            className={`btn-tactile w-full py-4 px-6 rounded-2xl font-extrabold text-xl sm:text-2xl shadow-md border-2 flex items-center justify-center gap-3 cursor-pointer ${
              isLoading || (!inputContent.trim() && !imageBase64)
                ? 'bg-stone-300 dark:bg-slate-800 text-stone-500 border-transparent cursor-not-allowed'
                : isHighContrast
                ? 'bg-blue-400 text-slate-950 border-blue-300 hover:bg-blue-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
            }`}
          >
            <FileText className="w-7 h-7 shrink-0" />
            <span>{isLoading ? tr.simplifying : tr.simplifyBillBtn}</span>
          </button>
        </div>

        {/* Sample Templates */}
        <div className="mt-8 pt-6 border-t border-stone-200 dark:border-slate-700">
          <p className="text-base sm:text-lg font-bold text-stone-700 dark:text-slate-300 mb-3">
            {language === 'hi' ? 'नमूना कागज़ चुनकर देखें:' : 'Try these sample documents:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => loadSample(tr.sampleBill1Text)}
              className="btn-tactile p-4 rounded-2xl border-2 text-left bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer"
            >
              <div className="flex items-center gap-2 font-extrabold text-base text-stone-900 dark:text-slate-100">
                <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                <span>{tr.sampleBill1}</span>
              </div>
              <p className="text-sm text-stone-500 dark:text-slate-400 mt-1 line-clamp-2">
                {tr.sampleBill1Text}
              </p>
            </button>

            <button
              type="button"
              onClick={() => loadSample(tr.samplePensionSlipText)}
              className="btn-tactile p-4 rounded-2xl border-2 text-left bg-stone-50 dark:bg-slate-800 border-stone-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer"
            >
              <div className="flex items-center gap-2 font-extrabold text-base text-stone-900 dark:text-slate-100">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                <span>{tr.samplePensionSlip}</span>
              </div>
              <p className="text-sm text-stone-500 dark:text-slate-400 mt-1 line-clamp-2">
                {tr.samplePensionSlipText}
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Simplified Document Result */}
      {result && (
        <section
          id="simplified-doc-result"
          className={`rounded-3xl p-6 sm:p-8 border-3 shadow-lg space-y-6 transition-all ${
            isHighContrast
              ? 'bg-slate-900 border-blue-400 text-slate-100'
              : 'bg-blue-50/60 border-blue-300 text-stone-900'
          }`}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-700">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-200 dark:bg-blue-950 text-blue-950 dark:text-blue-200 border border-blue-300">
                {language === 'hi' ? 'सरल सारांश' : 'Document Simplified'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                {result.whatIsThis}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleReadResult}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-base bg-white dark:bg-slate-800 border-2 border-stone-300 dark:border-slate-600 shadow-xs cursor-pointer hover:bg-stone-100 text-stone-900 dark:text-slate-100"
            >
              <Volume2 className="w-5 h-5 text-blue-600" />
              <span>{tr.readAloud}</span>
            </button>
          </div>

          {/* Amount & Due Date Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 space-y-1">
              <span className="text-sm font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wide">
                {language === 'hi' ? 'देय राशि (पैसे)' : 'Amount to Pay'}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-blue-700 dark:text-blue-400 font-serif">
                {result.amountToPay}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 space-y-1">
              <span className="text-sm font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>{language === 'hi' ? 'अंतिम तिथि' : 'Due Date / Deadline'}</span>
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-slate-100">
                {result.dueDate}
              </div>
            </div>
          </div>

          {/* Easy Explanation in Plain English/Hindi */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wide">
              {language === 'hi' ? 'आसान भाषा में अर्थ' : 'What this means in plain words'}:
            </h3>
            <p className="text-lg sm:text-xl font-medium text-stone-900 dark:text-slate-100 leading-relaxed">
              {result.easyExplanation}
            </p>
          </div>

          {/* Action Steps */}
          {result.actionSteps && result.actionSteps.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 space-y-3">
              <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>{language === 'hi' ? 'अब आपको क्या करना है:' : 'What you should do next:'}</span>
              </h3>
              <ul className="space-y-2.5">
                {result.actionSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-base sm:text-lg font-medium text-stone-800 dark:text-slate-200"
                  >
                    <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold flex items-center justify-center text-sm shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
