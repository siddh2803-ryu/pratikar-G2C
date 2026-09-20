/**
 * Centralized Bilingual Localization Dictionary for Pratikar InsurTech Engine
 * Supports English ('en') and Hindi ('hi') across all pages, components, and dynamic legal statements.
 * Terminology conforms to IRDAI Master Circular 2024 and Insurance Ombudsman Rules 2017.
 */

export type Language = 'en' | 'hi';

export const TRANSLATIONS = {
  en: {
    // Navigation & Common Header
    'nav.brand': 'Pratikar',
    'nav.insurtech': 'InsurTech',
    'nav.tagline': 'Health Claim Rejection Contest Engine · Geek2Code 2026 Grand Final',
    'nav.api_warmed': 'API Warmed & Ready',
    'nav.api_connecting': 'API Connecting',
    'nav.language_label': 'Language:',
    'nav.step_1': 'Upload',
    'nav.step_2': 'Confirm Facts',
    'nav.step_3': 'Verdict & Evidence',
    'nav.step_4': 'Appeal Document',

    // Footer
    'footer.disclaimer': 'Pratikar · Two-Path Grounded Regulatory Engine · Powered by IRDAI Master Circular 2024',
    'footer.team': 'Team: Sid · Pratham · Navya · Parnika · Dhiraj',
    'footer.zero_retention': 'Zero Training Retention (SEC-05)',

    // Upload Page
    'upload.hero_badge': 'Patient-Side InsurTech Advocate · Free for Individuals',
    'upload.hero_title': 'Contest an Unjust Health Insurance Claim Rejection',
    'upload.hero_desc': 'Upload your rejection letter and policy wording. Pratikar locates the cited clause verbatim, tests it against coded IRDAI regulations, and drafts a ready-to-file appeal.',
    'upload.fast_path_title': 'Demo Day Fast Path (Instant Verification)',
    'upload.fast_path_time': '< 5s Response Time',
    'upload.demo1_tag': 'Flow A: Strong Verdict',
    'upload.demo1_title': '60-Month Moratorium Violation',
    'upload.demo1_desc': 'Pre-existing disease rejection after 65 months',
    'upload.demo2_tag': 'Flow C: Moderate Verdict',
    'upload.demo2_title': 'No Rejection Clause Specified',
    'upload.demo2_desc': 'Clause absent in letter; demands insurer grounds',
    'upload.demo3_tag': 'Flow A: Strong Verdict',
    'upload.demo3_title': 'Clause/Policy Mismatch',
    'upload.demo3_desc': 'Cites non-existent clause; grounds for appeal',
    'upload.label_letter': '1. Rejection Letter (Photo or PDF)',
    'upload.choose_file_letter': 'Choose file or drag & drop',
    'upload.hint_letter': 'PDF, JPG, or PNG (Max 25 MB)',
    'upload.label_policy': '2. Policy Wording PDF',
    'upload.choose_file_policy': 'Choose digital policy PDF',
    'upload.hint_policy': '40–80 page digital PDF issued by insurer',
    'upload.privacy_notice_title': 'Privacy Notice:',
    'upload.privacy_notice_desc': 'Documents live only for this single session and are discarded at the end of the analysis. No personal data is retained or used for model training.',
    'upload.btn_analyzing': 'Analyzing Documents & IRDAI Provisions...',
    'upload.btn_submit': 'Extract & Verify Claim Facts',
    'upload.error_both_files': 'Please upload both the rejection letter and the policy wording PDF.',
    'upload.error_analysis_failed': 'Analysis could not be completed.',
    'upload.error_demo_failed': 'Failed to load demo case.',

    // Confirm Page
    'confirm.step_badge': 'Step 2 of 4: Extracted Claim Facts Confirmation',
    'confirm.title': 'Confirm Extracted Information',
    'confirm.subtitle': 'Pratikar has read the rejection letter into structured facts. Review these details before the two-path regulatory evaluation proceeds.',
    'confirm.field_policyholder': 'Policyholder Name',
    'confirm.fallback_policyholder': 'Insured Claimant',
    'confirm.field_insurer': 'Insurance Company',
    'confirm.field_policy_number': 'Policy Number',
    'confirm.fallback_not_stated': 'Not stated in letter',
    'confirm.field_claim_ref': 'Claim Reference / Docket ID',
    'confirm.field_disputed_amount': 'Disputed Claim Amount',
    'confirm.fallback_as_per_bills': 'As per bills',
    'confirm.field_rejection_date': 'Date of Repudiation Letter',
    'confirm.field_tenure': 'Continuous Coverage Tenure',
    'confirm.months': 'Months',
    'confirm.moratorium_met': '(≥ 60-Mo Moratorium Met)',
    'confirm.fallback_tenure_unknown': 'Not determinable from letter',
    'confirm.clause_box_title': 'Contractual Clause Cited by Insurer',
    'confirm.clause_absent_badge': 'Absent (Triggers Flow C)',
    'confirm.clause_present_desc': 'This clause will be retrieved verbatim from your policy PDF and tested for applicability.',
    'confirm.clause_absent_desc': 'The letter does not cite an explicit policy clause. Pratikar will generate a formal Request-for-Grounds letter instead of inventing a clause.',
    'confirm.stated_ground_title': 'Repudiation Reason Stated by Insurer',
    'confirm.btn_back': '← Upload Different Documents',
    'confirm.btn_proceed': 'Proceed to Contestability Verdict',

    // Verdict Page
    'verdict.step_badge': 'Step 3 of 4: Two-Path Evaluation Complete',
    'verdict.title': 'Contestability Verdict & Evidence',
    'verdict.btn_restart': 'Start New Analysis',
    'verdict.trail_title': 'Citation-Grounded Evidence Trail',
    'verdict.sources_count': '{count} Verified Sources',
    'verdict.next_action_label': 'Next Action',
    'verdict.next_action_weak': 'No appeal recommended. The repudiation is contractually valid.',
    'verdict.next_action_flow_c': 'Generate formal Request-for-Grounds letter to insurer.',
    'verdict.next_action_strong': 'Generate ready-to-file Grievance-Officer appeal document.',
    'verdict.next_action_weak_sub': 'Filing an appeal on a valid exclusion would waste time and cost without legal prospect.',
    'verdict.next_action_strong_sub': 'All statements are cited strictly from your policy wording and IRDAI circulars.',
    'verdict.btn_draft_flow_c': 'Draft Grounds Demand Letter',
    'verdict.btn_draft_strong': 'Draft Official GRO Appeal Letter',
    'verdict.btn_drafting': 'Drafting Appeal Document...',

    // Verdict Card
    'card.two_path_badge': 'Two-Path Grounded',
    'card.reasons_title': 'Determined Legal & Contractual Reasons:',
    'card.strong_level': 'Strong',
    'card.strong_title': 'Strong Contestability — Insurer Violation',
    'card.strong_desc': 'Statutory IRDAI provisions or policy terms override the insurer\'s rejection ground.',
    'card.moderate_level': 'Moderate',
    'card.moderate_title': 'Moderate Contestability — Grounds for Appeal',
    'card.moderate_desc': 'Policy clause wording contains ambiguities or insurer failed to substantiate grounds.',
    'card.weak_level': 'Weak',
    'card.weak_title': 'Rejection Stands — Legally Valid Rejection',
    'card.weak_desc': 'The insurer\'s rejection is legally grounded in applicable waiting periods or exclusions. No appeal is recommended.',

    // Evidence Trail
    'evidence.header_title': 'Verifiable Evidence Trail',
    'evidence.grounded_badge': '100% Grounded',
    'evidence.assertions_badge': 'Zero Uncited Assertions',
    'evidence.click_prompt': 'Click any citation to verify underlying policy wording or IRDAI regulation:',
    'evidence.policy_wording_page': 'Policy Wording — Page {page}',
    'evidence.default_provision': 'IRDAI Provision',
    'evidence.inspector_policy_title': 'Verbatim Policy Excerpt (Page {page})',
    'evidence.inspector_circular_title': 'Statutory Circular Provision',
    'evidence.inspector_id': 'ID: {id}',
    'evidence.note_label': 'Note:',
    'evidence.note_policy': 'This exact character span was retrieved directly from the PDF uploaded in this session with verified page indexing.',
    'evidence.note_circular': 'This provision is an operative, binding regulatory requirement published by the Insurance Regulatory and Development Authority of India.',
    'evidence.empty_inspector': 'Select an evidence item to inspect its source.',

    // Non-Advice Notice
    'notices.deadlines_title': 'Applicable Statutory Deadlines',
    'notices.deadline_15_days_label': '15 Days:',
    'notices.deadline_15_days_desc': 'Insurer GRO must resolve grievance in writing.',
    'notices.deadline_1_year_label': '1 Year:',
    'notices.deadline_1_year_desc': 'From GRO rejection to file with Insurance Ombudsman.',
    'notices.non_advice_title': 'Non-Advice Regulatory Notice',
    'notices.non_advice_desc': 'Pratikar is an assisted self-filing document preparation engine. It does not provide formal legal advice or representation. All appeal documents must be reviewed and submitted directly by the policyholder.',

    // Appeal Page
    'appeal.back_btn': 'Back to Verdict & Evidence',
    'appeal.title_flow_c': 'Request for Rejection Grounds Letter',
    'appeal.title_gro': 'Grievance-Officer (GRO) Appeal Letter',
    'appeal.subtitle': 'Ready to download and submit directly to {insurer}.',
    'appeal.doc_header_flow_c': 'REQUEST FOR SPECIFIC GROUNDS AND CLAUSE OF CLAIM REPUDIATION',
    'appeal.doc_header_gro': 'FORMAL GRIEVANCE APPEAL UNDER IRDAI PROTECTION REGULATIONS',
    'appeal.doc_sub': 'Prepared via Pratikar InsurTech Contest Engine · Filed Directly by Policyholder',
    'appeal.to': 'To,',
    'appeal.gro_designation': 'The Grievance Redressal Officer (GRO) / Claims Department',
    'appeal.subject_label': 'Subject:',
    'appeal.subject_flow_c': 'Demand for Specific Contractual Clause and Ground for Claim Repudiation Ref: {ref}',
    'appeal.subject_gro': 'Contest and Demand for Reconsideration of Repudiated Claim Ref: {ref}',
    'appeal.claim_particulars_title': 'CLAIM PARTICULARS',
    'appeal.particular_name': 'Policyholder Name:',
    'appeal.particular_policy_no': 'Policy Number:',
    'appeal.particular_claim_ref': 'Claim Reference ID:',
    'appeal.particular_date': 'Date of Repudiation:',
    'appeal.particular_amount': 'Disputed Amount:',
    'appeal.particular_ground': 'Stated Insurer Ground:',
    'appeal.statutory_grounds_title': 'Statutory & Contractual Grounds:',
    'appeal.evidence_citations_title': 'Evidence & Document Citations:',
    'appeal.source_label': 'Source:',
    'appeal.demand_label': 'Demand for Redressal:',
    'appeal.demand_text_1': 'Under IRDAI regulations, the insurer must dispose of this grievance in writing within 15 calendar days.',
    'appeal.demand_text_2': 'In the event this grievance is not resolved to satisfaction, this matter will be escalated to the Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 without further notice.',
    'appeal.signoff_yours': 'Yours faithfully,',
    'appeal.signoff_role': 'Policyholder / Insured Claimant',
    'appeal.signoff_date': 'Date: {date}',
    'appeal.btn_download': 'Download Ready-to-File PDF',
    'appeal.btn_downloading': 'Preparing PDF...',
    'appeal.btn_dispose': 'Dispose Session & Delete Documents',
    'appeal.confirm_disposal': 'This will permanently delete your uploaded documents and session records from Pratikar storage (PRD FR-13). Continue?',
    'appeal.not_applicable': 'N/A',
    'appeal.refer_enclosed': 'Refer enclosed policy',
    'appeal.insured_claimant': 'Insured Claimant',
    'appeal.as_per_bills': 'As per hospital bills',
  },

  hi: {
    // Navigation & Common Header
    'nav.brand': 'प्रतिकार (Pratikar)',
    'nav.insurtech': 'इन्शुरटेक',
    'nav.tagline': 'स्वास्थ्य दावा अस्वीकृति चुनौती इंजन · Geek2Code 2026 ग्रैंड फिनाले',
    'nav.api_warmed': 'एपीआई सक्रिय एवं तैयार',
    'nav.api_connecting': 'एपीआई कनेक्ट हो रहा है',
    'nav.language_label': 'भाषा:',
    'nav.step_1': 'दस्तावेज़ अपलोड',
    'nav.step_2': 'तथ्य पुष्टि',
    'nav.step_3': 'निर्णय एवं साक्ष्य',
    'nav.step_4': 'अपील दस्तावेज़',

    // Footer
    'footer.disclaimer': 'प्रतिकार · द्वि-मार्ग आधारित नियामक इंजन · आईआरडीएआई मास्टर परिपत्र 2024 द्वारा संचालित',
    'footer.team': 'टीम: सिड · प्रथम · नव्या · पर्णिका · धीरज',
    'footer.zero_retention': 'शून्य प्रशिक्षण डेटा प्रतिधारण (SEC-05)',

    // Upload Page
    'upload.hero_badge': 'मरीज-हितैषी इन्शुरटेक समर्थक · आम नागरिकों के लिए निःशुल्क',
    'upload.hero_title': 'अन्यायपूर्ण स्वास्थ्य बीमा दावा अस्वीकृति को चुनौती दें',
    'upload.hero_desc': 'अपना अस्वीकृति पत्र और पॉलिसी नियम अपलोड करें। प्रतिकार संबंधित खंड को शब्दशः खोजता है, आईआरडीएआई विनियमों के आधार पर परीक्षण करता है, और तैयार अपील तैयार करता है।',
    'upload.fast_path_title': 'डेमो डे फास्ट पाथ (त्वरित सत्यापन)',
    'upload.fast_path_time': '< 5 सेकंड प्रतिक्रिया समय',
    'upload.demo1_tag': 'फ्लो A: मजबूत निर्णय',
    'upload.demo1_title': '60-माह अधिस्थगन (मोराटोरियम) उल्लंघन',
    'upload.demo1_desc': '65 महीनों के बाद पहले से मौजूद बीमारी के आधार पर अस्वीकृति',
    'upload.demo2_tag': 'फ्लो C: मध्यम निर्णय',
    'upload.demo2_title': 'कोई अस्वीकृति खंड उल्लिखित नहीं',
    'upload.demo2_desc': 'पत्र में खंड अनुपस्थित; विशिष्ट आधार मांग पत्र',
    'upload.demo3_tag': 'फ्लो A: मजबूत निर्णय',
    'upload.demo3_title': 'खंड एवं पॉलिसी विसंगति (मिसमैच)',
    'upload.demo3_desc': 'गैर-मौजूद खंड का उल्लेख; अपील हेतु मजबूत आधार',
    'upload.label_letter': '1. अस्वीकृति पत्र (फोटो या पीडीएफ)',
    'upload.choose_file_letter': 'फ़ाइल चुनें या यहाँ खींचें',
    'upload.hint_letter': 'पीडीएफ, जेपीजी या पीएनजी (अधिकतम 25 एमबी)',
    'upload.label_policy': '2. पॉलिसी नियम एवं शर्तें पीडीएफ',
    'upload.choose_file_policy': 'डिजिटल पॉलिसी पीडीएफ चुनें',
    'upload.hint_policy': 'बीमाकर्ता द्वारा जारी 40-80 पृष्ठों की डिजिटल पीडीएफ',
    'upload.privacy_notice_title': 'गोपनीयता सूचना:',
    'upload.privacy_notice_desc': 'दस्तावेज़ केवल इस एकल सत्र के लिए रहते हैं और विश्लेषण समाप्त होने पर हटा दिए जाते हैं। कोई भी व्यक्तिगत डेटा संगृहीत या मॉडल प्रशिक्षण के लिए उपयोग नहीं किया जाता है।',
    'upload.btn_analyzing': 'दस्तावेजों एवं आईआरडीएआई प्रावधानों का विश्लेषण हो रहा है...',
    'upload.btn_submit': 'दावे के तथ्यों का निष्कर्षण एवं सत्यापन करें',
    'upload.error_both_files': 'कृपया अस्वीकृति पत्र और पॉलिसी नियम दोनों अपलोड करें।',
    'upload.error_analysis_failed': 'विश्लेषण पूरा नहीं किया जा सका।',
    'upload.error_demo_failed': 'डेमो केस लोड करने में विफल।',

    // Confirm Page
    'confirm.step_badge': 'चरण 2 / 4: निकाले गए दावा तथ्यों की पुष्टि',
    'confirm.title': 'निकाली गई जानकारी की पुष्टि करें',
    'confirm.subtitle': 'प्रतिकार ने अस्वीकृति पत्र से मुख्य तथ्यों को निकाला है। द्वि-मार्ग नियामक मूल्यांकन से पहले इन विवरणों की समीक्षा करें।',
    'confirm.field_policyholder': 'पॉलिसीधारक का नाम',
    'confirm.fallback_policyholder': 'बीमित दावेदार',
    'confirm.field_insurer': 'बीमा कंपनी',
    'confirm.field_policy_number': 'पॉलिसी संख्या',
    'confirm.fallback_not_stated': 'पत्र में उल्लिखित नहीं',
    'confirm.field_claim_ref': 'दावा संदर्भ / डॉकेट आईडी',
    'confirm.field_disputed_amount': 'विवादित दावा राशि',
    'confirm.fallback_as_per_bills': 'अस्पताल बिल के अनुसार',
    'confirm.field_rejection_date': 'अस्वीकृति पत्र की तिथि',
    'confirm.field_tenure': 'निरंतर कवरेज अवधि',
    'confirm.months': 'महीने',
    'confirm.moratorium_met': '(≥ 60 माह अधिस्थगन पूर्ण)',
    'confirm.fallback_tenure_unknown': 'पत्र से निर्धारित नहीं किया जा सकता',
    'confirm.clause_box_title': 'बीमाकर्ता द्वारा उल्लिखित अनुबंधीय खंड',
    'confirm.clause_absent_badge': 'अनुपस्थित (फ्लो C सक्रिय)',
    'confirm.clause_present_desc': 'यह खंड आपकी पॉलिसी पीडीएफ से शब्दशः निकाला जाएगा और इसकी वैधता की जांच की जाएगी।',
    'confirm.clause_absent_desc': 'पत्र में किसी स्पष्ट पॉलिसी खंड का उल्लेख नहीं है। प्रतिकार अपनी ओर से अनुमान लगाने के बजाय आधार-मांग पत्र तैयार करेगा।',
    'confirm.stated_ground_title': 'बीमाकर्ता द्वारा दिया गया अस्वीकृति का कारण',
    'confirm.btn_back': '← अन्य दस्तावेज़ अपलोड करें',
    'confirm.btn_proceed': 'चुनौती निर्णय की ओर आगे बढ़ें',

    // Verdict Page
    'verdict.step_badge': 'चरण 3 / 4: द्वि-मार्ग मूल्यांकन पूर्ण',
    'verdict.title': 'दावा चुनौती निर्णय एवं साक्ष्य',
    'verdict.btn_restart': 'नया विश्लेषण प्रारंभ करें',
    'verdict.trail_title': 'उद्धरण-आधारित साक्ष्य मार्ग',
    'verdict.sources_count': '{count} सत्यापित स्रोत',
    'verdict.next_action_label': 'अगला कदम',
    'verdict.next_action_weak': 'अपील की अनुशंसा नहीं की जाती है। अस्वीकृति अनुबंध के अनुसार वैध है।',
    'verdict.next_action_flow_c': 'बीमाकर्ता को औपचारिक आधार-मांग पत्र भेजें।',
    'verdict.next_action_strong': 'दाखिल करने हेतु तैयार शिकायत अधिकारी (GRO) अपील दस्तावेज़ तैयार करें।',
    'verdict.next_action_weak_sub': 'वैध बहिष्करण पर अपील दायर करने से समय और धन व्यर्थ होगा।',
    'verdict.next_action_strong_sub': 'सभी कथन आपकी पॉलिसी शर्तों और आईआरडीएआई परिपत्रों से शब्दशः उद्धृत हैं।',
    'verdict.btn_draft_flow_c': 'आधार मांग पत्र का प्रारूप तैयार करें',
    'verdict.btn_draft_strong': 'आधिकारिक GRO अपील पत्र तैयार करें',
    'verdict.btn_drafting': 'अपील दस्तावेज़ तैयार किया जा रहा है...',

    // Verdict Card
    'card.two_path_badge': 'द्वि-मार्ग द्वारा सत्यापित',
    'card.reasons_title': 'निर्धारित कानूनी एवं अनुबंधीय कारण:',
    'card.strong_level': 'मजबूत (Strong)',
    'card.strong_title': 'मजबूत दावा (Strong) — चुनौती योग्य',
    'card.strong_desc': 'आईआरडीएआई नियमों या पॉलिसी शर्तों के तहत दावा अस्वीकृति अमान्य है।',
    'card.moderate_level': 'मध्यम (Moderate)',
    'card.moderate_title': 'मध्यम स्थिति (Moderate) — पुनर्विचार योग्य',
    'card.moderate_desc': 'खंड व्याख्या में अस्पष्टता या बीमाकर्ता द्वारा ठोस आधार प्रस्तुत न करना।',
    'card.weak_level': 'कमजोर (Weak)',
    'card.weak_title': 'कमजोर स्थिति (Weak) — अस्वीकृति मान्य',
    'card.weak_desc': 'पॉलिसी शर्तों और विनियमों के अनुसार दावा स्वीकार्य नहीं है। किसी अपील की अनुशंसा नहीं की जाती है।',

    // Evidence Trail
    'evidence.header_title': 'सत्यापनीय साक्ष्य मार्ग',
    'evidence.grounded_badge': '100% सत्यापित',
    'evidence.assertions_badge': 'शून्य अनसत्यापित दावे',
    'evidence.click_prompt': 'मूल पॉलिसी नियम या आईआरडीएआई विनियम की पुष्टि के लिए किसी भी उद्धरण पर क्लिक करें:',
    'evidence.policy_wording_page': 'पॉलिसी दस्तावेज़ — पृष्ठ {page}',
    'evidence.default_provision': 'आईआरडीएआई प्रावधान',
    'evidence.inspector_policy_title': 'शब्दशः पॉलिसी उद्धरण (पृष्ठ {page})',
    'evidence.inspector_circular_title': 'वैधानिक परिपत्र प्रावधान',
    'evidence.inspector_id': 'पहचान संख्या (ID): {id}',
    'evidence.note_label': 'टिप्पणी:',
    'evidence.note_policy': 'यह सटीक अंश इस सत्र में अपलोड की गई पीडीएफ से सत्यापित पृष्ठ अनुक्रमण के साथ सीधे प्राप्त किया गया है।',
    'evidence.note_circular': 'यह प्रावधान भारतीय बीमा विनियामक और विकास प्राधिकरण (IRDAI) द्वारा जारी एक बाध्यकारी नियामक आवश्यकता है।',
    'evidence.empty_inspector': 'मूल स्रोत देखने के लिए किसी साक्ष्य बिंदु का चयन करें।',

    // Non-Advice Notice
    'notices.deadlines_title': 'लागू वैधानिक समय-सीमा',
    'notices.deadline_15_days_label': '15 दिन:',
    'notices.deadline_15_days_desc': 'बीमाकर्ता GRO को लिखित रूप में शिकायत का निवारण करना अनिवार्य है।',
    'notices.deadline_1_year_label': '1 वर्ष:',
    'notices.deadline_1_year_desc': 'बीमा लोकपाल के समक्ष शिकायत दर्ज करने हेतु GRO अस्वीकृति से 1 वर्ष की अवधि।',
    'notices.non_advice_title': 'कानूनी गैर-सलाह नियामक घोषणा',
    'notices.non_advice_desc': 'प्रतिकार एक स्व-दाखिल दस्तावेज़ तैयारी इंजन है। यह औपचारिक कानूनी सलाह या प्रतिनिधित्व प्रदान नहीं करता है। सभी अपील दस्तावेज़ पॉलिसीधारक द्वारा स्वयं जांचे और जमा किए जाने चाहिए।',

    // Appeal Page
    'appeal.back_btn': 'निर्णय एवं साक्ष्य पर वापस जाएं',
    'appeal.title_flow_c': 'दावा अस्वीकृति के आधार-मांग पत्र',
    'appeal.title_gro': 'शिकायत अधिकारी (GRO) अपील पत्र',
    'appeal.subtitle': '{insurer} को सीधे जमा करने और डाउनलोड करने हेतु तैयार।',
    'appeal.doc_header_flow_c': 'दावा अस्वीकृति के विशिष्ट आधारों और खंड की मांग हेतु पत्र',
    'appeal.doc_header_gro': 'आईआरडीएआई (IRDAI) संरक्षण विनियमों के तहत औपचारिक शिकायत अपील',
    'appeal.doc_sub': 'प्रतिकार इन्शुरटेक कॉन्टेस्ट इंजन द्वारा तैयार · पॉलिसीधारक द्वारा सीधे दाखिल',
    'appeal.to': 'सेवा में,',
    'appeal.gro_designation': 'शिकायत निवारण अधिकारी (जी.आर.ओ.) / दावा विभाग',
    'appeal.subject_label': 'विषय:',
    'appeal.subject_flow_c': 'दावा अस्वीकृति के विशिष्ट अनुबंधीय खंड और आधार की मांग संदर्भ: {ref}',
    'appeal.subject_gro': 'अस्वीकृत दावे के पुनर्विचार हेतु चुनौती एवं मांग संदर्भ: {ref}',
    'appeal.claim_particulars_title': 'दावे का विवरण (CLAIM PARTICULARS)',
    'appeal.particular_name': 'पॉलिसीधारक का नाम:',
    'appeal.particular_policy_no': 'पॉलिसी संख्या:',
    'appeal.particular_claim_ref': 'दावा संदर्भ संख्या:',
    'appeal.particular_date': 'अस्वीकृति की तिथि:',
    'appeal.particular_amount': 'विवादित राशि:',
    'appeal.particular_ground': 'बीमाकर्ता द्वारा उल्लिखित आधार:',
    'appeal.statutory_grounds_title': 'अपील के वैधानिक एवं अनुबंधीय आधार:',
    'appeal.evidence_citations_title': 'साक्ष्य एवं उद्धरण:',
    'appeal.source_label': 'स्रोत:',
    'appeal.demand_label': 'निवारण की मांग:',
    'appeal.demand_text_1': 'आईआरडीएआई नियमों के तहत, बीमाकर्ता को 15 कैलेंडर दिनों के भीतर इस शिकायत का लिखित रूप से निपटारा करना अनिवार्य है।',
    'appeal.demand_text_2': 'यदि इस शिकायत का संतोषजनक समाधान नहीं होता है, तो बिना किसी अग्रिम सूचना के बीमा लोकपाल नियम, 2017 के नियम 14 के तहत मामले को बीमा लोकपाल के समक्ष प्रस्तुत किया जाएगा।',
    'appeal.signoff_yours': 'भवदीय,',
    'appeal.signoff_role': 'पॉलिसीधारक / बीमित दावेदार',
    'appeal.signoff_date': 'दिनांक: {date}',
    'appeal.btn_download': 'दाखिल करने हेतु तैयार PDF डाउनलोड करें',
    'appeal.btn_downloading': 'PDF तैयार किया जा रहा है...',
    'appeal.btn_dispose': 'सत्र समाप्त करें एवं दस्तावेज़ हटाएं',
    'appeal.confirm_disposal': 'यह आपके अपलोड किए गए दस्तावेजों और सत्र रिकॉर्ड को प्रतिकार स्टोरेज से स्थायी रूप से हटा देगा। क्या आप जारी रखना चाहते हैं?',
    'appeal.not_applicable': 'लागू नहीं',
    'appeal.refer_enclosed': 'संलग्न पॉलिसी देखें',
    'appeal.insured_claimant': 'बीमित दावेदार',
    'appeal.as_per_bills': 'अस्पताल बिल के अनुसार',
  },
};

/**
 * Domain-specific dynamic sentence & phrase mappings for verdict summaries,
 * reasons, evidence items, and insurer grounds.
 */
export const DYNAMIC_HINDI_MAPPINGS: Record<string, string> = {
  // Demo Case 1 (Strong Verdict)
  "The insurer's repudiation violates binding IRDAI regulations. After 60 continuous months of coverage, claims cannot be contested for pre-existing disease or non-disclosure.":
    "बीमाकर्ता की अस्वीकृति बाध्यकारी आईआरडीएआई नियमों का उल्लंघन करती है। लगातार 60 महीनों के कवरेज के बाद, पहले से मौजूद बीमारी या गैर-प्रकटीकरण के आधार पर दावों को चुनौती नहीं दी जा सकती।",
  "The insurer rejected the claim citing pre-existing condition or non-disclosure, but the policy has completed 65 months of continuous coverage. Under IRDAI Master Circular 2024 cl. 13, the moratorium period of 60 months has elapsed, making the policy and claim incontestable on these grounds.":
    "बीमाकर्ता ने पहले से मौजूद स्थिति या गैर-प्रकटीकरण का हवाला देकर दावा खारिज कर दिया, लेकिन पॉलिसी ने निरंतर कवरेज के 65 महीने पूरे कर लिए हैं। आईआरडीएआई मास्टर परिपत्र 2024 खंड 13 के तहत, 60 महीने की अधिस्थगन (मोराटोरियम) अवधि समाप्त हो चुकी है, जिससे यह पॉलिसी और दावा इन आधारों पर चुनौती से परे है।",
  "Policy Clause 4.2 operates subject to statutory IRDAI moratorium limits which override restrictive policy wording.":
    "पॉलिसी खंड 4.2 वैधानिक आईआरडीएआई अधिस्थगन सीमाओं के अधीन संचालित होता है जो प्रतिबंधात्मक पॉलिसी शर्तों से ऊपर है।",
  "The policy has completed 65 continuous months of coverage, exceeding the 60-month statutory moratorium.":
    "पॉलिसी ने कवरेज के 65 निरंतर महीने पूरे कर लिए हैं, जो 60 महीने के वैधानिक अधिस्थगन से अधिक है।",
  "Policy Clause 4.2 retrieved verbatim from Page 14 of Star Health Comprehensive Policy Wording.":
    "पॉलिसी खंड 4.2 स्टार हेल्थ व्यापक पॉलिसी दस्तावेज़ के पृष्ठ 14 से शब्दशः प्राप्त किया गया।",
  "Repudiation under Clause 4.2: Pre-existing condition (Essential Hypertension & Cardiac history) not disclosed at inception.":
    "खंड 4.2 के तहत अस्वीकृति: प्रारंभ में पहले से मौजूद स्थिति (हाइपरटेंशन और कार्डियक इतिहास) का प्रकटीकरण नहीं किया गया।",

  // Demo Case 2 (Weak Verdict)
  "The insurer's rejection is legally valid under IRDAI standard terms and policy wording. No appeal is recommended.":
    "आईआरडीएआई मानक शर्तों और पॉलिसी नियमों के तहत बीमाकर्ता की अस्वीकृति कानूनी रूप से मान्य है। किसी अपील की अनुशंसा नहीं की जाती है।",
  "The claim occurred within the first 30 days of policy inception (0 months / 12 days elapsed) for an illness, which is validly excluded under standard policy terms and IRDAI regulations unless caused by an accident.":
    "यह दावा किसी बीमारी के लिए पॉलिसी शुरू होने के पहले 30 दिनों (0 महीने / 12 दिन व्यतीत) के भीतर हुआ, जो मानक पॉलिसी शर्तों और आईआरडीएआई नियमों के तहत दुर्घटना के बिना मान्य रूप से अपवर्जित है।",
  "Policy Clause 4.1 explicitly excludes treatment of illnesses diagnosed during the first 30 days.":
    "पॉलिसी खंड 4.1 पहले 30 दिनों के दौरान निदान की गई बीमारियों के उपचार को स्पष्ट रूप से बाहर रखता है।",
  "Initial 30-day exclusion is an approved standard regulatory waiting period.":
    "प्रारंभिक 30-दिवसीय अपवर्जन एक स्वीकृत मानक नियामक प्रतीक्षा अवधि है।",
  "Policy Clause 4.1 retrieved verbatim from Page 9 of Care Health Policy Wording.":
    "पॉलिसी खंड 4.1 केयर हेल्थ पॉलिसी दस्तावेज़ के पृष्ठ 9 से शब्दशः प्राप्त किया गया।",
  "Repudiation under Clause 4.1: Claim reported within the initial 30 days waiting period for non-accidental illness.":
    "खंड 4.1 के तहत अस्वीकृति: गैर-दुर्घटना बीमारी के लिए प्रारंभिक 30 दिनों की प्रतीक्षा अवधि के भीतर दावा दर्ज किया गया।",

  // Demo Case 3 (Flow C)
  "Your insurer has repudiated the claim without citing the specific clause or medical ground relied upon. A formal Request-for-Grounds letter is prepared.":
    "आपके बीमाकर्ता ने किसी विशिष्ट खंड या चिकित्सीय आधार का हवाला दिए बिना दावे को अस्वीकार कर दिया है। विशिष्ट आधारों की मांग हेतु एक औपचारिक पत्र तैयार किया गया है।",
  "Your insurer has not stated which clause it relied on. Under IRDAI regulations, an insurer must state specific contractual grounds with clause citations.":
    "आपके बीमाकर्ता ने यह नहीं बताया है कि उसने किस खंड पर भरोसा किया। आईआरडीएआई नियमों के तहत, बीमाकर्ता को खंड संदर्भों के साथ विशिष्ट अनुबंधीय आधार बताना अनिवार्य है।",
  "A written demand for specific grounds and investigation findings has been generated.":
    "विशिष्ट आधारों और जांच निष्कर्षों की लिखित मांग तैयार की गई है।",
  "Insurers are mandated to convey clear and reasoned grounds for claim repudiation.":
    "बीमाकर्ताओं के लिए दावा अस्वीकृति के स्पष्ट और तर्कसंगत आधार बताना अनिवार्य है।",
  "Claim repudiated as per terms and conditions of policy.":
    "पॉलिसी के नियमों और शर्तों के अनुसार दावा खारिज कर दिया गया।",

  // General Legal & Insurance Phrases
  "IRDAI Master Circular 2024 cl. 13 / Moratorium Clause":
    "आईआरडीएआई मास्टर परिपत्र 2024 खंड 13 / अधिस्थगन (मोराटोरियम) खंड",
  "IRDAI Master Circular 2024 / Standard Health Policy Terms cl. 4.1":
    "आईआरडीएआई मास्टर परिपत्र 2024 / मानक स्वास्थ्य पॉलिसी शर्तें खंड 4.1",
  "IRDAI Master Circular on Operations 2024 cl. 6 / Claim Settlement Norms":
    "आईआरडीएआई मास्टर परिपत्र 2024 खंड 6 / दावा निपटान मानदंड",
  "IRDAI Policyholder Protection / Claim Repudiation Norms":
    "आईआरडीएआई पॉलिसीधारक संरक्षण / दावा अस्वीकृति मानदंड",
};

/**
 * Resolves a translation key with optional interpolation parameters.
 */
export function t(key: string, lang: Language = 'en', params?: Record<string, string | number>): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = (dictionary as Record<string, string>)[key] || (TRANSLATIONS.en as Record<string, string>)[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, val]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    });
  }

  return text;
}

/**
 * Translates dynamic server-generated text (verdict summary, reasons, evidence statements)
 * into Hindi if target language is 'hi'. Passes through original if English or unmapped.
 */
export function translateDynamic(text: string, lang: Language = 'en'): string {
  if (lang !== 'hi' || !text) {
    return text;
  }

  // Exact match first
  if (DYNAMIC_HINDI_MAPPINGS[text]) {
    return DYNAMIC_HINDI_MAPPINGS[text];
  }

  // Substring replacement for composable phrases
  let result = text;
  for (const [enPhrase, hiPhrase] of Object.entries(DYNAMIC_HINDI_MAPPINGS)) {
    if (result.includes(enPhrase)) {
      result = result.replace(enPhrase, hiPhrase);
    }
  }

  return result;
}
