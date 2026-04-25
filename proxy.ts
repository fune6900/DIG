import { NextRequest, NextResponse, userAgent } from "next/server";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }
  const { device } = userAgent(req);
  if (device.type === "mobile") {
    const url = req.nextUrl.clone();
    url.pathname = "/ootd";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
