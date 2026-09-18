import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Scale, CheckCircle } from 'lucide-react';
import { Verdict } from '../api/client';

interface VerdictCardProps {
  verdict: Verdict;
  language: string;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ verdict, language }) => {
  const isStrong = verdict.level === 'strong';
  const isWeak = verdict.level === 'weak';
  const isModerate = verdict.level === 'moderate';

  const badgeConfig = {
    strong: {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      badge: 'bg-emerald-600 text-white',
      icon: ShieldCheck,
      title: language === 'hi' ? 'मजबूत दावा (Strong) — चुनौती योग्य' : 'Strong Contestability — Insurer Violation',
      desc: language === 'hi' ? 'आईआरडीएआई नियमों के तहत दावा अस्वीकृति अमान्य है।' : 'Statutory IRDAI provisions or policy terms override the insurer\'s rejection ground.',
    },
    moderate: {
      bg: 'bg-amber-50 border-amber-300 text-amber-900',
      badge: 'bg-amber-600 text-white',
      icon: AlertTriangle,
      title: language === 'hi' ? 'मध्यम स्थिति (Moderate) — पुनर्विचार योग्य' : 'Moderate Contestability — Grounds for Appeal',
      desc: language === 'hi' ? 'खंड व्याख्या में अस्पष्टता या प्रक्रियात्मक चूक।' : 'Policy clause wording contains ambiguities or insurer failed to substantiate grounds.',
    },
    weak: {
      bg: 'bg-slate-100 border-slate-300 text-slate-900',
      badge: 'bg-slate-700 text-white',
      icon: Scale,
      title: language === 'hi' ? 'कमजोर स्थिति (Weak) — अस्वीकृति मान्य' : 'Rejection Stands — Legally Valid Rejection',
      desc: language === 'hi' ? 'पॉलिसी शर्तों और विनियमों के अनुसार दावा स्वीकार्य नहीं है।' : 'The insurer\'s rejection is legally grounded in applicable waiting periods or exclusions. No appeal is recommended.',
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
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeConfig.badge}`}>
                {verdict.level}
              </span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Two-Path Grounded
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{badgeConfig.title}</h2>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
          {verdict.summary}
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {language === 'hi' ? 'निर्धारित कारण' : 'Determined Legal & Contractual Reasons:'}
        </h4>
        <ul className="space-y-2">
          {verdict.reasons.map((reason, idx) => (
            <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2 bg-white/70 p-3 rounded-lg border border-black/5">
              <span className="font-bold text-brand-600 mt-0.5">•</span>
              <span className="leading-snug">{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
