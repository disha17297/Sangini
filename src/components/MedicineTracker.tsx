import React, { useState } from 'react';
import { Language, ThemeContrast, Medicine, MedicineAnalysisResult } from '../types';
import { t } from '../translations';
import {
  Pill,
  CheckCircle2,
  Volume2,
  Plus,
  Clock,
  Sparkles,
  Info,
  Heart,
  AlertCircle,
  X
} from 'lucide-react';
import { speakText } from '../utils/speech';

interface MedicineTrackerProps {
  language: Language;
  contrast: ThemeContrast;
  medicines: Medicine[];
  onToggleMedicine: (id: string) => void;
  onAddMedicine: (med: Omit<Medicine, 'id' | 'takenToday'>) => void;
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
}

export const MedicineTracker: React.FC<MedicineTrackerProps> = ({
  language,
  contrast,
  medicines,
  onToggleMedicine,
  onAddMedicine,
  isSpeaking,
  setIsSpeaking,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';

  // State for explainer
  const [queryMedName, setQueryMedName] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [medInfoResult, setMedInfoResult] = useState<MedicineAnalysisResult | null>(null);

  // State for Add Medicine Modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newDosage, setNewDosage] = useState<string>('1 tablet');
  const [newSlot, setNewSlot] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [newNotes, setNewNotes] = useState<string>('');

  const takenCount = medicines.filter((m) => m.takenToday).length;
  const allTaken = medicines.length > 0 && takenCount === medicines.length;

  const handleExplainMed = async (nameToSearch?: string) => {
    const med = nameToSearch || queryMedName;
    if (!med.trim()) return;

    setIsExplaining(true);
    setMedInfoResult(null);

    try {
      const response = await fetch('/api/gemini/med-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineName: med,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.name || !data.purpose) {
        throw new Error('Invalid medicine explanation payload');
      }

      setMedInfoResult(data);

      const speech = `${data.name}. ${data.purpose}. ${data.whenToTake || ''}`;
      speakText(
        speech,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    } catch (err) {
      console.warn('Medicine info API fallback activated:', err);
      const isHi = language === 'hi';
      const fallbackData: MedicineAnalysisResult = {
        name: med,
        purpose: isHi
          ? 'यह दवा आमतौर पर आपके स्वास्थ्य को संतुलित रखने के लिए डॉक्टर की सलाह पर दी जाती है।'
          : 'This medication is commonly prescribed to maintain healthy balance as advised by your doctor.',
        whenToTake: isHi
          ? 'आमतौर पर भोजन के बाद एक गिलास ताजे पानी के साथ लें। डॉक्टर की पर्ची के अनुसार समय तय करें।'
          : 'Usually taken with or after meals with a full glass of water. Follow your doctor\'s prescription.',
        importantCautions: isHi
          ? [
              'खाली पेट न लें जब तक डॉक्टर ने विशेष रूप से न कहा हो',
              'दवा का समय न भूलें, नियमित समय पर लें',
              'खुराक खुद से न बदलें',
            ]
          : [
              'Do not take on an empty stomach unless advised by physician',
              'Take at the same scheduled time each day for best results',
              'Never alter dosage without doctor consultation',
            ],
        friendlyTip: isHi
          ? 'संगिनी में समय पर टिक लगाएं ताकि कोई खुराक न छूटे।'
          : 'Mark as taken in Sangini daily to easily maintain your routine.',
      };

      setMedInfoResult(fallbackData);
      speakText(
        `${fallbackData.name}. ${fallbackData.purpose}`,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    } finally {
      setIsExplaining(false);
    }
  };

  const handleReadMedResult = () => {
    if (!medInfoResult) return;
    const cautionsList = Array.isArray(medInfoResult.importantCautions)
      ? medInfoResult.importantCautions
      : [];
    const speech = `${medInfoResult.name || ''}. ${medInfoResult.purpose || ''}. ${
      medInfoResult.whenToTake || ''
    }. ${cautionsList.length > 0 ? cautionsList.join('. ') + '. ' : ''}${
      medInfoResult.friendlyTip || ''
    }`;
    speakText(
      speech,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const handleSaveNewMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const slotLabels: Record<string, string> = {
      morning: '8:30 AM',
      afternoon: '1:30 PM',
      evening: '7:00 PM',
      night: '9:30 PM',
    };

    onAddMedicine({
      name: newName.trim(),
      hindiName: newName.trim(),
      dosage: newDosage.trim() || '1 tablet',
      timeOfDay: newSlot,
      timeLabel: slotLabels[newSlot] || '8:00 AM',
      withFood: true,
      notes: newNotes.trim() || 'Take as advised by doctor',
    });

    setIsAddOpen(false);
    setNewName('');
    setNewDosage('1 tablet');
    setNewNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header Overview Card */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 transition-all ${
          isHighContrast
            ? 'bg-slate-900 border-emerald-400 text-slate-100'
            : 'bg-emerald-50/70 border-emerald-200 text-stone-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-sm shrink-0">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
                {tr.medsTitle}
              </h1>
              <p className="text-base sm:text-lg text-stone-700 dark:text-slate-300 mt-2 leading-relaxed">
                {tr.medsSubtitle}
              </p>
            </div>
          </div>

          <button
            id="btn-open-add-med"
            type="button"
            onClick={() => setIsAddOpen(true)}
            className={`btn-tactile inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-base sm:text-lg border-2 shadow-sm cursor-pointer shrink-0 ${
              isHighContrast
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 hover:bg-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>{language === 'hi' ? 'नई दवाई जोड़ें' : 'Add Medicine'}</span>
          </button>
        </div>

        {/* Status bar */}
        <div className="mt-6 pt-6 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-base sm:text-lg font-bold">
            {language === 'hi'
              ? `आज की प्रगति: ${takenCount} में से ${medicines.length} दवाइयां पूरी हुईं`
              : `Today's Progress: ${takenCount} of ${medicines.length} completed`}
          </div>

          {allTaken && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-extrabold text-sm border border-emerald-300">
              <Heart className="w-4 h-4 text-emerald-700 fill-current" />
              <span>{language === 'hi' ? 'शाबाश! सब दवाइयां पूरी हैं' : 'All Taken for Today!'}</span>
            </div>
          )}
        </div>
      </section>

      {/* Medicines Schedule list */}
      <section className="space-y-4">
        {medicines.map((med) => {
          return (
            <div
              key={med.id}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                med.takenToday
                  ? isHighContrast
                    ? 'bg-slate-900/60 border-emerald-600/50 opacity-80'
                    : 'bg-emerald-50/50 border-emerald-200 opacity-90'
                  : isHighContrast
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-stone-200 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                    med.takenToday
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-300 dark:border-slate-700'
                  }`}
                >
                  <Pill className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                      {language === 'hi' ? med.hindiName : med.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-sm font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{med.timeLabel}</span>
                    </span>
                  </div>

                  <p className="text-base sm:text-lg text-stone-700 dark:text-slate-300">
                    {med.dosage} &bull; {med.notes}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleExplainMed(med.name)}
                    className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Info className="w-4 h-4" />
                    <span>{language === 'hi' ? 'यह दवाई किस काम आती है?' : 'What is this medicine for?'}</span>
                  </button>
                </div>
              </div>

              {/* Mark Taken Button */}
              <button
                type="button"
                onClick={() => onToggleMedicine(med.id)}
                className={`btn-tactile px-6 py-4 rounded-2xl font-extrabold text-lg sm:text-xl border-2 flex items-center justify-center gap-3 cursor-pointer shrink-0 ${
                  med.takenToday
                    ? 'bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-stone-300 dark:border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-sm'
                }`}
              >
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span>{med.takenToday ? tr.undoTaken : tr.markAsTaken}</span>
              </button>
            </div>
          );
        })}
      </section>

      {/* GenAI Medicine Explainer Card */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 shadow-xs ${
          isHighContrast
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-stone-200'
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                {tr.askAboutMed}
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-slate-300">
                {language === 'hi'
                  ? 'किसी भी गोली या सिरप का नाम लिखें, संगिनी आसान भाषा में समझाएगी'
                  : 'Type any medicine name to receive a plain, reassuring explanation'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={queryMedName}
              onChange={(e) => setQueryMedName(e.target.value)}
              placeholder={tr.enterMedPlaceholder}
              className={`flex-1 p-4 text-lg sm:text-xl rounded-2xl border-2 focus:ring-4 focus:ring-amber-400 focus:outline-none ${
                isHighContrast
                  ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400'
                  : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
              }`}
            />
            <button
              id="btn-explain-med"
              type="button"
              disabled={isExplaining || !queryMedName.trim()}
              onClick={() => handleExplainMed()}
              className={`btn-tactile px-6 py-4 rounded-2xl font-extrabold text-lg sm:text-xl border-2 shadow-sm shrink-0 cursor-pointer ${
                isExplaining || !queryMedName.trim()
                  ? 'bg-stone-300 dark:bg-slate-800 text-stone-500 border-transparent cursor-not-allowed'
                  : isHighContrast
                  ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                  : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
              }`}
            >
              {isExplaining ? tr.explainingMed : tr.explainMedBtn}
            </button>
          </div>

          {/* Quick pill chips to test */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-sm font-bold text-stone-500 dark:text-slate-400">
              {language === 'hi' ? 'उदाहरण देखें:' : 'Try these:'}
            </span>
            {['Amlodipine (BP)', 'Metformin (Sugar)', 'Shelcal (Calcium)', 'Paracetamol (Fever)'].map(
              (name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    const clean = name.split(' ')[0];
                    setQueryMedName(clean);
                    handleExplainMed(clean);
                  }}
                  className="px-3 py-1 rounded-full text-sm font-bold bg-stone-100 dark:bg-slate-800 hover:bg-amber-100 text-stone-800 dark:text-slate-200 border border-stone-300 dark:border-slate-700 cursor-pointer"
                >
                  {name}
                </button>
              )
            )}
          </div>
        </div>

        {/* Result Card */}
        {medInfoResult && (
          <div className="mt-6 p-6 rounded-2xl bg-amber-50/70 dark:bg-slate-800/80 border-2 border-amber-300 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-700">
              <h3 className="text-xl sm:text-2xl font-extrabold text-amber-950 dark:text-amber-200">
                {medInfoResult.name}
              </h3>
              <button
                type="button"
                onClick={handleReadMedResult}
                className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold bg-white dark:bg-slate-700 border border-stone-300 dark:border-slate-600 cursor-pointer"
              >
                <Volume2 className="w-5 h-5 text-amber-600" />
                <span>{tr.readAloud}</span>
              </button>
            </div>

            <div className="space-y-3 text-base sm:text-lg">
              <div>
                <span className="font-extrabold text-stone-900 dark:text-slate-100">
                  {language === 'hi' ? 'यह किस काम आती है?' : 'What does this medicine do?'}:
                </span>{' '}
                <span className="text-stone-800 dark:text-slate-200">
                  {medInfoResult.purpose}
                </span>
              </div>

              <div>
                <span className="font-extrabold text-stone-900 dark:text-slate-100">
                  {language === 'hi' ? 'कब और कैसे लें?' : 'How and when to take?'}:
                </span>{' '}
                <span className="text-stone-800 dark:text-slate-200">
                  {medInfoResult.whenToTake}
                </span>
              </div>

              {medInfoResult.importantCautions && (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 space-y-2">
                  <span className="font-extrabold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span>{language === 'hi' ? 'जरूरी सावधानियां' : 'Important Reminders'}:</span>
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-stone-700 dark:text-slate-300">
                    {medInfoResult.importantCautions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm font-semibold text-stone-500 dark:text-slate-400 italic pt-2">
                {tr.doctorNote}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Add Medicine Modal */}
      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 shadow-xl space-y-6 ${
              isHighContrast
                ? 'bg-slate-900 border-amber-400 text-slate-100'
                : 'bg-white border-stone-300 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
              <h2 className="text-2xl font-extrabold">
                {language === 'hi' ? 'नई दवाई की जानकारी जोड़ें' : 'Add New Medicine'}
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMed} className="space-y-4">
              <div>
                <label className="block text-base font-extrabold mb-1">
                  {language === 'hi' ? 'दवाई का नाम' : 'Medicine Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Pantocid 40mg"
                  className="w-full p-3.5 text-lg rounded-xl border-2 border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-base font-extrabold mb-1">
                  {language === 'hi' ? 'मात्रा (खुराक)' : 'Dosage'}
                </label>
                <input
                  type="text"
                  value={newDosage}
                  onChange={(e) => setNewDosage(e.target.value)}
                  placeholder="e.g. 1 tablet after food"
                  className="w-full p-3.5 text-lg rounded-xl border-2 border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-base font-extrabold mb-1">
                  {language === 'hi' ? 'दिन का समय' : 'Time of Day'}
                </label>
                <select
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value as any)}
                  className="w-full p-3.5 text-lg rounded-xl border-2 border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-400 font-bold"
                >
                  <option value="morning">{tr.morningSlot}</option>
                  <option value="afternoon">{tr.afternoonSlot}</option>
                  <option value="evening">{tr.eveningSlot}</option>
                  <option value="night">{tr.nightSlot}</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-extrabold mb-1">
                  {language === 'hi' ? 'कोई विशेष सलाह' : 'Special Notes (e.g. Take with warm milk)'}
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. With water"
                  className="w-full p-3.5 text-lg rounded-xl border-2 border-stone-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-3 rounded-xl border-2 border-stone-300 dark:border-slate-700 font-bold text-base cursor-pointer"
                >
                  {tr.cancel}
                </button>
                <button
                  type="submit"
                  className="btn-tactile px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base border-2 border-emerald-500 shadow-md cursor-pointer"
                >
                  {language === 'hi' ? 'सुरक्षित सहेजें' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
