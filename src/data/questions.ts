/**
 * Questions, answered (/questions). The questions are what people actually ask,
 * in their own words, from Domatik (niche vhwpt-qa, 2026-11-08: about 310
 * YouTube comments and 25 search "related questions"; no Reddit). The answers
 * are drafts written only from facts already on this site.
 *
 * DRAFT until Bruce approves them. `confirm` names the fact only Bruce can
 * settle (coverage, referral rules, certifications, visit lengths); the page
 * flags it. Once he has answered, fix the wording, delete `confirm`, and when
 * none are left drop `noindex` from src/pages/questions.astro.
 *
 * Physical therapy and wellness stay clearly separate here as on every page:
 * every answer that touches cost says which one it means.
 */
import { practice } from "./site";

export type Question = {
  /** The anchor, so a single answer can be linked: /questions#referral */
  id: string;
  q: string;
  /** One string per paragraph. */
  a: string[];
  /** The page that says more. */
  more?: { label: string; href: string };
  /** What Bruce needs to confirm before this answer goes live. */
  confirm?: string;
};

export type Topic = { id: string; title: string; questions: Question[] };

const fees = { label: "Fees and insurance", href: "/book#call" };

export const topics: Topic[] = [
  {
    id: "cost",
    title: "Cost and coverage",
    questions: [
      {
        id: "medicare-at-home",
        q: "Does Medicare pay for physical therapy at home?",
        a: [
          `Physical therapy with Bruce is billed to Medicare and most major plans, and he comes to your home or care facility across ${practice.regionLong}. Coverage depends on your plan, so call before your first visit and Bruce will check yours.`,
        ],
        more: fees,
        confirm: "That Original Medicare covers his PT visits at home, and any conditions on that.",
      },
      {
        id: "medicare-advantage",
        q: "I have a Medicare Advantage plan. Is that different?",
        a: [
          "It can be. Medicare Advantage plans are run by private insurers, and each one sets its own rules, such as which therapists are in network and whether visits need approval first. Call with your plan’s name and Bruce will check it before you book.",
        ],
        confirm: "Which Advantage plans he is in network with, and whether they need prior approval.",
      },
      {
        id: "home-health",
        q: "Is this the same as home health?",
        a: [
          "No. Home health is a Medicare benefit for people who are homebound, usually arranged through an agency after a hospital stay. Bruce is a doctor of physical therapy in private practice who comes to you, from the first evaluation through to getting you strong.",
        ],
        confirm: "That clients don’t need to be homebound, and what he does for someone already on home health.",
      },
      {
        id: "visit-limits",
        q: "How many visits will I get?",
        a: [
          "That depends on what the evaluation finds and what your plan allows. Bruce writes the number of visits into your plan of care and tells you up front if your coverage limits it.",
        ],
        confirm: "Typical visit counts, and how he handles plan limits.",
      },
      {
        id: "no-insurance",
        q: "What does it cost without insurance?",
        a: [
          `Wellness and training are self-pay, and Bruce shares rates once he understands what you need. Physical therapy is billed to Medicare and most major plans; if you don’t have coverage for it, call and Bruce will talk through your options. Travel is included across ${practice.regionLong}.`,
        ],
        more: fees,
        confirm: "Whether he offers self-pay physical therapy, and at what rate.",
      },
    ],
  },
  {
    id: "start",
    title: "Getting started",
    questions: [
      {
        id: "referral",
        q: "Do I need a doctor’s referral?",
        a: [
          "Not always. Florida lets you start physical therapy without a referral for a limited time, but Medicare and some other plans need your physician to sign off on the plan of care. Bruce will tell you what yours needs when you call.",
          "Wellness and training don’t need a referral. If you have a health condition or a recent surgery, check with your physician first.",
        ],
        confirm: "Florida’s direct-access rules as they apply to him, and which plans need a referral.",
      },
      {
        id: "plan-of-care",
        q: "What if my doctor won’t sign the plan of care?",
        a: [
          "Call Bruce first. It is often paperwork that hasn’t reached the right person, and Bruce can send it again with a note on why therapy is needed. If your physician still has concerns, Bruce will talk it through with you and the office.",
        ],
        confirm: "How he handles this today.",
      },
      {
        id: "visit-length",
        q: "How long is a visit?",
        a: [
          "The first visit has four parts: your history and goals, a movement and strength assessment, the findings explained, and a written plan. Bruce will tell you how long to set aside when you book.",
        ],
        more: { label: "What happens at the first visit", href: "/services/health-evaluation" },
        confirm: "How long the first visit and follow-up visits usually run.",
      },
      {
        id: "equipment",
        q: "Do I need any equipment at home?",
        a: [
          "Very little: a clear patch of floor, a sturdy chair and clothes you can move in. Bruce brings what the session needs.",
        ],
        confirm: "What he brings, and anything clients should have ready.",
      },
      {
        id: "care-facility",
        q: "Can you see my parent in assisted living or memory care?",
        a: [
          `Yes. Bruce sees clients in their own homes and in care facilities across ${practice.regionLong}, including memory care. Families often book for a parent: tell Bruce where they live when you get in touch.`,
        ],
      },
      {
        id: "telehealth",
        q: "Can I do physical therapy by video?",
        a: [
          "Physical therapy by telehealth is available in Florida, case by case. Wellness coaching and training run live over video anywhere in the country.",
        ],
        more: { label: "Virtual Training", href: "/services/virtual-training" },
      },
    ],
  },
  {
    id: "surgery",
    title: "After knee or hip surgery",
    questions: [
      {
        id: "when-to-start",
        q: "When should therapy start after a knee or hip replacement?",
        a: [
          "Usually soon, and your surgeon sets the timing. Many people start moving with a therapist within a day or two of a joint replacement. Bruce follows your surgeon’s protocol, so the plan matches what they ordered.",
        ],
        more: { label: "Rehabilitation & Recovery", href: "/services/rehabilitation" },
        confirm: "The timing wording, and when he usually first sees surgical patients at home.",
      },
      {
        id: "knee-bend",
        q: "How do I get my knee to bend again?",
        a: [
          "Steady, frequent work rather than one big push. Bruce gives you a short home program, such as heel slides, seated knee bends and gentle stretches with a strap, set to your surgeon’s limits, and measures the bend at each visit so you can see it improve.",
        ],
        confirm: "The exercises named, and measuring the bend at each visit.",
      },
      {
        id: "pain",
        q: "How much pain is normal after knee surgery?",
        a: [
          "Some pain and swelling is expected, especially in the first weeks and after exercise, and it should ease over time.",
          "Call your surgeon right away if the pain keeps getting worse, your calf is hot, red or very swollen, or you have a fever. Call 911 for chest pain or trouble breathing.",
        ],
        confirm: "The warning signs, and how he wants clients to reach him between visits.",
      },
      {
        id: "outpatient",
        q: "When do I switch to outpatient therapy?",
        a: [
          "You may not need to. Bruce can keep treating you at home while you need physical therapy. When PT ends, wellness training can carry on from the same plan, so nobody starts over.",
        ],
        confirm: "When he would send someone to an outpatient clinic instead.",
      },
    ],
  },
  {
    id: "balance",
    title: "Balance and falls",
    questions: [
      {
        id: "balance-exercises",
        q: "What balance exercises are safe to do at home?",
        a: [
          "The safe ones are matched to your balance today and done with a counter or sturdy chair within reach. Bruce starts with a fall risk assessment, then gives you a short home program and makes it harder only as you earn it.",
        ],
        more: { label: "Balance & Fall Prevention", href: "/services/balance-and-fall-prevention" },
      },
      {
        id: "walker",
        q: "I can’t get down on the floor, or I use a walker. Can I still do this?",
        a: [
          "Yes. Much of the work happens standing at a counter or sitting in a chair, and Bruce trains with the walker or cane you already use, along with the strength you need for transfers and stairs.",
        ],
      },
      {
        id: "stroke-ms-vertigo",
        q: "Can you help with balance after a stroke, or with MS or vertigo?",
        a: [
          "Bruce treats Parkinson’s and other neurological conditions that affect balance and walking. Call to talk through your situation. If another specialist would serve you better, Bruce will say so.",
        ],
        confirm: "Whether he treats stroke, MS and vertigo.",
      },
      {
        id: "fall-risks",
        q: "Will you look at my home for fall risks?",
        a: [
          "Yes. A home safety review is part of balance and fall prevention. Falls rarely come from one cause, so Bruce looks at strength, balance, walking and the home itself, then builds a plan for each piece.",
        ],
      },
    ],
  },
  {
    id: "parkinsons",
    title: "Parkinson’s",
    questions: [
      {
        id: "exercise-parkinsons",
        q: "Does exercise help with Parkinson’s?",
        a: [
          "Yes. Research consistently finds that regular exercise helps people with Parkinson’s move better, and some studies suggest it may slow how quickly symptoms progress. Bruce treats Parkinson’s at home, with work on walking, balance and strength.",
        ],
        confirm: "The research wording.",
      },
      {
        id: "parkinsons-at-home",
        q: "Is there a physical therapist for Parkinson’s who comes to the house?",
        a: [
          `Yes. Bruce treats Parkinson’s and other neurological conditions in your home or care facility across ${practice.regionLong}, coordinated with your neurologist or physician.`,
        ],
        confirm: "Any Parkinson’s-specific training to name, such as LSVT BIG or PWR!.",
      },
      {
        id: "lsvt-big",
        q: "What is LSVT BIG?",
        a: [
          "LSVT BIG is a structured Parkinson’s program that trains large, deliberate movements so everyday ones get easier. It usually runs as 16 one-hour sessions over four weeks with a certified clinician.",
        ],
        confirm: "Whether he is LSVT BIG certified. If not, this question goes or points elsewhere.",
      },
    ],
  },
  {
    id: "training",
    title: "Training and wellness",
    questions: [
      {
        id: "pt-or-trainer",
        q: "What’s the difference between a physical therapist and a personal trainer?",
        a: [
          "A physical therapist is a licensed clinician who evaluates and treats injuries, surgery recovery and conditions that affect movement, and that care can be billed to insurance. A personal trainer coaches fitness, and training is self-pay.",
          "Bruce is both: a doctor of physical therapy and an ISSA-certified trainer. He keeps the two separate, and he can carry you from one to the other without starting over.",
        ],
        more: { label: "About Bruce", href: "/about" },
      },
      {
        id: "training-insurance",
        q: "Does insurance pay for personal training?",
        a: ["No. Wellness and training are self-pay and not billed to insurance."],
        more: fees,
      },
      {
        id: "virtual-weight-loss",
        q: "Does virtual training work for weight loss?",
        a: [
          "It can. Virtual sessions run live over video on the same assess, plan and progress structure as in-person work, with practical nutrition guidance and regular reassessment, so progress is measured rather than assumed. They are available anywhere in the country.",
        ],
        more: { label: "Weight Loss & Nutrition", href: "/services/weight-loss-and-nutrition" },
      },
      {
        id: "trainer-for-seniors",
        q: "What should I look for in a trainer for an older adult?",
        a: [
          "Someone who assesses before they program, adjusts every session, and knows when something needs a clinician instead. Bruce is a doctor of physical therapy as well as a certified trainer, so senior fitness with him is low-impact, supervised and built on how you actually move.",
        ],
        more: { label: "Senior Fitness", href: "/services/senior-fitness" },
      },
    ],
  },
  {
    id: "needling-lymphedema",
    title: "Dry needling and lymphedema",
    questions: [
      {
        id: "dry-needling-pain",
        q: "Does dry needling hurt?",
        a: [
          "Most people feel a quick prick as the thin needle goes in, then a brief twitch or deep ache in the muscle. Some soreness afterward is common and usually fades within a day or two. Bruce is certified in dry needling through the Athletic Dry Needling Group.",
        ],
        confirm: "That he offers dry needling in Florida, and the wording on how it feels.",
      },
      {
        id: "dry-needling-insurance",
        q: "Does insurance cover dry needling?",
        a: [
          "Often not. Medicare and many other plans don’t pay for dry needling, so it is usually self-pay. Ask Bruce what your plan covers and what it costs.",
        ],
        confirm: "How he bills dry needling, and its price.",
      },
      {
        id: "lymphedema",
        q: "What is lymphedema therapy, and who is it for?",
        a: [
          "Lymphedema is swelling, often in an arm or leg, when lymph fluid doesn’t drain well. It is common after cancer surgery, radiation or lymph node removal. The treatment, called complete decongestive therapy, combines gentle hands-on drainage, compression wrapping or garments, exercise and skin care.",
          "Bruce is a Certified Lymphedema Therapist (CLT), trained through ACOLS.",
        ],
        confirm: "That he treats lymphedema at home, and who he takes on.",
      },
      {
        id: "lymphedema-sessions",
        q: "How many lymphedema sessions will I need?",
        a: [
          "It depends on how much swelling there is and how your body responds. Treatment often starts with several sessions a week for a few weeks, then moves to a home routine with compression. Bruce sets the number after the evaluation.",
        ],
        confirm: "The typical course, and how lymphedema care is billed.",
      },
    ],
  },
];

export const allQuestions = topics.flatMap((t) => t.questions);
