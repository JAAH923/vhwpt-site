/**
 * Questions, answered (/questions). The questions are what people actually ask,
 * in their own words, from Domatik (niche vhwpt-qa, 2026-11-08: about 310
 * YouTube comments and 25 search "related questions"; no Reddit). The answers
 * are drafts written only from facts already on this site.
 *
 * Bruce checked every answer (2026-11-08/09). A new answer that needs a fact
 * only Bruce can settle gets a `confirm` note, which shows a "To confirm" pill;
 * fix the wording and delete `confirm` once he answers. While any are left,
 * put `noindex` and the draft note back on src/pages/questions.astro.
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
          "Yes. Bruce provides mobile outpatient physical therapy billed to Medicare Part B, so visits happen in your home or care facility when therapy is medically necessary. When a home visit isn’t possible, therapy can take place at his clinic.",
        ],
        more: fees,
      },
      {
        id: "medicare-advantage",
        q: "I have a Medicare Advantage plan. Is that different?",
        a: [
          `It can be. Medicare Advantage plans are run by private insurers, and each one sets its own network, copays and approval rules. Bruce is in network with ${practice.plans}. Call before your first visit to verify your specific plan.`,
        ],
      },
      {
        id: "home-health",
        q: "Is this the same as home health?",
        a: [
          "No. Home health is a Medicare benefit for people who are homebound, usually arranged through an agency after a hospital stay. Bruce is a doctor of physical therapy in private practice who comes to you, and you don’t need to be homebound to see him.",
          "If you are getting home health now under Medicare, Bruce can start once the agency has discharged you and your physician has sent new orders.",
        ],
      },
      {
        id: "visit-limits",
        q: "How many visits will I get?",
        a: [
          "It depends on your needs. Bruce sets the number in your plan of care after the evaluation, and adjusts it as you progress. Your insurance may also set limits or require approval.",
        ],
      },
      {
        id: "no-insurance",
        q: "What does it cost without insurance?",
        a: [
          "Wellness and training are self-pay. If you don’t have insurance, self-pay physical therapy is available too, and Bruce shares rates once he understands what you need.",
          "If you have Medicare, physical therapy that Medicare covers is billed to Medicare, and Bruce can’t take cash in its place. Services Medicare doesn’t cover, such as wellness programs, can be self-pay, and Bruce will tell you before your visit if something isn’t covered.",
        ],
        more: fees,
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
          "For physical therapy, yes, though not on day one. Florida lets Bruce see you for up to 30 days without a referral, and after that your physician needs to send an order. The insurance plans Bruce works with generally need one too, so it helps to ask your physician early.",
          "Wellness and training don’t need a referral. If you have a health condition or a recent surgery, check with your physician first.",
        ],
      },
      {
        id: "plan-of-care",
        q: "What if my doctor won’t sign the plan of care?",
        a: [
          "Call Bruce first. It is often paperwork that hasn’t reached the right person, and Bruce can request the orders again with a note on why therapy is needed. The decision is still your physician’s, and if they have concerns, Bruce will talk it through with you and the office.",
        ],
      },
      {
        id: "visit-length",
        q: "How long is a visit?",
        a: [
          "Most visits last about an hour. Some run shorter or a little longer, depending on what you need and your insurance plan’s rules.",
        ],
        more: { label: "What happens at the first visit", href: "/services/health-evaluation" },
      },
      {
        id: "equipment",
        q: "Do I need any equipment at home?",
        a: [
          "Very little: a clear patch of floor, a sturdy chair and clothes you can move in. For physical therapy, Bruce brings what each visit needs. For wellness training, he can give you a short list of easy-to-find equipment if you want to train between sessions.",
        ],
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
          "Usually soon, and your surgeon sets the timing. Many people start moving with a therapist within a day or two of a joint replacement. Bruce follows your surgeon’s protocol, and some surgeons leave the protocol to him.",
        ],
        more: { label: "Rehabilitation & Recovery", href: "/services/rehabilitation" },
      },
      {
        id: "knee-bend",
        q: "How do I get my knee to bend again?",
        a: [
          "Steady, frequent work rather than one big push. Bruce gives you a short home program, such as heel slides, seated knee bends and gentle stretches with a strap, set to your surgeon’s limits, and measures the bend at each visit so you can see it improve.",
          "Some people also go home from surgery with a continuous passive motion (CPM) machine, which slowly bends and straightens the knee for you.",
        ],
      },
      {
        id: "pain",
        q: "How much pain is normal after knee surgery?",
        a: [
          "Some pain and swelling is expected, especially in the first weeks and after exercise, and it should ease over time.",
          "Call your surgeon right away if the pain keeps getting worse, your calf is hot, red or very swollen, or you have a fever. Call 911 for chest pain or trouble breathing.",
          `For questions between visits, email Bruce at ${practice.email} or call ${practice.phone}. In an emergency, always call 911.`,
        ],
      },
      {
        id: "outpatient",
        q: "When do I switch to outpatient therapy?",
        a: [
          "Outpatient physical therapy is for when you need a therapist’s skilled care: for example, when you are at higher risk of a fall or injury, when your walking, balance or ability to bear weight has declined, or when a flare-up of a health condition could put you back in hospital. Bruce provides outpatient physical therapy in your home.",
          "Therapy ends when you have reached the most it can do for your mobility and no longer need skilled care. From there, a wellness strength and conditioning program can carry on from the same plan. That part is training rather than physical therapy, and it is self-pay.",
        ],
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
      },
      {
        id: "parkinsons-at-home",
        q: "Is there a physical therapist for Parkinson’s who comes to the house?",
        a: [
          `Yes. Bruce treats Parkinson’s and other neurological conditions in your home or care facility across ${practice.regionLong}, coordinated with your neurologist or physician.`,
        ],
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
      },
      {
        id: "dry-needling-insurance",
        q: "Does insurance cover dry needling?",
        a: [
          "Usually not. Original Medicare and most plans don’t cover dry needling, so it is usually self-pay, and Bruce shares rates once he understands what you need. Call to check your plan before your visit.",
        ],
      },
      {
        id: "lymphedema",
        q: "What is lymphedema therapy, and who is it for?",
        a: [
          "Lymphedema is swelling, often in an arm or leg, when lymph fluid doesn’t drain well. It is common after cancer surgery, radiation or lymph node removal. The treatment, called complete decongestive therapy, combines gentle hands-on drainage, compression wrapping or garments, exercise and skin care.",
          "Bruce is a Certified Lymphedema Therapist (CLT), trained through ACOLS.",
        ],
      },
      {
        id: "lymphedema-sessions",
        q: "How many lymphedema sessions will I need?",
        a: [
          "It depends on how much swelling there is and how your body responds. Treatment often starts with several sessions a week for a few weeks, then moves to a home routine with compression. Bruce sets the number after the evaluation.",
          "Lymphedema therapy is provided as physical therapy and billed to Medicare and the plans Bruce is in network with. If your plan doesn’t cover it, it can be self-pay where Medicare and your plan’s rules allow. Call to verify your coverage before your first visit.",
        ],
      },
    ],
  },
];

export const allQuestions = topics.flatMap((t) => t.questions);

/**
 * The five shown on the home page, by `id`: coverage, referral, surgery,
 * PT or trainer, and virtual training, so both halves of the practice show.
 */
export const homeQuestions = [
  "medicare-at-home",
  "referral",
  "when-to-start",
  "pt-or-trainer",
  "virtual-weight-loss",
].map((id) => allQuestions.find((q) => q.id === id)!);
