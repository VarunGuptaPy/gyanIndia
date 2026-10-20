export const SITE = {
  shortName: "GYAN",
  name: "GYAN — Global Young Achievers Network",
  fullName: "Global Young Achievers Network",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gyanindia.com").replace(/\/$/, ""),
  displayUrl: "www.gyanindia.com",
  tagline: "Discover Talent. Inspire Excellence. Empower Tomorrow.",
  secondaryTagline: "Every Child Has a Talent. Every Talent Deserves a Chance.",
  hindiTagline: "प्रतिभा की पहचान, उत्कृष्टता को सम्मान।",
  email: "admin@gyanindia.com",
  enquiryEmail: "enquiry@gyanindia.com",
  phone: "+91-73 4800 4848",
  phoneHref: "tel:+917348004848",
  offices: [
    {
      label: "Head Office",
      lines: ["5th Floor, AIPL Business Park", "Sector 62, Gurugram", "Haryana, India"],
    },
    {
      label: "Regional Office",
      lines: ["2nd Floor, Cyber Heights", "Gomti Nagar, Lucknow", "Uttar Pradesh, India"],
    },
  ],
} as const;

export const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About GYAN" },
  { href: "/nthe-2026", label: "NTHE 2026" },
  { href: "/subjects", label: "Subjects" },
  { href: "/awards", label: "Awards" },
  { href: "/schools", label: "Schools" },
  { href: "/contact", label: "Contact" },
] as const;

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export const ENQUIRY_CATEGORIES = [
  "Student registration",
  "Payments and refunds",
  "Admit card or examination centre",
  "Results and certificates",
  "School partnership",
  "General enquiry",
] as const;

export const CONSENT_VERSION = "2026-10-draft-1";
