/** Shared site data. Anything appearing on more than one page lives here. */

export const practice = {
  name: "Valencia Health & Wellness",
  legalName: "Valencia Health and Wellness, LLC",
  doctor: "Dr. Bruce Valencia, DPT",
  phone: "1-954-299-6536",
  phoneHref: "tel:19542996536",
  email: "info@vhwpt.com",
  region: "Broward & Palm Beach County",
  regionLong: "Broward and Palm Beach County",
};

export const credentials = [
  "Doctor of Physical Therapy (DPT)",
  "Certified Lymphedema Therapist (CLT), ACOLS",
  "Dry Needling Certification, Athletic Dry Needling Group",
  "ISSA-Certified Personal Trainer",
  "ISSA Specialist in Strength and Conditioning",
  "Sport Lifestyle Fitness Coach",
  "U.S. Navy Veteran",
];

/** The short credential row used in labels (Home, About). */
export const credentialLine =
  "DPT · CLT · Dry Needling · ISSA-CPT · ISSA Strength and Conditioning";

export const nav = [
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Book", href: "/book" },
];

/**
 * The three actions every hero and closing offers. Physical therapy and
 * wellness are booked separately (insurance compliance), so each has its own
 * button; both land on /book with the matching option picked. "Ask a
 * question" goes to the phone and email block on /book.
 */
export const actions = {
  pt: { label: "Book an evaluation", href: "/book?for=pt" },
  wellness: { label: "Book a wellness screening", href: "/book?for=wellness" },
  question: { label: "Ask a question", href: "/book#call" },
};

/**
 * Physical therapy and wellness stay clearly separate on every page, for
 * insurance compliance. Every service belongs to exactly one group.
 */
export const groups = [
  { id: "pt", label: "Physical therapy" },
  { id: "wellness", label: "Wellness and training" },
] as const;

export type GroupId = (typeof groups)[number]["id"];

/**
 * The service line. `anchor` is the section id on /services — these are
 * sections of one deep page, not separate pages. A section earns its own URL
 * only once it has enough of its own content to justify one; the first visit
 * is the one that does. `testimonial` names the client quote shown with it.
 */
export const services: {
  anchor: string;
  group: GroupId;
  title: string;
  /** A short tag shown beside the title, such as Virtual Training's scope. */
  tag?: string;
  lede: string;
  body: string;
  covers: string[];
  testimonial?: string;
}[] = [
  {
    anchor: "rehab",
    group: "pt",
    title: "Rehabilitation & Recovery",
    lede:
      "Getting back to normal after an injury or an operation, at the pace your body actually allows.",
    body:
      "Recovery rarely ends when the discharge paperwork does. Programs here are built around where you are now, progressed as you earn it, and coordinated with the surgeon or physician already managing your care.",
    covers: [
      "Total knee, hip and back surgery recovery",
      "Parkinson's and neurological conditions",
      "Injury rehabilitation",
      "Strength and range of motion",
      "Swelling and lymphatic care",
    ],
    testimonial: "Paul Duffe",
  },
  {
    anchor: "balance",
    group: "pt",
    title: "Balance & Fall Prevention",
    lede: "Skilled therapy for balance, walking and fall risk, in your home or care facility.",
    body:
      "Falls rarely come from one cause. Bruce looks at strength, balance, walking and the home itself, then builds a plan for each piece, coordinated with your physician.",
    covers: [
      "Balance and gait training",
      "Fall risk assessment",
      "Home safety review",
      "Assistive device training",
      "Strength for transfers and stairs",
    ],
  },
  {
    anchor: "senior",
    group: "wellness",
    title: "Senior Fitness",
    lede:
      "Staying steady on your feet, and keeping the strength that independence depends on.",
    body:
      "Low-impact, supervised, and adjusted every session. The goal is rarely a number in the gym. It is carrying groceries, managing stairs, and not being afraid of a fall.",
    covers: [
      "Balance and steadiness",
      "Mobility and walking",
      "Strength for daily tasks",
    ],
    testimonial: "Howard Kurpit",
  },
  {
    anchor: "training",
    group: "wellness",
    title: "Personal Training",
    lede: "One-to-one coaching, built on a wellness screening rather than a template.",
    body:
      "Every plan starts by looking at how you move. What follows is programming for your goals, your schedule and your history, adjusted as you progress, in person or virtually.",
    covers: [
      "Strength and conditioning",
      "Prehab and injury prevention",
      "Movement quality",
      "Training around an old injury",
      "Endurance and stamina",
    ],
    testimonial: "Brendan Meehan",
  },
  {
    anchor: "weight",
    group: "wellness",
    title: "Weight Loss & Nutrition",
    lede: "Body composition and metabolic health, handled together rather than separately.",
    body:
      "Training paired with practical nutrition guidance and regular reassessment, so progress is measured rather than assumed. Long-term clients have stayed with it for years.",
    covers: [
      "Body composition",
      "Metabolic health markers",
      "Practical nutrition guidance",
      "Habits that survive the year",
    ],
    testimonial: "Olga & Ozzie Brannon",
  },
  {
    anchor: "youth",
    group: "wellness",
    title: "Youth Sports Conditioning",
    lede: "Athletic development for young athletes, starting with how they move.",
    body:
      "Mechanics before intensity. Young athletes get stronger and more durable when the movement underneath is sound, which also lowers the risk of injury.",
    covers: [
      "Movement mechanics",
      "Sport-specific conditioning",
      "Durability and injury prevention",
      "Strength for growing athletes",
    ],
  },
  {
    anchor: "prenatal",
    group: "wellness",
    title: "Pre & Postnatal Fitness",
    lede: "Programming through pregnancy and the months after it.",
    body:
      "Modified as things change, trimester by trimester and through recovery, with the intent of keeping you active safely rather than benching you.",
    covers: [
      "Training through pregnancy",
      "Postnatal return to activity",
      "Core and pelvic strength",
      "Appropriate modifications",
    ],
  },
  {
    anchor: "virtual",
    group: "wellness",
    title: "Virtual Training",
    tag: "Wellness only · Nationwide",
    lede: "The same coaching, from anywhere in the country.",
    body:
      "Sessions run live over video, on the same assess, plan and progress structure as in-person work. It suits people who travel, people outside South Florida, and anyone whose schedule will not survive a commute. Virtual sessions are wellness coaching and training, separate from physical therapy.",
    covers: [
      "Live coached sessions",
      "Structured home programming",
      "Regular reassessment",
      "Available nationwide",
    ],
  },
  {
    anchor: "holistic",
    group: "wellness",
    title: "Holistic & Corporate Wellness",
    lede: "Whole-body coaching for individuals, and wellness programming for teams.",
    body:
      "Fitness, mindfulness and coaching for people who want a broader approach, plus on-site or virtual classes and workshops sized to an organization's team and schedule.",
    covers: [
      "Whole-body coaching",
      "Mindfulness and yoga-inspired movement",
      "On-site team classes",
      "Workplace wellness workshops",
    ],
    testimonial: "Joseph Leo",
  },
];

/** The four sections featured as cards on the homepage. */
export const featured = ["rehab", "senior", "training", "virtual"];

export const testimonials = {
  featured: {
    quote:
      "Dr. Valencia's vast experience as a personal trainer and doctor of physical therapy proved invaluable to my fitness journey, improving my strength, stamina, metabolic health, diet, and lifestyle.",
    name: "Brendan Meehan",
    service: "Personal Training · Weight Management · Holistic Wellness",
    anchor: "training",
  },
  cards: [
    {
      quote:
        "Over time, I even surpassed physical limitations medical experts believed impossible to overcome.",
      name: "Paul Duffe",
      service: "Rehabilitation & Recovery",
      detail: "Author & Fitness Enthusiast · Jacksonville, FL",
      anchor: "rehab",
    },
    {
      quote:
        "His holistic approach includes exercise, nutrition, natural supplements, and motivational material — all tailored to my needs. It's everything I need, and nothing I don't.",
      name: "Joseph Leo",
      service: "Personal Training · Holistic Wellness",
      anchor: "holistic",
    },
    {
      quote:
        "Bruce not only provided us with personal training, but guided us on nutrition and lifestyle changes that have made a lasting difference. We continue to use the skills he taught us, and our health reflects it.",
      name: "Olga & Ozzie Brannon",
      service: "Personal Training · Weight Management",
      detail: "Long-Term Clients",
      anchor: "weight",
    },
    {
      quote:
        "Thanks to you I am healthy, wealthy, and wise. My A1C dropped from 8.2 down to 5.8. My doctor confirmed my weight reduction, improved muscle tone, and I'm no longer at risk for diabetes.",
      name: "Olga Brannon",
      service: "Weight Management",
      anchor: "weight",
    },
    {
      quote:
        "Bruce and his team have been miracle workers! She smiles, talks, exercises, and even takes steps when she is under his care. He is caring, effective, and is the reason I keep Mom there.",
      name: "Howard Kurpit",
      service: "Senior Fitness · Memory Care",
      anchor: "senior",
    },
  ],
};

/** Every client quote, featured first. Quotes are the clients' own words: keep or cut, never edit. */
export const allTestimonials = [testimonials.featured, ...testimonials.cards];
export const testimonialByName = (name?: string) =>
  name ? allTestimonials.find((t) => t.name === name) : undefined;

/**
 * The four steps of the first visit, the same for the PT evaluation and the
 * wellness screening. Shown on /services/health-evaluation.
 */
export const evaluationSteps = [
  {
    n: "01",
    title: "History and goals",
    body:
      "What brought you here, what you have already tried, what your physician has said, your lifestyle, and what you actually want to be able to do again.",
  },
  {
    n: "02",
    title: "Movement and strength assessment",
    body:
      "A hands-on look at how you move, where the range is limited, where the strength is missing, and what is compensating for what.",
  },
  {
    n: "03",
    title: "Findings, explained",
    body:
      "What is going on, in language you can repeat to your family. Including an honest answer if what you need is a physician.",
  },
  {
    n: "04",
    title: "A written plan",
    body:
      "The programming, the progression, and what to do between sessions, written down so it is not something you have to remember.",
  },
];
