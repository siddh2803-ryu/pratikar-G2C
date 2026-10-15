import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NonAdviceNoticeProps {
  language?: string;
}

export const NonAdviceNotice: React.FC<NonAdviceNoticeProps> = () => {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5 shadow-xs space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Statutory Escalation Ladder */}
        <div className="p-4 bg-white rounded-xl border border-zinc-200/80 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800 mt-0.5 border border-zinc-200/60">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-950">
              {t('notices.deadlines_title')}
            </h4>
            <div className="mt-1.5 space-y-1.5 text-xs text-zinc-700">
              <p className="flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900"></span>
                <span><b>{t('notices.deadline_15_days_label')}</b> {t('notices.deadline_15_days_desc')}</span>
              </p>
              <p className="flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span><b>{t('notices.deadline_1_year_label')}</b> {t('notices.deadline_1_year_desc')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Not-Legal-Advice Disclaimer (BR-03, FR-14) */}
        <div className="p-4 bg-white rounded-xl border border-zinc-200/80 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 mt-0.5 border border-amber-200/60">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-950">
              {t('notices.non_advice_title')}
            </h4>
            <p className="mt-1 text-xs text-zinc-600 leading-relaxed font-normal">
              {t('notices.non_advice_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonAdviceNotice;
