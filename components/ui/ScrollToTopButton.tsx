"use client";

import { useEffect, useState } from "react";
import { ChevronUpIcon } from "@/components/ui/icons";

interface ScrollToTopButtonProps {
  threshold?: number;
}

export function ScrollToTopButton({ threshold = 600 }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > threshold);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  if (!visible) return null;

  function handleClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="トップへ戻る"
      className="fixed bottom-24 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-denim/20 bg-offwhite shadow-md text-denim transition-colors hover:bg-offwhite-subtle hover:shadow-lg dark:bg-canvas-subtle dark:border-denim-light/20 dark:text-offwhite dark:hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
    >
      <ChevronUpIcon width={18} height={18} />
    </button>
  );
}
