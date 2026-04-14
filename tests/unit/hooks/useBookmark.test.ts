import { renderHook, act } from "@testing-library/react";
import { useBookmark } from "@/hooks/useBookmark";

const STORAGE_KEY = "dig:bookmarks";

const mockKnowledgeId = "123e4567-e89b-12d3-a456-426614174000";
const anotherKnowledgeId = "223e4567-e89b-12d3-a456-426614174001";

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe("useBookmark", () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it("should return empty bookmarks initially", () => {
    const { result } = renderHook(() => useBookmark());
    expect(result.current.bookmarks).toEqual([]);
  });

  it("should add a bookmark", () => {
    const { result } = renderHook(() => useBookmark());

    act(() => {
      result.current.addBookmark(mockKnowledgeId);
    });

    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0].knowledgeId).toBe(mockKnowledgeId);
  });

  it("should not add duplicate bookmark", () => {
    const { result } = renderHook(() => useBookmark());

    act(() => {
      result.current.addBookmark(mockKnowledgeId);
    });
    act(() => {
      result.current.addBookmark(mockKnowledgeId);
    });

    expect(result.current.bookmarks).toHaveLength(1);
  });

  it("should remove a bookmark", () => {
    const { result } = renderHook(() => useBookmark());

    act(() => {
      result.current.addBookmark(mockKnowledgeId);
    });
    act(() => {
      result.current.removeBookmark(mockKnowledgeId);
    });

    expect(result.current.bookmarks).toHaveLength(0);
  });

  it("should return true for isBookmarked when bookmarked", () => {
    const { result } = renderHook(() => useBookmark());

    act(() => {
      result.current.addBookmark(mockKnowledgeId);
    });

    expect(result.current.isBookmarked(mockKnowledgeId)).toBe(true);
  });

  it("should return false for isBookmarked when not bookmarked", () => {
    const { result } = renderHook(() => useBookmark());

    expect(result.current.isBookmarked(mockKnowledgeId)).toBe(false);
  });

  it("should persist bookmarks to localStorage", () => {
    const { result } = renderHook(() => useBookmark());

    act(() => {
      result.current.addBookmark(mockKnowledgeId);
      result.current.addBookmark(anotherKnowledgeId);
    });

    const stored = localStorageMock.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();

    const parsed: unknown = JSON.parse(stored!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(
      (parsed as { knowledgeId: string }[]).some(
        (b) => b.knowledgeId === mockKnowledgeId,
      ),
    ).toBe(true);
    expect(
      (parsed as { knowledgeId: string }[]).some(
        (b) => b.knowledgeId === anotherKnowledgeId,
      ),
    ).toBe(true);
  });
});
