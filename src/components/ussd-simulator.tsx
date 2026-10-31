import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { simulateUssd } from "@/lib/ussd.functions";
import { Loader2, PhoneCall, RotateCcw } from "lucide-react";

/**
 * Interactive demo of the USSD menu flow. The visitor "dials" the service
 * code, then every key press appends a segment to the session path (exactly
 * what a real gateway sends) and re-renders the screen through the same
 * engine the live callback uses. Read-only: the demo never writes sessions,
 * users or reminders.
 */
export const USSD_SERVICE_CODE = "*335#";

export function UssdSimulator() {
  const simulate = useServerFn(simulateUssd);
  const [path, setPath] = useState<string[]>([]);
  const [dialed, setDialed] = useState(false);
  const [screen, setScreen] = useState<{ kind: string; text: string }>({
    kind: "CON",
    text: "",
  });
  const [busy, setBusy] = useState(false);

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
    if (!dialed || screen.kind === "END" || busy) return;
    await run([...path, key]);
  }

  async function dial() {
    setDialed(true);
    await run([]);
  }

  function reset() {
    setDialed(false);
    setPath([]);
    setScreen({ kind: "CON", text: "" });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-xs rounded-4xl border-4 border-border bg-card p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between rounded-t-xl bg-primary px-3 py-2">
          <span className="text-xs font-semibold text-primary-foreground">AfyaCare</span>
          <span className="font-mono text-[10px] text-primary-foreground/80">
            {dialed ? USSD_SERVICE_CODE : "USSD"}
          </span>
        </div>
        <div className="min-h-52 rounded-xl bg-secondary p-3">
          {busy && screen.text === "" ? (
            <p className="ussd-screen animate-pulse text-secondary-foreground">Connecting…</p>
          ) : !dialed ? (
            <p className="ussd-screen text-secondary-foreground">
              {"AfyaCare Health Service\n\nDial *335# to start."}
            </p>
          ) : (
            <p className="ussd-screen text-secondary-foreground">{screen.text}</p>
          )}
        </div>
        {!dialed ? (
          <button
            type="button"
            onClick={dial}
            disabled={busy}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PhoneCall className="h-4 w-4" />
            )}
            Dial {USSD_SERVICE_CODE}
          </button>
        ) : (
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
              aria-label="End session"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {!dialed
          ? "Just like dialling a real service code — nothing is saved."
          : screen.kind === "END"
            ? "Session ended — press the reset button to dial again."
            : "Reply with the numbers shown. Demo only — nothing is saved."}
      </p>
    </div>
  );
}
