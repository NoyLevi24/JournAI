import { useMemo, useState, useEffect, useRef } from 'react'
import { Pencil, Trash2, ChevronRight, Bot, Zap, DollarSign, Camera, Globe, Target } from 'lucide-react'

function NavBar({ onHome, onOpenAuth, goPlan, goTrips, goAlbums, showBrand, token, onLogout, user, onOpenProfile, route }: { onHome: () => void, onOpenAuth: () => void, goPlan: () => void, goTrips: () => void, goAlbums: ()=>void, showBrand: boolean, token: string | null, onLogout: ()=>void, user: any | null, onOpenProfile: ()=>void, route: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const showNavLinks = !!token && route !== 'home'
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,height:72,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',backdropFilter:'blur(8px)',background:'rgba(0,0,0,0.35)',zIndex:10,borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={onHome}>
        {showBrand && <>
          <img src="/logo.png" alt="JournAI" style={{height:44}}/>
          <span style={{color:'#fff',fontWeight:800,letterSpacing:0.6}}>JOURNAI</span>
        </>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:18,color:'#e5e7eb'}}>
        {!token ? (
          <a onClick={onOpenAuth} style={{cursor:'pointer'}}>Sign in</a>
        ) : (
          <>
            {showNavLinks && (
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <a onClick={onHome} style={{cursor:'pointer'}}>Home</a>
                {route !== 'planner' && <a onClick={goPlan} style={{cursor:'pointer'}}>Plan</a>}
                {route !== 'albums' && <a onClick={goAlbums} style={{cursor:'pointer'}}>My Albums</a>}
                {route !== 'trips' && <a onClick={goTrips} style={{cursor:'pointer'}}>My Trips</a>}
              </div>
            )}
            <div style={{position:'relative'}}>
              <div onClick={()=>setMenuOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                <div style={{width:36,height:36,borderRadius:'50%',overflow:'hidden',border:'1px solid #333',background:'#0d0d0d',display:'grid',placeItems:'center'}}>
                  {user?.avatar ? <img src={user.avatar} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontWeight:800}}>{(user?.username||'U').charAt(0).toUpperCase()}</span>}
                </div>
              </div>
              {menuOpen && (
                <div style={{position:'absolute',right:0,top:48,minWidth:240,background:'#0b0b0b',border:'1px solid #333',borderRadius:12,boxShadow:'0 10px 30px rgba(0,0,0,0.5)',padding:10,zIndex:20}}>
                  <div style={{display:'flex',gap:10,alignItems:'center',padding:10}}>
                    <div style={{width:40,height:40,borderRadius:'50%',overflow:'hidden',border:'1px solid #333',background:'#0d0d0d',display:'grid',placeItems:'center'}}>
                      {user?.avatar ? <img src={user.avatar} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontWeight:800}}>{(user?.username||'U').charAt(0).toUpperCase()}</span>}
                    </div>
                    <div>
                      <div style={{fontWeight:700}}>{user?.username||'User'}</div>
                      <div style={{opacity:0.8,fontSize:12}}>{user?.email||''}</div>
                    </div>
                  </div>
                  <div style={{height:1,background:'#222',margin:'6px 0'}}/>
                  <button onClick={()=>{ onOpenProfile(); setMenuOpen(false) }} style={{width:'100%',textAlign:'left',padding:'8px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>Edit Profile</button>
                  <button onClick={()=>{ onLogout(); setMenuOpen(false) }} style={{width:'100%',textAlign:'left',padding:'8px 10px',borderRadius:8,border:'1px solid #7f1d1d',background:'#7f1d1d',color:'#fff',cursor:'pointer',marginTop:6}}>Logout</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AlbumPage({ token, tripId, onBack }: { token: string, tripId: number, onBack: ()=>void }) {
  const [trip, setTrip] = useState<any | null>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [activeAlbumId, setActiveAlbumId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [takenAt, setTakenAt] = useState('')
  const [location, setLocation] = useState('')
  const [tags, setTags] = useState('')

  const load = async () => {
    const t = await fetch(`/api/itineraries/${tripId}`, { headers:{ Authorization:`Bearer ${token}` } })
    if (t.ok) setTrip(await t.json())
    const [p, a] = await Promise.all([
      fetch(`/api/photos/${tripId}`, { headers:{ Authorization:`Bearer ${token}` } }),
      fetch(`/api/albums/itinerary/${tripId}`, { headers:{ Authorization:`Bearer ${token}` } })
    ])
    if (p.ok) {
      const list = await p.json()
      setPhotos(list.map((ph:any)=> ({ ...ph, tags: ph.tags ? (typeof ph.tags === 'string' ? (()=>{ try { return JSON.parse(ph.tags) } catch { return [] } })() : ph.tags) : [] })))
    }
    if (a.ok) setAlbums(await a.json())
  }
  useEffect(()=>{ load() }, [tripId])

  const filtered = photos.filter(p => (activeAlbumId ? p.album_id === activeAlbumId : !p.album_id))

  const upload = async () => {
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    if (title) fd.append('title', title)
    if (caption) fd.append('caption', caption)
    if (takenAt) fd.append('takenAt', takenAt)
    if (location) fd.append('location', location)
    if (tags) fd.append('tags', JSON.stringify(tags.split(',').map(s=>s.trim()).filter(Boolean)))
    if (activeAlbumId) fd.append('albumId', String(activeAlbumId))
    const res = await fetch(`/api/photos/${tripId}`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }, body: fd })
    if (res.ok) { setFile(null); setTitle(''); setCaption(''); setTakenAt(''); setLocation(''); setTags(''); const el = document.getElementById('file-input') as HTMLInputElement | null; if (el) el.value = ''; load() }
  }
  const remove = async (id:number) => {
    const res = await fetch(`/api/photos/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    if (res.ok) setPhotos(photos.filter(p=>p.id!==id))
  }
  const createAlbum = async () => {
    const name = prompt('Album name (e.g., Day 1, Old Town)')
    if (!name) return
    const res = await fetch(`/api/albums/itinerary/${tripId}`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ name }) })
    if (res.ok) { const a = await res.json(); setAlbums([a, ...albums]) }
  }
  const renameAlbum = async (id:number) => {
    const name = prompt('New album name')
    if (!name) return
    const res = await fetch(`/api/albums/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ name }) })
    if (res.ok) { const updated = await res.json(); setAlbums(albums.map(al=>al.id===id?updated:al)) }
  }
  const deleteAlbum = async (id:number) => {
    if (!confirm('Delete album? Photos will remain in General.')) return
    const res = await fetch(`/api/albums/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    if (res.ok) { setAlbums(albums.filter(a=>a.id!==id)); if (activeAlbumId===id) setActiveAlbumId(null) }
  }

  return (
    <div style={{maxWidth:1100,margin:'120px auto 60px',padding:'0 20px',color:'#fff'}}>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button onClick={onBack} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>Back</button>
      </div>
      {trip && <h2>{trip.destination} Album</h2>}
      <div className="glass" style={{border:'1px solid #333',borderRadius:12,padding:14,marginTop:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button onClick={()=>setActiveAlbumId(null)} style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${activeAlbumId===null?'#0ea5e9':'#333'}`,background:activeAlbumId===null?'#0ea5e9':'transparent',color:activeAlbumId===null?'#001018':'#e5e7eb',cursor:'pointer'}}>General</button>
            {albums.map(a => (
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:6}}>
                <button onClick={()=>setActiveAlbumId(a.id)} style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${activeAlbumId===a.id?'#0ea5e9':'#333'}`,background:activeAlbumId===a.id?'#0ea5e9':'transparent',color:activeAlbumId===a.id?'#001018':'#e5e7eb',cursor:'pointer'}}>{a.name}</button>
                <button onClick={()=>renameAlbum(a.id)} title="Rename" style={{padding:'4px 6px',borderRadius:6,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer',display:'grid',placeItems:'center'}}><Pencil size={14} /></button>
                <button onClick={()=>deleteAlbum(a.id)} title="Delete" style={{padding:'4px 6px',borderRadius:6,border:'1px solid #7f1d1d',background:'#7f1d1d',color:'#fff',cursor:'pointer',display:'grid',placeItems:'center'}}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <button onClick={createAlbum} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>+ New album</button>
        </div>
        {activeAlbumId !== null ? (
          <div style={{display:'grid',gap:8,marginTop:10}}>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <input id="file-input" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
              <button onClick={upload} style={primaryBtnStyle} disabled={!file}>Upload</button>
            </div>
            {file && (
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <input placeholder="Title (optional)" value={title} onChange={e=>setTitle(e.target.value)} style={{...inputStyle,width:180}}/>
                <input placeholder="Caption (optional)" value={caption} onChange={e=>setCaption(e.target.value)} style={{...inputStyle,width:220}}/>
                <input type="date" placeholder="Date" value={takenAt} onChange={e=>setTakenAt(e.target.value)} style={{...inputStyle,width:180,colorScheme:'dark'}}/>
                <input placeholder="Location (optional)" value={location} onChange={e=>setLocation(e.target.value)} style={{...inputStyle,width:200}}/>
                <input placeholder="Tags (comma-separated)" value={tags} onChange={e=>setTags(e.target.value)} style={{...inputStyle,width:240}}/>
              </div>
            )}
          </div>
        ) : (
          <div style={{opacity:0.8,fontSize:13,marginTop:10,padding:12,background:'rgba(14,165,233,0.1)',border:'1px solid rgba(14,165,233,0.3)',borderRadius:8}}>
            💡 <strong>General</strong> shows all photos from your albums. To upload photos, create or select a specific album above.
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))',gap:10,marginTop:12}}>
          {(activeAlbumId==null ? photos : filtered).map(p => (
            <div key={p.id} className="glass" style={{border:'1px solid #333',borderRadius:8,padding:8}}>
              <img src={`/uploads/${p.filename}`} alt={p.caption||''} style={{width:'100%',height:160,objectFit:'cover',borderRadius:6,display:'block'}} onError={(e)=>{(e.target as HTMLImageElement).style.opacity='0.3'}}/>
              <div style={{marginTop:6}}>
                <div style={{fontWeight:700}}>{p.title||''}</div>
                <div style={{opacity:0.9,fontSize:12}}>{p.caption||''}</div>
                <div style={{opacity:0.7,fontSize:12}}>{p.taken_at||''} {p.location?`• ${p.location}`:''}</div>
                <div style={{opacity:0.7,fontSize:12}}>{Array.isArray(p.tags)? p.tags.join(', ') : ''}</div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
                <button onClick={()=>remove(p.id)} style={{padding:'4px 8px',borderRadius:6,border:'1px solid #7f1d1d',background:'#7f1d1d',color:'#fff',cursor:'pointer'}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AllAlbumsPage({ token, onOpenAlbum }: { token: string, onOpenAlbum: (tripId:number)=>void }) {
  const [trips, setTrips] = useState<any[]>([])
  const [latestByTrip, setLatestByTrip] = useState<Record<number,string>>({})
  const load = async () => {
    const res = await fetch('/api/itineraries', { headers:{ Authorization:`Bearer ${token}` } })
    if (!res.ok) return
    const list = await res.json()
    setTrips(list)
    const entries = await Promise.all(list.map(async (t:any)=>{
      const p = await fetch(`/api/photos/${t.id}`, { headers:{ Authorization:`Bearer ${token}` } })
      if (p.ok) {
        const ph = await p.json()
        const latest = ph?.[0]?.filename
        return [t.id, latest] as [number, string|undefined]
      }
      return [t.id, undefined] as [number, undefined]
    }))
    const map: Record<number,string> = {}
    for (const [id, fn] of entries) { if (fn) map[id]=fn }
    setLatestByTrip(map)
  }
  useEffect(()=>{ load() }, [])
  return (
    <div style={{maxWidth:1100,margin:'120px auto 60px',padding:'0 20px',color:'#fff'}}>
      <h2>My Albums</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))',gap:16,marginTop:12}}>
        {trips.map(t=> (
          <button key={t.id} onClick={()=>onOpenAlbum(t.id)} className="glass" style={{border:'1px solid #333',borderRadius:12,padding:0,overflow:'hidden',textAlign:'left',cursor:'pointer',color:'#e5e7eb'}}>
            <div style={{height:160,background:'#0d0d0d'}}>
              {latestByTrip[t.id] ? (
                <img src={`/uploads/${latestByTrip[t.id]}`} alt="cover" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              ) : (
                <div style={{height:'100%',display:'grid',placeItems:'center',opacity:0.6}}>No photos yet</div>
              )}
            </div>
            <div style={{padding:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700}}>{t.destination}</div>
                <div style={{opacity:0.8,fontSize:12}}>{t.destination} album</div>
              </div>
              <div style={{opacity:0.6}}>›</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ProfileModal({ open, onClose, token, onUpdated }: { open: boolean, onClose: ()=>void, token: string, onUpdated: (u:any)=>void }) {
  const [user, setUser] = useState<any|null>(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [avatar, setAvatar] = useState<string>('')
  const [showChangePass, setShowChangePass] = useState(false)
  useEffect(()=>{
    if (!open) return
    ;(async()=>{
      const res = await fetch('/api/auth/me', { headers:{ Authorization:`Bearer ${token}` } })
      if (res.ok) {
        const u = await res.json()
        setUser(u); setUsername(u.username||''); setEmail(u.email||''); setAvatar(u.avatar||'')
      }
    })()
  }, [open, token])
  if (!open) return null
  const save = async () => {
    const res = await fetch('/api/auth/me', { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ username, email }) })
    if (res.ok) { const u = await res.json(); onUpdated(u) }
  }
  const changePass = async () => {
    if (!currentPassword || !newPassword) return
    await fetch('/api/auth/me/password', { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ currentPassword, newPassword }) })
    setCurrentPassword(''); setNewPassword('')
  }
  const onPickAvatar = (f: File|null) => {
    if (!f) return
    const reader = new FileReader(); reader.onload = async () => {
      const dataUrl = reader.result as string
      // Update UI immediately for better UX
      setAvatar(dataUrl)
      const res = await fetch('/api/auth/me/avatar', { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ avatar: dataUrl }) })
      if (res.ok) { 
        const u = await res.json()
        setAvatar(u.avatar||'')
        onUpdated(u)
      }
    }; reader.readAsDataURL(f)
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:520,background:'#111',color:'#eee',border:'1px solid #333',borderRadius:12,padding:22,boxShadow:'0 10px 30px rgba(0,0,0,0.6)'}}>
        <h2 style={{marginTop:0}}>Profile</h2>
        <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:16,alignItems:'center'}}>
          <div>
            <div style={{width:72,height:72,borderRadius:'50%',overflow:'hidden',border:'1px solid #333',background:'#0d0d0d',display:'grid',placeItems:'center'}}>
              {avatar ? <img src={avatar} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontWeight:800,fontSize:22}}>{(username||'U').charAt(0).toUpperCase()}</span>}
            </div>
            <input type="file" accept="image/*" onChange={e=>onPickAvatar(e.target.files?.[0]||null)} style={{marginTop:8}}/>
          </div>
          <div>
            <input placeholder='Username' value={username} onChange={e=>setUsername(e.target.value)} style={inputStyle}/>
            <input placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}/>
            <button onClick={save} style={primaryBtnStyle}>Save</button>
          </div>
        </div>
        <div style={{height:1,background:'#222',margin:'16px 0'}}/>
        <button onClick={()=>setShowChangePass(s=>!s)} style={{padding:'8px 12px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>
          {showChangePass ? 'Hide change password' : 'Change password'}
        </button>
        {showChangePass && (
          <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:8,alignItems:'center'}}>
            <input placeholder='Current password' type='password' value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} style={inputStyle}/>
            <input placeholder='New password' type='password' value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={inputStyle}/>
            <button onClick={changePass} style={primaryBtnStyle}>Update</button>
          </div>
        )}
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

function Home({ authed, onStartAuth, onPlan, onTrips, onAlbums }: { authed: boolean, onStartAuth: () => void, onPlan: () => void, onTrips: () => void, onAlbums: ()=>void }) {
  return (
    <>
      {/* Hero Section */}
      <section className="section" style={{position:'relative'}}>
        <div className="container" style={{textAlign:'center'}}>
          <div style={{marginTop:60,display:'grid',gap:20,placeItems:'center'}}>
            <img src="/logo.png" alt="JournAI" style={{height:160,filter:'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'}}/>
            <div style={{maxWidth:800}}>
              <h1 style={{fontSize:64,fontWeight:900,marginBottom:20,background:'linear-gradient(135deg, #7bdcff, #0ea5e9)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                Plan Your Perfect Trip
              </h1>
              <p style={{fontSize:20,opacity:0.9,marginBottom:30,lineHeight:1.6}}>
                Let AI create personalized travel itineraries tailored to your interests, budget, and style. 
                From hidden gems to must-see attractions, JournAI crafts unforgettable experiences.
              </p>
            </div>
            <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
              {!authed ? (
                <button onClick={onStartAuth} className="btn primary" style={{fontSize:18,padding:'14px 32px'}}>Get Started</button>
              ) : (
                <>
                  <button onClick={onAlbums} className="btn" style={{fontSize:16,padding:'14px 28px'}}>My Albums</button>
                  <button onClick={onPlan} className="btn primary" style={{fontSize:18,padding:'14px 32px'}}>Plan</button>
              <button onClick={onTrips} className="btn" style={{fontSize:16,padding:'14px 28px'}}>My Trips</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{padding:'80px 20px',background:'rgba(0,0,0,0.3)'}}>
        <div className="container">
          <h2 style={{textAlign:'center',fontSize:48,fontWeight:800,marginBottom:60,color:'#fff'}}>How It Works</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:40}}>
            <div className="glass" style={{padding:32,textAlign:'center',borderRadius:16}}>
              <div style={{width:80,height:80,background:'linear-gradient(135deg, #0ea5e9, #7bdcff)',borderRadius:'50%',margin:'0 auto 20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,fontWeight:800,color:'#001018'}}>1</div>
              <h3 style={{fontSize:24,fontWeight:700,marginBottom:16,color:'#fff'}}>Tell Us Your Preferences</h3>
              <p style={{opacity:0.9,lineHeight:1.6}}>Share your destination, budget, travel dates, and interests. Our AI learns your style to create the perfect itinerary.</p>
            </div>
            <div className="glass" style={{padding:32,textAlign:'center',borderRadius:16}}>
              <div style={{width:80,height:80,background:'linear-gradient(135deg, #0ea5e9, #7bdcff)',borderRadius:'50%',margin:'0 auto 20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,fontWeight:800,color:'#001018'}}>2</div>
              <h3 style={{fontSize:24,fontWeight:700,marginBottom:16,color:'#fff'}}>AI Creates Your Plan</h3>
              <p style={{opacity:0.9,lineHeight:1.6}}>Our advanced AI analyzes millions of travel data points to craft a detailed, day-by-day itinerary with attractions, restaurants, and activities.</p>
            </div>
            <div className="glass" style={{padding:32,textAlign:'center',borderRadius:16}}>
              <div style={{width:80,height:80,background:'linear-gradient(135deg, #0ea5e9, #7bdcff)',borderRadius:'50%',margin:'0 auto 20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,fontWeight:800,color:'#001018'}}>3</div>
              <h3 style={{fontSize:24,fontWeight:700,marginBottom:16,color:'#fff'}}>Explore & Document</h3>
              <p style={{opacity:0.9,lineHeight:1.6}}>Follow your personalized plan, upload photos, and create lasting memories. Your journey becomes a beautiful digital album.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose JournAI Section */}
      <section style={{padding:'80px 20px'}}>
        <div className="container">
          <h2 style={{textAlign:'center',fontSize:48,fontWeight:800,marginBottom:60,color:'#fff'}}>Why Choose JournAI?</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))',gap:32}}>
            <div className="glass" style={{padding:28,borderRadius:16}}>
              <div style={{marginBottom:16,color:'#7bdcff'}}><Bot size={48} strokeWidth={1.5} /></div>
              <h3 style={{fontSize:24,fontWeight:700,marginBottom:16,color:'#fff'}}>AI-Powered Planning</h3>
              <p style={{opacity:0.9,lineHeight:1.6}}>Leverage cutting-edge artificial intelligence to discover hidden gems and create personalized experiences that match your unique travel style.</p>
            </div>
            <div className="glass" style={{padding:28,borderRadius:16}}>
              <div style={{marginBottom:16,color:'#7bdcff'}}><Zap size={48} strokeWidth={1.5} /></div>
              <h3 style={{fontSize:24,fontWeight:700,marginBottom:16,color:'#fff'}}>Instant Results</h3>
              <p style={{opacity:0.9,lineHeight:1.6}}>Get comprehensive travel plans in seconds, not hours. No more endless research - just tell us what you want and we'll handle the rest.</p>
            </div>
            <div className="glass" style={{padding:28,borderRadius:16}}>
              <div style={{marginBottom:16,color:'#7bdcff'}}><DollarSign size={48} strokeWidth={1.5} /></div>
              <h3 style={{fontSize:24,fontWeight:700,marginBottom:16,color:'#fff'}}>Budget-Conscious</h3>
              <p style={{opacity:0.9,lineHeight:1.6}}>From shoestring adventures to luxury getaways, our AI adapts to your budget and finds the best value for your money.</p>
            </div>
            <div className="glass" style={{padding:28,borderRadius:16}}>
              <div style={{marginBottom:16,color:'#7bdcff'}}><Camera size={48} strokeWidth={1.5} /></div>
              <h3 style={{fontSize:24,fontWeight:700,marginBottom:16,color:'#fff'}}>Digital Memory Book</h3>
              <p style={{opacity:0.9,lineHeight:1.6}}>Capture and organize your travel memories with our built-in photo album feature. Every trip becomes a beautiful digital story.</p>
            </div>
            <div className="glass" style={{padding:28,borderRadius:16}}>
              <div style={{marginBottom:16,color:'#7bdcff'}}><Globe size={48} strokeWidth={1.5} /></div>
              <h3 style={{fontSize:24,fontWeight:700,marginBottom:16,color:'#fff'}}>Global Coverage</h3>
              <p style={{opacity:0.9,lineHeight:1.6}}>From bustling cities to remote destinations, our AI has knowledge of places worldwide to create amazing itineraries anywhere.</p>
            </div>
            <div className="glass" style={{padding:28,borderRadius:16}}>
              <div style={{marginBottom:16,color:'#7bdcff'}}><Target size={48} strokeWidth={1.5} /></div>
              <h3 style={{fontSize:24,fontWeight:700,marginBottom:16,color:'#fff'}}>Personalized Experience</h3>
              <p style={{opacity:0.9,lineHeight:1.6}}>Every itinerary is uniquely tailored to your interests, whether you love art, nature, food, adventure, or cultural experiences.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section style={{padding:'80px 20px',background:'rgba(0,0,0,0.3)'}}>
        <div className="container">
          <h2 style={{textAlign:'center',fontSize:48,fontWeight:800,marginBottom:60,color:'#fff'}}>What Our Travelers Say</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))',gap:32}}>
            <div className="glass" style={{padding:28,borderRadius:16}}>
              <div style={{fontSize:24,marginBottom:16,color:'#7bdcff'}}>"</div>
              <p style={{fontSize:18,lineHeight:1.6,marginBottom:20,fontStyle:'italic'}}>
                "JournAI planned my 2-week Japan trip perfectly! It found amazing hidden restaurants and temples I never would have discovered on my own. The daily schedule was spot-on."
              </p>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:48,height:48,background:'linear-gradient(135deg, #0ea5e9, #7bdcff)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#001018'}}>S</div>
                <div>
                  <div style={{fontWeight:700,color:'#fff'}}>Sarah M.</div>
                  <div style={{opacity:0.7,fontSize:14}}>Tokyo, Japan</div>
                </div>
              </div>
            </div>
            <div className="glass" style={{padding:28,borderRadius:16}}>
              <div style={{fontSize:24,marginBottom:16,color:'#7bdcff'}}>"</div>
              <p style={{fontSize:18,lineHeight:1.6,marginBottom:20,fontStyle:'italic'}}>
                "As a solo female traveler, I was nervous about planning my Europe trip. JournAI created a safe, budget-friendly itinerary that was perfect for me. I felt confident every step of the way."
              </p>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:48,height:48,background:'linear-gradient(135deg, #0ea5e9, #7bdcff)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#001018'}}>M</div>
                <div>
                  <div style={{fontWeight:700,color:'#fff'}}>Maria L.</div>
                  <div style={{opacity:0.7,fontSize:14}}>Europe Backpacking</div>
                </div>
              </div>
            </div>
            <div className="glass" style={{padding:28,borderRadius:16}}>
              <div style={{fontSize:24,marginBottom:16,color:'#7bdcff'}}>"</div>
              <p style={{fontSize:18,lineHeight:1.6,marginBottom:20,fontStyle:'italic'}}>
                "We used JournAI for our family vacation to Italy. It perfectly balanced activities for our kids and adults, finding kid-friendly restaurants and attractions. Best family trip ever!"
              </p>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:48,height:48,background:'linear-gradient(135deg, #0ea5e9, #7bdcff)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#001018'}}>J</div>
                <div>
                  <div style={{fontWeight:700,color:'#fff'}}>John & Family</div>
                  <div style={{opacity:0.7,fontSize:14}}>Rome & Florence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trip Examples Section */}
      <section style={{padding:'80px 20px'}}>
        <div className="container">
          <h2 style={{textAlign:'center',fontSize:48,fontWeight:800,marginBottom:60,color:'#fff'}}>Inspiration for Your Next Adventure</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))',gap:32}}>
            <div className="glass" style={{padding:0,borderRadius:16,overflow:'hidden'}}>
              <div style={{height:200,backgroundImage:'url(/rome.jpg)',backgroundSize:'cover',backgroundPosition:'center',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)'}}></div>
              </div>
              <div style={{padding:24}}>
                <h3 style={{fontSize:24,fontWeight:700,marginBottom:12,color:'#fff'}}>Cultural Heritage Tour</h3>
                <p style={{opacity:0.9,marginBottom:16,lineHeight:1.6}}>7 days in Rome exploring ancient history, art museums, and authentic Italian cuisine. Perfect for history buffs and culture enthusiasts.</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span style={{padding:'4px 12px',background:'rgba(14,165,233,0.2)',borderRadius:20,fontSize:12,color:'#7bdcff'}}>History</span>
                  <span style={{padding:'4px 12px',background:'rgba(14,165,233,0.2)',borderRadius:20,fontSize:12,color:'#7bdcff'}}>Art</span>
                  <span style={{padding:'4px 12px',background:'rgba(14,165,233,0.2)',borderRadius:20,fontSize:12,color:'#7bdcff'}}>Food</span>
                </div>
              </div>
            </div>
            <div className="glass" style={{padding:0,borderRadius:16,overflow:'hidden'}}>
              <div style={{height:200,backgroundImage:'url(/Swiss-Alps.jpg)',backgroundSize:'cover',backgroundPosition:'center',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)'}}></div>
              </div>
              <div style={{padding:24}}>
                <h3 style={{fontSize:24,fontWeight:700,marginBottom:12,color:'#fff'}}>Nature Adventure</h3>
                <p style={{opacity:0.9,marginBottom:16,lineHeight:1.6}}>5 days in the Swiss Alps with hiking, mountain views, and cozy alpine villages. Ideal for outdoor enthusiasts and nature lovers.</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span style={{padding:'4px 12px',background:'rgba(14,165,233,0.2)',borderRadius:20,fontSize:12,color:'#7bdcff'}}>Nature</span>
                  <span style={{padding:'4px 12px',background:'rgba(14,165,233,0.2)',borderRadius:20,fontSize:12,color:'#7bdcff'}}>Adventure</span>
                  <span style={{padding:'4px 12px',background:'rgba(14,165,233,0.2)',borderRadius:20,fontSize:12,color:'#7bdcff'}}>Hiking</span>
                </div>
              </div>
            </div>
            <div className="glass" style={{padding:0,borderRadius:16,overflow:'hidden'}}>
              <div style={{height:200,backgroundImage:'url(/Bali.jpg)',backgroundSize:'cover',backgroundPosition:'center',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)'}}></div>
              </div>
              <div style={{padding:24}}>
                <h3 style={{fontSize:24,fontWeight:700,marginBottom:12,color:'#fff'}}>Tropical Paradise</h3>
                <p style={{opacity:0.9,marginBottom:16,lineHeight:1.6}}>10 days in Bali with beach relaxation, water activities, and spiritual experiences. Perfect for those seeking peace and rejuvenation.</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span style={{padding:'4px 12px',background:'rgba(14,165,233,0.2)',borderRadius:20,fontSize:12,color:'#7bdcff'}}>Beach</span>
                  <span style={{padding:'4px 12px',background:'rgba(14,165,233,0.2)',borderRadius:20,fontSize:12,color:'#7bdcff'}}>Relaxation</span>
                  <span style={{padding:'4px 12px',background:'rgba(14,165,233,0.2)',borderRadius:20,fontSize:12,color:'#7bdcff'}}>Wellness</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{padding:'80px 20px',background:'rgba(0,0,0,0.4)'}}>
        <div className="container" style={{textAlign:'center'}}>
          <h2 style={{fontSize:48,fontWeight:800,marginBottom:20,color:'#fff'}}>Ready to Start Your Journey?</h2>
          <p style={{fontSize:20,opacity:0.9,marginBottom:40,maxWidth:600,margin:'0 auto 40px',lineHeight:1.6}}>
            Join thousands of travelers who trust JournAI to create their perfect trips. 
            Your next adventure is just a click away.
          </p>
          <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={onPlan} className="btn primary" style={{fontSize:18,padding:'16px 36px'}}>Plan My Trip</button>
            <button onClick={onStartAuth} className="btn" style={{fontSize:16,padding:'16px 32px'}}>Sign Up Free</button>
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
  const [currentTripId, setCurrentTripId] = useState<number | null>(null)
  const [chatInput, setChatInput] = useState('')
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
      setCurrentTripId(data.id)
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
      setCurrentTripId(data.id)
      await loadTrips()
      setTimeout(()=>planRef.current?.scrollIntoView({behavior:'smooth'}), 0)
    } catch (e:any) { alert(e.message) }
    finally { setLoading(false) }
  }

  const sendEdit = async () => {
    if (!currentTripId || !plan || !chatInput.trim()) return
    const res = await fetch(`/api/itineraries/${currentTripId}/edit`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ message: chatInput, plan }) })
    const data = await res.json().catch(()=>null)
    if (data?.plan) { setPlan(data.plan); setChatInput(''); setTimeout(()=>planRef.current?.scrollIntoView({behavior:'smooth'}), 0) }
  }

  return (
    <>
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
          <div style={{marginTop:16,opacity:0.8,fontSize:12}}>Use the AI Planner widget (bottom-right) to edit.</div>
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
    {plan && (
      <div style={{position:'fixed',right:16,bottom:16,width:360,background:'#0b0b0b',border:'1px solid #333',borderRadius:12,boxShadow:'0 10px 30px rgba(0,0,0,0.6)',padding:12,color:'#e5e7eb'}}>
        <div style={{fontWeight:700,marginBottom:8}}>AI Planner</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:8}}>
          <input placeholder="Tell AI how to change the plan..." value={chatInput} onChange={e=>setChatInput(e.target.value)} style={inputStyle}/>
          <button onClick={sendEdit} style={primaryBtnStyle} disabled={!chatInput.trim()}>Apply</button>
        </div>
        <div style={{opacity:0.7,fontSize:12,marginTop:6}}>Edits are saved to this trip.</div>
      </div>
    )}
    </>
  )
}

function TripDetails({ token, tripId, onBack, onOpenAlbum }: { token: string, tripId: number, onBack: ()=>void, onOpenAlbum: ()=>void }) {
  const [trip, setTrip] = useState<any | null>(null)
  const [openDay, setOpenDay] = useState<number | null>(null)

  const load = async () => {
    const t = await fetch(`/api/itineraries/${tripId}`, { headers:{ Authorization:`Bearer ${token}` } })
    if (t.ok) setTrip(await t.json())
  }
  useEffect(()=>{ load() }, [tripId])

  return (
    <div style={{maxWidth:1000,margin:'120px auto 60px',padding:'0 20px',color:'#fff'}}>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button onClick={onBack} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>Back</button>
        {trip && <button onClick={onOpenAlbum} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>{trip.destination} pics</button>}
      </div>
      {trip && (
        <>
          <h2>Trip to {trip.destination}</h2>
          <div style={{opacity:0.9,marginBottom:12}}>{trip.durationDays} days • {trip.budget}</div>
          <div className="glass" style={{border:'1px solid #333',borderRadius:12,padding:14,marginBottom:16}}>
            <h3 style={{marginTop:0}}>Itinerary</h3>
            <div style={{display:'grid',gap:8}}>
              {trip.plan?.days?.map((d:any)=> (
                <div key={d.day} style={{border:'1px solid #333',borderRadius:8,overflow:'hidden'}}>
                  <button onClick={()=>setOpenDay(openDay===d.day?null:d.day)} style={{width:'100%',textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,padding:12,background:'rgba(255,255,255,0.03)',color:'#e5e7eb',border:'none',cursor:'pointer'}}>
                    <strong>{d.title}</strong>
                    <span style={{opacity:0.8,fontSize:12}}>{openDay===d.day?'−':'+'}</span>
                  </button>
                  {openDay===d.day && (
                    <div style={{padding:12}}>
                      <div style={{opacity:0.9,marginBottom:8}}>{d.summary}</div>
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
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TripsPage({ token, onOpenDetails, onOpenAlbum }: { token: string, onOpenDetails: (id:number)=>void, onOpenAlbum: (id:number)=>void }) {
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
          <div key={t.id} className="glass" style={{border:'1px solid #333',borderRadius:12,padding:12,display:'grid',gridTemplateColumns:'1fr auto auto',alignItems:'center',gap:8}}>
            <div>
              <div style={{fontWeight:700}}>{t.destination}</div>
              <div style={{opacity:0.8,fontSize:12}}>{t.durationDays} days • {t.budget} • {new Date(t.createdAt || t.created_at).toLocaleDateString()}</div>
            </div>
            <button onClick={()=>onOpenDetails(t.id)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>Open</button>
            <button onClick={()=>onOpenAlbum(t.id)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #333',background:'transparent',color:'#e5e7eb',cursor:'pointer'}}>My Album</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function App() {
  const [route, _setRoute] = useState<'home'|'planner'|'trip-details'|'trips'|'albums'|'album'>(()=>{
    if (typeof window === 'undefined') return 'home'
    return (localStorage.getItem('journai_route') as any) || 'home'
  })
  const [authOpen, setAuthOpen] = useState(false)
  const [token, setToken] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('journai_token') : null)
  const [detailsTripId, _setDetailsTripId] = useState<number | null>(()=>{
    if (typeof window === 'undefined') return null
    const v = localStorage.getItem('journai_tripId')
    return v ? Number(v) : null
  })
  const canPlan = useMemo(()=>!!token, [token])
  const [user, setUser] = useState<any|null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [numTrips, setNumTrips] = useState<number>(0)

  useEffect(()=>{
    if (!token) { setUser(null); setNumTrips(0); return }
    ;(async()=>{
      const [uRes, tRes] = await Promise.all([
        fetch('/api/auth/me', { headers:{ Authorization:`Bearer ${token}` } }).catch(()=>null),
        fetch('/api/itineraries', { headers:{ Authorization:`Bearer ${token}` } }).catch(()=>null)
      ])
      if (uRes?.ok) setUser(await uRes.json()); else setUser(null)
      if (tRes?.ok) { const list = await tRes.json(); setNumTrips(Array.isArray(list)?list.length:0) } else setNumTrips(0)
    })()
  }, [token])

  const setRoutePersist = (r: 'home'|'planner'|'trip-details'|'trips'|'albums'|'album') => {
    _setRoute(r)
    if (typeof window !== 'undefined') localStorage.setItem('journai_route', r)
  }
  const setDetailsTripId = (id: number | null) => {
    _setDetailsTripId(id)
    if (typeof window !== 'undefined') {
      if (id == null) localStorage.removeItem('journai_tripId')
      else localStorage.setItem('journai_tripId', String(id))
    }
  }
  const setTokenPersist = (t:string|null) => { setToken(t); if (t) localStorage.setItem('journai_token', t); else localStorage.removeItem('journai_token'); if (!t) { setRoutePersist('home'); setDetailsTripId(null) } }
  useEffect(()=>{
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tripId = params.get('tripId')
    if (tripId && token) { setDetailsTripId(Number(tripId)); setRoutePersist('trip-details') }
  }, [token])

  const ctaLabel = numTrips > 0 ? 'Plan Another Trip' : 'Get Started'

  return (
    <>
      <NavBar onHome={()=>setRoutePersist('home')} onOpenAuth={()=>setAuthOpen(true)} goPlan={()=>setRoutePersist('planner')} goTrips={()=>setRoutePersist('trips')} goAlbums={()=>setRoutePersist('albums')} showBrand={route!=='home'} token={token} onLogout={()=>setTokenPersist(null)} user={user} onOpenProfile={()=>setProfileOpen(true)} route={route} />
      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuth={(t)=>setTokenPersist(t)} />
      {token && <ProfileModal open={profileOpen} onClose={()=>setProfileOpen(false)} token={token} onUpdated={(u)=>setUser(u)} />}
      {route==='home' ? (
        <Home authed={!!token} onStartAuth={()=>setAuthOpen(true)} onPlan={()=>setRoutePersist('planner')} onTrips={()=>setRoutePersist('trips')} onAlbums={()=>setRoutePersist('albums')} />
      ) : route==='planner' ? (
        canPlan ? <Planner token={token!} onOpenDetails={(id)=>{ setDetailsTripId(id); setRoutePersist('trip-details') }} /> : (
          <div style={{display:'grid',placeItems:'center',minHeight:'100vh',color:'#fff'}}>
            <div style={{marginTop:100,textAlign:'center'}}>
              <p>Please sign in to start planning.</p>
              <button onClick={()=>setAuthOpen(true)} style={primaryBtnStyle}>Sign in</button>
            </div>
          </div>
        )
      ) : route==='trips' ? (
        canPlan ? <TripsPage token={token!} onOpenDetails={(id)=>{ setDetailsTripId(id); setRoutePersist('trip-details') }} onOpenAlbum={(id)=>{ setDetailsTripId(id); setRoutePersist('album') }} /> : null
      ) : route==='albums' ? (
        canPlan ? <AllAlbumsPage token={token!} onOpenAlbum={(id)=>{ setDetailsTripId(id); setRoutePersist('album') }} /> : null
      ) : route==='album' ? (
        canPlan && detailsTripId!=null ? <AlbumPage token={token!} tripId={detailsTripId} onBack={()=>setRoutePersist('trips')} /> : null
      ) : (
        canPlan && detailsTripId!=null ? <TripDetails token={token!} tripId={detailsTripId} onBack={()=>setRoutePersist('trips')} onOpenAlbum={()=>{ setRoutePersist('album') }} /> : null
      )}
    </>
  )
}
