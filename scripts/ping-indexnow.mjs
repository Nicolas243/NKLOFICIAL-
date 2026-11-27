const DEFAULT_SITEMAP_URL = 'https://nkloficial.com.br/sitemap.xml';
const DEFAULT_INDEXNOW_KEY = 'a7f4c92e1b8d40539e6c1a2f8b4d7e03';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_BATCH_SIZE = 10000;

function readCliFlag(args, prefix) {
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : '';
}

function unescapeXmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extractSitemapUrls(xml) {
  const urls = [];
  const pattern = /<loc>\s*([\s\S]*?)\s*<\/loc>/gi;
  let match = pattern.exec(xml);
  while (match !== null) {
    const cleaned = unescapeXmlEntities(match[1].trim());
    if (cleaned) {
      urls.push(cleaned);
    }
    match = pattern.exec(xml);
  }
  return urls;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function resolveUrls(urlsFlag, sitemapUrl) {
  if (urlsFlag) {
    return urlsFlag
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  const response = await fetch(sitemapUrl, {
    headers: { Accept: 'application/xml, text/xml;q=0.9, */*;q=0.8' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar sitemap (${response.status}): ${sitemapUrl}`);
  }

  const xml = await response.text();
  return extractSitemapUrls(xml);
}

async function main() {
  const args = process.argv.slice(2);
  const sitemapUrl = readCliFlag(args, '--sitemap=') || DEFAULT_SITEMAP_URL;
  const urlsFlag = readCliFlag(args, '--urls=');
  const key =
    readCliFlag(args, '--key=')
    || process.env.INDEXNOW_KEY?.trim()
    || DEFAULT_INDEXNOW_KEY;

  const rawUrls = await resolveUrls(urlsFlag, sitemapUrl);
  const fallbackOrigin = new URL(sitemapUrl).origin;
  const parsedOrigin = rawUrls.length > 0 ? new URL(rawUrls[0]).origin : fallbackOrigin;
  const host = new URL(parsedOrigin).host;
  const keyLocation = `${parsedOrigin}/${key}.txt`;

  const uniqueUrls = Array.from(
    new Set(
      rawUrls.filter((entry) => {
        try {
          const parsed = new URL(entry);
          return parsed.host === host && (parsed.protocol === 'https:' || parsed.protocol === 'http:');
        } catch {
          return false;
        }
      }),
    ),
  );

  if (uniqueUrls.length === 0) {
    console.error('[indexnow] Nenhuma URL valida encontrada para envio.');
    process.exitCode = 1;
    return;
  }

  const batches = chunkArray(uniqueUrls, MAX_BATCH_SIZE);
  let totalSubmitted = 0;

  for (const urlList of batches) {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList,
      }),
      signal: AbortSignal.timeout(15000),
    });

    totalSubmitted += urlList.length;
    console.log(
      `[indexnow] status=${response.status} submittedCount=${urlList.length} totalSubmitted=${totalSubmitted}`,
    );

    if (response.status >= 400) {
      const bodyText = await response.text().catch(() => '');
      if (bodyText) {
        console.error(`[indexnow] erro=${bodyText}`);
      }
      process.exitCode = 1;
      return;
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[indexnow] falha=${message}`);
  process.exitCode = 1;
});
