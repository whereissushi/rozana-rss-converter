const xml2js = require('xml2js');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const feedUrl = req.query.url;

    if (!feedUrl) {
      return res.status(400).send('Missing url parameter');
    }

    // Try multiple proxy services
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`,
      feedUrl // Direct attempt as fallback
    ];

    let xmlData = null;
    let lastError = null;

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/xml, text/xml, */*'
          },
          timeout: 15000
        });

        if (response.ok) {
          xmlData = await response.text();
          // Check if it's valid XML (not Cloudflare error page)
          if (xmlData.includes('<HLASENIA>') || xmlData.includes('<?xml')) {
            break;
          }
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!xmlData) {
      throw new Error(`Could not fetch feed from any proxy. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    // Parse the XML
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    // Convert to RSS format
    const items = result.HLASENIA.HLASENIE.map(item => {
      const nazov = item.NAZOV?.[0] || '';
      const popis = item.POPIS?.[0] || '';
      const datum = item.DATUM_ZVEREJNENIA?.[0] || '';
      const url = item.URL?.[0] || '';
      const prilohaUrl = item.PRILOHA_URL?.[0] || '';

      // Build description with attachment link if available
      let description = popis;
      if (prilohaUrl) {
        description += ` <a href="${prilohaUrl}" target="_blank">${prilohaUrl}</a>`;
      }

      return `    <item>
      <title>${escapeXml(nazov)}</title>
      <description><![CDATA[${description}]]></description>
      <pubDate>${formatDate(datum)}</pubDate>
      <link>${escapeXml(url)}</link>
    </item>`;
    }).join('\n');

    // Build RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Rozana Feed</title>
    <link>${feedUrl}</link>
    <description>Converted RSS feed from Rozana</description>
${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.status(200).send(rss);

  } catch (error) {
    console.error('Error converting feed:', error);
    res.status(500).send('Error converting feed: ' + error.message);
  }
};

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toUTCString();

  // Parse DD.MM.YYYY HH:MM:SS format
  const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute, second] = match;
    const date = new Date(year, month - 1, day, hour, minute, second);
    return date.toUTCString();
  }

  return new Date(dateStr).toUTCString();
}
