/**
 * The three service delivery modes — how a client works with Bruce.
 *
 * These are distinct from the seven program areas on the homepage, which describe
 * *who* a program is for. Services are the delivery format; programs are the
 * specialty. Every program is delivered through one of these services.
 *
 * Copy recovered from the legacy WordPress posts (last edited 2024-10-10), which
 * remained in the database after the theme stopped rendering them. Lightly edited
 * for typos and regional phrasing only — the substance is Bruce's own.
 */

export interface Service {
  slug: string;
  title: string;
  /** Short label for cards and cross-links. */
  shortTitle: string;
  /** The legacy H2 — used as the page's lead line. */
  lede: string;
  /** One-sentence summary for the services index and meta description. */
  teaser: string;
  intro: string;
  groups: {
    heading: string;
    items: { term: string; detail: string }[];
  }[];
}

export const services: Service[] = [
  {
    slug: "personal-training",
    title: "Personal Training",
    shortTitle: "Personal Training",
    lede: "One-on-One Coaching to Maximize Your Fitness Potential",
    teaser:
      "Individualized, hands-on coaching with a workout plan built around your goals, fitness level, and health considerations.",
    intro:
      "Our personal training services at Valencia Health and Wellness, LLC are designed to provide you with individualized attention and customized workout plans that target your specific fitness goals. Whether you're looking to build strength, improve endurance, or enhance overall wellness, personal training offers a focused approach to help you succeed.",
    groups: [
      {
        heading: "Benefits of Personal Training",
        items: [
          {
            term: "Customized Fitness Plans",
            detail:
              "Receive a workout plan that is specifically designed for you, considering your goals, fitness level, and any health considerations.",
          },
          {
            term: "Hands-On Coaching",
            detail:
              "Get real-time feedback and adjustments from your personal trainer, ensuring each exercise is performed safely and effectively.",
          },
          {
            term: "Motivation and Accountability",
            detail:
              "Regular sessions help keep you motivated, while the personalized attention provides the accountability needed to stay on track.",
          },
          {
            term: "Flexible Scheduling",
            detail:
              "Personal training sessions can be scheduled at times that fit your lifestyle, offering the flexibility you need to maintain consistency.",
          },
          {
            term: "Holistic Approach",
            detail:
              "Beyond just workouts, personal training includes guidance on nutrition, recovery, and lifestyle changes that support your overall health and fitness journey.",
          },
        ],
      },
    ],
  },
  {
    slug: "online-training",
    title: "Online Training",
    shortTitle: "Online Training",
    lede: "Flexible, Accessible Fitness Coaching from Anywhere",
    teaser:
      "Personalized programming delivered remotely — live virtual sessions or on-demand workouts that fit your schedule.",
    intro:
      "Valencia Health and Wellness, LLC offers comprehensive online training that allows you to achieve your fitness goals from the comfort of your home or wherever you are. Our online training programs are designed to be flexible and accessible, providing you with personalized guidance and structured routines to suit your lifestyle and fitness level.",
    groups: [
      {
        heading: "What You Can Expect from Online Training",
        items: [
          {
            term: "Personalized Workout Plans",
            detail:
              "Each plan is tailored to your fitness goals, abilities, and preferences, ensuring you have a routine that works for you.",
          },
          {
            term: "Live Virtual Sessions and On-Demand Workouts",
            detail:
              "Participate in live coaching sessions or follow along with on-demand workouts that fit your schedule.",
          },
          {
            term: "Expert Guidance",
            detail:
              "Benefit from the expertise of a certified trainer and Doctor of Physical Therapy who ensures that each exercise is performed correctly and safely.",
          },
          {
            term: "Progress Tracking",
            detail:
              "Regular check-ins and progress tracking help keep you accountable and motivated as you move towards your fitness goals.",
          },
        ],
      },
    ],
  },
  {
    slug: "health-evaluations",
    title: "Health Evaluations",
    shortTitle: "Health Evaluations",
    lede: "Comprehensive Health Assessments for Optimal Wellness",
    teaser:
      "A thorough assessment of your physical condition — available as part of training, or as a specialized evaluation by a Doctor of Physical Therapy.",
    intro:
      "At Valencia Health and Wellness, LLC, we offer detailed health evaluations that provide a thorough understanding of your physical condition, helping to guide your fitness and wellness journey. These evaluations are available both as part of our personal training services and through specialized assessments conducted by a Doctor of Physical Therapy.",
    groups: [
      {
        heading: "Health Evaluations as a Personal Trainer",
        items: [
          {
            term: "Fitness Assessments",
            detail:
              "Evaluate your current fitness level, including strength, flexibility, endurance, and body composition, to create a tailored fitness plan.",
          },
          {
            term: "Goal Setting",
            detail:
              "Work together to set realistic, achievable goals based on your evaluation results and personal aspirations.",
          },
          {
            term: "Ongoing Monitoring",
            detail:
              "Regular re-evaluations to track progress and adjust your program as needed to keep you moving forward.",
          },
        ],
      },
      {
        heading: "Health Evaluations as a Doctor of Physical Therapy",
        items: [
          {
            term: "In-Depth Physical Assessments",
            detail:
              "Comprehensive evaluations to identify movement dysfunctions, postural imbalances, and areas of weakness or pain.",
          },
          {
            term: "Injury Prevention and Recovery",
            detail:
              "Develop strategies to prevent injuries before they occur and support your recovery if you're dealing with an existing condition.",
          },
          {
            term: "Personalized Rehabilitation Plans",
            detail:
              "For those recovering from injury or surgery, receive a customized rehabilitation plan designed to restore function, improve mobility, and reduce pain.",
          },
          {
            term: "Holistic Health Insights",
            detail:
              "Gain valuable insights into your overall health, including recommendations for exercise modifications, lifestyle changes, and strategies for managing chronic conditions.",
          },
        ],
      },
    ],
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
