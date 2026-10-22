import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Btn, Card, Input, Msg, Spinner, idOf } from '../components/common/ui';

export default function Charities() {
  const [list, setList] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState(false);
 useEffect(() => {
    api.get('/charities').then((r) => setCategories([...new Set(r.data.map((c) => c.category).filter(Boolean))])).catch(() => {});
  }, []);
useEffect(() => {
    const t = setTimeout(() => {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (category) q.set('category', category);
      if (featured) q.set('featured', 'true');
      api.get('/charities?' + q).then((r) => setList(r.data)).catch(() => setList([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search, category, featured]);

  return (
    <section className="py-10">
      <h1 className="text-3xl font-bold">Charities you can support</h1>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="w-full max-w-sm">
          <Input label="Search" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        <label className="text-sm text-white/70">Category
          <select className="mt-1 block rounded-xl border border-white/10 bg-ink px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {categories.map((c) => 
            <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
           Featured only
        </label>
      </div>
      {!list ? 
      <Spinner /> : list.length === 0 ? 
      <p className="mt-10 text-white/50">No charities found.</p> 
      : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Link key={idOf(c)} to={`/charities/${idOf(c)}`}>
              <Card className="h-full transition hover:-translate-y-1 hover:border-brand/50">
                {c.image_url && 
                <img src={c.image_url} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />
                }
                <h3 className="font-semibold">{c.name}</h3>

                {c.category && 
                <span className="text-xs text-warm">{c.category}</span>
                }
                <p className="mt-1 line-clamp-3 text-sm text-white/60">{c.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function CharityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [c, setC] = useState(null);
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { api.get(`/charities/${id}`).then((r) => setC(r.data)).catch((e) => setErr(errMsg(e))); }, [id]);

  
  const donate = async () => {
    setErr('');
    try { const { data } = await api.post(`/charities/${id}/donate`, { amount }); window.location = data.url; }
    catch (e) { setErr(errMsg(e)); }
  };

  if (err && !c) return <p className="py-20 text-center text-red-300">{err}</p>;
  if (!c) return <Spinner />;
  const events = Array.isArray(c.events) ? c.events : [];
  return (
    <section className="py-10">
      <Link to="/charities" className="text-sm text-brand">← All charities</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {c.image_url ? 
        <img src={c.image_url} alt={c.name} className="h-72 w-full rounded-2xl object-cover" /> 
        : 
        <div className="h-72 rounded-2xl bg-gradient-to-br from-brand/30 to-warm/30" />}
        <div>
          <h1 className="text-3xl font-bold">{c.name}</h1>
          <p className="mt-4 text-white/70">{c.description}</p>
          <Card className="mt-6">
            <h3 className="font-semibold">Make a donation</h3>
            <p className="mb-3 text-sm text-white/60">Independent of your subscription and gameplay.</p>
            {user ? (
              <div className="flex items-end gap-3">
                <Input label="Amount (₹)" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <Btn onClick={donate}>Donate</Btn>
                </div>
              ) : 
              <Link className="text-brand" to="/login">Login to donate</Link>
              }
            <div className="mt-3">
              <Msg>{err}</Msg>
              </div>
          </Card>
        </div>
      </div>
      {events.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-xl font-semibold">Upcoming events</h2>
          <div className="grid gap-3 sm:grid-cols-2">{events.map((e, i) => 
            <Card key={i}>
              <p className="font-medium">{e.title || e.name}</p>
              <p className="text-sm text-white/60">{e.date} {e.location && `· ${e.location}`}
              </p>
              </Card>
            )}
            
            </div>
        </div>
      )}
    </section>
  );
}
