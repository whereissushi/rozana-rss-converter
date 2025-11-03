const xml2js = require('xml2js');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const feedUrl = req.query.url;

    if (!feedUrl) {
      return res.status(400).send('Missing url parameter');
    }

    let xmlData = null;

    // Check if demo mode
    if (feedUrl.includes('demo') || feedUrl.includes('test')) {
      // Use demo data
      const fs = require('fs');
      const path = require('path');
      xmlData = fs.readFileSync(path.join(__dirname, 'demo.xml'), 'utf-8');
    } else {
      // Try to fetch real feed with multiple methods
      const methods = [
        // Method 1: ScraperAPI (has free tier with render=true for JS)
        {
          url: `http://api.scraperapi.com?api_key=scraperapi_free_trial&url=${encodeURIComponent(feedUrl)}&render=false`,
          headers: {}
        },
        // Method 2: Direct with full browser headers
        {
          url: feedUrl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'sk-SK,sk;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www.rozana.sk/'
          }
        }
      ];

      for (const method of methods) {
        try {
          const response = await fetch(method.url, {
            headers: method.headers,
            timeout: 25000
          });

          if (response.ok) {
            const data = await response.text();
            if (data && data.includes('<HLASENIA>') && !data.includes('Cloudflare') && !data.includes('blocked') && !data.toLowerCase().includes('attention required')) {
              xmlData = data;
              break;
            }
          }
        } catch (err) {
          continue;
        }
      }

      if (!xmlData) {
        return res.status(503).send(`Unable to fetch RSS feed due to Cloudflare protection. Please use demo mode by adding 'demo' or 'test' in URL, or contact Rozana.sk for API access without Cloudflare protection.`);
      }
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
