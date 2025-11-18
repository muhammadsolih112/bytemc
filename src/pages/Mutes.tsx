import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const API = (() => {
  const cfg = (window as any).__APP_CONFIG__;
  if (cfg && cfg.apiBaseUrl) return String(cfg.apiBaseUrl).replace(/\/$/, "");
  const env = import.meta.env.VITE_API_URL;
  if (env) return String(env).replace(/\/$/, "");
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || /^10\./.test(host) || /^192\.168\./.test(host);
  if (isLocal) return `http://${host}:4000`;
  const proto = window.location.protocol === "https:" ? "https" : "http";
  return `${proto}://${host}`;
})();

type Entry = {
  id: number;
  player: string;
  reason: string;
  image_url?: string | null;
  created_at: string;
  issuer?: string;
  expires_at?: string | null;
  duration?: string | null;
};

export default function Mutes() {
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [query, setQuery] = useState<string>("");
  const toImageSrc = (u?: string | null) => {
    if (!u) return "";
    return u.startsWith("http") ? u : `${API}${u}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/public/mutes`);
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          setError((data && (data.error || data.details)) || "Ma'lumotni yuklashda xatolik");
          setItems([]);
        } else {
          setItems(data);
        }
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (msg.toLowerCase().includes("failed to fetch")) {
          const hint = import.meta.env.VITE_API_URL ? `API: ${API}` : `API: ${API} — productionda backend URL kerak (VITE_API_URL)`;
          setError(`Ulanish xatosi. ${hint}`);
        } else {
          setError(msg || "Tarmoq xatosi");
        }
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Tick every second to update countdowns and auto-hide expired mutes
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatRemaining = (expires_at?: string | null) => {
    if (!expires_at) return null;
    const ms = new Date(expires_at).getTime() - now;
    if (ms <= 0) return "Tugadi";
    let s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const parts: string[] = [];
    if (d) parts.push(`${d} kun`);
    if (h) parts.push(`${h} soat`);
    if (m) parts.push(`${m} daqiqa`);
    parts.push(`${s} sekund`);
    return parts.join(" ");
  };

  // Show all mutes (including expired/unmuted) as history

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="container mx-auto p-6 pt-24 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mute'lar ro'yxati</h1>
          <Link to="/" className="text-sm text-crypto-purple hover:underline">Bosh sahifa</Link>
        </div>
        {loading && <p>Yuklanmoqda...</p>}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-900/50 text-red-200 border border-red-800">
            Xatolik: {error}
          </div>
        )}
        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish: o'yinchi yoki sabab"
            className="w-full border border-gray-700 bg-background text-foreground p-2 rounded"
          />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.filter(e => {
            const q = query.trim().toLowerCase();
            if (!q) return true;
            return e.player.toLowerCase().includes(q) || e.reason.toLowerCase().includes(q);
          }).map((e) => (
            <div
              key={e.id}
              className="border rounded p-4 bg-card animate-fade-in shadow-sm cursor-pointer hover:bg-gray-800/40 transition"
              onClick={() => setSelected(e)}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded text-white bg-yellow-600 text-xs">MUTE</span>
                <p className="font-semibold break-words">{e.player}</p>
              </div>
              <p className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</p>
              <p className="mt-2 break-words">Sabab: {e.reason}</p>
              {typeof e.duration !== 'undefined' && (
                <p className="text-xs text-gray-400 mt-1">
                  {e.expires_at ? (
                    <>Qolgan vaqt: {formatRemaining(e.expires_at)}</>
                  ) : (
                    <>Muddat: Doimiy</>
                  )}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Kim tomonidan: {e.issuer ?? 'Noma\'lum'}</p>
              {e.image_url && (
                <img
                  src={toImageSrc(e.image_url)}
                  alt="Dalil"
                  loading="lazy"
                  onError={(ev) => { ev.currentTarget.style.display = "none"; }}
                  className="mt-3 w-full max-h-64 object-cover rounded border border-gray-700"
                />
              )}
            </div>
          ))}
        </div>
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-card rounded shadow-lg max-w-lg w-full p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded text-white bg-yellow-600 text-xs">MUTE</span>
                <h3 className="text-lg font-semibold break-words">{selected.player}</h3>
              </div>
              <p className="text-xs text-gray-500">{new Date(selected.created_at).toLocaleString()}</p>
              <p className="mt-2 break-words">{selected.reason}</p>
              {typeof selected.duration !== 'undefined' && (
                <p className="text-xs text-gray-400 mt-1">
                  {selected.expires_at ? (
                    <>Qolgan vaqt: {formatRemaining(selected.expires_at)}</>
                  ) : (
                    <>Muddat: Doimiy</>
                  )}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Kim tomonidan: {selected.issuer ?? 'Noma\'lum'}</p>
              {selected.image_url && (
                <img
                  src={toImageSrc(selected.image_url)}
                  alt="Dalil"
                  loading="lazy"
                  onError={(ev) => { ev.currentTarget.style.display = 'none'; }}
                  className="mt-3 w-full max-h-[60vh] object-contain rounded border border-gray-700"
                />
              )}
              <button className="mt-4 bg-blue-600 text-white px-3 py-2 rounded w-full" onClick={() => setSelected(null)}>Yopish</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}