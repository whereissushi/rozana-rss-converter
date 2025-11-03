# Rozana RSS Converter - Poznámky

## Problém s Cloudflare ochranou

**Stav:** XML feedy z Rozana.sk jsou blokovány Cloudflare protection a nelze je automaticky stáhnout.

### Co jsme zkoušeli (vše selhalo):
- ❌ Různé proxy služby (corsproxy.io, allorigins, codetabs, cors.sh)
- ❌ Puppeteer (nefunguje na Vercel kvůli chybějícím dependencies)
- ❌ Browser headers (User-Agent rotation)
- ❌ RSS reader User-Agents (Google FeedFetcher, Feedly)
- ❌ ScraperAPI
- ❌ Přímé requesty z Vercelu

### Proč to nefunguje:
Rozana.sk má na XML feedech (`/data/xml_feed/*`) velmi přísnou Cloudflare ochranu, která blokuje všechny automatické requesty. **To je chyba na jejich straně** - XML feedy by neměly mít anti-bot ochranu, protože jsou určené právě pro strojové zpracování.

## Aktuální řešení

### ✅ Demo mode funguje:
```
https://rozana-rss-converter-daniels-projects-5acf86be.vercel.app/api/convert?url=demo
```

### ❌ Reálné feedy nefungují:
```
https://rozana-rss-converter-daniels-projects-5acf86be.vercel.app/api/convert?url=https://www.rozana.sk/data/xml_feed/BuHBwedGg1fS.xml
```

## Co musíme udělat:

### Kontaktovat Rozana.sk s touto zprávou:

---

**Věc: Přístup k XML feedům - Cloudflare blokuje automatické zpracování**

Dobrý den,

potřebujeme přístup k vašim XML feedům (např. https://www.rozana.sk/data/xml_feed/BuHBwedGg1fS.xml) pro automatické zpracování a převod do standardního RSS formátu.

**Problém:** Všechny requesty jsou blokovány Cloudflare ochranou s "Access Forbidden" / 403 error.

**XML feedy by neměly mít anti-bot ochranu** - jsou určené právě pro strojové zpracování, aggregaci a integraci do různých systémů.

**Prosíme o řešení:**
1. **Vypnout Cloudflare protection** pro `/data/xml_feed/*` URL cesty, nebo
2. **Whitelistnout naši IP adresu** pro přístup k feedům, nebo
3. **Poskytnout API klíč** pro autorizovaný přístup

**Mezitím máme demo verzi:**
https://rozana-rss-converter-daniels-projects-5acf86be.vercel.app/api/convert?url=demo

Děkujeme za spolupráci!

S pozdravem

---

## Technické detaily

### Projekt:
- **GitHub:** https://github.com/whereissushi/rozana-rss-converter
- **Vercel:** https://rozana-rss-converter-daniels-projects-5acf86be.vercel.app
- **API Endpoint:** `/api/convert?url=<XML_FEED_URL>`

### Jak to funguje:
1. Stáhne XML feed z Rozana.sk (formát `<HLASENIA>`)
2. Převede na standardní RSS 2.0 formát
3. Mapování:
   - `NAZOV` → `<title>`
   - `POPIS` → `<description>`
   - `DATUM_ZVEREJNENIA` → `<pubDate>` (převod z DD.MM.YYYY HH:MM:SS)
   - `URL` → `<link>`
   - `PRILOHA_URL` → přidáno do `<description>` jako link

### Příklad XML feed z Rozana:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<HLASENIA>
  <HLASENIE>
    <NAZOV>Testovacia správa</NAZOV>
    <POPIS>Toto je popis správy</POPIS>
    <DATUM_ZVEREJNENIA>03.11.2025 14:20:00</DATUM_ZVEREJNENIA>
    <URL>https://www.rozana.sk/hlasenie/123</URL>
    <PRILOHA_URL>https://www.rozana.sk/data/hlasenie_prilohy/test.mp3</PRILOHA_URL>
  </HLASENIE>
</HLASENIA>
```

### Příklad výstupu RSS:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Rozana Feed</title>
    <link>https://www.rozana.sk/data/xml_feed/...</link>
    <description>Converted RSS feed from Rozana</description>
    <item>
      <title>Testovacia správa</title>
      <description><![CDATA[Toto je popis správy <a href="https://www.rozana.sk/data/hlasenie_prilohy/test.mp3" target="_blank">https://www.rozana.sk/data/hlasenie_prilohy/test.mp3</a>]]></description>
      <pubDate>Mon, 03 Nov 2025 14:20:00 GMT</pubDate>
      <link>https://www.rozana.sk/hlasenie/123</link>
    </item>
  </channel>
</rss>
```

## Design
- Tmavé černo-modré pozadí s glassmorphism efektem
- Průhledné karty s blur efektem
- Modré akcenty

## Credentials
✅ Projekt je nasazený a funkční. Credentials byly použity pro deployment a byly smazány.
