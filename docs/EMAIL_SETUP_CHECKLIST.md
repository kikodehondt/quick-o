# 🎯 EMAIL SETUP QUICK REFERENCE

## 📋 Checklist (Print Deze!)

```
STAP 1: TEMPLATES UPLOADEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Open Supabase Dashboard
☐ Ga naar: Authentication → Email Templates

☐ Upload confirm-signup.html → "Confirm signup"
☐ Upload change-email.html → "Change Email"  
☐ Upload reset-password.html → "Reset password"
☐ Upload reauthentication.html → "Magic Link"

Voor elk template:
  1. Klik template naam
  2. Ctrl+A (select all)
  3. Delete
  4. Paste nieuwe HTML
  5. Save
  6. Zie groen "Template updated" bericht

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


STAP 2: AUTHENTICATION SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Ga naar: Authentication → Settings

Zet DEZE AAN:
☐ Enable email confirmations: ✓ ON
☐ Secure email change: ✓ ON
☐ Enable password recovery: ✓ ON

☐ Site URL: https://quick-o.kikodehondt.be

☐ Redirect URLs (voeg toe):
   • https://quick-o.kikodehondt.be/**
   • https://quick-o.kikodehondt.be/auth/callback
   • http://localhost:5173/**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


STAP 3: SMTP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Ga naar: Project Settings → Authentication

Kies één:
☐ Optie A: Enable Custom SMTP: OFF (gebruik built-in)
☐ Optie B: Configureer eigen SMTP

Test:
☐ Verstuur test email vanuit Supabase
☐ Ontvang test email binnen 1 minuut

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


STAP 4: TEST EMAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Test 1: Signup
   1. Open quick-o.kikodehondt.be
   2. Maak account met je email
   3. Check inbox (+ SPAM!)
   4. Klik "Bevestig e-mailadres"
   5. Verify redirect werkt

☐ Test 2: Password Reset
   1. Klik "Wachtwoord vergeten"
   2. Vul email in
   3. Check inbox
   4. Klik "Nieuw wachtwoord instellen"
   5. Stel nieuw wachtwoord in

☐ Test 3: Mobile
   1. Open email op telefoon
   2. Check layout
   3. Test links

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🚨 Troubleshooting

### Probleem: Links doen niets
```
FIX:
1. Check Supabase → Authentication → URL Configuration
2. Verify redirect URLs include:
   • https://quick-o.kikodehondt.be/**
3. Save en test opnieuw
```

### Probleem: Emails komen niet aan
```
CHECK:
1. Supabase → Logs → Filter "email"
2. Check SPAM folder
3. Check SMTP status (moet "Connected" zijn)
4. Test met andere email provider
```

### Probleem: Template ziet er kapot uit
```
FIX:
1. Open HTML file opnieuw
2. Ctrl+A → Ctrl+C (copy ALL)
3. Ga naar Supabase template
4. Ctrl+A → Ctrl+V (overwrite ALL)
5. Save
```

## 📧 Email Template Locaties

```
PROJECT ROOT
└── supabase/
    └── templates/
        └── emails/
            ├── confirm-signup.html      ← Signup confirmation
            ├── change-email.html        ← Email change
            ├── reset-password.html      ← Password reset
            └── reauthentication.html    ← Magic link
```

## 🔗 Belangrijke URLs

```
Supabase Dashboard:
→ https://app.supabase.com

Je Website:
→ https://quick-o.kikodehondt.be

Development:
→ http://localhost:5173
```

## 🎯 Success Criteria

**Als alles werkt:**
- ✅ Signup email binnen 60 seconden
- ✅ Email heeft Quick-O logo en styling
- ✅ "Bevestig e-mailadres" button werkt
- ✅ Redirect naar website werkt
- ✅ Password reset emails werken
- ✅ Email change werkt
- ✅ Alles ziet er goed uit op mobiel

## 🆘 Quick Help

**Supabase Docs:**
https://supabase.com/docs/guides/auth/auth-email-templates

**Debug in Browser Console:**
```javascript
// Check session
const { data } = await supabase.auth.getSession()
console.log(data)

// Force resend email
await supabase.auth.resend({
  type: 'signup',
  email: 'your-email@gmail.com'
})
```

## 📞 Files Om Te Openen

1. **Complete Guide:** `SUPABASE_EMAIL_SETUP_COMPLETE.md`
2. **Diagnostics Tool:** `email-diagnostics.html` (open in browser)
3. **Email Templates:** `supabase/templates/emails/*.html`

---

**Print deze pagina en vink af terwijl je werkt! ✓**
