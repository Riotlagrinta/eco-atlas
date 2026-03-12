import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuth = !!req.auth;
  // @ts-ignore
  const isAdmin = req.auth?.user?.role === 'admin';
  const isNextAuthPage = req.nextUrl.pathname.startsWith('/api/auth');
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
  const isProfilePage = req.nextUrl.pathname.startsWith('/profil');

  // 1. Rediriger vers la connexion si accès à une page protégée sans être authentifié
  if (!isAuth && (isAdminPage || isProfilePage)) {
    return NextResponse.redirect(new URL('/connexion', req.nextUrl));
  }

  // 2. Bloquer l'accès aux pages admin si l'utilisateur n'est pas admin
  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
