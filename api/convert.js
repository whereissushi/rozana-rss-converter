const axios = require('axios');
const xml2js = require('xml2js');

module.exports = async (req, res) => {
  try {
    const feedUrl = req.query.url;

    if (!feedUrl) {
      return res.status(400).send('Missing url parameter');
    }

    // Fetch the Rozana XML feed
    const response = await axios.get(feedUrl);
    const xmlData = response.data;

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
