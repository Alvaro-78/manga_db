import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { isDemo, supabase } from './lib/supabase'
import Login from './pages/Login'
import Library from './pages/Library'
import MangaDetail from './pages/MangaDetail'
import Reader from './pages/Reader'
import AdminList from './pages/admin/AdminList'
import AdminNewManga from './pages/admin/AdminNewManga'
import AdminManga from './pages/admin/AdminManga'
import AdminChapter from './pages/admin/AdminChapter'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Rol del usuario ('user' o 'admin'), guardado en la tabla profiles.
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('id, role').eq('id', userId).single()
      .then(({ data }) => setProfile(data))
  }, [userId])
  const role = profile && profile.id === userId ? profile.role : null

  if (session === undefined) return <p className="center muted">Cargando…</p>
  if (!session) return <Login />

  const user = session.user

  return (
    <BrowserRouter>
      <header className="topbar">
        <Link to="/" className="brand">Mi Mangateca</Link>
        <nav className="tabs">
          <NavLink to="/" end>Biblioteca</NavLink>
          <NavLink to="/admin">Administrar</NavLink>
        </nav>
        <div className="topbar-right">
          <span className="muted small hide-mobile">{user.email}</span>
          {role === 'admin' && <span className="badge role-admin">Admin</span>}
          <button className="ghost" onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
      </header>
      {isDemo && (
        <div className="demo-banner">
          <strong>Modo demo</strong>: datos de ejemplo en memoria; los cambios se pierden al recargar.
          Configura Supabase (ver README) para guardar de verdad.
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/manga/:mangaId" element={<MangaDetail />} />
          <Route path="/manga/:mangaId/capitulo/:chapterId" element={<Reader />} />
          <Route path="/admin" element={<AdminList />} />
          <Route path="/admin/nuevo" element={<AdminNewManga user={user} />} />
          <Route path="/admin/manga/:mangaId" element={<AdminManga user={user} />} />
          <Route path="/admin/manga/:mangaId/capitulo/:chapterId" element={<AdminChapter user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
