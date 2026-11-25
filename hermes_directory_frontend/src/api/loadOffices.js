import api from "./api";

export default async function loadOffices(signal) {
  const endpoint = new URL("/api/offices/", window.location.origin);
  const visited = new Set();
  const offices = new Map();
  let page = endpoint;
  let expectedCount;

  while (page) {
    // DRF may build absolute links using the backend host behind the proxy.
    page.searchParams.sort();
    const query = page.search;
    if (page.pathname !== endpoint.pathname || visited.has(query)) {
      throw new Error("Invalid Office pagination link");
    }
    visited.add(query);

    const { data } = await api.get(`offices/${query}`, { signal });
    const { count, results, next } = data ?? {};
    expectedCount ??= count;
    if (
      !Number.isSafeInteger(count) || count < 0 || count !== expectedCount ||
      !Array.isArray(results) || (next !== null && (typeof next !== "string" || !next))
    ) {
      throw new Error("Invalid Office page");
    }

    const previousSize = offices.size;
    for (const office of results) {
      if (!Number.isSafeInteger(office?.id)) throw new Error("Invalid Office ID");
      offices.set(office.id, office);
    }

    if (next === null ? offices.size !== count : offices.size === previousSize || offices.size >= count) {
      throw new Error("Incomplete Office list");
    }
    page = next === null ? null : new URL(next, page);
  }

  return [...offices.values()];
}
