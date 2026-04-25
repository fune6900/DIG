"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MOBILE_UA_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function MobileRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (MOBILE_UA_PATTERN.test(navigator.userAgent)) {
      router.replace("/ootd");
    }
  }, [router]);
  return null;
}
