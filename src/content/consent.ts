// Versioned guardian consent text. A SHA-256 hash of this text is stored with every
// consent record, so any change must also bump CONSENT_VERSION in src/lib/site.ts.
// DRAFT — requires review by a qualified legal professional before live registration.

export const CONSENT_TEXT = `I confirm that I am the parent or lawful guardian of the student being registered and that I am at least 18 years of age.

I consent to GYAN — Global Young Achievers Network processing the personal data I provide about my child and myself (names, class, board, school, city, state, examination language and my contact details) for the limited purposes of registering my child for the National Talent Hunt Examination, conducting the examination, issuing admit cards, publishing results and rankings to me, issuing certificates and communicating with me about the examination.

I understand that GYAN will not use my child's data for behavioural tracking or targeted advertising, will not sell it, and will not publicly display my child's full name or school without separate consent. I may request access, correction or erasure of the data, or withdraw consent, by writing to admin@gyanindia.com. Withdrawing consent may prevent my child's participation.`;

export const CONSENT_SUMMARY = [
  "I am the parent or lawful guardian of this student and at least 18 years old.",
  "I consent to GYAN processing my child's and my details only to conduct NTHE 2026 — registration, admit cards, results, rankings and certificates.",
  "GYAN will not sell this data, use it for advertising, or publish my child's full name or school without separate consent.",
];
