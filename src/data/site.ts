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
  "ISSA-Certified Personal Trainer",
  "Certified Lymph Therapist (CLT)",
  "U.S. Navy Veteran",
];

export const nav = [
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Book", href: "/book" },
];

/**
 * The service line. `anchor` is the section id on /services — these are
 * sections of one deep page, not separate pages. A section earns its own URL
 * only once it has enough of its own content to justify one; the Health
 * Evaluation is the one that does.
 */
export const services = [
  {
    anchor: "rehab",
    title: "Rehabilitation & Recovery",
    lede:
      "Getting back to normal after an injury or an operation, at the pace your body actually allows.",
    body:
      "Recovery rarely ends when the discharge paperwork does. Programs here are built around where you are now, progressed as you earn it, and coordinated with the surgeon or physician already managing your care.",
    covers: [
      "Recovery after surgery",
      "Injury rehabilitation",
      "Strength and range of motion",
      "Swelling and lymphatic care",
      "Returning to activity safely",
    ],
  },
  {
    anchor: "senior",
    title: "Senior Fitness",
    lede:
      "Staying steady on your feet, and keeping the strength that independence depends on.",
    body:
      "Low-impact, supervised, and adjusted every session. The goal is rarely a number in the gym — it is carrying groceries, managing stairs, and not being afraid of a fall.",
    covers: [
      "Balance and steadiness",
      "Fall risk",
      "Mobility and walking",
      "Strength for daily tasks",
    ],
  },
  {
    anchor: "training",
    title: "Personal Training",
    lede: "One-to-one coaching, built on an evaluation rather than a template.",
    body:
      "Every plan starts by looking at how you move. What follows is programming for your goals, your schedule and your history — adjusted as you progress, in person or virtually.",
    covers: [
      "Strength and conditioning",
      "Movement quality",
      "Training around an old injury",
      "Endurance and stamina",
    ],
  },
  {
    anchor: "weight",
    title: "Weight Management & Nutrition",
    lede: "Body composition and metabolic health, handled together rather than separately.",
    body:
      "Training paired with practical nutrition guidance and regular re-evaluation, so progress is measured rather than assumed. Long-term clients have used this to move real clinical markers.",
    covers: [
      "Body composition",
      "Metabolic health markers",
      "Practical nutrition guidance",
      "Habits that survive the year",
    ],
  },
  {
    anchor: "youth",
    title: "Youth Sports Conditioning",
    lede: "Athletic development for young athletes, starting with how they move.",
    body:
      "Mechanics before intensity. Young athletes get stronger and more durable when the movement underneath is sound, which is also what keeps them off the treatment table.",
    covers: [
      "Movement mechanics",
      "Sport-specific conditioning",
      "Durability and injury prevention",
      "Strength for growing athletes",
    ],
  },
  {
    anchor: "prenatal",
    title: "Pre & Postnatal Fitness",
    lede: "Certified programming through pregnancy and the months after it.",
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
    title: "Virtual Training",
    lede: "The same coaching, from anywhere in the country.",
    body:
      "Sessions run live over video, on the same evaluate-plan-progress structure as in-person work. It suits people who travel, people outside South Florida, and anyone whose schedule will not survive a commute.",
    covers: [
      "Live coached sessions",
      "Structured home programming",
      "Regular re-evaluation",
      "Available nationwide",
    ],
  },
  {
    anchor: "holistic",
    title: "Holistic & Corporate Wellness",
    lede: "Whole-body coaching for individuals, and wellness programming for teams.",
    body:
      "Fitness, mindfulness and coaching for people who want a broader approach, plus on-site or virtual classes and workshops sized to an organization's team and schedule.",
    covers: [
      "Whole-body coaching",
      "Mindfulness and yoga",
      "On-site team classes",
      "Workplace wellness workshops",
    ],
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

/** The four steps of the first visit. Shown on /services/health-evaluation. */
export const evaluationSteps = [
  {
    n: "01",
    title: "History and goals",
    body:
      "What brought you here, what you have already tried, what your physician has said, and what you actually want to be able to do again.",
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
      "What is going on, in language you can repeat to your family. Including an honest answer if what you need is a physician rather than a trainer.",
  },
  {
    n: "04",
    title: "A written plan",
    body:
      "The programming, the progression, and what to do between sessions — written down, so it is not something you have to remember.",
  },
];
