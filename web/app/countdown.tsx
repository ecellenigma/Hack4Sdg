"use client";
import { useSyncExternalStore } from "react";
import { SUBMISSIONS_CLOSE } from "@/lib/event";

const CLOSE = Math.floor(SUBMISSIONS_CLOSE.getTime() / 1000);
const tick = (cb: () => void) => {
  const t = setInterval(cb, 1000);
  return () => clearInterval(t);
};

/** Seconds left until submissions close. null on the server and while hydrating. */
export function useSecondsLeft(): number | null {
  const now = useSyncExternalStore(tick, () => Math.floor(Date.now() / 1000), () => 0);
  return now ? CLOSE - now : null;
}

export default function Countdown() {
  const left = useSecondsLeft();
  if (left === null) return null;
  if (left <= 0) return <span className="count">Submissions are closed</span>;
  const two = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="count" role="timer">
      Closes in <b>{Math.floor(left / 86400)}d {two(Math.floor(left / 3600) % 24)}h {two(Math.floor(left / 60) % 60)}m {two(left % 60)}s</b>
    </span>
  );
}
