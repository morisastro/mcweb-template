"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Shield } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: async (p: { username: string; password: string }) => {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Błąd");
      return d;
    },
    onSuccess: () => router.push("/admin"),
    onError: (e) => setErr((e as Error).message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        mut.mutate({ username, password });
      }}
      className="space-y-2"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-ink-faint">
        <Shield className="h-3.5 w-3.5" /> Panel administratora
      </div>
      <input className="input" placeholder="Login admina" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <input className="input" type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {err && <p className="text-xs text-bad">{err}</p>}
      <button type="submit" disabled={mut.isPending} className="btn-primary w-full">
        {mut.isPending ? "Logowanie…" : "Zaloguj jako admin"}
      </button>
    </form>
  );
}
