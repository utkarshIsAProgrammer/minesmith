const BASE_URL = process.env.MODRINTH_API_URL || 'https://api.modrinth.com/v2';
const CDN_URL = process.env.MODRINTH_CDN_URL || 'https://cdn.modrinth.com';

const HEADERS = {
  'User-Agent': 'MineSmith/1.0.0 (minecraft-modpack-builder)',
  Accept: 'application/json',
};

const FETCH_TIMEOUT = 10_000; // 10 seconds for all Modrinth calls

/**
 * Search for mods on Modrinth
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<Array>} Array of mod results
 */
export async function searchMods(query, options = {}) {
  const {
    limit = 10,
    index = 'relevance',
    facets = [],
    minecraftVersion = null,
    loaders = null,
  } = options;

  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
    index,
  });

  // Build facets array
  const searchFacets = [...facets];

  if (minecraftVersion) {
    searchFacets.push([`versions:${minecraftVersion}`]);
  }

  if (loaders && loaders.length > 0) {
    searchFacets.push([`categories:${loaders.join('|')}`]);
  }

  // Project type facet — mods only
  searchFacets.push(['project_type:mod']);

  if (searchFacets.length > 0) {
    params.set('facets', JSON.stringify(searchFacets));
  }

  const url = `${BASE_URL}/search?${params.toString()}`;

  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(FETCH_TIMEOUT) });

  if (!res.ok) {
    throw new Error(`Modrinth search error (${res.status})`);
  }

  const data = await res.json();
  return data.hits || [];
}

/**
 * Get full project details from Modrinth
 */
export async function getModDetails(modId) {
  const res = await fetch(`${BASE_URL}/project/${modId}`, { headers: HEADERS, signal: AbortSignal.timeout(FETCH_TIMEOUT) });

  if (!res.ok) {
    throw new Error(`Modrinth project error (${res.status})`);
  }

  return await res.json();
}

/**
 * Get available versions for a mod
 */
export async function getModVersions(modId, options = {}) {
  const params = new URLSearchParams();

  if (options.minecraftVersion) {
    params.set('game_versions', `["${options.minecraftVersion}"]`);
  }

  if (options.loader) {
    params.set('loaders', `["${options.loader}"]`);
  }

  const url = `${BASE_URL}/project/${modId}/version${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(FETCH_TIMEOUT) });

  if (!res.ok) {
    throw new Error(`Modrinth versions error (${res.status})`);
  }

  return await res.json();
}

/**
 * Get the download URL for a specific mod version
 */
export function getDownloadUrl(versionData) {
  if (!versionData?.files?.[0]) return null;
  return versionData.files[0].url;
}

/**
 * Download a mod file as buffer
 */
export async function downloadModFile(url) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });

  if (!res.ok) {
    throw new Error(`Failed to download mod file (${res.status})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = url.split('/').pop();
  const contentType = res.headers.get('content-type');

  return { buffer, filename, contentType };
}

/**
 * Get the icon URL for a mod
 */
export function getModIconUrl(projectId, iconUrl) {
  if (iconUrl) return iconUrl;
  return `${CDN_URL}/data/${projectId}/icon.png`;
}

/**
 * Get dependencies for a mod (checks its version for a specific MC version + loader)
 * Returns array of { projectId, projectName, type: 'required'|'optional'|'incompatible'|'embedded' }
 */
export async function getModDependencies(modId, minecraftVersion, loader) {
  try {
    const versions = await getModVersions(modId, { minecraftVersion, loader });
    if (!versions || versions.length === 0) return [];

    const latestVersion = versions[0];
    const deps = latestVersion.dependencies || [];

    if (deps.length === 0) return [];

    // Fetch details for all dependency projects in parallel
    const depIds = deps.map(d => d.project_id).filter(Boolean);
    if (depIds.length === 0) return [];

    const depDetails = await Promise.allSettled(
      depIds.map(id => getModDetails(id))
    );

    const detailsMap = new Map();
    for (const result of depDetails) {
      if (result.status === 'fulfilled') {
        detailsMap.set(result.value.id, result.value);
      }
    }

    return deps
      .filter(d => d.project_id)
      .map(d => {
        const detail = detailsMap.get(d.project_id);
        return {
          projectId: d.project_id,
          projectName: detail?.title || d.project_id,
          projectSlug: detail?.slug || '',
          projectUrl: detail?.slug ? `https://modrinth.com/mod/${detail.slug}` : '',
          iconUrl: detail?.icon_url || '',
          description: detail?.description || '',
          type: d.dependency_type || 'required',
          versionRequired: d.version_name || null,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Fetch dependencies for multiple mods in parallel
 */
export async function getBulkDependencies(modIds, minecraftVersion, loader) {
  const results = await Promise.allSettled(
    modIds.map(id => getModDependencies(id, minecraftVersion, loader))
  );

  const allDeps = new Map(); // projectId -> { requiredBy: [modNames], depInfo }

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') {
      for (const dep of results[i].value) {
        if (!allDeps.has(dep.projectId)) {
          allDeps.set(dep.projectId, { ...dep, requiredBy: [] });
        }
        allDeps.get(dep.projectId).requiredBy.push(modIds[i]);
      }
    }
  }

  return Array.from(allDeps.values());
}

/**
 * Search multiple queries in parallel and deduplicate results
 */
export async function multiSearch(queries, options = {}) {
  const allResults = new Map();

  const searches = queries.map(query =>
    searchMods(query, { limit: 12, ...options }).catch(() => [])
  );

  const results = await Promise.allSettled(searches);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const mod of result.value) {
        if (!allResults.has(mod.project_id)) {
          allResults.set(mod.project_id, mod);
        }
      }
    }
  }

  return Array.from(allResults.values());
}
