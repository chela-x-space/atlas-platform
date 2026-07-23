const STOP_WORDS = new Set([
  "a", "an", "and", "at", "by", "for", "from", "in", "into", "is", "of",
  "on", "the", "to", "with", "nasa", "new", "news", "update",
]);

function words(value) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
}

function similarity(left, right) {
  const a = words(left);
  const b = words(right);
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const word of a) if (b.has(word)) overlap += 1;
  return overlap / Math.min(a.size, b.size);
}

/**
 * Articles remain independently attributable, while similar coverage is presented
 * as one event. The newest verified headline is used as the event label.
 */
export function groupNewsByEvent(items) {
  const newestFirst = [...items].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  const groups = [];

  for (const item of newestFirst) {
    const group = groups.find((candidate) =>
      candidate.category === item.category &&
      similarity(candidate.title, item.title) >= 0.6
    );

    if (group) {
      group.articles.push(item);
      group.sourceCount = new Set(group.articles.map((article) => article.sourceId)).size;
      continue;
    }

    groups.push({
      id: `event-${item.id}`,
      title: item.title,
      category: item.category,
      latestAt: item.publishedAt,
      articles: [item],
      sourceCount: 1,
    });
  }

  return groups;
}

export function filterNewsGroups(groups, query, category) {
  const needle = query.trim().toLowerCase();
  return groups.filter((group) => {
    if (category !== "all" && group.category !== category) return false;
    if (!needle) return true;
    return group.articles.some((article) =>
      `${article.title} ${article.summary} ${article.sourceName} ${article.category}`
        .toLowerCase()
        .includes(needle)
    );
  });
}

export function canUseAiSummary(group, trustedSourceIds) {
  const trusted = new Set(
    group.articles
      .filter((article) => trustedSourceIds.includes(article.sourceId))
      .map((article) => article.sourceId),
  );
  return trusted.size >= 2;
}

