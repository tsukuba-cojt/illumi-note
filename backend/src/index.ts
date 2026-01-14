import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type ProfilePayload = {
  name: string
  email: string
  password: string
  avatarUrl: string | null
}

const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
)

const dataRoot = path.join(process.cwd(), 'data')

function getLightFilePath(projectId: string, sceneId: string) {
  return path.join(dataRoot, 'light', projectId, `${sceneId}.json`)
}

function getProfileFilePath() {
  return path.join(dataRoot, 'profile', 'user.json')
}

const defaultProfile: ProfilePayload = {
  name: 'COJT大好き',
  email: 'cojt@sample.com',
  password: 'password1234',
  avatarUrl: null,
}

async function ensureDirForFile(filePath: string) {
  const dir = path.dirname(filePath)
  await mkdir(dir, { recursive: true })
}

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/health', (c) => {
  return c.json({ ok: true })
})

app.get('/api/projects/:projectId/scenes/:sceneId/light', async (c) => {
  const { projectId, sceneId } = c.req.param()
  const filePath = getLightFilePath(projectId, sceneId)

  try {
    const raw = await readFile(filePath, 'utf-8')
    return c.json(JSON.parse(raw))
  } catch {
    return c.json({ error: 'NOT_FOUND' }, 404)
  }
})

app.put('/api/projects/:projectId/scenes/:sceneId/light', async (c) => {
  const { projectId, sceneId } = c.req.param()
  const filePath = getLightFilePath(projectId, sceneId)

  try {
    const body = await c.req.json()
    await ensureDirForFile(filePath)
    await writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8')
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'BAD_REQUEST' }, 400)
  }
})

app.get('/api/profile', async (c) => {
  const filePath = getProfileFilePath()

  try {
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<ProfilePayload>
    return c.json({ ...defaultProfile, ...parsed })
  } catch {
    return c.json(defaultProfile)
  }
})

app.put('/api/profile', async (c) => {
  const filePath = getProfileFilePath()

  try {
    const body = (await c.req.json()) as Partial<ProfilePayload>

    const sanitized: ProfilePayload = {
      name: typeof body.name === 'string' ? body.name : defaultProfile.name,
      email: typeof body.email === 'string' ? body.email : defaultProfile.email,
      password: typeof body.password === 'string' ? body.password : defaultProfile.password,
      avatarUrl: typeof body.avatarUrl === 'string' || body.avatarUrl === null ? body.avatarUrl : defaultProfile.avatarUrl,
    }

    await ensureDirForFile(filePath)
    await writeFile(filePath, JSON.stringify(sanitized, null, 2), 'utf-8')

    return c.json({ ok: true, profile: sanitized })
  } catch {
    return c.json({ error: 'BAD_REQUEST' }, 400)
  }
})

const port = Number(process.env.PORT ?? 3000)
const hostname = process.env.HOST ?? '0.0.0.0'

serve({
  fetch: app.fetch,
  port,
  hostname,
}, (info) => {
  console.log(`Server is running on http://${hostname}:${info.port}`)
})
