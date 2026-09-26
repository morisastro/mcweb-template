"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

export function MinecraftLoginForm() {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: async (n: string) => {
      const res = await fetch("/api/auth/minecraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Błąd");
      return data;
    },
    onSuccess: () => router.push("/konto"),
    onError: (e) => setErr((e as Error).message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        mut.mutate(nick);
      }}
      className="space-y-2"
    >
      <input
        className="input"
        placeholder="Nick Minecraft (np. Steve)"
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        pattern="[A-Za-z0-9_]{3,16}"
        required
      />
      {err && <p className="text-xs text-bad">{err}</p>}
      <button type="submit" disabled={mut.isPending} className="btn-primary w-full">
        {mut.isPending ? "Weryfikacja…" : "Zaloguj przez Minecraft"}
      </button>
    </form>
  );
}
