// Cloudflare Worker to bypass Cloudflare protection
// This runs on Cloudflare's edge network with different IPs

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'sk-SK,sk;q=0.9',
        'Referer': 'https://www.rozana.sk/',
        'Origin': 'https://www.rozana.sk'
      }
    })

    const headers = new Headers(response.headers)
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  } catch (error) {
    return new Response('Error fetching: ' + error.message, { status: 500 })
  }
}
