const path = require('path');
const xlsx = require('xlsx');

const catalogPath = path.join(__dirname, '../config/MKB10_Kasalliklar.xlsx');
let cachedRows = null;

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[‘’ʻ`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const loadCatalog = () => {
  if (cachedRows) return cachedRows;

  const workbook = xlsx.readFile(catalogPath, { cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  cachedRows = rows
    .map((row) => {
      const code = String(row.Kod || '').trim();
      const name = String(row["Nomi (O'zbekcha)"] || '').trim();
      const russianName = String(row['Название (Русский)'] || '').trim();
      return {
        code,
        name,
        russianName,
        searchText: normalizeText(`${code} ${name} ${russianName}`)
      };
    })
    .filter((row) => row.code && row.name);

  return cachedRows;
};

const searchMkb10 = (query, { count = 10 } = {}) => {
  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length < 2) return [];

  const terms = normalizedQuery.split(' ').filter(Boolean);
  const limit = Math.min(Number(count) || 10, 25);

  return loadCatalog()
    .filter((row) => terms.every((term) => row.searchText.includes(term)))
    .sort((a, b) => {
      const aName = normalizeText(a.name);
      const bName = normalizeText(b.name);
      const aStarts = aName.startsWith(normalizedQuery) || normalizeText(a.code).startsWith(normalizedQuery);
      const bStarts = bName.startsWith(normalizedQuery) || normalizeText(b.code).startsWith(normalizedQuery);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return a.code.localeCompare(b.code);
    })
    .slice(0, limit)
    .map(({ code, name, russianName }) => ({ code, name, description: name, russianName }));
};

module.exports = { searchMkb10, normalizeText };
