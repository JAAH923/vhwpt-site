export type Concept = {
  id: string;
  name: string;
  tone: string;
  eyebrow: string;
  headline: string;
  lede: string;
  bodyClass: string;
  heroMode: "logo-led" | "headshot-led" | "split" | "soft" | "editorial";
  servicesIntro: string;
  doctorLine: string;
  summary: string;
};

export const concepts: Concept[] = [
  {
    id: "1",
    name: "Clinical Noir",
    tone: "Cinematic, dark, precise",
    eyebrow: "Doctor-led performance",
    headline: "Move with clinical confidence.",
    lede: "Health evaluations, personal training, and online coaching designed through a physical therapy lens.",
    bodyClass: "v1",
    heroMode: "logo-led",
    servicesIntro: "A restrained, premium path from evaluation to movement strategy.",
    doctorLine: "The plan changes when the coach understands the body clinically.",
    summary: "Dark, cinematic, restrained, close to the current premium editorial direction.",
  },
  {
    id: "2",
    name: "White Glove",
    tone: "Clean, clinical, human",
    eyebrow: "Dr. Bruce Valencia, DPT / CLT",
    headline: "Better movement starts with a better read.",
    lede: "A clean, personal wellness experience led by a clinician who can evaluate, coach, and progress the plan with care.",
    bodyClass: "v2",
    heroMode: "headshot-led",
    servicesIntro: "Quiet confidence, clear structure, and Bruce in the first position.",
    doctorLine: "A premium health plan should feel personal before it feels technical.",
    summary: "Clean white clinical premium with Bruce's headshot leading the first viewport.",
  },
  {
    id: "3",
    name: "Performance Club",
    tone: "Athletic, bold, premium",
    eyebrow: "Strength with clinical standards",
    headline: "Train like progress has a plan.",
    lede: "For people who want the energy of fitness with the precision of physical therapy-informed coaching.",
    bodyClass: "v3",
    heroMode: "split",
    servicesIntro: "Performance energy without losing credibility.",
    doctorLine: "Strength work gets sharper when movement quality stays in the room.",
    summary: "Luxury fitness energy with bold contrast, confident movement language, and punchier CTAs.",
  },
  {
    id: "4",
    name: "Calm Care",
    tone: "Soft, reassuring, trustworthy",
    eyebrow: "Health, wellness, and guidance",
    headline: "Feel clear about your next step.",
    lede: "A calmer way to begin training, evaluation, or online coaching with expert support and less guesswork.",
    bodyClass: "v4",
    heroMode: "soft",
    servicesIntro: "Gentle pacing, high trust, and approachable expertise.",
    doctorLine: "Clinical care can feel calm, direct, and deeply human.",
    summary: "Soft healthcare trust, personal reassurance, and gentle wellness pacing.",
  },
  {
    id: "5",
    name: "Practitioner Editorial",
    tone: "Editorial, sparse, authoritative",
    eyebrow: "Valencia Health & Wellness",
    headline: "The body is the brief.",
    lede: "A practitioner-led brand story about evaluation, training, and durable strength.",
    bodyClass: "v5",
    heroMode: "editorial",
    servicesIntro: "A magazine-like page with bold type, less UI, and more point of view.",
    doctorLine: "Bruce's role is not just to train. It is to interpret what movement is saying.",
    summary: "Magazine-like brand story with large typography, minimal UI, and focused authority.",
  },
];
