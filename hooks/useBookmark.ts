"use client";

import { useState } from "react";
import { z } from "zod";
import {
  type Bookmark,
  type BookmarkStorage,
  BookmarkStorageSchema,
} from "@/types/bookmark";

const STORAGE_KEY = "dig:bookmarks";

function readFromStorage(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = z
      .array(BookmarkStorageSchema)
      .safeParse(JSON.parse(raw ?? "[]"));
    if (!parsed.success) return [];
    return parsed.data.map((b) => ({ ...b, createdAt: new Date(b.createdAt) }));
  } catch {
    return [];
  }
}

function writeToStorage(bookmarks: Bookmark[]): void {
  const storage: BookmarkStorage[] = bookmarks.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

export function useBookmark() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() =>
    readFromStorage(),
  );

  function addBookmark(knowledgeId: string): void {
    setBookmarks((prev) => {
      if (prev.some((b) => b.knowledgeId === knowledgeId)) return prev;
      const next: Bookmark[] = [
        ...prev,
        {
          id: crypto.randomUUID(),
          knowledgeId,
          createdAt: new Date(),
        },
      ];
      writeToStorage(next);
      return next;
    });
  }

  function removeBookmark(knowledgeId: string): void {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.knowledgeId !== knowledgeId);
      writeToStorage(next);
      return next;
    });
  }

  function isBookmarked(knowledgeId: string): boolean {
    return bookmarks.some((b) => b.knowledgeId === knowledgeId);
  }

  return { bookmarks, addBookmark, removeBookmark, isBookmarked };
}
