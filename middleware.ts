import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
 
export async function middleware(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers()
	})
 
	if(!session) {
		return NextResponse.redirect(new URL("/landing", request.url));
	}
 
	return NextResponse.next();
}
 
export const config = {
  runtime: "nodejs",
  matcher: [
    /*
     * Match all request paths except:
     * - /landing (landing page)
     * - /login (login page)
     * - /register (register page)
     * - /api (API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /sitemap.xml (static files)
     */
    "/((?!landing|login|register|api|_next|favicon.ico|sitemap.xml).*)",
  ],
};