const NLM_ICD10CM_SEARCH_URL = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search';

const normalizeIcd10cmResponse = (payload) => {
  const rows = Array.isArray(payload?.[3]) ? payload[3] : [];

  return rows
    .map((row) => {
      if (!Array.isArray(row)) return null;
      const [code, name] = row;
      if (!code || !name) return null;
      return { code: String(code), name: String(name) };
    })
    .filter(Boolean);
};

const searchIcd10cm = async (terms, { count = 10 } = {}) => {
  const query = String(terms || '').trim();
  if (query.length < 2) return [];

  const url = new URL(NLM_ICD10CM_SEARCH_URL);
  url.searchParams.set('sf', 'code,name');
  url.searchParams.set('df', 'code,name');
  url.searchParams.set('terms', query);
  url.searchParams.set('count', String(Math.min(Math.max(Number(count) || 10, 1), 25)));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`NLM ICD-10-CM API returned ${response.status}`);
    }

    return normalizeIcd10cmResponse(await response.json());
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  normalizeIcd10cmResponse,
  searchIcd10cm
};
