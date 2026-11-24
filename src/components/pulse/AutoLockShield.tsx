import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";

export const AUTO_LOCK_MS = 60_000;

export function AutoLockShield() {
  const { settings } = useSettings();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!settings.autoLock) {
      setLocked(false);
      return;
    }
    let timer = window.setTimeout(() => setLocked(true), AUTO_LOCK_MS);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLocked(true), AUTO_LOCK_MS);
    };
    const events = ["mousemove", "keydown", "pointerdown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [settings.autoLock, locked]);

  if (!locked) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/60 backdrop-blur-2xl animate-fade-up" role="dialog" aria-label="Screen locked">
      <div className="panel flex flex-col items-center gap-4 p-8 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
          <Lock className="size-6 text-primary-foreground" />
        </div>
        <div>
          <div className="text-lg font-semibold">View locked</div>
          <p className="mt-1 text-sm text-muted-foreground">Hidden after 60 seconds of inactivity.</p>
        </div>
        <Button onClick={() => setLocked(false)} autoFocus>Unlock View</Button>
      </div>
    </div>
  );
}
