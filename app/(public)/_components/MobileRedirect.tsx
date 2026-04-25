"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MOBILE_MAX_WIDTH = 767;

export function MobileRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches
    ) {
      router.replace("/ootd");
    }
  }, [router]);
  return null;
}
