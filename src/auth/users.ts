import type { MockUser } from './types'

/** نقش‌های پیش‌فرض هر ثبت‌نام عادی در پلتفرم نمونه (نه سیلوی جدا) */
export const REGISTERED_USER_ROLES: MockUser['roles'] = ['consumer', 'creator']

const USERS_STORAGE_KEY = 'portfolio-mock-registered-users'

/**
 * حساب‌های seed دمو — رمز همه: Demo123!
 *
 * مدیرعامل = Platform Operator (elevated)
 * پیمانکار = ثبت‌نام‌شده واقعی: Consumer + Creator
 */
export const SEED_USERS: MockUser[] = [
  {
    id: 'u-ceo',
    username: 'ceo',
    email: 'ceo@example.invalid',
    password: 'Demo123!',
    displayName: 'مدیرعامل پلتفرم نمونه',
    roles: ['platform'],
    defaultRole: 'platform',
  },
  {
    id: 'u-contractor',
    username: 'contractor',
    email: 'contractor@example.invalid',
    password: 'Demo123!',
    displayName: 'پیمانکار دمو',
    roles: ['consumer', 'creator'],
    defaultRole: 'creator',
  },
  {
    id: 'u-user',
    username: 'user',
    email: 'user@example.invalid',
    password: 'Demo123!',
    displayName: 'کاربر ثبت‌نام‌شده',
    roles: ['consumer', 'creator'],
    defaultRole: 'consumer',
  },
  /** alias برای سازگاری با دموهای قبلی */
  {
    id: 'u-platform',
    username: 'operator',
    email: 'operator@example.invalid',
    password: 'Demo123!',
    displayName: 'مدیرعامل پلتفرم نمونه (اپراتور)',
    roles: ['platform'],
    defaultRole: 'platform',
  },
  {
    id: 'u-consumer-only',
    username: 'consumer',
    email: 'consumer@example.invalid',
    password: 'Demo123!',
    displayName: 'مریم (فقط مصرف — تست)',
    roles: ['consumer'],
    defaultRole: 'consumer',
  },
  {
    id: 'u-creator-only',
    username: 'creator',
    email: 'creator@example.invalid',
    password: 'Demo123!',
    displayName: 'علی (فقط مدل‌ساز — تست)',
    roles: ['creator'],
    defaultRole: 'creator',
  },
]

export const MOCK_USERS = SEED_USERS

function readRegisteredUsers(): MockUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MockUser[]
  } catch {
    return []
  }
}

function writeRegisteredUsers(users: MockUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export function allUsers(): MockUser[] {
  return [...SEED_USERS, ...readRegisteredUsers()]
}

export function findUserByLogin(login: string, password: string): MockUser | null {
  const key = login.trim().toLowerCase()
  const user = allUsers().find(
    (u) =>
      u.email.toLowerCase() === key ||
      u.username.toLowerCase() === key,
  )
  if (!user || user.password !== password) return null
  return user
}

export function findUserById(id: string): MockUser | undefined {
  return allUsers().find((u) => u.id === id)
}

export function emailOrUsernameTaken(login: string): boolean {
  const key = login.trim().toLowerCase()
  return allUsers().some(
    (u) => u.email.toLowerCase() === key || u.username.toLowerCase() === key,
  )
}

export function registerMockUser(input: {
  displayName: string
  email: string
  username: string
  password: string
}): { ok: true; user: MockUser } | { ok: false; message: string } {
  const email = input.email.trim()
  const username = input.username.trim()
  if (!email || !username || !input.password || !input.displayName.trim()) {
    return { ok: false, message: 'همه فیلدها الزامی است.' }
  }
  if (emailOrUsernameTaken(email) || emailOrUsernameTaken(username)) {
    return { ok: false, message: 'این ایمیل یا نام کاربری قبلاً ثبت شده است.' }
  }

  const user: MockUser = {
    id: `u-reg-${Date.now()}`,
    email,
    username,
    password: input.password,
    displayName: input.displayName.trim(),
    roles: [...REGISTERED_USER_ROLES],
    defaultRole: 'consumer',
  }

  const next = [...readRegisteredUsers(), user]
  writeRegisteredUsers(next)
  return { ok: true, user }
}
