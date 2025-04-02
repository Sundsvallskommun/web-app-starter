import { NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import i18nConfig from '@app/i18nConfig';
import { envs } from '../middleware-envs';

export async function middleware(req: NextRequest) {
  const {
    nextUrl: { pathname, origin },
  } = req;

  if (pathname === '/admin') {
    return NextResponse.redirect(new URL(envs.adminUrl));
  }

  if (envs.protectedRoutes.includes(pathname)) {
    const cookiName = 'connect.sid';
    const token = req.cookies.get(cookiName)?.value || '';

    const { status } = await fetch(`${envs.apiUrl}/me`, {
      cache: 'no-cache',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: `${cookiName}=${encodeURI(token)}`,
      },
    });

    if (status === 401) {
      const absoluteUrl = new URL(`${envs.basePath}/login?path=${pathname}`, origin);
      return NextResponse.redirect(absoluteUrl.toString());
    }
  }

  req.headers.set('x-path', pathname);
  return i18nRouter(req, i18nConfig);
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
};
