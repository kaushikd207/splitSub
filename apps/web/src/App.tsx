import { Component, FormEvent, ReactNode, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRight, BadgeCheck, CalendarDays, Check, ChevronRight, LockKeyhole, Plus, Search, ShieldCheck, Sparkles, Users } from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true });
let RUNTIME_CONFIG: any = null;
async function loadRuntimeConfigIfNeeded() {
  if (RUNTIME_CONFIG !== null) return;
  try {
    const resp = await fetch('/app-config.json', { cache: 'no-store' });
    if (resp.ok) RUNTIME_CONFIG = await resp.json();
    else RUNTIME_CONFIG = {};
  } catch {
    RUNTIME_CONFIG = {};
  }
}

const STORAGE_KEY = 'splitsub-demo-state-v1';

// On load: fetch runtime config and clear demo seed if a real API URL is present.
(async () => {
  try {
    await loadRuntimeConfigIfNeeded();
    if (RUNTIME_CONFIG && RUNTIME_CONFIG.VITE_API_URL) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // ignore
  }
})();

const demoServices = [
  {
    id: 'spotify',
    name: 'Spotify',
    plans: [
      { id: 'spotify-family', name: 'Premium Family', price: 179, billingCycle: 'MONTHLY', maxMembers: 6 },
    ],
    sharingAllowed: true,
    eligibilityRules: 'Only official provider invitations are permitted.',
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    plans: [
      { id: 'youtube-family', name: 'Family', price: 299, billingCycle: 'MONTHLY', maxMembers: 5 },
    ],
    sharingAllowed: true,
    eligibilityRules: 'Only official provider invitations are permitted.',
  },
  {
    id: 'apple-one',
    name: 'Apple One',
    plans: [
      { id: 'apple-family', name: 'Family', price: 365, billingCycle: 'MONTHLY', maxMembers: 6 },
    ],
    sharingAllowed: true,
    eligibilityRules: 'Only official provider invitations are permitted.',
  },
  {
    id: 'm365',
    name: 'Microsoft 365',
    plans: [
      { id: 'm365-family', name: 'Family', price: 819, billingCycle: 'MONTHLY', maxMembers: 6 },
    ],
    sharingAllowed: true,
    eligibilityRules: 'Only official provider invitations are permitted.',
  },
] as const;

const demoGroupsSeed = [
  {
    id: 'group-spotify-1',
    totalPrice: 179,
    totalMembers: 6,
    offeredSlots: 2,
    service: { id: 'spotify', name: 'Spotify' },
    plan: { id: 'spotify-family', name: 'Premium Family' },
    owner: { name: 'Priya N.', emailVerified: true },
    renewalDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'group-youtube-1',
    totalPrice: 299,
    totalMembers: 5,
    offeredSlots: 3,
    service: { id: 'youtube-premium', name: 'YouTube Premium' },
    plan: { id: 'youtube-family', name: 'Family' },
    owner: { name: 'Amit R.', emailVerified: true },
    renewalDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'group-apple-1',
    totalPrice: 365,
    totalMembers: 6,
    offeredSlots: 1,
    service: { id: 'apple-one', name: 'Apple One' },
    plan: { id: 'apple-family', name: 'Family' },
    owner: { name: 'Nina K.', emailVerified: false },
    renewalDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
] as const;

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const err = (e: any) => e?.response?.data?.error || 'Something went wrong. Please try again.';

function getDemoState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const initial = {
    users: [
      { id: 'demo-user', name: 'Aarav N.', email: 'aarav@example.com', password: 'demo123456', role: 'USER', emailVerified: true },
    ],
    user: null,
    groups: [...demoGroupsSeed],
    memberships: [],
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function writeDemoState(next: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function safeUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'USER',
    emailVerified: !!u.emailVerified,
    avatar: u.avatar || null,
  };
}

async function apiRequest<T>(path: string, method = 'get', body?: Record<string, unknown>): Promise<T> {
  await loadRuntimeConfigIfNeeded();
  const runtimeUrl = (RUNTIME_CONFIG && RUNTIME_CONFIG.VITE_API_URL) || import.meta.env.VITE_API_URL;
  const useDemoMode = !runtimeUrl;

  const demoFallback = () => {
    const state = getDemoState();
    const user = state.user;

    if (path === '/auth/me') {
      return { user: user ? safeUser(user) : null } as T;
    }

    if (path === '/auth/login') {
      const { email, password } = body || {};
      const candidate = state.users.find((u: any) => u.email === email);
      if (!candidate || candidate.password !== password) {
        throw Object.assign(new Error('Invalid email or password'), {
          response: { status: 401, data: { error: 'Invalid email or password' } },
        });
      }
      state.user = candidate;
      writeDemoState(state);
      return { user: safeUser(candidate) } as T;
    }

    if (path === '/auth/register') {
      const { name, email, password } = body || {};
      if (state.users.some((u: any) => u.email === email)) {
        throw Object.assign(new Error('Account already exists'), {
          response: { status: 409, data: { error: 'An account already exists for that email.' } },
        });
      }
      const created = { id: `user-${Date.now()}`, name, email, password, role: 'USER', emailVerified: false };
      state.users.push(created);
      state.user = created;
      writeDemoState(state);
      return { user: safeUser(created) } as T;
    }

    if (path === '/groups') {
      return state.groups as T;
    }

    if (path === '/services') {
      return demoServices as T;
    }

    if (path === '/memberships/me') {
      if (!user) return [] as T;
      return state.memberships.filter((membership: any) => membership.userId === user.id) as T;
    }

    if (path.startsWith('/groups/') && path.endsWith('/reserve')) {
      if (!user) {
        throw Object.assign(new Error('Authentication required'), {
          response: { status: 401, data: { error: 'Authentication required' } },
        });
      }
      const groupId = path.split('/')[2];
      const group = state.groups.find((current: any) => current.id === groupId);
      if (!group) {
        throw Object.assign(new Error('Group is unavailable'), {
          response: { status: 404, data: { error: 'Group is unavailable' } },
        });
      }
      const existing = state.memberships.find((membership: any) => membership.groupId === groupId && membership.userId === user.id);
      if (existing) {
        return { reservationId: existing.id, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() } as T;
      }
      const totalShare = Number(group.totalPrice) / Number(group.totalMembers);
      const memberFee = Math.round(totalShare * 0.04 + 5);
      const membership = {
        id: `membership-${Date.now()}`,
        userId: user.id,
        groupId,
        group,
        status: 'ACTIVE',
        total: totalShare + memberFee,
      };
      state.memberships.push(membership);
      writeDemoState(state);
      return { reservationId: membership.id, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() } as T;
    }

    return null as T;
  };

  if (useDemoMode) {
    return demoFallback();
  }

  try {
    const base = runtimeUrl || '/api';
    const response = await axios.request({ baseURL: base, url: path, method, data: body, withCredentials: true });
    return response.data as T;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);

    if (path === '/auth/me') {
      const user = getDemoState().user;
      return { user: user ? safeUser(user) : null } as T;
    }

    if (path === '/auth/login') {
      const { email, password } = body || {};
      const state = getDemoState();
      const candidate = state.users.find((u: any) => u.email === email);
      if (!candidate || candidate.password !== password) {
        throw Object.assign(new Error('Invalid email or password'), {
          response: { status: 401, data: { error: 'Invalid email or password' } },
        });
      }
      state.user = candidate;
      writeDemoState(state);
      return { user: safeUser(candidate) } as T;
    }

    if (path === '/auth/register') {
      const { name, email, password } = body || {};
      const state = getDemoState();
      if (state.users.some((u: any) => u.email === email)) {
        throw Object.assign(new Error('Account already exists'), {
          response: { status: 409, data: { error: 'An account already exists for that email.' } },
        });
      }
      const created = { id: `user-${Date.now()}`, name, email, password, role: 'USER', emailVerified: false };
      state.users.push(created);
      state.user = created;
      writeDemoState(state);
      return { user: safeUser(created) } as T;
    }

    if (path === '/groups') {
      return getDemoState().groups as T;
    }

    if (path === '/services') {
      return demoServices as T;
    }

    if (path === '/memberships/me') {
      const state = getDemoState();
      const user = state.user;
      if (!user) {
        return [] as T;
      }
      return state.memberships.filter((membership: any) => membership.userId === user.id) as T;
    }

    if (path.startsWith('/groups/') && path.endsWith('/reserve')) {
      const state = getDemoState();
      const user = state.user;
      if (!user) {
        throw Object.assign(new Error('Authentication required'), {
          response: { status: 401, data: { error: 'Authentication required' } },
        });
      }
      const groupId = path.split('/')[2];
      const group = state.groups.find((current: any) => current.id === groupId);
      if (!group) {
        throw Object.assign(new Error('Group is unavailable'), {
          response: { status: 404, data: { error: 'Group is unavailable' } },
        });
      }
      const existing = state.memberships.find((membership: any) => membership.groupId === groupId && membership.userId === user.id);
      if (existing) {
        return { reservationId: existing.id, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() } as T;
      }
      const totalShare = Number(group.totalPrice) / Number(group.totalMembers);
      const memberFee = Math.round(totalShare * 0.04 + 5);
      const membership = {
        id: `membership-${Date.now()}`,
        userId: user.id,
        groupId,
        group,
        status: 'ACTIVE',
        total: totalShare + memberFee,
      };
      state.memberships.push(membership);
      writeDemoState(state);
      return { reservationId: membership.id, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() } as T;
    }

    if (status === 401) {
      throw error;
    }

    if (error?.message?.includes('Network Error') || error?.code === 'ERR_NETWORK') {
      return null as T;
    }

    throw error;
  }
}

function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiRequest<{ user: any | null }>('/auth/me', 'get');
      return res.user ?? null;
    },
    retry: false,
  });
}

function Brand() {
  return (
    <Link className="brand" to="/">
      <span>?</span> SplitSub
    </Link>
  );
}

function Nav() {
  const { data: user } = useMe();
  return (
    <header>
      <Brand />
      <nav>
        <Link to="/explore">Explore</Link>
        <a href="/#how">How it works</a>
        <Link to="/subscriptions">My subscriptions</Link>
      </nav>
      <div className="nav-actions">
        {user ? <span className="text-link">Hi, {user.name.split(' ')[0]}</span> : <Link className="text-link" to="/login">Log in</Link>}
        <Link className="button small" to="/create">
          <Plus size={16} /> Create group
        </Link>
      </div>
    </header>
  );
}

function GroupCard({ g }: { g: any }) {
  const nav = useNavigate();
  const client = useQueryClient();
  const [message, setMessage] = useState('');
  const base = Number(g.totalPrice) / Number(g.totalMembers || 1);
  const fee = Math.round(base * 0.04 + 5);

  async function join() {
    try {
      await apiRequest(`/groups/${g.id}/reserve`, 'post');
      setMessage('Slot reserved successfully. This demo version keeps the reservation in your browser.');
      client.invalidateQueries({ queryKey: ['groups'] });
      client.invalidateQueries({ queryKey: ['memberships'] });
      client.invalidateQueries({ queryKey: ['me'] });
    } catch (e) {
      if ((e as any).response?.status === 401) {
        nav('/login');
        return;
      }
      setMessage(err(e));
    }
  }

  return (
    <article className="group-card">
      <div className="group-top">
        <div className="logo">{g.service?.name?.[0] || 'S'}</div>
        <div>
          <p className="eyebrow">{g.service?.name}</p>
          <h3>{g.plan?.name}</h3>
        </div>
        <span className="slot">{Math.max(0, Number(g.availableSlots ?? g.offeredSlots ?? 0))} slots left</span>
      </div>
      <div className="owner">
        <span className="avatar">{g.owner?.name?.[0] || 'H'}</span>
        <span>Hosted by {g.owner?.name}</span>
        {g.owner?.emailVerified && <BadgeCheck size={16} />}
      </div>
      <div className="price-row">
        <div>
          <small>Monthly share</small>
          <strong>{money(base)}</strong>
        </div>
        <div>
          <small>Platform fee</small>
          <b>{money(fee)}</b>
        </div>
        <div>
          <small>Total payable</small>
          <strong>{money(base + fee)}</strong>
        </div>
      </div>
      <div className="card-foot">
        <span>
          <CalendarDays size={15} /> Renews {new Date(g.renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        <button onClick={join} className="button dark">
          Join group <ArrowRight size={16} />
        </button>
      </div>
      {message && <p className="form-message">{message}</p>}
    </article>
  );
}

function Home() {
  const { data = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiRequest<any[]>('/groups', 'get'),
  });

  return (
    <>
      <Nav />
      <main>
        <section className="hero">
          <div className="pill">
            <Sparkles size={14} /> Fair sharing, built for peace of mind
          </div>
          <h1>
            Share the cost.<br />
            <i>Enjoy more.</i>
          </h1>
          <p>Join eligible subscription groups and pay only your share. Clear pricing, protected payments, no credential sharing.</p>
          <div className="hero-actions">
            <Link className="button" to="/explore">
              Explore groups <ArrowRight size={17} />
            </Link>
            <Link className="secondary" to="/create">
              Create a group
            </Link>
          </div>
          <div className="trust">
            <span>
              <ShieldCheck /> Terms-aware groups
            </span>
            <span>
              <LockKeyhole /> Secure checkout
            </span>
            <span>
              <Users /> Member invitations only
            </span>
          </div>
        </section>
        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">EXPLORE NOW</p>
              <h2>Great plans. Better together.</h2>
            </div>
            <Link to="/explore" className="inline">
              View all groups <ChevronRight size={18} />
            </Link>
          </div>
          {data.length ? (
            <div className="grid">
              {data.slice(0, 3).map((g: any) => (
                <GroupCard key={g.id} g={g} />
              ))}
            </div>
          ) : (
            <p className="empty">No groups yet. Be the first to create an eligible subscription group.</p>
          )}
        </section>
      </main>
      <footer>
        <Brand />
        <p>Made for fairer subscriptions.</p>
      </footer>
    </>
  );
}

function Explore() {
  const [query, setQuery] = useState('');
  const { data = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => apiRequest<any[]>('/groups', 'get'),
  });

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return data;
    return data.filter((g: any) => {
      const service = (g.service?.name || '').toLowerCase();
      const plan = (g.plan?.name || '').toLowerCase();
      return service.includes(value) || plan.includes(value);
    });
  }, [data, query]);

  return (
    <>
      <Nav />
      <main className="page">
        <p className="eyebrow">MARKETPLACE</p>
        <h1 className="page-title">Find your next subscription.</h1>
        <div className="search">
          <Search size={19} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search groups" />
        </div>
        <div className="results-head">
          <span>{filtered.length} groups available</span>
        </div>
        {isLoading ? (
          <p>Loading groups�</p>
        ) : filtered.length ? (
          <div className="grid">
            {filtered.map((g: any) => (
              <GroupCard key={g.id} g={g} />
            ))}
          </div>
        ) : (
          <p className="empty">No open groups right now. Create one to get started.</p>
        )}
      </main>
    </>
  );
}

function Create() {
  const nav = useNavigate();
  const client = useQueryClient();
  const { data: user } = useMe();
  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiRequest<any[]>('/services', 'get'),
  });

  const [serviceId, setServiceId] = useState('');
  const [planId, setPlanId] = useState('');
  const [price, setPrice] = useState('');
  const [members, setMembers] = useState('');
  const [slots, setSlots] = useState('');
  const [message, setMessage] = useState('');

  const service = catalog.find((item: any) => item.id === serviceId);
  const plans = Array.isArray(service?.plans) ? service.plans : [];

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!user) {
      nav('/login');
      return;
    }

    const selectedPlan = plans.find((plan: any) => plan.id === planId);
    if (!selectedPlan) {
      setMessage('Please select a valid service and plan.');
      return;
    }

    try {
      const state = getDemoState();
      const nextGroup = {
        id: `group-${Date.now()}`,
        service: { id: service.id, name: service.name },
        plan: { id: selectedPlan.id, name: selectedPlan.name },
        owner: { name: user.name, emailVerified: true },
        totalPrice: Number(price),
        totalMembers: Number(members),
        offeredSlots: Number(slots),
        availableSlots: Number(slots),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      state.groups.unshift(nextGroup);
      writeDemoState(state);
      client.invalidateQueries({ queryKey: ['groups'] });
      nav('/explore');
    } catch (e) {
      setMessage(err(e));
    }
  }

  return (
    <>
      <Nav />
      <main className="create">
        <p className="eyebrow">CREATE A GROUP</p>
        <h1>Start sharing, the right way.</h1>
        <p>Only list plans that support official additional-member invitations.</p>
        <form className="form-card" onSubmit={submit}>
          <h2>Group details</h2>
          {isLoading ? (
            <p>Loading eligible services�</p>
          ) : (
            <>
              <label>
                Service
                <select required value={serviceId} onChange={(e) => { setServiceId(e.target.value); setPlanId(''); }}>
                  <option value="">Select a service</option>
                  {catalog.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Plan
                <select required disabled={!serviceId} value={planId} onChange={(e) => setPlanId(e.target.value)}>
                  <option value="">Select a plan</option>
                  {plans.map((plan: any) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} (up to {plan.maxMembers})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Total monthly subscription price (INR)
                <input required type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <label>
                Total members in the plan
                <input required type="number" min="2" value={members} onChange={(e) => setMembers(e.target.value)} />
              </label>
              <label>
                Open spots to share
                <input required type="number" min="1" value={slots} onChange={(e) => setSlots(e.target.value)} />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" required />
                I confirm this plan permits invited members and the terms are met.
              </label>
              {message && <p className="form-message">{message}</p>}
              <button className="button" type="submit">
                Publish group <ArrowRight size={16} />
              </button>
            </>
          )}
        </form>
      </main>
    </>
  );
}

function Login() {
  const nav = useNavigate();
  const client = useQueryClient();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const path = register ? '/auth/register' : '/auth/login';
      const payload = register ? { name, email, password } : { email, password };
      await apiRequest(path, 'post', payload);
      await client.invalidateQueries({ queryKey: ['me'] });
      nav('/create');
    } catch (e) {
      setMessage(err(e));
    }
  }

  return (
    <main className="auth">
      <Brand />
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">{register ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</p>
        <h1>{register ? 'Join SplitSub.' : 'Good to see you.'}</h1>
        <p>{register ? 'Create an account to host or join eligible groups.' : 'Log in to reserve a subscription slot.'}</p>
        {register && (
          <label>
            Name
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label>
          Email
          <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </label>
        <label>
          Password
          <input required value={password} onChange={(e) => setPassword(e.target.value)} minLength={10} type="password" />
        </label>
        {message && <p className="form-message">{message}</p>}
        <button className="button" type="submit">
          {register ? 'Create account' : 'Log in'} <ArrowRight size={16} />
        </button>
        <small>
          {register ? 'Already have an account?' : 'New to SplitSub?'}{' '}
          <button type="button" className="link-button" onClick={() => setRegister((value) => !value)}>
            {register ? 'Log in' : 'Create an account'}
          </button>
        </small>
      </form>
    </main>
  );
}

function Subscriptions() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['memberships'],
    queryFn: () => apiRequest<any[]>('/memberships/me', 'get'),
    retry: false,
  });

  return (
    <>
      <Nav />
      <main className="page">
        <p className="eyebrow">MY SUBSCRIPTIONS</p>
        <h1 className="page-title">Your memberships.</h1>
        {isLoading ? (
          <p>Loading memberships�</p>
        ) : data.length ? (
          <div className="grid">
            {data.map((membership: any) => (
              <GroupCard key={membership.id || membership.group?.id} g={{ ...membership.group, availableSlots: 0 }} />
            ))}
          </div>
        ) : (
          <p className="empty">You have no memberships yet.</p>
        )}
      </main>
    </>
  );
}

class ScreenErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="page">
          <h1 className="page-title">We couldn�t load this screen.</h1>
          <p className="empty">Refresh the page. If this continues, verify that the backend is configured correctly.</p>
          <Link className="button" to="/">
            Return home
          </Link>
        </main>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ScreenErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<Create />} />
        <Route path="/login" element={<Login />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </ScreenErrorBoundary>
  );
}
