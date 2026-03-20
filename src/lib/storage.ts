const ACCESS_TOKEN_KEY = 'spa_manager_access_token'

export const storage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  setAccessToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  clearAccessToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
}
