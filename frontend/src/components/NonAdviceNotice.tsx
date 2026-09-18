import React from 'react';
import { Clock, AlertCircle, Scale, Calendar } from 'lucide-react';

interface NonAdviceNoticeProps {
  language: string;
}

export const NonAdviceNotice: React.FC<NonAdviceNoticeProps> = ({ language }) => {
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
              {language === 'hi' ? 'वैधानिक समय-सीमा' : 'Applicable Statutory Deadlines'}
            </h4>
            <div className="mt-1 space-y-1 text-xs text-slate-700">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                <b>15 Days:</b> Insurer GRO must resolve grievance in writing.
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <b>1 Year:</b> From GRO rejection to file with Insurance Ombudsman.
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
              {language === 'hi' ? 'कानूनी गैर-सलाह घोषणा' : 'Non-Advice Regulatory Notice'}
            </h4>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              {language === 'hi'
                ? 'यह सेवा कानूनी प्रतिनिधित्व प्रदान नहीं करती है। यह उपयोगकर्ता द्वारा प्रस्तुत पॉलिसी और आईआरडीएआई नियमों के आधार पर दस्तावेज तैयार करती है। उपयोगकर्ता दस्तावेज स्वयं दाखिल करता है।'
                : 'Pratikar is an assisted self-filing document preparation engine. It does not provide formal legal advice or representation. All appeal documents must be reviewed and submitted directly by the policyholder.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
