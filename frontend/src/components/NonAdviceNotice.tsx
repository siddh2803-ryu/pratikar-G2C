import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NonAdviceNoticeProps {
  language?: string;
}

export const NonAdviceNotice: React.FC<NonAdviceNoticeProps> = () => {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Statutory Escalation Ladder */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-start gap-3 shadow-xs">
          <div className="p-2 rounded-lg bg-sky-100 text-brand-700 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('notices.deadlines_title')}
            </h4>
            <div className="mt-1 space-y-1 text-xs text-slate-700">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                <b>{t('notices.deadline_15_days_label')}</b> {t('notices.deadline_15_days_desc')}
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <b>{t('notices.deadline_1_year_label')}</b> {t('notices.deadline_1_year_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Not-Legal-Advice Disclaimer (BR-03, FR-14) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-start gap-3 shadow-xs">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('notices.non_advice_title')}
            </h4>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              {t('notices.non_advice_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
