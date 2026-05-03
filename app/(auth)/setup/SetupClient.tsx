"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AVATARS = ["🦁", "🐯", "🐻", "🦊", "🐸", "🐙", "🦋", "🌟", "🚀", "🎸", "🍕", "🎮"];
const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6"];

type UserInput = {
  name: string;
  avatar: string;
  color: string;
  pin: string;
  confirmPin: string;
};

const emptyUser = (): UserInput => ({
  name: "",
  avatar: AVATARS[0],
  color: COLORS[0],
  pin: "",
  confirmPin: "",
});

export function SetupClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [householdName, setHouseholdName] = useState("");
  const [users, setUsers] = useState<Omit<UserInput, "confirmPin">[]>([]);
  const [form, setForm] = useState<UserInput>(emptyUser());
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // ── Step 1 ────────────────────────────────────────────────────────────────

  function handleStep1() {
    if (!householdName.trim()) return;
    setStep(2);
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────

  function handleAddUser() {
    setFormError("");
    if (!form.name.trim()) return setFormError("Voer een naam in.");
    if (!/^\d{4}$/.test(form.pin)) return setFormError("PIN moet precies 4 cijfers zijn.");
    if (form.pin !== form.confirmPin) return setFormError("PINs komen niet overeen.");
    if (users.some((u) => u.name.toLowerCase() === form.name.toLowerCase()))
      return setFormError("Deze naam is al in gebruik.");

    setUsers((prev) => [
      ...prev,
      { name: form.name.trim(), avatar: form.avatar, color: form.color, pin: form.pin },
    ]);
    setForm(emptyUser());
  }

  function handleRemoveUser(index: number) {
    setUsers((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Step 3 / Submit ───────────────────────────────────────────────────────

  async function handleSubmit() {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdName: householdName.trim(), users }),
      });

      if (res.ok) {
        router.push("/pin");
        router.refresh();
      } else {
        const data = await res.json();
        setGlobalError(data.error ?? "Er ging iets mis.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Shared PIN input helpers ───────────────────────────────────────────────

  function PinDots({ value }: { value: string }) {
    return (
      <div className="flex gap-2 mt-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${i < value.length ? "bg-indigo-500" : "bg-slate-200"}`}
          />
        ))}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* Progress indicator */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              s === step ? "w-8 bg-indigo-500" : s < step ? "w-4 bg-indigo-300" : "w-4 bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Household name ── */}
      {step === 1 && (
        <div className="w-full max-w-sm flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welkom!</h1>
            <p className="text-slate-500 mt-1">Laten we eerst jullie huishouden instellen.</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Naam van jullie huishouden
            </label>
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStep1()}
              placeholder="bijv. Familie De Vries"
              className="h-14 px-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 text-lg focus:border-indigo-400 focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          <button
            onClick={handleStep1}
            disabled={!householdName.trim()}
            className="h-14 rounded-2xl bg-indigo-500 text-white font-bold text-lg disabled:opacity-40 active:scale-95 transition-all"
          >
            Verder →
          </button>
        </div>
      )}

      {/* ── Step 2: Add users ── */}
      {step === 2 && (
        <div className="w-full max-w-sm flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Wie wonen er?</h1>
            <p className="text-slate-500 mt-1">Voeg 1 tot 3 personen toe.</p>
          </div>

          {/* Added users */}
          {users.length > 0 && (
            <div className="flex flex-col gap-2">
              {users.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100"
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: u.color + "20" }}
                  >
                    {u.avatar}
                  </span>
                  <span className="font-semibold text-slate-700 flex-1">{u.name}</span>
                  <button
                    onClick={() => handleRemoveUser(i)}
                    className="text-slate-300 hover:text-red-400 text-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add user form */}
          {users.length < 3 && (
            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white border border-slate-100">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Naam</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="bijv. Thomas"
                  className="h-12 px-3 rounded-xl border border-slate-200 text-slate-800 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Avatar */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avatar</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setForm((f) => ({ ...f, avatar: emoji }))}
                      className={`h-10 rounded-xl text-xl transition-all ${
                        form.avatar === emoji
                          ? "ring-2 ring-indigo-400 bg-indigo-50 scale-110"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kleur</label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm((f) => ({ ...f, color }))}
                      className={`w-9 h-9 rounded-full transition-all ${
                        form.color === color ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={form.pin}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setForm((f) => ({ ...f, pin: v }));
                    }}
                    placeholder="••••"
                    className="h-12 px-3 rounded-xl border border-slate-200 text-slate-800 text-center text-xl tracking-widest focus:border-indigo-400 focus:outline-none"
                  />
                  <PinDots value={form.pin} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Bevestig PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={form.confirmPin}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setForm((f) => ({ ...f, confirmPin: v }));
                    }}
                    placeholder="••••"
                    className="h-12 px-3 rounded-xl border border-slate-200 text-slate-800 text-center text-xl tracking-widest focus:border-indigo-400 focus:outline-none"
                  />
                  <PinDots value={form.confirmPin} />
                </div>
              </div>

              {formError && (
                <p className="text-red-500 text-sm font-medium">{formError}</p>
              )}

              <button
                onClick={handleAddUser}
                className="h-12 rounded-xl bg-slate-800 text-white font-semibold active:scale-95 transition-all"
              >
                + Gebruiker toevoegen
              </button>
            </div>
          )}

          {users.length > 0 && (
            <button
              onClick={() => setStep(3)}
              className="h-14 rounded-2xl bg-indigo-500 text-white font-bold text-lg active:scale-95 transition-all"
            >
              Klaar →
            </button>
          )}
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && (
        <div className="w-full max-w-sm flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Alles klopt?</h1>
            <p className="text-slate-500 mt-1">Controleer de gegevens en start de app.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-100 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Huishouden</span>
            <span className="text-lg font-bold text-slate-800">{householdName}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Bewoners</span>
            {users.map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100"
              >
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: u.color + "20" }}
                >
                  {u.avatar}
                </span>
                <div>
                  <p className="font-semibold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400">PIN ingesteld ✓</p>
                </div>
                <div
                  className="ml-auto w-4 h-4 rounded-full"
                  style={{ backgroundColor: u.color }}
                />
              </div>
            ))}
          </div>

          {globalError && (
            <p className="text-red-500 text-sm font-medium text-center">{globalError}</p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="h-14 rounded-2xl bg-indigo-500 text-white font-bold text-lg disabled:opacity-60 active:scale-95 transition-all"
            >
              {loading ? "Aanmaken..." : "Start de app →"}
            </button>
            <button
              onClick={() => setStep(2)}
              className="h-12 rounded-2xl text-slate-400 font-medium active:scale-95 transition-all"
            >
              ← Terug aanpassen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
