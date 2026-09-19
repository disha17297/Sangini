import React, { useState } from 'react';
import { Language, ThemeContrast, FamilyContact } from '../types';
import { t } from '../translations';
import { initialFamilyContacts } from '../data';
import {
  Users,
  Phone,
  MessageCircle,
  Heart,
  Send,
  Check,
  AlertTriangle,
  PhoneCall,
  X
} from 'lucide-react';

interface FamilyConnectProps {
  language: Language;
  contrast: ThemeContrast;
  onOpenSos: () => void;
}

export const FamilyConnect: React.FC<FamilyConnectProps> = ({
  language,
  contrast,
  onOpenSos,
}) => {
  const tr = t[language];
  const isHighContrast = contrast === 'high';

  const [contacts] = useState<FamilyContact[]>(initialFamilyContacts);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const quickMessages = [tr.msg1, tr.msg2, tr.msg3];

  const handleSendQuickMessage = (msg: string, idx: number) => {
    navigator.clipboard.writeText(msg);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 3000);

    // Open WhatsApp Web/App with prefilled text
    const primaryContact = contacts[0];
    const cleanNumber = primaryContact.phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header card */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 ${
          isHighContrast
            ? 'bg-slate-900 border-rose-400 text-slate-100'
            : 'bg-rose-50/70 border-rose-200 text-stone-900'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-600 text-white shadow-sm shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
              {tr.familyTitle}
            </h1>
            <p className="text-base sm:text-lg text-stone-700 dark:text-slate-300 mt-2 leading-relaxed">
              {tr.familySubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Family Contacts Grid */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
          {language === 'hi' ? 'आपके नजदीकी स्नेही जन' : 'Your Loved Ones & Trusted Caregivers'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className={`p-6 rounded-3xl border-2 flex flex-col justify-between gap-5 transition-all shadow-xs ${
                isHighContrast
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-stone-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${c.avatarBg} text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-sm`}
                >
                  {c.initials}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
                    {c.name}
                  </h3>
                  <p className="text-base text-stone-600 dark:text-slate-300 font-bold">
                    {language === 'hi' ? c.relationHi : c.relation}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-slate-400 font-mono mt-0.5">
                    {c.phone}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Call & WhatsApp */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`tel:${c.phone}`}
                  className="btn-tactile py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
                >
                  <Phone className="w-5 h-5 shrink-0" />
                  <span>{tr.callNow}</span>
                </a>

                <a
                  href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile py-3.5 px-4 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 border-2 border-stone-300 dark:border-slate-600 text-stone-900 dark:text-slate-100 font-extrabold text-base flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{tr.whatsappChat}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick 1-Tap Loving Messages */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 shadow-xs space-y-4 ${
          isHighContrast
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500 fill-current" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-slate-100">
            {tr.quickLovingUpdate}
          </h2>
        </div>
        <p className="text-base text-stone-600 dark:text-slate-300">
          {language === 'hi'
            ? 'टाइप करने की जरूरत नहीं है। किसी भी संदेश को छूकर सीधे भेजें:'
            : 'No need to type with shaky hands. Tap any pre-written message to send immediately:'}
        </p>

        <div className="space-y-3 pt-1">
          {quickMessages.map((msg, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-slate-800 border-2 border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <p className="text-base sm:text-lg font-medium text-stone-800 dark:text-slate-200 leading-relaxed">
                "{msg}"
              </p>

              <button
                type="button"
                onClick={() => handleSendQuickMessage(msg, idx)}
                className="btn-tactile px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{language === 'hi' ? 'भेज दिया!' : 'Sent!'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{language === 'hi' ? 'भेजें' : 'Send'}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency Help Banner */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border-2 border-red-500 ${
          isHighContrast
            ? 'bg-red-950/40 text-red-100'
            : 'bg-red-50 text-red-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black flex items-center gap-2 text-red-700 dark:text-red-400">
              <PhoneCall className="w-6 h-6" />
              <span>{tr.emergencyHelp}</span>
            </h2>
            <p className="text-base opacity-90 leading-relaxed">
              {tr.helpLineDesc} &bull; {language === 'hi' ? 'राष्ट्रीय हेल्पलाइन: 112 / एम्बुलेंस: 102' : 'National Emergency: 112 / Medical Ambulance: 102'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSos}
            className="btn-tactile px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg sm:text-xl shadow-lg border-2 border-red-400 shrink-0 cursor-pointer"
          >
            {tr.emergencySos}
          </button>
        </div>
      </section>
    </div>
  );
};
