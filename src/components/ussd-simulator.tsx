import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { simulateUssd } from "@/server/ussd.functions";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";

/**
 * Interactive demo of the USSD menu flow. Every key press appends a segment
 * to the session path (exactly what a real gateway sends) and re-renders the
 * screen through the same engine the live callback uses. Read-only: the demo
 * never writes sessions, users or reminders.
 */
export function UssdSimulator() {
  const simulate = useServerFn(simulateUssd);
  const [path, setPath] = useState<string[]>([]);
  const [screen, setScreen] = useState<{ kind: string; text: string }>({
    kind: "CON",
    text: "",
  });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    void run([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(newPath: string[]) {
    setBusy(true);
    try {
      const result = await simulate({ data: { text: newPath.join("*") } });
      setScreen({ kind: result.kind, text: result.text });
      setPath(newPath);
    } catch {
      setScreen({ kind: "END", text: "Connection problem. Press reset." });
    } finally {
      setBusy(false);
    }
  }

  async function press(key: string) {
    if (screen.kind === "END" || busy) return;
    await run([...path, key]);
  }

  async function reset() {
    await run([]);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-xs rounded-4xl border-4 border-border bg-card p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between rounded-t-xl bg-primary px-3 py-2">
          <span className="text-xs font-semibold text-primary-foreground">AfyaCare</span>
          <span className="text-[10px] text-primary-foreground/70">USSD</span>
        </div>
        <div className="min-h-52 rounded-xl bg-secondary p-3">
          {busy && screen.text === "" ? (
            <p className="ussd-screen animate-pulse text-secondary-foreground">Connecting…</p>
          ) : (
            <p className="ussd-screen text-secondary-foreground">{screen.text}</p>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0"].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              disabled={busy || screen.kind === "END"}
              className="flex h-11 items-center justify-center rounded-lg bg-muted text-base font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="flex h-11 items-center justify-center rounded-lg bg-primary text-foreground/90 transition-colors hover:bg-primary/90 disabled:opacity-40"
            aria-label="Reset session"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {screen.kind === "END"
          ? "Session ended — press the reset button to start again."
          : "Reply with the numbers shown. Demo only — nothing is saved."}
      </p>
    </div>
  );
}
