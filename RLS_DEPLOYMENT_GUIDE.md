# 🔒 Secure RLS Policies - Deployment Instructies

## ⚠️ BELANGRIJK: Voor Productie Deployment

De huidige `database_schema.sql` gebruikt **permissive policies** (`USING (true)`) die **NIET VEILIG** zijn voor productie. Deze policies staan iedereen toe om alle data te lezen, creëren, wijzigen en verwijderen.

Voor productie **MOET** je `secure_rls_policies.sql` toepassen.

---

## 🔍 Verschil tussen Development en Production Policies

### Development Policies (database_schema.sql)
```sql
-- NIET VEILIG VOOR PRODUCTIE
CREATE POLICY "Allow all operations on vocab_sets" 
  ON vocab_sets FOR ALL 
  USING (true) WITH CHECK (true);
```
- ✅ Makkelijk voor development
- ❌ **GEVAARLIJK**: Iedereen kan alles doen
- ❌ Geen authenticatie vereist
- ❌ Gebruikers kunnen elkaars data wijzigen/verwijderen

### Production Policies (secure_rls_policies.sql)
```sql
-- VEILIG VOOR PRODUCTIE
CREATE POLICY "Users can update own vocab sets"
  ON vocab_sets FOR UPDATE 
  TO authenticated
  USING (auth.uid()::text = created_by)
  WITH CHECK (auth.uid()::text = created_by);
```
- ✅ **VEILIG**: Alleen geauthenticeerde users
- ✅ Users kunnen alleen hun eigen data wijzigen
- ✅ Publieke sets zijn leesbaar voor iedereen
- ✅ Strikte validatie van ownership

---

## 📋 Deployment Checklist

### Stap 1: Backup je Database
```sql
-- Maak een backup in Supabase Dashboard
-- Project Settings > Backups > Create Backup
```

### Stap 2: Test in Staging/Development
1. Open Supabase Dashboard
2. Ga naar **SQL Editor**
3. Kopieer ALLE code uit `secure_rls_policies.sql`
4. Run de query
5. Test alle functionaliteit:
   - [ ] Login/Register werkt
   - [ ] Sets aanmaken werkt
   - [ ] Sets bewerken werkt (alleen eigen sets)
   - [ ] Sets verwijderen werkt (alleen eigen sets)
   - [ ] Publieke sets zijn leesbaar zonder login
   - [ ] Private sets zijn alleen zichtbaar voor eigenaar
   - [ ] Delen via link werkt

### Stap 3: Verificatie Queries
Run deze queries in SQL Editor om te checken of alles correct is:

```sql
-- Check 1: RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('vocab_sets', 'word_pairs', 'study_progress');
-- Expected: Alle TRUE

-- Check 2: Policies zijn actief
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Expected: 12+ policies (zie secure_rls_policies.sql)

-- Check 3: Permissive policies zijn weg
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE '%Allow all%';
-- Expected: GEEN RESULTATEN (oude permissive policies moeten weg zijn)
```

### Stap 4: Security Tests

#### Test 1: Unauthenticated Access
```sql
-- Als je NIET ingelogd bent, moet dit FALEN:
INSERT INTO vocab_sets (name, created_by) 
VALUES ('Hack Test', 'fake-user-id');
-- Expected: ERROR: new row violates row-level security policy
```

#### Test 2: Cross-User Access
```sql
-- Als User A, probeer User B's set te verwijderen (moet FALEN):
DELETE FROM vocab_sets 
WHERE created_by != auth.uid()::text;
-- Expected: 0 rows deleted (geen error, maar geen effect)
```

#### Test 3: Own Data Access
```sql
-- Als ingelogde user, moet dit WERKEN:
SELECT * FROM vocab_sets 
WHERE created_by = auth.uid()::text;
-- Expected: Je eigen sets
```

---

## 🚀 Productie Deployment

### Optie A: Via Supabase Dashboard (Aanbevolen)
1. Log in op [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecteer je **PRODUCTIE** project
3. Ga naar **SQL Editor**
4. Maak een nieuwe query
5. Kopieer ALLE code uit `secure_rls_policies.sql`
6. **Lees de code door** om te begrijpen wat het doet
7. Click **Run** (of Cmd/Ctrl + Enter)
8. Wacht op bevestiging: "Success. No rows returned"
9. Run de verificatie queries (zie Stap 3)

### Optie B: Via Supabase CLI
```bash
# Installeer Supabase CLI
npm install -g supabase

# Login
supabase login

# Link je project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push --file secure_rls_policies.sql
```

---

## 🔧 Troubleshooting

### Error: "permission denied for table vocab_sets"
**Oplossing**: RLS is actief maar policies zijn niet correct. Check of secure_rls_policies.sql volledig is uitgevoerd.

### Error: "new row violates row-level security policy"
**Oplossing**: Dit is CORRECT gedrag! Het betekent dat RLS werkt en ongeautoriseerde acties blokkeert.

### Probleem: "Ik kan mijn eigen sets niet meer bewerken"
**Mogelijke oorzaken**:
1. `created_by` field is niet correct gezet
2. User is niet authenticated
3. Policy is niet correct toegepast

**Fix**:
```sql
-- Check created_by values
SELECT id, name, created_by, auth.uid()::text as current_user
FROM vocab_sets
WHERE created_by IS NULL OR created_by = '';

-- Update missing created_by (ALLEEN als je zeker weet dat het jouw sets zijn)
UPDATE vocab_sets
SET created_by = 'YOUR_USER_ID'
WHERE created_by IS NULL;
```

### Probleem: "Publieke sets zijn niet meer zichtbaar"
**Check**:
```sql
-- Moet "Anyone can read vocab sets" policy tonen
SELECT * FROM pg_policies 
WHERE tablename = 'vocab_sets' 
AND policyname = 'Anyone can read vocab sets';
```

---

## 📊 Monitoring na Deployment

### Week 1: Intensieve Monitoring
- [ ] Check Supabase Logs dagelijks (Database > Logs)
- [ ] Monitor error rates in Vercel Analytics
- [ ] Test alle functionaliteit handmatig
- [ ] Vraag early adopters om feedback

### Week 2-4: Regular Monitoring
- [ ] Check logs 2x per week
- [ ] Monitor user reports
- [ ] Check voor security events

### Maandelijks
- [ ] Review RLS policies
- [ ] Check voor nieuwe security best practices
- [ ] Update documentatie

---

## 🛡️ Aanvullende Security Maatregelen

Na het toepassen van RLS policies, configureer ook:

### 1. Rate Limiting (Supabase Dashboard)
```
Project Settings > API > Rate Limiting
- Enable: ✅
- Requests per minute: 100 (pas aan naar behoefte)
```

### 2. Email Confirmations
```
Authentication > Settings
- Enable email confirmations: ✅
- Confirmation URL: https://www.quick-o.be/auth/callback
```

### 3. Captcha Protection
```
Authentication > Settings > Security
- Enable Captcha protection: ✅
- Provider: hCaptcha (al geïntegreerd in code)
```

### 4. JWT Settings
```
Authentication > Settings > JWT
- JWT expiry: 604800 (7 dagen)
- Auto refresh: ✅
```

---

## 📝 Rollback Plan (Als iets misgaat)

### Immediate Rollback
Als er KRITIEKE problemen zijn:

```sql
-- EMERGENCY: Disable RLS (TIJDELIJK!)
ALTER TABLE vocab_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE word_pairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_progress DISABLE ROW LEVEL SECURITY;

-- Let op: Dit is ONVEILIG, gebruik alleen in noodgeval!
```

### Proper Rollback
1. Restore backup via Supabase Dashboard
2. Re-apply `database_schema.sql` (development policies)
3. Identificeer het probleem
4. Fix de secure_rls_policies.sql
5. Test opnieuw
6. Deploy opnieuw

---

## ✅ Success Criteria

Je deployment is succesvol als:

- ✅ Alle bestaande functionaliteit werkt
- ✅ Gebruikers kunnen ALLEEN hun eigen sets wijzigen
- ✅ Publieke sets zijn leesbaar voor iedereen
- ✅ Unauthenticated users kunnen GEEN sets aanmaken
- ✅ Geen foute error messages in productie
- ✅ Performance is niet slechter dan voorheen
- ✅ Logs tonen geen security violations

---

## 🆘 Support

Bij problemen:
1. Check deze documentatie
2. Review `docs/SECURITY.md`
3. Check Supabase Logs (Database > Logs)
4. Contact: contact@quick-o.be

---

**Laatst bijgewerkt**: 1 januari 2026
**Auteur**: Kiko Dehondt
**Status**: ✅ Production Ready
