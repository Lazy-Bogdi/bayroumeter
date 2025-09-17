import { useEffect, useMemo, useState } from "react";
import Head from "next/head";

type Vote = { userId: string; choice: "Oui" | "Non"; ts: string };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export default function Home() {
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [voteEmail, setVoteEmail] = useState("");
  const [choice, setChoice] = useState<"Oui" | "Non">("Oui");
  const [msgUser, setMsgUser] = useState("");
  const [msgVote, setMsgVote] = useState("");
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const total = votes.length;
    const oui = votes.filter(v => v.choice === "Oui").length;
    const non = total - oui;
    const pctOui = total ? Math.round((oui * 100) / total) : 0;
    return { total, oui, non, pctOui };
  }, [votes]);

  async function refresh() {
    try {
      setLoading(true);
      const r = await fetch(`${API_BASE}/votes`);
      const data = await r.json();
      setVotes(Array.isArray(data) ? data : []);
    } catch {
      setMsgVote("Erreur de récupération des votes");
    } finally {
      setLoading(false);
    }
  }

  async function createUser() {
    setMsgUser("");
    try {
      const r = await fetch(`${API_BASE}/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, email }),
      });
      const data = await r.json();

      if (r.status === 201) {
        setMsgUser(`Utilisateur créé: ${data.pseudo} (${data.email})`);
        setVoteEmail(email);
        return;
      }

      // cas utilisateur déjà existant (backend renvoie 200 + exists:true)
      if (r.status === 200 && data?.exists) {
        setMsgUser(`Utilisateur déjà existant: ${data.user?.email || email}`);
        setVoteEmail(data.user?.email || email);
        return;
      }

      // autre erreur explicite
      if (!r.ok) throw new Error(data?.error || "Erreur");
    } catch (e: any) {
      setMsgUser(`Erreur: ${e?.message || e}`);
    }
  }

  async function submitVote() {
    setMsgVote("");
    try {
      const r = await fetch(`${API_BASE}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: voteEmail, choice }),
      });
      const data = await r.json();

      if (r.status === 201) {
        setMsgVote(`Vote enregistré: ${data.choice}`);
        refresh();
        return;
      }

      // cas non inscrit (backend renvoie 403)
      if (r.status === 403) {
        setMsgVote("Impossible de voter : utilisateur non inscrit. Crée un compte d’abord.");
        return;
      }

      if (!r.ok) throw new Error(data?.error || "Erreur");
    } catch (e: any) {
      setMsgVote(`Erreur: ${e?.message || e}`);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <>
      <Head>
        <title>BayrouMeter</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="max-w-3xl mx-auto p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">🗳️ BayrouMeter</h1>
            <p className="text-neutral-400 mt-1">
              Est-ce que François Bayrou nous manque&nbsp;?
            </p>
          </header>

          {/* 1) S’identifier */}
          <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 shadow">
            <h2 className="text-lg font-medium mb-3">1) S’identifier</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-400"
                placeholder="Pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
              />
              <input
                className="rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-400"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={createUser}
                className="rounded-xl bg-white text-neutral-900 px-4 py-2 font-medium hover:bg-neutral-200 active:scale-95 transition"
              >
                Créer l’utilisateur
              </button>
            </div>
            {msgUser && <p className="text-sm text-neutral-400 mt-2">{msgUser}</p>}
          </section>

          {/* 2) Voter */}
          <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 shadow">
            <h2 className="text-lg font-medium mb-3">2) Voter</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-400"
                placeholder="Email (identifiant)"
                type="email"
                value={voteEmail}
                onChange={(e) => setVoteEmail(e.target.value)}
              />
              <select
                className="rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-400"
                value={choice}
                onChange={(e) => setChoice(e.target.value as "Oui" | "Non")}
              >
                <option>Oui</option>
                <option>Non</option>
              </select>
              <button
                onClick={submitVote}
                className="rounded-xl bg-white text-neutral-900 px-4 py-2 font-medium hover:bg-neutral-200 active:scale-95 transition"
              >
                Envoyer le vote
              </button>
            </div>
            {msgVote && <p className="text-sm text-neutral-400 mt-2">{msgVote}</p>}
          </section>

          {/* 3) Résultats */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 shadow">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">3) Résultats</h2>
              <button
                onClick={refresh}
                className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800 active:scale-95 transition"
              >
                {loading ? "Chargement…" : "Actualiser"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <Stat label="Total" value={stats.total} />
              <Stat label="Oui" value={stats.oui} />
              <Stat label="Oui (%)" value={`${stats.pctOui}%`} />
            </div>

            <div className="mt-2">
              <div className="h-3 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${stats.pctOui}%` }}
                  title={`Oui ${stats.pctOui}%`}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Oui {stats.pctOui}%</span>
                <span>Non {100 - stats.pctOui}%</span>
              </div>
            </div>

            <ul className="mt-5 space-y-2">
              {votes.map((v, i) => (
                <li key={`${v.userId}-${v.ts}-${i}`} className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-neutral-300">{v.userId}</span>{" "}
                    <span className="text-neutral-500">→</span>{" "}
                    <span className={v.choice === "Oui" ? "text-emerald-400" : "text-red-400"}>
                      {v.choice}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {new Date(v.ts).toLocaleString()}
                  </div>
                </li>
              ))}
              {votes.length === 0 && (
                <li className="text-sm text-neutral-500">Aucun vote pour l’instant.</li>
              )}
            </ul>
          </section>

          <footer className="text-xs text-neutral-500 mt-8">
            API: <code className="text-neutral-400">{API_BASE}</code>
          </footer>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
