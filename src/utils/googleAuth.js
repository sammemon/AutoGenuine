// Official Google Identity Services & OAuth 2.0 Integration
// Redirects directly to accounts.google.com for authentic Google Sign-In

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '138033118379-87u3su87npe595iud8pqdn2ng2ci69g3.apps.googleusercontent.com'

/**
 * Executes the real Google OAuth 2.0 flow directly on accounts.google.com
 * (Exact same method used by ChatGPT, Claude, and Daraz)
 */
export async function triggerGoogleOAuth() {
  return new Promise((resolve, reject) => {
    // 1. If Google Identity Services SDK is loaded in window
    if (window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              return reject(new Error(tokenResponse.error_description || tokenResponse.error))
            }

            try {
              // Retrieve verified user profile from Google's UserInfo API
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              })
              const profile = await userInfoRes.json()

              if (!profile.email) {
                return reject(new Error('Google did not provide a verified email address'))
              }

              resolve({
                email: profile.email,
                name: profile.name || profile.given_name || profile.email.split('@')[0],
                avatar: profile.picture || '',
                token: tokenResponse.access_token,
              })
            } catch (err) {
              reject(new Error('Failed to fetch profile from Google: ' + err.message))
            }
          },
        })

        client.requestAccessToken({ prompt: 'select_account' })
        return
      } catch (err) {
        console.warn('GSI TokenClient notice:', err)
      }
    }

    // 2. Direct Popup / Redirect to accounts.google.com
    const redirectUri = window.location.origin
    const clientId = GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com'

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=openid%20profile%20email&prompt=select_account`

    const width = 500
    const height = 650
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      googleAuthUrl,
      'google_oauth_signin',
      `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no,location=no`
    )

    if (!popup) {
      // If browser blocked popup, redirect current tab
      window.location.href = googleAuthUrl
      return
    }

    // Listen for redirect back with Google token in URL hash
    const timer = setInterval(async () => {
      try {
        if (!popup || popup.closed) {
          clearInterval(timer)
          reject(new Error('Google sign-in window was closed'))
          return
        }

        const href = popup.location.href
        if (href && (href.includes('access_token') || href.includes('error'))) {
          clearInterval(timer)
          popup.close()

          const hash = href.split('#')[1] || href.split('?')[1] || ''
          const params = new URLSearchParams(hash)
          const token = params.get('access_token')

          if (token) {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            })
            const profile = await userInfoRes.json()

            resolve({
              email: profile.email,
              name: profile.name || profile.given_name,
              avatar: profile.picture,
              token,
            })
          } else {
            reject(new Error(params.get('error') || 'Google sign-in was cancelled'))
          }
        }
      } catch {
        // Cross-origin restriction while user is on accounts.google.com domain
      }
    }, 500)
  })
}
