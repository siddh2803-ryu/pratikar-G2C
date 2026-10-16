import React from 'react';
import { ArrowLeft, Scale, AlertTriangle, Clock, CheckCircle2, BookOpen, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 sm:py-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-500" />
          <span>{isHindi ? 'वापस विश्लेषण पर जाएँ' : 'Back to Analysis'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="space-y-3 border-b border-zinc-200/80 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-xs font-medium tracking-tight shadow-2xs">
          <Scale className="w-3.5 h-3.5 text-zinc-600" />
          <span>{isHindi ? 'नियामक ढांचा: IRDAI मास्टर परिपत्र 2024' : 'Regulatory Scope: IRDAI Master Circular 2024'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-950 tracking-tight">
          {isHindi ? 'प्रतिकार सेवा की नियम एवं शर्तें' : 'Pratikar Terms and Conditions of Service'}
        </h1>
        <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed max-w-3xl">
          {isHindi
            ? 'स्वास्थ्य बीमा दावा अस्वीकृति के मूल्यांकन और अपील दस्तावेज़ तैयार करने के लिए आधिकारिक नियम, उपयोगकर्ता दायित्व और विधिक अस्वीकरण।'
            : 'Operational framework, user responsibilities, statutory dispute deadlines, and legal disclaimers governing the Pratikar evaluation engine.'}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-zinc-500">
          <span>{isHindi ? 'प्रभावी तिथि: अक्टूबर 2026' : 'Effective: October 2026'}</span>
          <span>·</span>
          <span>{isHindi ? 'संस्करण: 2.1' : 'Version: 2.1'}</span>
          <span>·</span>
          <span>{isHindi ? 'क्षेत्राधिकार: भारत गणराज्य' : 'Jurisdiction: Republic of India'}</span>
        </div>
      </div>

      {/* Key Declarations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-2xs space-y-2">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 w-fit border border-amber-200/60">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
            {isHindi ? 'विधिक सलाह नहीं है' : 'Not Formal Legal Counsel'}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {isHindi
              ? 'प्रतिकार एक स्वचालित नियामक संदर्भ उपकरण है। यह एक कानून फर्म नहीं है और आधिकारिक विधिक परामर्श प्रदान नहीं करता।'
              : 'Pratikar is a deterministic regulatory analysis tool for self-filing policyholders and does not constitute formal legal advice.'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-2xs space-y-2">
          <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800 w-fit">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
            {isHindi ? 'सटीक साक्ष्य उद्धरण' : 'Zero Hallucinations'}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {isHindi
              ? 'प्रत्येक निष्कर्ष पॉलिसी के वास्तविक खंडों और आईआरडीएआई के आधिकारिक परिपत्र प्रावधानों पर आधारित होता है।'
              : 'Every reason and finding is directly tethered to verifiable text spans in uploaded policy wording and IRDAI circulars.'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-2xs space-y-2">
          <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800 w-fit">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
            {isHindi ? 'वैधानिक समयसीमा' : 'Statutory Escalation Windows'}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {isHindi
              ? 'बीमाकर्ता GRO के पास 15 दिन और बीमा लोकपाल के पास 1 वर्ष की समयसीमा लागू होती है।'
              : 'Strict deadlines apply: 15 days for insurer GRO resolution, 30 days before Ombudsman filing, and 1 year maximum for Ombudsman escalation.'}
          </p>
        </div>
      </div>

      {/* Detailed Legal Sections */}
      <div className="space-y-6 text-zinc-800 text-xs sm:text-sm leading-relaxed bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-xs">
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '1. सेवा का उद्देश्य एवं विनियामक अधिकार क्षेत्र' : '1. Purpose of Service and Regulatory Scope'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'प्रतिकार भारतीय स्वास्थ्य बीमा पॉलिसीधारकों को उनके दावों की अस्वीकृति का विनियामक विश्लेषण करने और आवश्यक अपील पत्र तैयार करने में सहायता करता है। यह सेवा भारतीय बीमा विनियामक और विकास प्राधिकरण (IRDAI) के मास्टर परिपत्र (Ref: IRDAI/HLT/CIR/PRO/84/5/2024 dated 29.05.2024) और बीमा लोकपाल नियम, 2017 पर आधारित है। प्रतिकार का उपयोग करके, आप स्वीकार करते हैं कि यह प्रणाली केवल सूचनात्मक और आत्म-फाइलिंग सहायता प्रदान करती है।'
              : 'Pratikar provides deterministic computational analysis of health insurance claim repudiations to assist Indian policyholders in preparing formal appeals. The engine references operative regulations published by the Insurance Regulatory and Development Authority of India (IRDAI), specifically the Master Circular on Operations and Allied Matters of Health Insurance Business (Ref: IRDAI/HLT/CIR/PRO/84/5/2024 dated 29.05.2024), as well as the Insurance Ombudsman Rules, 2017.'}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '2. विधिक एवं चिकित्सीय परामर्श का अभाव (BR-03, FR-14)' : '2. Non-Legal and Non-Medical Advice Disclaimer (BR-03, FR-14)'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'प्रतिकार कोई कानून फर्म, अधिवक्ता, थर्ड पार्टी एडमिनिस्ट्रेटर (TPA), या बीमा मध्यस्थ नहीं है। इंजन द्वारा उत्पन्न अपील दस्तावेज़ और निर्णय विधिक या चिकित्सीय सलाह का गठन नहीं करते हैं। उपयोगकर्ताओं को किसी भी गंभीर या उच्च-मूल्य के कानूनी विवाद में योग्य कानूनी अधिवक्ता से परामर्श करने की सलाह दी जाती है।'
              : 'Pratikar is not a law firm, advocate, legal intermediary, Third Party Administrator (TPA), or licensed insurance agent. All findings, verdicts, and generated appeal drafts are automated references designed to facilitate self-representation by policyholders. They do not constitute formal legal counsel, attorney-client representation, or medical adjudication.'}
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '3. उपयोगकर्ता के दायित्व एवं तथ्य सत्यापन (FR-05)' : '3. Policyholder Responsibilities and Fact Confirmation (FR-05)'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'सटीक परिणाम प्राप्त करने के लिए उपयोगकर्ता को वैध अस्वीकृति पत्र और संबंधित पॉलिसी अनुबंध पीडीएफ अपलोड करना अनिवार्य है। चरण 2 (तथ्य पुष्टि) पर, उपयोगकर्ता को निकाले गए तथ्यों (जैसे पॉलिसी संख्या, अस्वीकृति आधार, और निरंतर वैधता अवधि) की पुष्टि करनी होगी। बीमाकर्ता या लोकपाल को गलत जानकारी प्रस्तुत करने की पूरी जिम्मेदारी उपयोगकर्ता की होगी।'
              : 'Users are strictly responsible for the authenticity and completeness of documents submitted. Pratikar provides a mandatory Fact Confirmation interface (Step 2) to ensure policyholders verify critical parameters (including policyholder name, continuous coverage months, claim amount, and cited exclusion clauses) prior to generating an appeal letter.'}
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '4. वैधानिक विवाद समाधान समयसीमा' : '4. Statutory Dispute Resolution Deadlines'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'आईआरडीएआई और बीमा लोकपाल नियमों के तहत निम्नलिखित वैधानिक समयसीमाएं बाध्यकारी हैं:'
              : 'Policyholders must observe strict statutory deadlines established by Indian insurance regulations:'}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600">
            <li>
              <b>{isHindi ? '15 कैलेंडर दिन: ' : '15 Calendar Days: '}</b>
              {isHindi
                ? 'बीमा कंपनी के शिकायत निवारण अधिकारी (GRO) को शिकायत प्राप्त होने के 15 दिनों के भीतर लिखित निर्णय देना अनिवार्य है।'
                : 'Mandatory resolution window for the insurer Grievance Redressal Officer (GRO) under IRDAI Master Circular 2024.'}
            </li>
            <li>
              <b>{isHindi ? '30 कैलेंडर दिन: ' : '30 Calendar Days: '}</b>
              {isHindi
                ? 'यदि बीमा कंपनी 30 दिनों में उत्तर नहीं देती है या उत्तर असंतोषजनक है, तो पॉलिसीधारक बीमा लोकपाल के पास जाने के लिए पात्र हो जाता है।'
                : 'Eligibility threshold to escalate to the Insurance Ombudsman if the insurer fails to respond or rejects the appeal.'}
            </li>
            <li>
              <b>{isHindi ? '1 वर्ष की सीमा: ' : '1 Year Limitation: '}</b>
              {isHindi
                ? 'बीमा लोकपाल नियम 2017 के नियम 17 के तहत, अस्वीकृति की तिथि के 1 वर्ष के भीतर बीमा लोकपाल के समक्ष शिकायत दर्ज की जानी चाहिए।'
                : 'Maximum statutory limitation period to register a grievance with the Insurance Ombudsman under Rule 17 of Insurance Ombudsman Rules, 2017.'}
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '5. दायित्व की सीमा' : '5. Limitation of Liability'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'प्रतिकार विनियामक नियमों के आधार पर निष्पक्ष और सटीक विश्लेषण प्रदान करने का हर संभव प्रयास करता है। हालांकि, हम यह गारंटी नहीं दे सकते कि कोई विशेष बीमाकर्ता या बीमा लोकपाल अपील को स्वीकार करेगा। प्रतिकार किसी भी वित्तीय हानि, अस्वीकृति, या विलंबित फाइलिंग के लिए उत्तरदायी नहीं होगा।'
              : 'While Pratikar applies deterministic statutory rules and exact character-span citation to minimize procedural errors, we make no representations or warranties regarding the ultimate outcome of an appeal filed with an insurer or the Insurance Ombudsman. In no event shall Pratikar be liable for any indirect, incidental, or consequential damages resulting from claim repudiation disputes.'}
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '6. शासी कानून एवं न्यायक्षेत्र' : '6. Governing Law and Jurisdiction'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'ये शर्तें भारत गणराज्य के कानूनों के अनुसार शासित और व्याख्यायित की जाएंगी। किसी भी विवाद का निपटारा भारत के सक्षम न्यायालयों के अनन्य क्षेत्राधिकार में होगा।'
              : 'These Terms and Conditions shall be governed by, and construed in accordance with, the laws of the Republic of India. Any legal actions or proceedings arising out of these terms shall be subject to the exclusive jurisdiction of the competent courts of India.'}
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
