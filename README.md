# QuickO 📚

Een moderne, motiverende web applicatie voor het oefenen van woordjes. Perfect voor studenten die effectief en leuk hun vocabulaire willen uitbreiden!

## ✨ Features

- **Eenvoudig Sets Aanmaken**: Plak gewoon je woordjes in het juiste formaat
- **Smart Parser**: Automatische parsing van het formaat `woord1, woord2; woord3, woord4`
- **Interactieve Flashcards**: Klik om het antwoord te zien
- **Progress Tracking**: Houd je scores bij met lokale en cloud opslag
- **Motiverende UI**: Mooie, kleurrijke interface met animaties
- **Database Opslag**: Al je sets worden veilig opgeslagen
- **Verwijder je Sets**: Verwijder alleen de sets die je zelf hebt aangemaakt
- **Shuffle Mode**: Woordjes worden random getoond

## 🚀 Installatie

### 1. Dependencies Installeren

```bash
npm install
```

### 2. Supabase Setup

1. Ga naar [Supabase](https://supabase.com) en maak een nieuw project aan
2. Kopieer je Project URL en Anon Key
3. Maak een `.env` file:

```bash
cp .env.example .env
```

4. Vul je Supabase credentials in:

```env
VITE_SUPABASE_URL=jouw_supabase_url
VITE_SUPABASE_ANON_KEY=jouw_supabase_anon_key
```

### 3. Database Schema

Voer de migrate scripts uit in de Supabase SQL Editor:

1. Open eerst `database_schema.sql` en voer dit uit (maak tabellen aan)
2. Open dan `database_migration.sql` en voer dit uit (voeg kolommen toe)

Dit creëert:
- `vocab_sets` - Voor je woordjes sets (met language1, language2, created_by velden)
- `word_pairs` - Voor individuele woordparen
- `study_progress` - Voor het bijhouden van je voortgang

## 🎮 Gebruik

### Development Server Starten

```bash
npm run dev
```

### Nieuwe Set Aanmaken

1. Klik op "Nieuwe Set Aanmaken"
2. Vul een naam in (bijv. "Frans Hoofdstuk 1")
3. Plak je woordjes in dit formaat:

```
huis, maison; kat, chat; hond, chien; boek, livre; tafel, table
```

4. Klik op "Set Opslaan"

### Oefenen

1. Klik op "Oefenen" bij een set
2. Zie het Nederlandse woord
3. Klik op de kaart om het Franse woord te zien
4. Klik op "Correct" of "Fout"
5. Bekijk je score aan het einde!

### Je Sets Beheren

- **Verwijderen**: Alleen sets die jij hebt aangemaakt kunnen verwijderd worden. Klik het rode vuilnisbak icoon rechtsboven op de setkaart.

## 📝 Formaat voor Woordjes

Het formaat is super simpel en AI-vriendelijk:

```
nederlands woord, frans woord; volgend nederlands woord, volgend frans woord
```

**Voorbeelden:**

```
huis, maison; kat, chat; hond, chien
```

```
lopen, marcher; rennen, courir; springen, sauter; zwemmen, nager
```

Je kunt ChatGPT of andere AI vragen om tekst in dit formaat te zetten:

> "Zet deze woordjes in het formaat: woord1, woord2; woord3, woord4"

## 🎨 Tech Stack

- **React** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Supabase** - Database & Backend
- **Lucide React** - Icons

## 📦 Build voor Productie

```bash
npm run build
```

## 🌐 Deployment

De app kan eenvoudig gedeployed worden op:
- **Vercel** (Aanbevolen)
- **Netlify**
- **Railway**

Vergeet niet je environment variables in te stellen!

### Vercel Deployment

```bash
# Installeer Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🤝 Contributing

Suggesties en verbeteringen zijn welkom!

## 📄 Licentie

MIT

---

**Veel succes met het leren van je woordjes! 🎓✨**
