export type ParsedFeedItem = {
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string;
};
export function stripUnsafeHtml(value: string): string;
export function parseRssOrAtom(xml: string, limit?: number): ParsedFeedItem[];
