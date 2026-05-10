export interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string };
  description: string | null;
  alt_description: string | null;
  user: { name: string; links: { html: string } };
  links: { html: string };
  tags?: { title: string }[];
}

interface UnsplashApiResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export async function searchUnsplashPhotos(params: {
  query: string;
  page: number;
  perPage: number;
}): Promise<{ photos: UnsplashPhoto[]; totalPages: number }> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY is not set");
  }

  const enhancedQuery = `${params.query} outfit fashion`;
  const searchParams = new URLSearchParams({
    query: enhancedQuery,
    page: String(params.page),
    per_page: String(params.perPage),
  });

  const url = `https://api.unsplash.com/search/photos?${searchParams.toString()}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unsplash API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as UnsplashApiResponse;

  return {
    photos: data.results,
    totalPages: data.total_pages,
  };
}
