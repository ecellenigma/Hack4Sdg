/** Event facts in one place. Leave a string empty and the site shows "To be announced". */
export const SUBMISSIONS_CLOSE = new Date("2026-10-10T23:59:59+05:30"); // the database enforces its own copy: event_settings.submissions_close
export const DEADLINE_LABEL = "10 October 2026, 11:59 PM IST";
export const FINALS_LABEL = "17 October 2026";
export const FINALISTS = 10;
export const VENUE = "";
export const PRIZES = "";
export const CONTACT = "";

export const FINALS_CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Hack%20for%20SDG%3A%20offline%20final%20round&dates=20261017/20261018" +
  "&details=The%20ten%20best%20teams%20pitch%20in%20person%20for%207%E2%80%938%20minutes.%20https%3A%2F%2Fhack4sdg.vercel.app";
