import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero, Section } from "@/components/site/section";
import { availableSubjects, getCurrentExam, isRegistrationOpen } from "@/lib/exam";
import { formatPaise } from "@/lib/fees";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { notFound } from "next/navigation";

export const metadata = {
  ...pageMetadata({
    title: "राष्ट्रीय प्रतिभा खोज परीक्षा 2026 — हिंदी में जानकारी",
    description: "GYAN की राष्ट्रीय प्रतिभा खोज परीक्षा (NTHE) 2026 की मुख्य जानकारी हिंदी में।",
    path: "/hi",
  }),
};

// A Hindi summary page. The rest of the website (including registration forms) is
// currently available in English only — this page says so explicitly.
export default async function HindiPage() {
  const exam = await getCurrentExam();
  if (!exam) notFound();
  const subjects = availableSubjects(exam);
  const open = isRegistrationOpen(exam);
  return (
    <div lang="hi">
      <PageHero
        eyebrow="हिंदी में जानकारी"
        title="हर बच्चे में प्रतिभा है। हर प्रतिभा को अवसर मिलना चाहिए।"
        lede="GYAN की राष्ट्रीय प्रतिभा खोज परीक्षा (NTHE) 2026 के माध्यम से अपनी क्षमता को पहचानें, अपने ज्ञान को परखें और राष्ट्रीय स्तर पर पहचान की ओर कदम बढ़ाएँ।"
        crumbs={[{ label: "हिंदी" }]}
      />
      <Section tone="white">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="display-md">परीक्षा एक नज़र में</h2>
            <dl className="mt-6 divide-y divide-line rounded-[var(--radius-xl)] border border-line bg-paper px-6">
              {[
                ["परीक्षा", "राष्ट्रीय प्रतिभा खोज परीक्षा 2026"],
                ["आयोजक", "GYAN — ग्लोबल यंग अचीवर्स नेटवर्क"],
                ["तिथि", "12 दिसंबर 2026"],
                ["माध्यम", "ऑफ़लाइन (परीक्षा केंद्रों पर)"],
                ["भाषाएँ", "अंग्रेज़ी और हिंदी"],
                ["पात्रता (प्रस्तावित)", `कक्षा ${exam.eligibleClassMin} से ${exam.eligibleClassMax}`],
                ["बोर्ड (प्रस्तावित)", "CBSE, ICSE और UP बोर्ड"],
                ["पंजीकरण शुल्क", `${formatPaise(exam.registrationFeePaise)} (एक बार)`],
                ["विषय शुल्क", `${formatPaise(subjects[0]?.feePaise ?? 25000)} प्रति विषय`],
                ["पुरस्कार", "विषयवार राष्ट्रीय रैंकिंग"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 py-3.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-semibold text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-8">
            <div>
              <h2 className="display-md">प्रस्तावित विषय</h2>
              <ul className="mt-6 grid grid-cols-2 gap-3">
                {subjects.map((s) => (
                  <li key={s.id} className="rounded-xl border border-line bg-white px-4 py-3 font-semibold text-navy">{s.subject.nameHi}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--radius-xl)] border border-line bg-paper p-6">
              <h2 className="text-lg font-bold">शुल्क की गणना</h2>
              <p className="mt-2 text-ink/80">कुल शुल्क = ₹50 + (₹250 × विषयों की संख्या)। उदाहरण: 1 विषय ₹300, 3 विषय ₹800, सभी 7 विषय ₹1,800।</p>
            </div>
            <div className="rounded-[var(--radius-xl)] border border-gold/40 bg-gold-50 p-6 text-sm text-navy">
              <p className="font-semibold">कृपया ध्यान दें</p>
              <p className="mt-1">पंजीकरण फ़ॉर्म और वेबसाइट के अन्य पृष्ठ अभी केवल अंग्रेज़ी में उपलब्ध हैं। परीक्षा की अवधि, प्रश्नों की संख्या और अंकन योजना की घोषणा शीघ्र की जाएगी। सहायता के लिए {SITE.phone} पर संपर्क करें।</p>
            </div>
            <Button asChild size="lg">
              <Link href={open ? "/register" : "/nthe-2026"}>{open ? "पंजीकरण करें (अंग्रेज़ी फ़ॉर्म)" : "परीक्षा का विवरण देखें"}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
