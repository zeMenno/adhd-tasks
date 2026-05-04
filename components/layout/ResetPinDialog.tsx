"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { resetPin } from "@/lib/auth/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Step = "current" | "new" | "confirm";

const STEP_LABELS: Record<Step, string> = {
  current: "Voer je huidige PIN in",
  new: "Voer je nieuwe PIN in",
  confirm: "Bevestig je nieuwe PIN",
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

function PinPad({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      {/* Dots */}
      <div className="flex justify-center gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-4 h-4 rounded-full transition-colors duration-150 ${
              i < value.length ? "bg-slate-800" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key, i) => {
          if (key === "") return <div key={i} />;
          if (key === "⌫") {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(value.slice(0, -1))}
                disabled={disabled || value.length === 0}
                className="h-12 rounded-xl text-slate-500 text-xl active:scale-95 transition-all disabled:opacity-30"
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (value.length < 4) onChange(value + key);
              }}
              disabled={disabled || value.length >= 4}
              className="h-12 rounded-xl bg-slate-100 text-slate-800 font-semibold text-lg active:scale-95 active:bg-slate-200 transition-all disabled:opacity-30"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResetPinDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>("current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Reset state whenever the dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep("current");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setError("");
    }
  }, [open]);

  // Auto-advance steps
  useEffect(() => {
    if (step === "current" && currentPin.length === 4) {
      setStep("new");
      setError("");
    }
  }, [currentPin, step]);

  useEffect(() => {
    if (step === "new" && newPin.length === 4) {
      setStep("confirm");
      setError("");
    }
  }, [newPin, step]);

  useEffect(() => {
    if (step === "confirm" && confirmPin.length === 4) {
      if (newPin !== confirmPin) {
        setError("PINs komen niet overeen");
        setStep("new");
        setNewPin("");
        setConfirmPin("");
        return;
      }
      startTransition(async () => {
        try {
          await resetPin(currentPin, newPin);
          toast.success("PIN gewijzigd!");
          onOpenChange(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Er ging iets mis");
          setStep("current");
          setCurrentPin("");
          setNewPin("");
          setConfirmPin("");
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin, step]);

  const activeValue =
    step === "current" ? currentPin :
    step === "new" ? newPin :
    confirmPin;

  const setActiveValue =
    step === "current" ? setCurrentPin :
    step === "new" ? setNewPin :
    setConfirmPin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>PIN wijzigen</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1.5 justify-center">
          {(["current", "new", "confirm"] as Step[]).map((s) => (
            <span
              key={s}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                s === step
                  ? "bg-slate-800"
                  : (["current", "new", "confirm"] as Step[]).indexOf(s) <
                    (["current", "new", "confirm"] as Step[]).indexOf(step)
                  ? "bg-emerald-400"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <p className="text-center text-sm font-semibold text-slate-700">
          {STEP_LABELS[step]}
        </p>

        {error && (
          <p className="text-center text-xs font-semibold text-red-500 animate-shake">
            {error}
          </p>
        )}

        <PinPad
          value={activeValue}
          onChange={setActiveValue}
          disabled={isPending}
        />

        {isPending && (
          <p className="text-center text-xs text-slate-400">Bezig...</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
