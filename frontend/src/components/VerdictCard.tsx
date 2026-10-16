import React from 'react';
import { ShieldCheck, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';
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
      border: 'border-emerald-300/80',
      bg: 'bg-emerald-50/40',
      badgeBg: 'bg-emerald-600 text-white',
      dotBg: 'bg-emerald-400',
      badgeText: t('card.strong_level'),
      icon: ShieldCheck,
      iconColor: 'text-emerald-700',
      title: t('card.strong_title'),
      desc: t('card.strong_desc'),
    },
    moderate: {
      border: 'border-amber-300/80',
      bg: 'bg-amber-50/40',
      badgeBg: 'bg-amber-600 text-white',
      dotBg: 'bg-amber-400',
      badgeText: t('card.moderate_level'),
      icon: AlertTriangle,
      iconColor: 'text-amber-700',
      title: t('card.moderate_title'),
      desc: t('card.moderate_desc'),
    },
    weak: {
      border: 'border-zinc-300',
      bg: 'bg-zinc-50/80',
      badgeBg: 'bg-zinc-800 text-white',
      dotBg: 'bg-zinc-400',
      badgeText: t('card.weak_level'),
      icon: Scale,
      iconColor: 'text-zinc-700',
      title: t('card.weak_title'),
      desc: t('card.weak_desc'),
    },
  }[verdict.level];

  const IconComponent = badgeConfig.icon;

  return (
    <div className={`rounded-2xl border ${badgeConfig.border} p-6 sm:p-7 shadow-xs ${badgeConfig.bg} transition-all`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/70 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-zinc-200/80">
            <IconComponent className={`w-7 h-7 ${badgeConfig.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${badgeConfig.badgeBg} shadow-2xs`}>
                {badgeConfig.badgeText}
              </span>
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t('card.two_path_badge')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 mt-1 tracking-tight">{badgeConfig.title}</h2>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm sm:text-base font-medium text-zinc-800 leading-relaxed">
          {translateDynamic(verdict.summary)}
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          {t('card.reasons_title')}
        </h4>
        <ul className="space-y-2">
          {verdict.reasons.map((reason, idx) => (
            <li
              key={idx}
              className="text-xs sm:text-sm text-zinc-800 flex items-start gap-2.5 bg-white/90 p-3.5 rounded-xl border border-zinc-200/70 shadow-2xs"
            >
              <span className="font-bold text-zinc-400 mt-0.5 text-xs">0{idx + 1}.</span>
              <span className="leading-snug font-medium">{translateDynamic(reason)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VerdictCard;
