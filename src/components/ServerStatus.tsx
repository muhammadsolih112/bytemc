import { useEffect, useState } from "react";

const API = (() => {
  const env = import.meta.env.VITE_API_URL;
  if (env) return String(env).replace(/\/$/, "");
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || /^10\./.test(host) || /^192\.168\./.test(host);
  if (isLocal) return `http://${host}:4000`;
  const proto = window.location.protocol === "https:" ? "https" : "http";
  return `${proto}://${host}`;
})();

type Status = {
  host: string;
  port: number;
  onlinePlayers: number;
  maxPlayers: number;
  samplePlayers: string[];
  totalSeen: number;
};

export default function ServerStatus() {
  const [data, setData] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/server/status`);
        const json = await res.json();
        if (!res.ok || !json || typeof json !== "object") throw new Error("Ma'lumot yuklanmadi");
        setData({
          host: String(json.host || ""),
          port: Number(json.port || 0),
          onlinePlayers: Number(json.onlinePlayers || 0),
          maxPlayers: Number(json.maxPlayers || 0),
          samplePlayers: Array.isArray(json.samplePlayers) ? json.samplePlayers.map(String) : [],
          totalSeen: Number(json.totalSeen || 0),
        });
        setError(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.toLowerCase().includes("failed to fetch")) {
          const hint = import.meta.env.VITE_API_URL ? `API: ${API}` : `API: ${API}`;
          setError(`Ulanish xatosi. ${hint}`);
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="container mx-auto p-6 pt-6">
      <div className="border rounded-xl p-6 bg-card shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Server holati</h2>
        {loading && <p>Yuklanmoqda...</p>}
        {error && (
          <p className="mb-2 p-3 rounded bg-red-900/50 text-red-200 border border-red-800">Xatolik: {error}</p>
        )}
        {!loading && !error && data && (
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p>Host: {data.host}:{data.port}</p>
              <p>Online: {data.onlinePlayers}/{data.maxPlayers}</p>
            </div>
            <div>
              <p>Oxirgi namunalar: {data.samplePlayers.join(", ") || "—"}</p>
              <p>Jami ko‘rilgan o‘yinchilar: {data.totalSeen}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}