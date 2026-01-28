import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash, randomBytes } from 'node:crypto'
import path from 'node:path'

type ProfilePayload = {
  name: string
  email: string
  password: string
  avatarUrl: string | null
}

type UserRecord = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

type AuthErrorDetails = {
  name?: string[]
  email?: string[]
  password?: string[]
  confirmPassword?: string[]
}

const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    credentials: true,
  })
)

app.post('/api/auth/register', async (c) => {
  const body = (await c.req.json()) as Partial<{
    name: string
    email: string
    password: string
    confirmPassword: string
  }>

  const details: AuthErrorDetails = {}

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''

  if (!name) {
    details.name = [...(details.name ?? []), 'required']
  }
  if (!email) {
    details.email = [...(details.email ?? []), 'required']
  }
  if (!password) {
    details.password = [...(details.password ?? []), 'required']
  }
  if (password && password.length < 5) {
    details.password = [...(details.password ?? []), 'min_length_5']
  }
  if (password !== confirmPassword) {
    details.confirmPassword = [...(details.confirmPassword ?? []), 'mismatch']
  }

  if (Object.keys(details).length > 0) {
    return c.json(buildValidationError(details), 400)
  }

  const users = await readUsers()
  const existing = users.find((user) => user.email === email)
  if (existing) {
    details.email = [...(details.email ?? []), 'already_exists']
    return c.json(buildValidationError(details, 'このメールアドレスは既に登録されています'), 409)
  }

  const newUser: UserRecord = {
    id: randomBytes(12).toString('hex'),
    name,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  await writeUsers(users)
  await writeActiveUserId(newUser.id)

  const profileToPersist: ProfilePayload = {
    name,
    email,
    password: '',
    avatarUrl: null,
  }
  await writeProfile(profileToPersist)

  return c.json({
    user: sanitizeUser(newUser),
    accessToken: createToken('access'),
    refreshToken: createToken('refresh'),
  })
})

app.post('/api/auth/login', async (c) => {
  const body = (await c.req.json()) as Partial<{
    email: string
    password: string
  }>

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return c.json(
      buildValidationError(
        {
          ...(email ? {} : { email: ['required'] }),
          ...(password ? {} : { password: ['required'] }),
        },
        'メールアドレスとパスワードを入力してください'
      ),
      400
    )
  }

  const users = await readUsers()
  const user = users.find((record) => record.email === email)

  if (!user || user.passwordHash !== hashPassword(password)) {
    return c.json(
      {
        error: {
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      },
      401
    )
  }

  await writeActiveUserId(user.id)

  const profile = await readProfile()
  await writeProfile({
    ...profile,
    name: user.name,
    email: user.email,
    password: '',
  })

  return c.json({
    user: sanitizeUser(user),
    accessToken: createToken('access'),
    refreshToken: createToken('refresh'),
  })
})

app.post('/api/auth/logout', async (c) => {
  await writeActiveUserId(null)
  return c.json({ ok: true })
})

const dataRoot = path.join(process.cwd(), 'data')

function getLightFilePath(projectId: string, sceneId: string) {
  return path.join(dataRoot, 'light', projectId, `${sceneId}.json`)
}

function getProfileFilePath() {
  return path.join(dataRoot, 'profile', 'user.json')
}

function getUsersFilePath() {
  return path.join(dataRoot, 'auth', 'users.json')
}

function getActiveUserFilePath() {
  return path.join(dataRoot, 'auth', 'current-user.json')
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

async function readUsers(): Promise<UserRecord[]> {
  const filePath = getUsersFilePath()

  try {
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as UserRecord[]
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // ignore read errors; treat as no users
  }

  return []
}

async function readActiveUserId(): Promise<string | null> {
  const filePath = getActiveUserFilePath()

  try {
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as { userId?: string }
    if (parsed && typeof parsed.userId === 'string') {
      return parsed.userId
    }
  } catch {
    // ignore
  }

  return null
}

async function writeActiveUserId(userId: string | null) {
  const filePath = getActiveUserFilePath()
  await ensureDirForFile(filePath)
  const payload = userId ? { userId } : {}
  await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8')
}

async function readProfile(): Promise<ProfilePayload> {
  const filePath = getProfileFilePath()

  try {
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<ProfilePayload>
    return { ...defaultProfile, ...parsed }
  } catch {
    return defaultProfile
  }
}

async function writeProfile(profile: ProfilePayload) {
  const filePath = getProfileFilePath()
  await ensureDirForFile(filePath)
  await writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8')
}

async function writeUsers(users: UserRecord[]) {
  const filePath = getUsersFilePath()
  await ensureDirForFile(filePath)
  await writeFile(filePath, JSON.stringify(users, null, 2), 'utf-8')
}

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

function createToken(prefix: string) {
  return `${prefix}_${randomBytes(24).toString('hex')}`
}

function sanitizeUser(user: UserRecord) {
  const { id, name, email, createdAt } = user
  return { id, name, email, createdAt }
}

function buildValidationError(details: AuthErrorDetails, message = '入力内容を確認してください') {
  return {
    error: {
      message,
      details,
    },
  }
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
  const activeUserId = await readActiveUserId()
  const users = await readUsers()
  const profile = await readProfile()

  if (activeUserId) {
    const activeUser = users.find((user) => user.id === activeUserId)
    if (activeUser) {
      return c.json({
        ...profile,
        name: activeUser.name,
        email: activeUser.email,
        password: '',
      })
    }
  }

  return c.json({ ...profile, password: '' })
})

app.put('/api/profile', async (c) => {
  try {
    const body = await c.req.json<ProfilePayload>()
    const sanitizedProfile: ProfilePayload = {
      name: body.name,
      email: body.email,
      password: '',
      avatarUrl: body.avatarUrl ?? null,
    }
    await writeProfile(sanitizedProfile)

    const activeUserId = await readActiveUserId()
    if (activeUserId) {
      const users = await readUsers()
      const updated = users.map((user) =>
        user.id === activeUserId
          ? {
              ...user,
              name: body.name,
              email: body.email,
              passwordHash:
                body.password && body.password.trim().length > 0
                  ? hashPassword(body.password)
                  : user.passwordHash,
            }
          : user
      )
      await writeUsers(updated)
    }

    return c.json({ ok: true })
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
