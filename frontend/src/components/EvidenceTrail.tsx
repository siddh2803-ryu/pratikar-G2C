import React, { useState } from 'react';
import { FileText, BookOpen, CheckCircle2 } from 'lucide-react';
import { EvidenceItem } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface EvidenceTrailProps {
  evidenceTrail: EvidenceItem[];
  language?: string;
}

export const EvidenceTrail: React.FC<EvidenceTrailProps> = ({ evidenceTrail }) => {
  const { t, translateDynamic } = useLanguage();
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(
    evidenceTrail.length > 0 ? evidenceTrail[0] : null
  );

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 bg-zinc-50/80 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-zinc-800" />
          <h3 className="font-bold text-zinc-950 text-sm sm:text-base tracking-tight">
            {t('evidence.header_title')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t('evidence.grounded_badge')}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">
            {t('evidence.assertions_badge')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200/80">
        {/* Left: Interactive list of citations */}
        <div className="lg:col-span-6 p-4 space-y-2.5 max-h-[440px] overflow-y-auto">
          <p className="text-[11px] text-zinc-400 font-medium px-1">
            {t('evidence.click_prompt')}
          </p>
          {evidenceTrail.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isPolicy = item.source_type === 'policy_span';
            const sourceLabel = isPolicy
              ? t('evidence.policy_wording_page', { page: item.page_number || '' })
              : (translateDynamic(item.provision_ref || '') || t('evidence.default_provision'));

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-left ${
                  isSelected
                    ? 'border-zinc-950 bg-zinc-50/90 shadow-2xs ring-1 ring-zinc-950'
                    : 'border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/50 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 bg-zinc-100 text-zinc-700 font-mono border border-zinc-200/60">
                    <FileText className="w-3 h-3 text-zinc-500" />
                    {sourceLabel}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-zinc-400">#{item.ordinal}</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-zinc-900 line-clamp-2">
                  {translateDynamic(item.statement)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Verbatim source inspector */}
        <div className="lg:col-span-6 p-5 bg-zinc-50/40 flex flex-col justify-between">
          {selectedItem ? (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedItem.source_type === 'policy_span'
                    ? t('evidence.inspector_policy_title', { page: selectedItem.page_number || '' })
                    : t('evidence.inspector_circular_title')}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {t('evidence.inspector_id', { id: selectedItem.id })}
                </span>
              </div>

              {/* Monospace Code Inspector */}
              <div className="bg-zinc-950 text-zinc-200 p-4 rounded-xl border border-zinc-800 shadow-sm font-mono text-xs leading-relaxed max-h-[280px] overflow-y-auto whitespace-pre-wrap selection:bg-zinc-700">
                {selectedItem.source_text}
              </div>

              <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <span className="font-bold text-amber-700 mt-0.5">{t('evidence.note_label')}</span>
                <span className="leading-relaxed">
                  {selectedItem.source_type === 'policy_span'
                    ? t('evidence.note_policy')
                    : t('evidence.note_circular')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-xs text-zinc-400">
              {t('evidence.select_to_inspect')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceTrail;
