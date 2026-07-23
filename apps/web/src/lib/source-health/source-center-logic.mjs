export function filterSourceProviders(providers, query, status) {
  const needle = query.trim().toLowerCase();
  return providers.filter((provider) => {
    if (status !== "all" && provider.status !== status) return false;
    if (!needle) return true;
    return [
      provider.name,
      provider.organization,
      provider.id,
      provider.category,
      provider.status,
      provider.coverage,
      provider.attribution,
      provider.notes,
      provider.license.label,
    ].join(" ").toLowerCase().includes(needle);
  });
}

export function sourceProviderStatistics(providers) {
  const offlineStatuses = new Set(["paused", "disabled", "rate_limited", "unavailable"]);
  return {
    online: providers.filter((provider) => provider.status === "online").length,
    offline: providers.filter((provider) => offlineStatuses.has(provider.status)).length,
    configurationRequired: providers.filter((provider) => provider.status === "configuration_required").length,
    totalReports: providers.reduce((total, provider) => total + provider.reports, 0),
  };
}

