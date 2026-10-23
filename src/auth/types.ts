export type AppRole = 'consumer' | 'creator' | 'platform'

export type MockUser = {
  id: string
  username: string
  email: string
  password: string
  displayName: string
  roles: AppRole[]
  defaultRole: AppRole
}

export type AuthSession = {
  userId: string
  activeRole: AppRole
}

export const ROLE_LABEL: Record<AppRole, string> = {
  consumer: 'مصرف‌کننده',
  creator: 'مدل‌ساز',
  platform: 'مدیرعامل / پلتفرم',
}

/** خانه پس از ورود: حساب کاربری برای بازار؛ پلتفرم فقط برای اپراتور elevated */
export const ROLE_HOME: Record<AppRole, string> = {
  consumer: '/account',
  creator: '/account',
  platform: '/platform',
}

export function homeForUser(user: MockUser): string {
  if (user.roles.includes('platform') && !user.roles.includes('consumer') && !user.roles.includes('creator')) {
    return '/platform'
  }
  if (user.roles.includes('consumer') || user.roles.includes('creator')) {
    return '/account'
  }
  return ROLE_HOME[user.defaultRole]
}
