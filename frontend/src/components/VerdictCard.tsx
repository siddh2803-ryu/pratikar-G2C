import React from 'react';
import { ShieldCheck, AlertTriangle, Scale, CheckCircle } from 'lucide-react';
import { Verdict } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface VerdictCardProps {
  verdict: Verdict;
  language?: string;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ verdict }) => {
  const { t, translateDynamic } = useLanguage();

  const badgeConfig = {
    strong: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      badgeBg: 'bg-emerald-600 text-white',
      badgeText: t('card.strong_level'),
      icon: ShieldCheck,
      title: t('card.strong_title'),
      desc: t('card.strong_desc'),
    },
    moderate: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      badgeBg: 'bg-amber-600 text-white',
      badgeText: t('card.moderate_level'),
      icon: AlertTriangle,
      title: t('card.moderate_title'),
      desc: t('card.moderate_desc'),
    },
    weak: {
      bg: 'bg-slate-100 border-slate-300 text-slate-900',
      badgeBg: 'bg-slate-700 text-white',
      badgeText: t('card.weak_level'),
      icon: Scale,
      title: t('card.weak_title'),
      desc: t('card.weak_desc'),
    },
  }[verdict.level];

  const IconComponent = badgeConfig.icon;

  return (
    <div className={`rounded-2xl border-2 p-6 shadow-sm ${badgeConfig.bg} transition-all`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white shadow-sm border border-black/5">
            <IconComponent className="w-7 h-7 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeConfig.badgeBg}`}>
                {badgeConfig.badgeText}
              </span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {t('card.two_path_badge')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{badgeConfig.title}</h2>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
          {translateDynamic(verdict.summary)}
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {t('card.reasons_title')}
        </h4>
        <ul className="space-y-2">
          {verdict.reasons.map((reason, idx) => (
            <li
              key={idx}
              className="text-xs sm:text-sm text-slate-700 flex items-start gap-2 bg-white/70 p-3 rounded-lg border border-black/5"
            >
              <span className="font-bold text-brand-600 mt-0.5">•</span>
              <span className="leading-snug">{translateDynamic(reason)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
