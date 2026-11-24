/**
 * Bruce's classes and events. Each one has an info page at /events/<slug>/ and its sign-up at
 * /events/<slug>/signup/ (src/pages/events/<slug>/). The slug is also the `event` tag saved with
 * every sign-up and the name of its Resend "Coming" list, so keep it as <place>-<yyyy-mm-dd>.
 *
 * For the next class: add an entry here, copy src/pages/events/meadows-2026-12-17/ to the new slug
 * and change the one import line in each file, then point src/pages/meadows.astro at it.
 */
export type ClassEvent = {
  slug: string;
  title: string;
  when: string;
  time: string;
  where: string;
  place: string;
  /** The flyer's copy, one string per paragraph. Empty hides the block. */
  about: string[];
};

export const meadows20261217: ClassEvent = {
  slug: "meadows-2026-12-17",
  title: "Holiday-Proof Habits",
  when: "Thursday, December 17",
  time: "11:00 AM",
  where: "Community Center, The Meadows of Crystal Lake",
  place: "The Meadows of Crystal Lake",
  about: [],
};
