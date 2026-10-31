// Cliente falso en memoria que imita la parte de la API de Supabase que usa la app.
// Se activa cuando no hay .env.local, para poder ver la interfaz sin backend.
// Los datos se pierden al recargar la página.

const DEMO_USER = { id: 'demo-user', email: 'demo@mangateca.local' }
const DEMO_SESSION = { user: DEMO_USER }

const db = { mangas: [], tags: [], manga_tags: [], orders: [], profiles: [{ id: DEMO_USER.id, email: DEMO_USER.email, role: 'admin' }] }
const files = new Map() // ruta de storage → URL mostrable

// Relaciones entre tablas: [tabla destino, columna de unión, tipo, (tabla intermedia, columna destino)]
const RELATIONS = {
  mangas: { tags: ['tags', 'manga_id', 'through', 'manga_tags', 'tag_id'] },
}

const DEFAULTS = { mangas: { status: 'leyendo', single_volume: false, volume: null, series_complete: false } }

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

// Divide "a, b(c, d(e)), f" respetando paréntesis.
function splitTop(str) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of str) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

function project(table, row, selectStr) {
  const result = {}
  for (const token of splitTop(selectStr || '*')) {
    const m = token.match(/^(\w+)(?:!\w+)?\((.*)\)$/s)
    if (!m) {
      if (token === '*') Object.assign(result, row)
      else result[token] = row[token]
      continue
    }
    const [, rel, inner] = m
    const [target, key, kind, via, targetKey] = RELATIONS[table][rel]
    if (kind === 'through') {
      const ids = db[via].filter((r) => r[key] === row.id).map((r) => r[targetKey])
      result[rel] = db[target].filter((t) => ids.includes(t.id)).map((t) => project(target, t, inner))
    } else if (kind === 'many') {
      const children = db[target].filter((r) => r[key] === row.id)
      result[rel] = inner.trim() === 'count'
        ? [{ count: children.length }]
        : children.map((c) => project(target, c, inner))
    } else {
      const parent = db[target].find((r) => r.id === row[key])
      result[rel] = parent ? project(target, parent, inner) : null
    }
  }
  return result
}

function compare(a, b, col, ascending) {
  const x = a[col]
  const y = b[col]
  const n = typeof x === 'number' || !isNaN(Number(x)) && !isNaN(Number(y))
  const diff = n ? Number(x) - Number(y) : String(x).localeCompare(String(y))
  return ascending ? diff : -diff
}

class Query {
  constructor(table) {
    this.table = table
    this.op = 'select'
    this.selectStr = '*'
    this.filters = []
    this.orders = []
    this.isSingle = false
    this.returning = false
  }

  select(str = '*') {
    if (this.op === 'select') this.selectStr = str
    else { this.returning = true; this.selectStr = str }
    return this
  }
  insert(payload) { this.op = 'insert'; this.payload = payload; return this }
  update(payload) { this.op = 'update'; this.payload = payload; return this }
  delete() { this.op = 'delete'; return this }
  eq(col, value) { this.filters.push([col, value]); return this }
  order(col, opts = {}) { this.orders.push({ col, ascending: opts.ascending ?? true, ref: opts.referencedTable }); return this }
  single() { this.isSingle = true; return this }

  then(resolve, reject) { return this.run().then(resolve, reject) }

  matches(row) {
    return this.filters.filter(([c]) => !c.includes('.')).every(([c, v]) => row[c] === v)
  }

  async run() {
    await delay()
    const rows = db[this.table]
    let data

    if (this.op === 'insert') {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p) => ({
        id: crypto.randomUUID(),
        user_id: DEMO_USER.id,
        created_at: new Date().toISOString(),
        ...DEFAULTS[this.table],
        ...p,
      }))
      rows.push(...list)
      data = list
    } else if (this.op === 'update') {
      data = rows.filter((r) => this.matches(r))
      data.forEach((r) => Object.assign(r, this.payload))
    } else if (this.op === 'delete') {
      const removed = rows.filter((r) => this.matches(r))
      removed.forEach((r) => cascadeDelete(this.table, r.id))
      return { data: null, error: null }
    } else {
      data = rows.filter((r) => this.matches(r))
    }

    if (this.op === 'select' || this.returning) {
      data = data.map((r) => project(this.table, r, this.selectStr))
      // Filtros sobre tablas relacionadas, p. ej. "tags.name".
      for (const [col, value] of this.filters.filter(([c]) => c.includes('.'))) {
        const [rel, field] = col.split('.')
        data = data.filter((r) => r[rel]?.[field] === value)
      }
      for (const { col, ascending, ref } of [...this.orders].reverse()) {
        if (ref) data.forEach((r) => r[ref]?.sort?.((a, b) => compare(a, b, col, ascending)))
        else data.sort((a, b) => compare(a, b, col, ascending))
      }
    }

    if (this.isSingle) {
      if (data.length !== 1) return { data: null, error: { message: 'No encontrado' } }
      return { data: data[0], error: null }
    }
    return { data, error: null }
  }
}

function cascadeDelete(table, id) {
  db[table] = db[table].filter((r) => r.id !== id)
  if (table === 'mangas') db.manga_tags = db.manga_tags.filter((r) => r.manga_id !== id)
  if (table === 'tags') db.manga_tags = db.manga_tags.filter((r) => r.tag_id !== id)
}

export function createDemoClient() {
  seed()
  return {
    from: (table) => new Query(table),
    auth: {
      getSession: async () => ({ data: { session: DEMO_SESSION } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: { session: DEMO_SESSION }, error: null }),
      signUp: async () => ({ data: { session: DEMO_SESSION }, error: null }),
      signOut: async () => alert('En modo demo no se puede cerrar sesión.'),
    },
    storage: {
      from: () => ({
        upload: async (path, file) => {
          await delay(250)
          files.set(path, URL.createObjectURL(file))
          return { data: { path }, error: null }
        },
        remove: async (paths) => {
          paths.forEach((p) => files.delete(p))
          return { data: null, error: null }
        },
        createSignedUrls: async (paths) => ({
          data: paths.map((path) => ({ path, signedUrl: files.get(path) ?? null })),
          error: null,
        }),
      }),
    },
  }
}

// ---------- Datos de ejemplo ----------

function placeholder(label, sub, hue) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},55%,45%)"/><stop offset="1" stop-color="hsl(${hue + 40},60%,25%)"/>
    </linearGradient></defs>
    <rect width="600" height="900" fill="url(#g)"/>
    <text x="300" y="440" text-anchor="middle" font-family="system-ui,sans-serif" font-size="56" font-weight="800" fill="white">${label}</text>
    <text x="300" y="510" text-anchor="middle" font-family="system-ui,sans-serif" font-size="30" fill="rgba(255,255,255,.75)">${sub}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function seed() {
  if (db.mangas.length) return
  const tagNames = ['Shōnen', 'Seinen', 'SliceOfLife', 'Fantasía', 'EdiciónEspecial']
  const tagId = Object.fromEntries(tagNames.map((name) => {
    const id = crypto.randomUUID()
    db.tags.push({ id, name, created_at: new Date().toISOString() })
    return [name, id]
  }))
  const samples = [
    { title: 'Viento de Acero', author: 'Akira Morimoto', status: 'leyendo', hue: 10, volume: '1-3', complete: true,
      tags: ['Seinen', 'Fantasía'],
      description: 'Una espadachina errante recorre un imperio en ruinas buscando al hombre que destruyó su aldea.' },
    { title: 'Café Luna', author: 'Yui Hoshino', status: 'terminado', hue: 200, single_volume: true,
      tags: ['SliceOfLife'], description: 'Historias tranquilas en una cafetería que solo abre de noche.' },
    { title: 'Proyecto Órbita', author: 'Kenji Arata', status: 'pendiente', hue: 260, tags: ['Shōnen'], description: null },
    { title: 'Neón Samurái', author: 'Rei Takeda', status: 'pendiente', hue: 320, volume: '1',
      tags: ['Shōnen', 'EdiciónEspecial'], description: null },
    { title: 'El Jardín Olvidado', author: null, status: 'abandonado', hue: 120, tags: [], description: null },
  ]
  db.orders.push(
    { id: crypto.randomUUID(), title: 'Neón Samurái', author: 'Rei Takeda', volume: '2', publisher: 'Ivrea', created_at: new Date().toISOString() },
    { id: crypto.randomUUID(), title: 'Café Luna', author: 'Yui Hoshino', volume: null, publisher: 'Norma', created_at: new Date(Date.now() - 86400000).toISOString() },
  )
  samples.forEach((s, i) => {
    const mangaId = crypto.randomUUID()
    const coverPath = `demo/covers/${mangaId}.svg`
    files.set(coverPath, placeholder(s.title, s.author ?? '', s.hue))
    db.mangas.push({
      id: mangaId, user_id: DEMO_USER.id, title: s.title, author: s.author, description: s.description,
      status: s.status, single_volume: s.single_volume ?? false, volume: s.volume ?? null,
      series_complete: s.single_volume || s.complete || false, cover_path: coverPath,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    })
    s.tags.forEach((name) => db.manga_tags.push({ id: crypto.randomUUID(), manga_id: mangaId, tag_id: tagId[name] }))
  })
}
