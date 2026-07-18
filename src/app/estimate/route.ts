import { NextResponse, type NextRequest } from "next/server";

/**
 * The estimator lives at the domain root. Visitors who land on
 * /estimate (old links, bookmarks) are permanently redirected to / with
 * every query and UTM parameter preserved.
 */
export function GET(request: NextRequest) {
  const destination = new URL("/", request.url);
  destination.search = request.nextUrl.search;
  return NextResponse.redirect(destination, 308);
}
