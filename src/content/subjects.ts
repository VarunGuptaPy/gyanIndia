// Editorial content for subjects. Subject availability and fees live in the database;
// this file holds descriptive copy and the INDICATIVE focus areas shown on the website.
// The official syllabus has not been published — every page using this content must say so.

export type SubjectContent = {
  slug: string;
  name: string;
  nameHi: string;
  icon: "english" | "maths" | "science" | "gk" | "reasoning" | "computer" | "ai";
  short: string;
  intro: string;
  skills: string[];
  bands: { label: string; topics: string[] }[];
};

export const CLASS_BANDS = ["Classes 1–2", "Classes 3–5", "Classes 6–8", "Classes 9–10"] as const;

export const SUBJECT_CONTENT: SubjectContent[] = [
  {
    slug: "english",
    name: "English",
    nameHi: "अंग्रेज़ी",
    icon: "english",
    short: "Reading comprehension, vocabulary, grammar and the confident use of language.",
    intro:
      "The English paper looks at how well a student understands and uses the language — reading with meaning, choosing words precisely and applying grammar naturally rather than by rote.",
    skills: ["Reading comprehension", "Vocabulary in context", "Grammar and usage", "Sentence construction"],
    bands: [
      { label: "Classes 1–2", topics: ["Alphabet, phonics and simple words", "Naming and action words", "Singular and plural", "Short picture-based comprehension"] },
      { label: "Classes 3–5", topics: ["Nouns, pronouns, verbs, adjectives", "Tenses in everyday use", "Synonyms, antonyms and spellings", "Short passage comprehension"] },
      { label: "Classes 6–8", topics: ["Active and passive voice", "Direct and indirect speech", "Idioms and phrasal verbs", "Unseen passages and inference"] },
      { label: "Classes 9–10", topics: ["Advanced grammar and error spotting", "Sentence transformation", "Vocabulary in context", "Critical reading of prose and poetry"] },
    ],
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    nameHi: "गणित",
    icon: "maths",
    short: "Number sense, problem solving and mathematical reasoning across topics.",
    intro:
      "The Mathematics paper rewards understanding over memorisation. Questions are designed to test whether students can reason with numbers, shapes and patterns and apply concepts to unfamiliar problems.",
    skills: ["Number sense", "Problem solving", "Spatial reasoning", "Data interpretation"],
    bands: [
      { label: "Classes 1–2", topics: ["Counting and place value", "Addition and subtraction", "Shapes and patterns", "Time, money and measurement"] },
      { label: "Classes 3–5", topics: ["Multiplication and division", "Fractions and decimals", "Perimeter and area", "Data handling with tables and bar graphs"] },
      { label: "Classes 6–8", topics: ["Integers and rational numbers", "Ratio, proportion and percentage", "Algebraic expressions and simple equations", "Geometry, mensuration and data"] },
      { label: "Classes 9–10", topics: ["Polynomials and linear equations", "Coordinate geometry and triangles", "Surface area and volume", "Statistics and probability"] },
    ],
  },
  {
    slug: "science",
    name: "Science",
    nameHi: "विज्ञान",
    icon: "science",
    short: "Scientific concepts, observation and the application of ideas to everyday life.",
    intro:
      "The Science paper encourages curiosity. It looks at how students observe the world, connect cause and effect, and apply scientific ideas from physics, chemistry and biology to real situations.",
    skills: ["Conceptual understanding", "Observation and inference", "Application to daily life", "Scientific vocabulary"],
    bands: [
      { label: "Classes 1–2", topics: ["Plants and animals around us", "Our body and senses", "Food, water and shelter", "Weather and seasons"] },
      { label: "Classes 3–5", topics: ["Living and non-living things", "Matter and materials", "Force, work and energy basics", "Environment and conservation"] },
      { label: "Classes 6–8", topics: ["Cells, nutrition and reproduction", "Motion, light, sound and electricity", "Acids, bases and chemical changes", "Natural resources and pollution"] },
      { label: "Classes 9–10", topics: ["Laws of motion, work and energy", "Atoms, molecules and chemical reactions", "Life processes and heredity", "Light, electricity and magnetism"] },
    ],
  },
  {
    slug: "general-knowledge",
    name: "General Knowledge",
    nameHi: "सामान्य ज्ञान",
    icon: "gk",
    short: "Awareness of India and the world — history, geography, culture, sport and current affairs.",
    intro:
      "The General Knowledge paper celebrates awareness and curiosity about India and the world, including history, geography, civic life, culture, science in society, sport and age-appropriate current affairs.",
    skills: ["Awareness of India and the world", "Current affairs", "Culture and heritage", "Civic understanding"],
    bands: [
      { label: "Classes 1–2", topics: ["Our national symbols", "Festivals of India", "Animals, birds and plants", "Community helpers"] },
      { label: "Classes 3–5", topics: ["States, capitals and landmarks", "Famous personalities", "Sports and games", "Inventions and discoveries"] },
      { label: "Classes 6–8", topics: ["Indian history and freedom movement", "World geography", "The Constitution and civic life", "Age-appropriate current affairs"] },
      { label: "Classes 9–10", topics: ["Indian polity and economy basics", "World organisations", "Science and technology in the news", "Art, literature and heritage"] },
    ],
  },
  {
    slug: "logical-reasoning",
    name: "Logical Reasoning",
    nameHi: "तार्किक क्षमता",
    icon: "reasoning",
    short: "Patterns, sequences, analogies and structured thinking — no prior syllabus needed.",
    intro:
      "Logical Reasoning measures how a student thinks rather than what they have memorised. Questions involve patterns, sequences, classification, analogies and visual puzzles.",
    skills: ["Pattern recognition", "Verbal reasoning", "Non-verbal reasoning", "Analytical thinking"],
    bands: [
      { label: "Classes 1–2", topics: ["Odd one out", "Simple patterns", "Matching and grouping", "Spatial awareness"] },
      { label: "Classes 3–5", topics: ["Number and letter series", "Analogies", "Mirror and water images", "Direction sense"] },
      { label: "Classes 6–8", topics: ["Coding–decoding", "Blood relations", "Ranking and ordering", "Figure completion"] },
      { label: "Classes 9–10", topics: ["Syllogisms", "Statements and conclusions", "Data sufficiency", "Puzzles and seating arrangement"] },
    ],
  },
  {
    slug: "computer-applications",
    name: "Computer Applications",
    nameHi: "कंप्यूटर अनुप्रयोग",
    icon: "computer",
    short: "Digital literacy, computer fundamentals and computational thinking.",
    intro:
      "The Computer Applications paper looks at digital literacy and computational thinking — how computers work, how we use them responsibly and how problems can be broken into logical steps.",
    skills: ["Computer fundamentals", "Digital literacy", "Computational thinking", "Safe and responsible use"],
    bands: [
      { label: "Classes 1–2", topics: ["Parts of a computer", "Uses of computers", "Mouse and keyboard", "Taking care of devices"] },
      { label: "Classes 3–5", topics: ["Input and output devices", "Files and folders", "Introduction to the internet", "Online safety"] },
      { label: "Classes 6–8", topics: ["Word processing and spreadsheets", "Algorithms and flowcharts", "Introduction to block coding", "Cyber safety and etiquette"] },
      { label: "Classes 9–10", topics: ["Networks and the internet", "Programming concepts", "Databases basics", "Cyber ethics and data privacy"] },
    ],
  },
  {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence",
    nameHi: "कृत्रिम बुद्धिमत्ता",
    icon: "ai",
    short: "An introduction to how AI works, where it is used and how to use it responsibly.",
    intro:
      "The Artificial Intelligence paper introduces students to the ideas behind AI — how machines learn from data, where AI appears in daily life and why fairness and responsibility matter.",
    skills: ["AI awareness", "Data and patterns", "Problem framing", "Ethics and responsible use"],
    bands: [
      { label: "Classes 1–2", topics: ["Smart machines around us", "Humans and machines", "Sorting and grouping", "Following instructions"] },
      { label: "Classes 3–5", topics: ["What is AI?", "AI in daily life", "Patterns and predictions", "Being safe with technology"] },
      { label: "Classes 6–8", topics: ["How machines learn from data", "Computer vision and speech", "AI project cycle", "Bias and fairness"] },
      { label: "Classes 9–10", topics: ["Supervised and unsupervised learning", "Natural language processing basics", "Evaluating AI models", "AI ethics and society"] },
    ],
  },
];

export function subjectContent(slug: string) {
  return SUBJECT_CONTENT.find((s) => s.slug === slug);
}
