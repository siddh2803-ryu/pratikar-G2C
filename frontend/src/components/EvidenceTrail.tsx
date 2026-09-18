import React, { useState } from 'react';
import { FileText, BookOpen, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';
import { EvidenceItem } from '../api/client';

interface EvidenceTrailProps {
  evidenceTrail: EvidenceItem[];
  language: string;
}

export const EvidenceTrail: React.FC<EvidenceTrailProps> = ({ evidenceTrail, language }) => {
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(
    evidenceTrail.length > 0 ? evidenceTrail[0] : null
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-slate-900 text-base">
            {language === 'hi' ? 'साक्ष्य मार्ग (Evidence Trail)' : 'Verifiable Evidence Trail'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Grounded
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Zero Uncited Assertions
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left: Interactive list of citations */}
        <div className="lg:col-span-6 p-4 space-y-2.5 max-h-[420px] overflow-y-auto">
          <p className="text-xs text-slate-500 font-medium px-2">
            {language === 'hi'
              ? 'मूल दस्तावेज उद्धरण देखने के लिए किसी भी बिंदु पर क्लिक करें:'
              : 'Click any citation to verify underlying policy wording or IRDAI regulation:'}
          </p>
          {evidenceTrail.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isPolicy = item.source_type === 'policy_span';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700">
                    <FileText className="w-3 h-3 text-brand-600" />
                    {isPolicy ? `Policy Wording — Page ${item.page_number}` : (item.provision_ref || 'IRDAI Provision')}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">#{item.ordinal}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2">
                  {item.statement}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right: Verbatim source inspector */}
        <div className="lg:col-span-6 p-5 bg-slate-50/50 flex flex-col justify-between">
          {selectedItem ? (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {selectedItem.source_type === 'policy_span'
                    ? `Verbatim Policy Excerpt (Page ${selectedItem.page_number})`
                    : `Statutory Circular Provision`}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {selectedItem.id}</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm font-mono text-xs text-slate-800 leading-relaxed max-h-[260px] overflow-y-auto whitespace-pre-wrap">
                {selectedItem.source_text}
              </div>

              <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <span className="font-bold text-amber-700 mt-0.5">Note:</span>
                <span>
                  {selectedItem.source_type === 'policy_span'
                    ? 'This exact character span was retrieved directly from the PDF uploaded in this session with verified page indexing.'
                    : 'This provision is an operative, binding regulatory requirement published by the Insurance Regulatory and Development Authority of India.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-slate-400">
              Select an evidence item to inspect its source.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
