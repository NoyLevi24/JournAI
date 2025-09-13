import { useMemo, useState, useEffect, useRef } from 'react'

function NavBar({ onHome, onOpenAuth, onStart, showBrand, token, onLogout }: { onHome: () => void, onOpenAuth: () => void, onStart: () => void, showBrand: boolean, token: string | null, onLogout: ()=>void }) {
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,height:72,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',backdropFilter:'blur(8px)',background:'rgba(0,0,0,0.35)',zIndex:10,borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={onHome}>
        {showBrand && <>
          <img src="/logo.png" alt="JournAI" style={{height:44}}/>
          <span style={{color:'#fff',fontWeight:800,letterSpacing:0.6}}>JOURNAI</span>
        </>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:24,color:'#e5e7eb'}}>
        <a onClick={onHome} style={{cursor:'pointer'}}>Home</a>
        {!token ? (
          <a onClick={onOpenAuth} style={{cursor:'pointer'}}>Login/Registration</a>
        ) : (
          <a onClick={onLogout} style={{cursor:'pointer'}}>Logout</a>
        )}
        <button onClick={onStart} style={primaryBtnStyle}>Get Started</button>
      </div>
    </div>
  )
}

function AuthModal({ open, onClose, onAuth }: { open: boolean, onClose: () => void, onAuth: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login'|'register'>('register')
  const [error, setError] = useState<string|undefined>()
  if (!open) return null
  const submit = async () => {
    setError(undefined)
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const body = mode === 'register' ? { username, email, password } : { email, password }
      const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onAuth(data.token)
      onClose()
    } catch (e:any) { setError(e.message) }
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:380,background:'#111',color:'#eee',border:'1px solid #333',borderRadius:12,padding:22,boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
        <h2 style={{marginTop:0}}>{mode === 'register' ? 'Create account' : 'Welcome back'}</h2>
        {mode==='register' && (
          <input placeholder='Username' value={username} onChange={e=>setUsername(e.target.value)} style={inputStyle}/>
        )}
        <input placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}/>
        <input placeholder='Password' type='password' value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/>
        {error && <div style={{color:'#ff6b6b',marginBottom:8}}>{error}</div>}
        <button onClick={submit} style={primaryBtnStyle}>{mode==='register'?'Sign up':'Sign in'}</button>
        <div style={{marginTop:8,fontSize:13}}>
          {mode==='register' ? (
            <>Already have an account? <a style={{color:'#7bdcff',cursor:'pointer'}} onClick={()=>setMode('login')}>Log in</a></>
          ) : (
            <>New here? <a style={{color:'#7bdcff',cursor:'pointer'}} onClick={()=>setMode('register')}>Create one</a></>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width:'100%',padding:'12px 14px',borderRadius:10,border:'1px solid #333',background:'#0d0d0d',color:'#fff',marginBottom:12 }
const primaryBtnStyle: React.CSSProperties = { padding:'12px 18px',borderRadius:999,border:'1px solid #0ea5e9',background:'#0ea5e9',color:'#001018',fontWeight:800,cursor:'pointer' }

function Home({ onStart, onOpenAuth, onTrips }: { onStart: () => void, onOpenAuth: () => void, onTrips: () => void }) {
  return (
    <>
      <section className="section" style={{position:'relative'}}>
        <div className="container" style={{textAlign:'center'}}>
          <div style={{marginTop:60,display:'grid',gap:14,placeItems:'center'}}>
            <img src="/logo.png" alt="JournAI" style={{height:160,filter:'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'}}/>
            <div style={{display:'flex',gap:10}}>
              <button onClick={onOpenAuth} className="btn">Sign in</button>
              <button onClick={onStart} className="btn primary" style={{fontSize:18}}>Get Started</button>
              <button onClick={onTrips} className="btn">My Trips</button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function Card({ title, text }: { title: string, text: string }) {
  return (
    <div className="glass" style={{border:'1px solid #333',borderRadius:12,padding:18}}>
      <div style={{fontWeight:700,marginBottom:6}}>{title}</div>
      <div style={{opacity:0.9}}>{text}</div>
    </div>
  )
}

function Labeled({ label, hint, children }: { label: string, hint?: string, children: React.ReactNode }) {
  return (
    <label style={{display:'grid',gap:6}}>
      <span style={{fontSize:13,opacity:0.9}}>{label}{hint && <span style={{opacity:0.7}}> — {hint}</span>}</span>
      {children}
    </label>
  )
}

function Chip({ selected, onClick, children }: { selected: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{padding:'8px 12px',borderRadius:999,border:`1px solid ${selected?'#0ea5e9':'#333'}`,background:selected?'#0ea5e9':'transparent',color:selected?'#001018':'#e5e7eb',cursor:'pointer'}}>{children}</button>
  )}

function Planner({ token, onOpenDetails }: { token: string, onOpenDetails: (tripId:number)=>void }) {
  const [destination, setDestination] = useState('')
  const [budget, setBudget] = useState<'Shoestring'|'Moderate'|'Luxury'>('Moderate')
  const [durationDays, setDurationDays] = useState(5)
  const [interests, setInterests] = useState<string[]>(['Art','Nature','Food'])
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<any | null>(null)
  const [trips, setTrips] = useState<any[]>([])
  const planRef = useRef<HTMLDivElement>(null)

  const allInterests = ['Highlights','Art','Nature','Food','History','Nightlife','Shopping','Kids','Adventure','Beach','Architecture']

  const toggleInterest = (value: string) => {
    setInterests(prev => prev.includes(value) ? prev.filter(v=>v!==value) : [...prev, value])
  }

  const loadTrips = async () => {
    const res = await fetch('/api/itineraries', { headers:{ Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setTrips(data)
    }
  }

  useEffect(() => { loadTrips() }, [])

  const viewTrip = async (id: number) => {
    const res = await fetch(`/api/itineraries/${id}`, { headers:{ Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setPlan(data.plan)
      setDestination(data.destination)
      setBudget(data.budget)
      setDurationDays(data.durationDays)
      setInterests(data.interests)
      setTimeout(()=>planRef.current?.scrollIntoView({behavior:'smooth'}), 0)
    }
  }

  const deleteTrip = async (id: number) => {
    if (!confirm('Delete this trip?')) return
    const res = await fetch(`/api/itineraries/${id}`, { method:'DELETE', headers:{ Authorization: `Bearer ${token}` } })
    if (res.ok) {
      setTrips(trips.filter(t => t.id !== id))
      if (plan && (trips.find(t => t.id === id))) setPlan(null)
    } else {
      const err = await res.json().catch(()=>({error:'Delete failed'}))
      alert(err.error || 'Delete failed')
    }
  }

  const submit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/itineraries', { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ destination, budget, durationDays: Number(durationDays), interests }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setPlan(data.plan)
      await loadTrips()
      setTimeout(()=>planRef.current?.scrollIntoView({behavior:'smooth'}), 0)
    } catch (e:any) { alert(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{maxWidth:1100,margin:'120px auto 60px',padding:'0 20px',color:'#fff'}}>
      <h2>Plan your trip</h2>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,alignItems:'start'}}>
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Labeled label="Destination" hint="City/Region/Country">
              <input placeholder='e.g. Rome, Italy' value={destination} onChange={e=>setDestination(e.target.value)} style={inputStyle}/>
            </Labeled>
            <Labeled label="Budget" hint="Overall trip style">
              <select value={budget} onChange={e=>setBudget(e.target.value as any)} style={{...inputStyle,background:'#0d0d0d'}}>
                <option>Shoestring</option>
                <option>Moderate</option>
                <option>Luxury</option>
              </select>
            </Labeled>
            <Labeled label="Duration (days)" hint="1–30">
              <input type='number' min={1} max={30} value={durationDays} onChange={e=>setDurationDays(Number(e.target.value))} style={inputStyle}/>
            </Labeled>
            <Labeled label="Interests" hint="Pick one or more">
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {allInterests.map(opt => (
                  <Chip key={opt} selected={interests.includes(opt)} onClick={()=>toggleInterest(opt)}>{opt}</Chip>
                ))}
              </div>
            </Labeled>
          </div>
          <button onClick={submit} style={{...primaryBtnStyle,marginTop:12}} disabled={loading}>{loading? 'Generating...' : 'Generate Plan'}</button>

          {plan && (
            <div ref={planRef} style={{marginTop:24,background:'rgba(0,0,0,0.5)',border:'1px solid #333',borderRadius:12,padding:16}}>
              <h3>Daily Plan</h3>
              <div style={{display:'grid',gap:12}}>
                {plan.days?.map((d:any)=> (
                  <div key={d.day} style={{border:'1px solid #333',borderRadius:8,padding:12}}>
                    <strong>{d.title}</strong>
                    <div style={{opacity:0.9,margin:'6px 0'}}>{d.summary}</div>
                    <div style={{opacity:0.9}}>
                      {d.morning && <div><em>Morning:</em> {d.morning}</div>}
                      {d.afternoon && <div><em>Afternoon:</em> {d.afternoon}</div>}
                      {d.evening && <div><em>Evening:</em> {d.evening}</div>}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:6}}>
                      <div>
                        <em>Attractions</em>
                        <ul>
                          {d.attractions?.map((a:any,i:number)=>(<li key={i}>{a.name} — {a.type}{a.notes?` — ${a.notes}`:''}</li>))}
                        </ul>
                      </div>
                      <div>
                        <em>Restaurants</em>
                        <ul>
                          {d.restaurants?.map((r:any,i:number)=>(<li key={i}>{r.name} — {r.cuisine}{r.notes?` — ${r.notes}`:''}</li>))}
                        </ul>
                      </div>
                    </div>
                    <div style={{marginTop:6}}><em>Transport:</em> {d.transport}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="glass" style={{border:'1px solid #333',borderRadius:12,padding:14}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 style={{margin:0}}>My Trips</h3>
            <button onClick={loadTrips} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>Refresh</button>
          </div>
          <div style={{marginTop:10,display:'grid',gap:8}}>
            {trips.length === 0 && <div style={{opacity:0.8}}>No trips yet. Generate your first plan!</div>}
            {trips.map(t => (
              <div key={t.id} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,alignItems:'center'}}>
                <button onClick={()=>viewTrip(t.id)} style={{textAlign:'left',padding:10,borderRadius:10,border:'1px solid #333',background:'rgba(255,255,255,0.03)',color:'#e5e7eb',cursor:'pointer'}}>
                  <div style={{fontWeight:700}}>{t.destination}</div>
                  <div style={{opacity:0.8,fontSize:12}}>{t.durationDays} days • {t.budget} • {new Date(t.createdAt || t.created_at).toLocaleDateString()}</div>
                </button>
                <button onClick={()=>onOpenDetails(t.id)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>Details</button>
                <button onClick={()=>deleteTrip(t.id)} title="Delete" style={{padding:'6px 10px',borderRadius:8,border:'1px solid #7f1d1d',background:'#7f1d1d',color:'#fff',cursor:'pointer'}}>Delete</button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function TripDetails({ token, tripId, onBack }: { token: string, tripId: number, onBack: ()=>void }) {
  const [trip, setTrip] = useState<any | null>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')

  const load = async () => {
    const t = await fetch(`/api/itineraries/${tripId}`, { headers:{ Authorization:`Bearer ${token}` } })
    if (t.ok) setTrip(await t.json())
    const p = await fetch(`/api/photos/${tripId}`, { headers:{ Authorization:`Bearer ${token}` } })
    if (p.ok) setPhotos(await p.json())
  }
  useEffect(()=>{ load() }, [tripId])

  const upload = async () => {
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    fd.append('caption', caption)
    const res = await fetch(`/api/photos/${tripId}`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }, body: fd })
    if (res.ok) {
      setFile(null);
      setCaption('');
      const el = document.getElementById('file-input') as HTMLInputElement | null;
      if (el) el.value = '';
      load();
    }
  }

  const remove = async (id:number) => {
    const res = await fetch(`/api/photos/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    if (res.ok) setPhotos(photos.filter(p=>p.id!==id))
  }

  return (
    <div style={{maxWidth:1000,margin:'120px auto 60px',padding:'0 20px',color:'#fff'}}>
      <button onClick={onBack} style={{marginBottom:12,padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>Back</button>
      {trip && (
        <>
          <h2>Trip to {trip.destination}</h2>
          <div style={{opacity:0.9,marginBottom:12}}>{trip.durationDays} days • {trip.budget}</div>
          <div className="glass" style={{border:'1px solid #333',borderRadius:12,padding:14,marginBottom:16}}>
            <h3 style={{marginTop:0}}>Album</h3>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <input id="file-input" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
              <input placeholder="Caption" value={caption} onChange={e=>setCaption(e.target.value)} style={{...inputStyle,width:240}}/>
              <button onClick={upload} style={primaryBtnStyle} disabled={!file}>Upload</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))',gap:10,marginTop:12}}>
              {photos.map(p=> (
                <div key={p.id} className="glass" style={{border:'1px solid #333',borderRadius:8,padding:8}}>
                  <img src={`/uploads/${p.filename}`} alt={p.caption||''} style={{width:'100%',height:160,objectFit:'cover',borderRadius:6,display:'block'}} onError={(e)=>{(e.target as HTMLImageElement).style.opacity='0.3'}}/>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
                    <div style={{opacity:0.9,fontSize:12}}>{p.caption||''}</div>
                    <button onClick={()=>remove(p.id)} style={{padding:'4px 8px',borderRadius:6,border:'1px solid #7f1d1d',background:'#7f1d1d',color:'#fff',cursor:'pointer'}}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TripsPage({ token, onOpenDetails }: { token: string, onOpenDetails: (id:number)=>void }) {
  const [trips, setTrips] = useState<any[]>([])
  const load = async () => {
    const res = await fetch('/api/itineraries', { headers:{ Authorization:`Bearer ${token}` } })
    if (res.ok) setTrips(await res.json())
  }
  useEffect(()=>{ load() }, [])
  return (
    <div style={{maxWidth:900,margin:'120px auto 60px',padding:'0 20px',color:'#fff'}}>
      <h2>My Trips</h2>
      <div style={{display:'grid',gap:10}}>
        {trips.map(t => (
          <div key={t.id} className="glass" style={{border:'1px solid #333',borderRadius:12,padding:12,display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>{t.destination}</div>
              <div style={{opacity:0.8,fontSize:12}}>{t.durationDays} days • {t.budget} • {new Date(t.createdAt || t.created_at).toLocaleDateString()}</div>
            </div>
            <button onClick={()=>onOpenDetails(t.id)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>Open</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function App() {
  const [route, setRoute] = useState<'home'|'planner'|'trip-details'|'trips'>('home')
  const [authOpen, setAuthOpen] = useState(false)
  const [token, setToken] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('journai_token') : null)
  const [detailsTripId, setDetailsTripId] = useState<number | null>(null)
  const canPlan = useMemo(()=>!!token, [token])

  const setTokenPersist = (t:string|null) => { setToken(t); if (t) localStorage.setItem('journai_token', t); else localStorage.removeItem('journai_token') }

  return (
    <>
      <NavBar onHome={()=>setRoute('home')} onOpenAuth={()=>setAuthOpen(true)} onStart={()=>setRoute('planner')} showBrand={route!=='home'} token={token} onLogout={()=>setTokenPersist(null)} />
      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuth={(t)=>setTokenPersist(t)} />
      {route==='home' ? (
        <Home onStart={()=>setRoute('planner')} onOpenAuth={()=>setAuthOpen(true)} onTrips={()=>setRoute('trips')} />
      ) : route==='planner' ? (
        canPlan ? <Planner token={token!} onOpenDetails={(id)=>{ setDetailsTripId(id); setRoute('trip-details') }} /> : (
          <div style={{display:'grid',placeItems:'center',minHeight:'100vh',color:'#fff'}}>
            <div style={{marginTop:100,textAlign:'center'}}>
              <p>Please sign in to start planning.</p>
              <button onClick={()=>setAuthOpen(true)} style={primaryBtnStyle}>Sign in</button>
            </div>
          </div>
        )
      ) : route==='trips' ? (
        canPlan ? <TripsPage token={token!} onOpenDetails={(id)=>{ setDetailsTripId(id); setRoute('trip-details') }} /> : null
      ) : (
        canPlan && detailsTripId!=null ? <TripDetails token={token!} tripId={detailsTripId} onBack={()=>setRoute('trips')} /> : null
      )}
    </>
  )
}
