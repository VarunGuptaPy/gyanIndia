export type Faq = { q: string; a: string };

export const FAQ_GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: "About the examination",
    items: [
      {
        q: "What is the National Talent Hunt Examination (NTHE) 2026?",
        a: "NTHE 2026 is GYAN's national-level talent examination for school students. It gives students an opportunity to test their knowledge in individual subjects, understand their strengths and compete for subject-wise national recognition.",
      },
      {
        q: "When will the examination be held?",
        a: "NTHE 2026 is scheduled for 12 December 2026. It will be conducted offline (pen and paper) at examination centres. Reporting time and centre details will appear on the admit card.",
      },
      {
        q: "Who can participate?",
        a: "The examination is proposed for students of Classes 1 to 10 from CBSE, ICSE and UP Board schools. Final eligibility will be confirmed by GYAN and shown on the NTHE 2026 page.",
      },
      {
        q: "In which languages can students write the examination?",
        a: "Students may choose English or Hindi as their examination language at the time of registration.",
      },
      {
        q: "What is the question pattern, duration and marking scheme?",
        a: "The duration, number of questions, marking scheme and negative marking policy have not yet been finalised. They will be published on the NTHE 2026 page before admit cards are released.",
      },
    ],
  },
  {
    title: "Registration and fees",
    items: [
      {
        q: "How much does it cost to register?",
        a: "There is a one-time registration fee of ₹50, plus ₹250 for each subject selected. For example, one subject costs ₹300 in total and three subjects cost ₹800. Any applicable taxes or gateway charges will be shown clearly before payment.",
      },
      {
        q: "Can a student take more than one subject?",
        a: "Yes. A student may select any number of the available subjects. Each subject is assessed and ranked separately.",
      },
      {
        q: "Who should fill in the registration form?",
        a: "Because participants are minors, registration must be completed by a parent or legal guardian, who creates the account, gives consent and manages the student's details.",
      },
      {
        q: "Can I register more than one child?",
        a: "Yes. Log in to your guardian account and start a new registration for each child. Each child receives a separate registration number.",
      },
      {
        q: "When is my registration confirmed?",
        a: "Your registration is confirmed only after GYAN's payment system has verified your payment. You will then see a registration number on your dashboard and, where email is enabled, receive a confirmation email.",
      },
      {
        q: "What if my payment failed or money was deducted but the registration is still pending?",
        a: "Payments are verified directly with the payment gateway, which can occasionally take a few minutes. If the status does not update, please contact us with the time of payment and do not pay again unless the dashboard asks you to.",
      },
    ],
  },
  {
    title: "Admit cards, results and certificates",
    items: [
      {
        q: "When will admit cards be available?",
        a: "Admit cards will be released on the student dashboard after examination centres and reporting times are finalised. We will notify registered guardians when they are available.",
      },
      {
        q: "How will results be announced?",
        a: "Results will be available privately on the student dashboard. Subject-wise national rankings will be shown once approved and published by GYAN.",
      },
      {
        q: "How can a certificate be verified?",
        a: "Every GYAN certificate carries a unique certificate number and QR code. Anyone can confirm its authenticity on the Certificate Verification page. To protect privacy, the page displays only the student's initials.",
      },
    ],
  },
];

export const HOME_FAQS: Faq[] = [
  FAQ_GROUPS[0].items[0],
  FAQ_GROUPS[0].items[2],
  FAQ_GROUPS[1].items[0],
  FAQ_GROUPS[1].items[2],
  FAQ_GROUPS[2].items[0],
  FAQ_GROUPS[0].items[4],
];
