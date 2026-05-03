"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Household } from "@/lib/db/schema";
import type { HouseholdMember } from "@/lib/db/queries/household";

type Props = {
  household: Household;
  users: HouseholdMember[];
};

export function PinClient({ household, users }: Props) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<HouseholdMember | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleUserSelect(user: HouseholdMember) {
    setSelectedUser(user);
    setPin("");
    setError("");
  }

  function handleDigit(digit: string) {
    if (pin.length < 4) setPin((p) => p + digit);
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
  }

  async function handleSubmit() {
    if (pin.length !== 4 || !selectedUser) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, pin }),
      });

      if (res.ok) {
        router.push("/today");
        router.refresh();
      } else {
        let message = "Verkeerde PIN";
        const ct = res.headers.get("content-type");
        if (ct?.includes("application/json")) {
          try {
            const data = (await res.json()) as { error?: string };
            message = data.error ?? message;
          } catch {
            if (res.status >= 500) {
              message = "Serverfout. Probeer het later opnieuw.";
            }
          }
        } else if (res.status >= 500) {
          message = "Serverfout. Probeer het later opnieuw.";
        }
        setError(message);
        setPin("");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">{household.name}</h1>
      <p className="text-slate-500 text-sm mb-8">Wie ben jij?</p>

      {/* User selection */}
      {!selectedUser && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white shadow-sm border-2 border-transparent hover:border-slate-200 active:scale-95 transition-all"
              style={{ borderColor: "transparent" }}
            >
              <span
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: user.color + "20" }}
              >
                {user.avatar ?? "👤"}
              </span>
              <span className="font-semibold text-slate-700">{user.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* PIN pad */}
      {selectedUser && (
        <div className="w-full max-w-xs flex flex-col items-center gap-6">
          {/* Back button */}
          <button
            onClick={() => { setSelectedUser(null); setPin(""); setError(""); }}
            className="self-start text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            ← Terug
          </button>

          {/* User indicator */}
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: selectedUser.color + "20" }}
            >
              {selectedUser.avatar ?? "👤"}
            </span>
            <span className="font-semibold text-slate-700">{selectedUser.name}</span>
          </div>

          {/* PIN dots */}
          <div className={`flex gap-4 ${shake ? "animate-shake" : ""}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all ${
                  i < pin.length
                    ? "scale-100"
                    : "scale-75 bg-slate-200"
                }`}
                style={i < pin.length ? { backgroundColor: selectedUser.color } : {}}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="h-16 rounded-2xl bg-white shadow-sm text-2xl font-semibold text-slate-700 active:scale-95 active:bg-slate-100 transition-all"
              >
                {d}
              </button>
            ))}
            <div /> {/* empty */}
            <button
              onClick={() => handleDigit("0")}
              className="h-16 rounded-2xl bg-white shadow-sm text-2xl font-semibold text-slate-700 active:scale-95 active:bg-slate-100 transition-all"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-white shadow-sm text-xl text-slate-400 active:scale-95 active:bg-slate-100 transition-all"
            >
              ⌫
            </button>
          </div>

          {/* Confirm */}
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4 || loading}
            className="w-full h-14 rounded-2xl text-white font-bold text-lg disabled:opacity-40 active:scale-95 transition-all"
            style={{ backgroundColor: selectedUser.color }}
          >
            {loading ? "..." : "Inloggen"}
          </button>
        </div>
      )}
    </div>
  );
}
