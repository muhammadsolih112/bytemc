import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useSearchParams } from "react-router-dom";

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
  type: 'ban' | 'mute' | 'kick';
  player: string;
  reason: string;
  image_url?: string | null;
  created_at: string;
  issuer?: string;
  expires_at?: string | null;
  duration?: string | null;
};

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState<string>(params.get('q') || '');
  const [bans, setBans] = useState<Entry[]>([]);
  const [mutes, setMutes] = useState<Entry[]>([]);
  const [kicks, setKicks] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toImageSrc = (u?: string | null) => {
    if (!u) return "";
    return u.startsWith("http") ? u : `${API}${u}`;
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [rb, rm, rk] = await Promise.all([
          fetch(`${API}/api/public/bans`).then(r => r.json()),
          fetch(`${API}/api/public/mutes`).then(r => r.json()),
          fetch(`${API}/api/public/kicks`).then(r => r.json()),
        ]);
        if (!Array.isArray(rb) || !Array.isArray(rm) || !Array.isArray(rk)) {
          throw new Error('Ma\'lumotni yuklashda xatolik');
        }
        setBans(rb.map((x: any) => ({ ...x, type: 'ban' })));
        setMutes(rm.map((x: any) => ({ ...x, type: 'mute' })));
        setKicks(rk.map((x: any) => ({ ...x, type: 'kick' })));
        setError(null);
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (msg.toLowerCase().includes("failed to fetch")) {
          const hint = import.meta.env.VITE_API_URL ? `API: ${API}` : `API: ${API}. Productionda backend URL kerak (VITE_API_URL).`;
          setError(`Ulanish xatosi. ${hint}`);
        } else {
          setError(msg || "Tarmoq xatosi");
        }
        } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q) setParams({ q });
    else setParams({});
  }, [query, setParams]);

  const filterByQuery = (list: Entry[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(e => e.player.toLowerCase().includes(q));
  };

  const bansFiltered = useMemo(() => filterByQuery(bans), [bans, query]);
  const mutesFiltered = useMemo(() => filterByQuery(mutes), [mutes, query]);
  const kicksFiltered = useMemo(() => filterByQuery(kicks), [kicks, query]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="container mx-auto p-6 pt-24 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Qidiruv</h1>
          <Link to="/" className="text-sm text-crypto-purple hover:underline">Bosh sahifa</Link>
        </div>

        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirmoqchi bolgan nickizni yozing"
            className="w-full md:w-1/2 px-4 py-2 rounded border border-gray-700 bg-gray-900 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">Ban, Mute va Kick ichidan izlaydi.</p>
        </div>

        {loading && <p>Yuklanmoqda...</p>}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-900/50 text-red-200 border border-red-800">
            Xatolik: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold mb-3">Banlar</h2>
              {bansFiltered.length === 0 ? (
                <p className="text-sm text-gray-400">Hech narsa topilmadi</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bansFiltered.map(e => (
                    <div key={`ban-${e.id}`} className="border rounded p-4 bg-card shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 rounded text-white bg-red-600 text-xs">BAN</span>
                        <p className="font-semibold break-words">{e.player}</p>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</p>
                      <p className="mt-2 break-words">Sabab: {e.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">Kim tomonidan: {e.issuer ?? "Noma'lum"}</p>
                      {e.image_url && (
                        <img src={toImageSrc(e.image_url)} alt="Dalil" className="mt-3 w-full max-h-64 object-cover rounded border border-gray-700" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Mutelar</h2>
              {mutesFiltered.length === 0 ? (
                <p className="text-sm text-gray-400">Hech narsa topilmadi</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mutesFiltered.map(e => (
                    <div key={`mute-${e.id}`} className="border rounded p-4 bg-card shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 rounded text-white bg-yellow-600 text-xs">MUTE</span>
                        <p className="font-semibold break-words">{e.player}</p>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</p>
                      <p className="mt-2 break-words">Sabab: {e.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">Muddat: {e.expires_at ? (e.duration || '—') : 'Doimiy'}</p>
                      <p className="text-xs text-gray-400 mt-1">Kim tomonidan: {e.issuer ?? "Noma'lum"}</p>
                      {e.image_url && (
                        <img src={toImageSrc(e.image_url)} alt="Dalil" className="mt-3 w-full max-h-64 object-cover rounded border border-gray-700" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Kicklar</h2>
              {kicksFiltered.length === 0 ? (
                <p className="text-sm text-gray-400">Hech narsa topilmadi</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kicksFiltered.map(e => (
                    <div key={`kick-${e.id}`} className="border rounded p-4 bg-card shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 rounded text-white bg-blue-600 text-xs">KICK</span>
                        <p className="font-semibold break-words">{e.player}</p>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</p>
                      <p className="mt-2 break-words">Sabab: {e.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">Kim tomonidan: {e.issuer ?? "Noma'lum"}</p>
                      {e.image_url && (
                        <img src={toImageSrc(e.image_url)} alt="Dalil" className="mt-3 w-full max-h-64 object-cover rounded border border-gray-700" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}