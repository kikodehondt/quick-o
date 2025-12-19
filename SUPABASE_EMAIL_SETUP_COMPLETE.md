# 🔧 Complete Supabase Email Templates Setup Guide

## 🚨 Probleem Diagnose

### Symptomen:
- ✗ Links in emails doen niets
- ✗ Niet alle emails worden verstuurd
- ✗ Confirm signup werkt niet
- ✗ Password reset werkt niet
- ✗ Email change werkt niet

### Root Causes:
1. **Email templates niet geüpload** naar Supabase Dashboard
2. **Email redirect URLs** verkeerd geconfigureerd
3. **Email confirmations** mogelijk uitgeschakeld
4. **SMTP settings** niet correct

---

## ✅ Oplossing: Stap-voor-Stap

### STAP 1: Supabase Dashboard Configuratie

#### 1.1 Open Supabase Dashboard
```
https://app.supabase.com
→ Selecteer je Quick-O project
```

#### 1.2 Email Templates Uploaden

**Navigeer naar:**
```
Authentication → Email Templates
```

**Upload elk template:**

| Supabase Template Naam | Jouw HTML Bestand | Locatie |
|------------------------|-------------------|---------|
| **Confirm signup** | `confirm-signup.html` | `supabase/templates/emails/confirm-signup.html` |
| **Change Email** | `change-email.html` | `supabase/templates/emails/change-email.html` |
| **Reset password** | `reset-password.html` | `supabase/templates/emails/reset-password.html` |
| **Magic Link** | `reauthentication.html` | `supabase/templates/emails/reauthentication.html` |

**Voor elk template:**
1. Klik op template naam in Supabase
2. **Selecteer ALLE tekst** in de editor (Ctrl+A)
3. **Delete** de oude content
4. Open het HTML bestand in VS Code
5. **Copy ALLE inhoud** (Ctrl+A → Ctrl+C)
6. **Paste** in Supabase editor (Ctrl+V)
7. Klik **Save**
8. Zie groene "Template updated" bericht

---

### STAP 2: Authentication Settings

#### 2.1 Email Confirmation Inschakelen

**Navigeer naar:**
```
Authentication → Settings → Auth Settings
```

**Zorg dat deze AANSTAAN:**
- ✅ **Enable email confirmations** - AAN
- ✅ **Secure email change** - AAN  
- ✅ **Enable password recovery** - AAN

**Site URL instellen:**
```
Site URL: https://quick-o.kikodehondt.be
```

**Redirect URLs toevoegen:**
```
Redirect URLs:
→ https://quick-o.kikodehondt.be/**
→ https://quick-o.kikodehondt.be/auth/callback
→ http://localhost:5173/** (voor development)
```

---

### STAP 3: Email Provider Settings

#### 3.1 SMTP Configuratie (BELANGRIJK!)

**Navigeer naar:**
```
Project Settings → Authentication → SMTP Settings
```

**Optie A: Gebruik Supabase's Ingebouwde SMTP (Makkelijkst)**
```
✓ Enable Custom SMTP: OFF (gebruik built-in)
✓ From Email: noreply@mail.app.supabase.io
```

**Optie B: Eigen SMTP (Aanbevolen voor productie)**
Als je een eigen domein wil:
```
Enable Custom SMTP: ON
SMTP Host: smtp.gmail.com (of jouw provider)
SMTP Port: 587
SMTP Username: your-email@gmail.com
SMTP Password: your-app-password
From Email: noreply@quick-o.kikodehondt.be
```

Voor Gmail:
1. Ga naar Google Account → Security
2. Enable 2-factor authentication
3. Genereer "App Password"
4. Gebruik die als SMTP Password

---

### STAP 4: Test Elk Template

#### 4.1 Test Confirm Sign-Up

**In je browser:**
```javascript
// Open browser console op je website
// Test signup flow:

1. Klik "Account Maken"
2. Vul in:
   - Email: je-test-email@gmail.com
   - Password: TestTest123!
   - Naam: Test User
3. Klik "Account Maken"
4. Check je inbox (ook SPAM!)
5. Klik op "Bevestig mijn e-mailadres" button
6. Verify je wordt doorgestuurd naar je website
```

**Als het niet werkt:**
- Check Supabase Dashboard → Authentication → Users
- Kijk of user bestaat maar `email_confirmed_at` is `null`
- Check Supabase Dashboard → Logs voor errors

#### 4.2 Test Reset Password

```javascript
1. Klik "Wachtwoord vergeten?"
2. Vul je email in
3. Check inbox (ook SPAM!)
4. Klik "Nieuw wachtwoord instellen"
5. Vul nieuw wachtwoord in
6. Verify je kan inloggen
```

#### 4.3 Test Change Email

```javascript
1. Log in op je account
2. Ga naar Settings/Profile
3. Klik "Update Profile"
4. Verander je email
5. Check BEIDE inboxen:
   - Oude email: bevestiging dat email verandert
   - Nieuwe email: bevestig nieuwe email
6. Klik link in nieuwe email inbox
7. Verify email is veranderd
```

---

### STAP 5: URL Configuration in Code

Je code ziet er al goed uit! Maar verify deze settings:

**In `src/lib/authContext.tsx`:**
```typescript
// ✅ CORRECT - Deze zijn al goed:
signUp: {
  emailRedirectTo: `${window.location.origin}/auth/callback`
}

resetPassword: {
  redirectTo: `${window.location.origin}/auth/callback`
}
```

**Verify in Supabase Dashboard → Authentication → URL Configuration:**
```
Site URL: https://quick-o.kikodehondt.be
Redirect URLs:
  - https://quick-o.kikodehondt.be/**
  - https://quick-o.kikodehondt.be/auth/callback
  - http://localhost:5173/**
```

---

### STAP 6: Email Template Variables Checken

**Alle templates MOETEN deze variabelen gebruiken:**

#### In `confirm-signup.html`:
```html
<a href="{{ .ConfirmationURL }}" class="cta-button">
  ✓ Bevestig mijn e-mailadres
</a>
<div class="code">{{ .TokenHash }}</div>
```

#### In `reset-password.html`:
```html
<a href="{{ .ConfirmationURL }}" class="cta-button">
  🔄 Nieuw wachtwoord instellen
</a>
```

#### In `change-email.html`:
```html
<a href="{{ .ConfirmationURL }}" class="cta-button">
  ✓ Bevestig mijn e-mailadres
</a>
<div class="code">{{ .TokenHash }}</div>
```

**Verify deze staan in je HTML files!**

---

## 🔍 Troubleshooting Guide

### Probleem: "Links doen niets"

**Diagnose:**
```
1. Open email in browser
2. Right-click op CTA button → "Copy link address"
3. Plak link in notepad
4. Check of link bevat:
   ✓ https://quick-o.kikodehondt.be
   ✓ #access_token=...
   ✓ &type=signup OF &type=recovery
```

**Mogelijke oorzaken:**
- ❌ Redirect URL niet toegevoegd in Supabase
- ❌ Template variabelen verkeerd
- ❌ Site URL verkeerd ingesteld

**Oplossing:**
```
1. Ga naar Supabase Dashboard
2. Authentication → URL Configuration
3. Add: https://quick-o.kikodehondt.be/**
4. Save
5. Test opnieuw
```

---

### Probleem: "Emails komen niet aan"

**Check deze dingen:**

**1. Supabase Logs:**
```
Dashboard → Logs → Auth Logs
→ Zoek naar "email"
→ Check voor errors
```

**2. SPAM folder:**
```
Gmail: Check "Promotions" en "Spam"
Outlook: Check "Junk"
```

**3. Email Rate Limits:**
```
Dashboard → Authentication → Settings
→ Check "Rate Limits"
→ Default: 60 emails/hour
```

**4. SMTP Status:**
```
Dashboard → Project Settings → Authentication
→ Scroll naar "SMTP Settings"
→ Verify "Status: Connected"
```

---

### Probleem: "Template ziet er kapot uit"

**Oorzaken:**
1. HTML niet volledig gekopieerd
2. Email client ondersteunt bepaalde CSS niet

**Test in verschillende clients:**
- ✓ Gmail (web)
- ✓ Gmail (app)
- ✓ Outlook (web)
- ✓ Apple Mail
- ✓ Outlook (desktop)

**Quick fix:**
```
1. Open HTML bestand opnieuw
2. Ctrl+A (select all)
3. Ctrl+C (copy)
4. Ga naar Supabase template editor
5. Ctrl+A (select all in Supabase)
6. Ctrl+V (paste)
7. Save
```

---

### Probleem: "Logo/Afbeeldingen worden niet geladen"

**Check image URLs in templates:**
```html
<!-- ✅ CORRECT: -->
<img src="https://pstldfuyzstudasfozft.supabase.co/storage/v1/object/public/bucket/Quick-O_logo.png">
<img src="https://pstldfuyzstudasfozft.supabase.co/storage/v1/object/public/bucket/kiko-dehondt.jpg">
```

**Upload images naar Supabase Storage:**
```
1. Dashboard → Storage
2. Create bucket: "public"
3. Upload: Quick-O_logo.png
4. Upload: kiko-dehondt.jpg
5. Set bucket to PUBLIC
6. Copy URLs
7. Update HTML templates met correcte URLs
```

---

## 🧪 Complete Test Procedure

### Test 1: Sign Up Flow
```bash
1. Open incognito window
2. Ga naar https://quick-o.kikodehondt.be
3. Klik "Account Maken"
4. Vul formulier in
5. Submit
6. ✓ Verify: Email ontvangen binnen 1 minuut
7. ✓ Verify: Email heeft Quick-O styling
8. ✓ Verify: "Bevestig mijn e-mailadres" button werkt
9. ✓ Verify: Je wordt doorgestuurd naar website
10. ✓ Verify: Je bent ingelogd
```

### Test 2: Password Reset
```bash
1. Log uit
2. Klik "Wachtwoord vergeten"
3. Vul email in
4. Submit
5. ✓ Verify: Email ontvangen binnen 1 minuut
6. ✓ Verify: "Nieuw wachtwoord instellen" button werkt
7. ✓ Verify: Je komt op reset pagina
8. ✓ Verify: Je kan nieuw wachtwoord instellen
9. ✓ Verify: Je kan inloggen met nieuw wachtwoord
```

### Test 3: Email Change
```bash
1. Log in
2. Ga naar Profile/Settings
3. Update email naar nieuw adres
4. ✓ Verify: Email ontvangen op OUDE adres
5. ✓ Verify: Email ontvangen op NIEUWE adres
6. ✓ Verify: Link in nieuwe email werkt
7. ✓ Verify: Email is geupdate in account
```

### Test 4: Mobile Test
```bash
1. Open email op mobiel (Gmail app)
2. ✓ Verify: Layout is responsive
3. ✓ Verify: Buttons zijn groot genoeg
4. ✓ Verify: Tekst is leesbaar
5. ✓ Verify: Links werken
```

---

## 📋 Checklist Before Going Live

### Pre-Launch Checklist:

**Email Templates:**
- [ ] Confirm signup HTML uploaded
- [ ] Reset password HTML uploaded
- [ ] Change email HTML uploaded
- [ ] Magic link/Reauthentication HTML uploaded
- [ ] All templates saved in Supabase

**Settings:**
- [ ] Email confirmations: ENABLED
- [ ] Password recovery: ENABLED
- [ ] Secure email change: ENABLED
- [ ] Site URL: https://quick-o.kikodehondt.be
- [ ] Redirect URLs include: /auth/callback and /**

**SMTP:**
- [ ] SMTP configured (built-in or custom)
- [ ] From email set
- [ ] Test email sent successfully

**Images:**
- [ ] Quick-O logo uploaded to Storage
- [ ] Profile photo uploaded to Storage
- [ ] Storage bucket is PUBLIC
- [ ] Image URLs updated in templates

**Testing:**
- [ ] Sign up flow tested
- [ ] Password reset tested
- [ ] Email change tested  
- [ ] Mobile email tested
- [ ] Gmail tested
- [ ] Outlook tested
- [ ] All links work

---

## 🚀 Quick Command Reference

### Test Email Locally (Development):

```bash
# Start dev server
npm run dev

# Open browser
http://localhost:5173

# Test signup
# Check terminal for Supabase logs
```

### Check Supabase Logs:

```bash
# In Supabase Dashboard:
→ Logs
→ Auth Logs
→ Filter: "email"

# Look for:
✓ "Email sent successfully"
✗ "Email delivery failed"
✗ "SMTP connection error"
```

### Force Re-send Email:

```javascript
// In browser console on your website:
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com'
})
console.log('Resend result:', data, error)
```

---

## 📞 Support Resources

### Supabase Documentation:
- Auth: https://supabase.com/docs/guides/auth
- Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates
- SMTP: https://supabase.com/docs/guides/auth/auth-smtp

### Testing Tools:
- Email client test: https://www.emailonacid.com/
- HTML validator: https://validator.w3.org/
- Gmail test: https://mail.google.com/

### Debug Tools:
```javascript
// Check current auth state:
const { data } = await supabase.auth.getSession()
console.log('Current session:', data)

// Check user:
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)

// Test email delivery:
const { error } = await supabase.auth.resetPasswordForEmail('test@email.com')
console.log('Email error:', error)
```

---

## 🎯 Success Criteria

**When everything works correctly:**

✅ New users receive signup confirmation email within 60 seconds  
✅ Email has Quick-O branding and looks professional  
✅ "Bevestig e-mailadres" button works and redirects correctly  
✅ Password reset emails arrive within 60 seconds  
✅ Reset links work and allow password change  
✅ Email change sends confirmations to both old and new address  
✅ All emails look good on mobile  
✅ No emails end up in spam  
✅ All links work correctly  
✅ Users can complete auth flows successfully  

---

**Als je alle stappen hebt gevolgd, werken je emails perfect! 🎉**

*Last updated: December 19, 2025*
