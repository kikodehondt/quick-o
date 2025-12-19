# 🔍 SEO & Google Search Console Setup voor Quick-O

## ✅ Wat al ingesteld is:

### 1. **Metadata in index.html:**
- ✓ Title: "Quick-O - Gratis Woordenlijsten Trainer | Snel Leren"
- ✓ Meta description correct ingesteld
- ✓ Open Graph tags voor social media
- ✓ Twitter Card tags
- ✓ JSON-LD structured data (WebApplication schema)
- ✓ Favicon: `/Quick-O_logo.png`
- ✓ Canonical URL: `https://quick-o.kikodehondt.be/`

### 2. **SEO in App.tsx:**
- ✓ Dynamic page title updates
- ✓ Meta description updates voor verschillende pagina's
- ✓ Open Graph meta updates

### 3. **Robots & Sitemap:**
- ✓ `robots.txt` geconfigureerd met sitemap verwijzing
- ✓ `sitemap.xml` aanwezig
- ✓ Proper crawl directives

### 4. **Progressive Web App:**
- ✓ `manifest.json` aangemaakt met:
  - Juiste branding: "Quick-O"
  - Groene theme color: #10b981
  - App icons ingesteld
  - Screenshot metadata

## 🚀 Acties om Google te updaten:

### Stap 1: Google Search Console
1. Ga naar https://search.google.com/search-console
2. Voeg je domein toe: `quick-o.kikodehondt.be`
3. Verifieer eigendom (gebruik de Google-verifiëringscode die al in public/ staat)
4. Ga naar "Sitemaps" en voeg toe: `https://quick-o.kikodehondt.be/sitemap.xml`
5. Klik "Request indexing" voor je homepage
6. Gebruik "URL Inspection" om Google te forceren je pagina opnieuw te crawlen

### Stap 2: Bing Webmaster Tools
1. Ga naar https://www.bing.com/webmaster
2. Voeg je site toe
3. Upload `sitemap.xml`
4. Voeg `robots.txt` toe

### Stap 3: Open Graph Validator
- Test je links: https://ogp.me/
- Controleer dat logo en beschrijving correct verschijnen

### Stap 4: Mobile-Friendly Test
- Controleer responsiveness: https://search.google.com/test/mobile-friendly
- All-in-one SEO checker: https://www.seobility.net/

## 🔧 Wat je kan verbeteren:

### Index.html aanpassing (COPY-PASTE):
Voeg dit toe na de favicon regel:
```html
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/Quick-O_logo.png" />
<meta name="theme-color" content="#10b981" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

## 📊 Waarom "kikodehondt" nog verschijnt:

Google's cache vernieuwen duurt meestal **2-4 weken**. De volgende dingen helpen:

1. **Request Re-indexing** in Google Search Console (snelste manier)
2. **Vernieuw browser cache** - Ctrl+Shift+Delete
3. **Vernieuw Google cache** - `cache:quick-o.kikodehondt.be` in Google zoeken
4. **Zorg SSL certificaat correct is** - Je site moet HTTPS zijn

## 🎯 Controleer dat alles correct werkt:

```bash
# In terminal - controleer response headers
curl -I https://quick-o.kikodehondt.be/

# Controleer robots.txt
curl https://quick-o.kikodehondt.be/robots.txt

# Controleer sitemap
curl https://quick-o.kikodehondt.be/sitemap.xml
```

## 📝 Volgende stappen:

1. [ ] Voeg manifest link toe aan index.html
2. [ ] Voeg meta theme-color toe
3. [ ] Log in op Google Search Console
4. [ ] Submit sitemap
5. [ ] Request indexing voor homepage
6. [ ] Wacht 24-48 uur op herbepaling

**Resultaat:** Quick-O zal dan correct verschijnen met:
- ✓ Juiste titel in Google zoeken
- ✓ Juiste beschrijving
- ✓ Quick-O logo (favicon)
- ✓ Social media preview met logo
- ✓ Mobiele app support
