import React from 'react';
import { ArrowLeft, Shield, Lock, FileCheck, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
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
          <Shield className="w-3.5 h-3.5 text-zinc-600" />
          <span>{isHindi ? 'वैधानिक अनुपालन: DPDPA 2023 एवं IRDAI' : 'Statutory Compliance: DPDPA 2023 & IRDAI'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-950 tracking-tight">
          {isHindi ? 'प्रतिकार गोपनीयता नीति एवं डेटा सुरक्षा वक्तव्य' : 'Pratikar Privacy Policy & Data Protection Statement'}
        </h1>
        <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed max-w-3xl">
          {isHindi
            ? 'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (DPDPA) और IRDAI उपभोक्ता संरक्षण दिशानिर्देशों के तहत शून्य डेटा प्रतिधारण और पूर्ण सत्र अलगाव का आधिकारिक वक्तव्य।'
            : 'Operational declaration of Zero Training Retention, In-Memory Ephemeral Processing, and User Privacy under the Digital Personal Data Protection Act, 2023.'}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-zinc-500">
          <span>{isHindi ? 'प्रभावी तिथि: अक्टूबर 2026' : 'Effective: October 2026'}</span>
          <span>·</span>
          <span>{isHindi ? 'संस्करण: 2.1' : 'Version: 2.1'}</span>
          <span>·</span>
          <span>{isHindi ? 'क्षेत्राधिकार: भारत गणराज्य' : 'Jurisdiction: Republic of India'}</span>
        </div>
      </div>

      {/* Core Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-2xs space-y-2">
          <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800 w-fit">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
            {isHindi ? 'शून्य डेटा प्रतिधारण' : 'Zero Retention (SEC-05)'}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {isHindi
              ? 'अपलोड किए गए दस्तावेज़ केवल सक्रिय विश्लेषण के दौरान मेमोरी में रहते हैं और स्थायी रूप से सुरक्षित नहीं किए जाते।'
              : 'Uploaded policy documents and rejection letters reside strictly in volatile session RAM and are wiped after processing.'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-2xs space-y-2">
          <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800 w-fit">
            <Server className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
            {isHindi ? 'कोई मॉडल प्रशिक्षण नहीं' : 'No Model Training'}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {isHindi
              ? 'आपकी चिकित्सा या बीमा जानकारी का उपयोग किसी भी एआई मॉडल या एलएलएम को प्रशिक्षित करने के लिए कभी नहीं किया जाता।'
              : 'User health records, policy terms, and personal identifiers are never utilized to train or fine-tune machine learning models.'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-2xs space-y-2">
          <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800 w-fit">
            <RefreshCw className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
            {isHindi ? 'तात्कालिक सत्र निपटान' : 'Instant Data Purge (FR-13)'}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {isHindi
              ? 'उपयोगकर्ता "सत्र डेटा हटाएं" बटन पर क्लिक करके किसी भी समय सभी कैश्ड तथ्यों को तुरंत मिटा सकते हैं।'
              : 'Policyholders maintain unilateral control to instantly erase all active session facts via the Purge Session control.'}
          </p>
        </div>
      </div>

      {/* Structured Legal Content */}
      <div className="space-y-6 text-zinc-800 text-xs sm:text-sm leading-relaxed bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-xs">
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '1. दर्शन एवं विनियामक ढांचा' : '1. Overview and Data Processing Philosophy'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'प्रतिकार एक रोगी-हितैषी विनियामक विश्लेषण इंजन है जो भारतीय बीमा विनियामक और विकास प्राधिकरण (IRDAI) के मास्टर परिपत्र 2024 और बीमा लोकपाल नियम, 2017 के तहत काम करता है। हम स्वास्थ्य बीमा से जुड़े संवेदनशील व्यक्तिगत डेटा को अत्यधिक गोपनीयता और सुरक्षा के साथ संभालते हैं। हमारा मुख्य सिद्धांत यह है कि उपयोगकर्ताओं को अपने कानूनी अधिकारों की जांच करने के लिए अपनी गोपनीयता का त्याग नहीं करना चाहिए।'
              : 'Pratikar operates as an automated regulatory contest engine built in strict alignment with the IRDAI Master Circular on Operations and Allied Matters of Health Insurance Business (2024) and the Insurance Ombudsman Rules, 2017. We recognize that health insurance disputes involve sensitive personal health data (SPHD). Our fundamental architecture is built on the principle of data minimization: we process only what is strictly required to evaluate contestability and generate grievance documentation.'}
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '2. शून्य प्रशिक्षण डेटा प्रतिधारण सिद्धांत (SEC-05)' : '2. Zero Training Retention Principle (SEC-05)'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'अपलोड किए गए पत्र और पॉलिसी नियम किसी भी स्थायी डेटाबेस में संग्रहित नहीं किए जाते हैं। फ़ाइलों को सीधे मेमोरी में पार्स किया जाता है, आवश्यक तथ्य (जैसे अस्वीकृति की तिथि, पॉलिसी प्रारंभ तिथि, और उल्लिखित खंड) निकाले जाते हैं, और आईआरडीएआई नियमों से मिलान के बाद विश्लेषण परिणाम तैयार किया जाता है। सत्र समाप्त होने या पृष्ठ बंद होने पर मेमोरी पूरी तरह खाली कर दी जाती है।'
              : 'All documents uploaded to Pratikar (including insurer repudiation letters, policy terms, and medical discharge summaries) are processed strictly in volatile, ephemeral RAM. Raw file binaries and extracted paragraphs are never persisted to disk, relational databases, object stores, or long-term caching tiers. Most importantly, uploaded documents are completely segregated from any generative model training pipelines.'}
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '3. संसाधित डेटा की प्रकृति' : '3. Scope of Ephemeral Data Processed'}
          </h2>
          <p className="text-zinc-600">
            {isHindi ? 'विश्लेषण प्रक्रिया के दौरान निम्नलिखित तत्व अस्थायी रूप से निकाले जाते हैं:' : 'During an active analysis workflow, the engine extracts strictly necessary data points:'}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600">
            <li>{isHindi ? 'बीमा कंपनी का नाम और पॉलिसी संख्या' : 'Insurer corporate identity and policy identification number.'}</li>
            <li>{isHindi ? 'दावा अस्वीकृति की तिथि एवं दावा संदर्भ संख्या' : 'Claim reference number and formal repudiation date.'}</li>
            <li>{isHindi ? 'अस्वीकृति पत्र में उल्लिखित पॉलिसी खंड संदर्भ (जैसे खंड 4.2)' : 'Cited exclusion clause reference (for example, Clause 4.2 pre-existing illness).'}</li>
            <li>{isHindi ? 'पॉलिसी की निरंतर वैधता अवधि (माह)' : 'Continuous policy coverage duration (months accrued toward moratorium threshold).'}</li>
            <li>{isHindi ? 'अस्पताल बिल एवं दावा राशि (सांख्यिकी मिलान हेतु)' : 'Claimed amount and basic hospitalization classification.'}</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '4. डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (DPDPA) के तहत अधिकार' : '4. Rights under the Digital Personal Data Protection Act, 2023'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'DPDPA 2023 के तहत, आप एक "डेटा स्वामी" (Data Principal) हैं। आपको अपने डेटा तक पहुंचने, पुष्टि करने, और तत्काल हटाए जाने का पूरा अधिकार है। चूंकि प्रतिकार किसी भी डेटा को स्थायी रूप से संगृहीत नहीं करता है, इसलिए आपके सत्र को समाप्त करना स्वचालित रूप से आपके डेटा को मिटाने के बराबर है।'
              : 'In accordance with the Digital Personal Data Protection Act, 2023 (DPDPA) of India, policyholders acting as Data Principals possess unequivocal rights to privacy, data minimization, and immediate erasure. Because Pratikar enforces an ephemeral architecture with zero long-term retention, closing your browser session or clicking the "Purge Session" control executes total erasure of all in-flight session data.'}
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '5. सुरक्षा एवं एन्क्रिप्शन मानक' : '5. Security Architecture and Transport Encryption'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'उपयोगकर्ता के ब्राउज़र और सर्वर के बीच संचार पूरी तरह से टीएलएस 1.3 एन्क्रिप्शन के साथ सुरक्षित है। प्रॉम्प्ट इंजेक्शन हमलों से सुरक्षा के लिए, दस्तावेज़ों को केवल डेटा पेलोड के रूप में संसाधित किया जाता है और किसी भी अप्रमाणित निर्देश को निष्पादित करने से रोका जाता है।'
              : 'All communications between your client device and our evaluation endpoints are encrypted in transit using industry-standard Transport Layer Security (TLS 1.3). In accordance with security guideline SEC-10, all parsed document texts are treated exclusively as isolated data objects and cannot influence or alter system instructions.'}
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950">
            {isHindi ? '6. संपर्क एवं शिकायत निवारण' : '6. Privacy Inquiries and Contact'}
          </h2>
          <p className="text-zinc-600">
            {isHindi
              ? 'डेटा सुरक्षा या इस गोपनीयता नीति के संबंध में किसी भी प्रश्न के लिए, आप सीधे हमारी सुरक्षा टीम से संपर्क कर सकते हैं। प्रतिकार व्यक्तिगत डेटा की रक्षा और विनियामक पारदर्शिता के लिए प्रतिबद्ध है।'
              : 'For questions regarding data processing standards or statutory compliance under Indian data protection regulations, policyholders may direct inquiries to the technical security and compliance officers at compliance@pratikar.internal.'}
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
