import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/settings(.*)",
  "/account(.*)",
]);

// Define public routes that signed-in users should be redirected away from
const isPublicAuthRoute = createRouteMatcher([
  "/",
  "/login",
  "/signup",
  "/features",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Redirect signed-in users away from landing/auth pages to dashboard
  if (userId && isPublicAuthRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  // Protect authenticated routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
