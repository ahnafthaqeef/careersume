import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Everything behind the sign-in wall. `/onboarding` is here because the key
 *  wizard writes to the signed-in user's own key row. */
const PROTECTED_PATHS = [
  '/account',
  '/admin',
  '/builder',
  '/cover-letter',
  '/dashboard',
  '/history',
  '/job-scanner',
  '/job-tracker',
  '/onboarding',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  // Signed-in users get bounced off sign-in and sign-up, but the OAuth callback
  // has to stay reachable while it is still exchanging the code for a session.
  const isAuthPage =
    pathname.startsWith('/auth') && !pathname.startsWith('/auth/callback')

  // Anything else (the API routes, which authenticate themselves) skips the
  // session lookup entirely.
  if (!isProtected && !isAuthPage) return NextResponse.next()

  let response = NextResponse.next({ request })

  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { domain },
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, ...(domain ? { domain } : {}) })
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // A failed auth check is treated as signed out.
  }

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/builder', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // `.+` rather than `.*` so the landing page ("/") is excluded: it is
    // force-static, and running an auth lookup on it would defeat the cache.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).+)',
  ],
}
