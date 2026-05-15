import { ROUTES } from '@/constants/routes'

export function redirectToLogin() {
  window.location.href = ROUTES.AUTH.LOGIN
}
