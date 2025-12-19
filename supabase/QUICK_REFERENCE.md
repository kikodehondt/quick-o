# 🎯 Email Templates Quick Reference Card

## 📋 Template Files

```
supabase/templates/emails/
├── ✅ confirm-signup.html (3.8 KB)
├── 📧 change-email.html (4.2 KB)
├── 🔑 reset-password.html (4.8 KB)
└── 🔐 reauthentication.html (5.1 KB)
```

---

## ⚡ 5-Minute Setup

### 1. Open Supabase
```
Dashboard → Authentication → Email Templates
```

### 2. For Each Template
```
✓ Click on template type
✓ Remove default content
✓ Paste HTML content
✓ Click Save
```

### Mapping
| Template | File | Supabase |
|----------|------|----------|
| ✅ Confirm Sign-Up | `confirm-signup.html` | Confirm sign-up |
| 📧 Change Email | `change-email.html` | Change email |
| 🔑 Reset Password | `reset-password.html` | Reset password |
| 🔐 Reauthentication | `reauthentication.html` | Reauthentication |

### 3. Test
```
✓ Create account → Check email
✓ Change email → Check email
✓ Reset password → Check email
✓ Verify on mobile
```

---

## 🎨 Template Overview

### ✅ Confirm Sign-Up
- **Purpose**: Welcome new users
- **Design**: Blue gradient, spinning logo
- **Key Element**: Benefits list with checkmarks
- **CTA**: "Bevestig mijn e-mailadres"
- **Animations**: Spin, slide, fade-in, float

### 📧 Change Email
- **Purpose**: Verify new email
- **Design**: Cyan gradient, floating particles
- **Key Element**: Security assurance box
- **CTA**: "Bevestig e-mailadres"
- **Animations**: Float, bounce, scale

### 🔑 Reset Password
- **Purpose**: Password recovery
- **Design**: Blue gradient, floating shapes
- **Key Element**: 24-hour timer, security notice
- **CTA**: "🔓 Wachtwoord Opnieuw Instellen"
- **Animations**: Pulse, float, tick-tock timer

### 🔐 Reauthentication
- **Purpose**: Verify identity
- **Design**: Blue gradient, animated bubbles
- **Key Element**: Green security badge
- **CTA**: "✓ Dit ben ik — Aanvaard"
- **Animations**: Bubble float, spin, pulse

---

## 🎨 Colors Used

```
Primary Blue        #0ea5e9   (Sky blue)
Secondary Blue      #0284c7   (Ocean blue)
Cyan/Turquoise      #06b6d4   (Modern cyan)
Navy Blue           #0369a1   (Deep blue)
Success Green       #22c55e   (Checkmarks)
Warning Yellow      #f59e0b   (Alerts)
Text Gray           #64748b   (Body text)
Light Gray          #e2e8f0   (Borders)
```

---

## ✨ Animation Types

| Animation | Used In | Effect |
|-----------|---------|--------|
| Spin | Confirm, Reauthentication | 360° logo rotation |
| Float | Change Email, Reset | Smooth drifting motion |
| Bounce | Change Email | Up-down movement |
| Pulse | All | Glowing/pulsing effect |
| Fade-in | All | Smooth appearance |
| Slide | All | Directional entrance |
| Scale | All | Size transitions |
| Glide | Reset | Smooth motion |

---

## 📱 Responsive Breakpoints

```
Desktop:  600px+  → Full width layout
Tablet:   601px   → Optimized padding
Mobile:   <600px  → Stacked layout
```

---

## 🔗 Template Variables

```
{{ .ConfirmationURL }}  → Action link
{{ .TokenHash }}        → Verification code
{{ .SiteURL }}          → Your website URL
{{ .Email }}            → User's email
```

**Don't modify!** Supabase fills these automatically.

---

## 📧 Quick Features Checklist

- [x] Quick-O logo included
- [x] Animated backgrounds
- [x] Fully responsive
- [x] Mobile optimized
- [x] Verification codes provided
- [x] Security messaging
- [x] Social links
- [x] Professional footer
- [x] Hover effects
- [x] Dutch language
- [x] Gradient backgrounds
- [x] Multiple animations
- [x] Color consistent
- [x] Accessible

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Logo not showing | Check Supabase storage is public |
| Links don't work | Verify your Supabase URL |
| Mobile layout broken | Test in actual mobile app |
| Animations not showing | Some email clients don't support CSS animation |
| Text too small | Mobile email client or old version |

---

## 📚 Documentation Files

| File | Read Time | Best For |
|------|-----------|----------|
| SETUP_QUICK_START.md | 2 min | Quick setup |
| emails/README.md | 15 min | Full details |
| VISUAL_PREVIEW.md | 10 min | Visual guide |
| TEMPLATES_SUMMARY.md | 5 min | Overview |
| INDEX.md | 3 min | Navigation |

---

## 🎯 Common Tasks

### Change Colors
Find in each file:
```
#0ea5e9 → Your primary color
#0284c7 → Your secondary color
#06b6d4 → Your accent color
```

### Change Text
Search for:
```
Quick-O          → Your brand name
quick-o.de...    → Your website
Kiko Dehondt     → Your name
```

### Update Logo URL
Find:
```
https://pstldfuyzstudasfozft.supabase.co/storage/v1/object/public/bucket/Quick-O_logo.png
```
Replace with your logo URL.

### Adjust Animation Speed
Change values like:
```
animation: spin 4s linear infinite;
          ↑ duration here (4s)

animation-delay: 0.3s;
                 ↑ delay here
```

---

## ✅ Deployment Checklist

```
Pre-Launch
□ Read SETUP_QUICK_START.md
□ Copy all 4 templates to Supabase
□ Test on desktop
□ Test on mobile
□ Verify all links work
□ Check logo loads
□ Verify emails are in Dutch (or translated)

Launch
□ Deploy to production
□ Monitor first few emails
□ Check bounce rate
□ Ask users for feedback

Post-Launch
□ Monitor engagement metrics
□ Check for email client issues
□ Plan customizations if needed
□ Keep documentation handy
```

---

## 📊 File Size Reference

```
confirm-signup.html       ~3.8 KB
change-email.html         ~4.2 KB
reset-password.html       ~4.8 KB
reauthentication.html     ~5.1 KB
─────────────────────────────────
Total                    ~18 KB

All files fully self-contained
(CSS included, no external dependencies)
```

---

## 🌐 Email Client Support

✅ Gmail  
✅ Gmail Mobile App  
✅ Outlook  
✅ Outlook Mobile  
✅ Apple Mail  
✅ Apple Mail Mobile  
✅ Yahoo Mail  
✅ ProtonMail  
✅ Thunderbird  

---

## 🔒 Security Notes

- No tracking pixels
- No external scripts
- Secure template variables
- No password requests
- Security warnings included
- Clear verification processes

---

## 💡 Pro Tips

1. **Always test first** with your own account
2. **Test on mobile** - different apps display differently
3. **Use real links** - Supabase variables are better than hardcoding
4. **Monitor delivery** - Check for bounces and issues
5. **Keep backups** - Save your customized versions
6. **Test frequently** - Especially if you customize

---

## 🚀 Next Steps

1. **Choose your path:**
   - Rush? → SETUP_QUICK_START.md
   - Full details? → emails/README.md
   - Want visuals? → VISUAL_PREVIEW.md

2. **Copy templates to Supabase**

3. **Test everything**

4. **Deploy with confidence!**

---

## 📞 Quick Help

**"How do I set this up?"**
→ See SETUP_QUICK_START.md

**"How do I customize it?"**
→ See emails/README.md (Customization Guide section)

**"What does it look like?"**
→ See VISUAL_PREVIEW.md

**"Tell me everything"**
→ See emails/README.md

**"I'm lost, help!"**
→ Start with INDEX.md

---

**You've got this! 💙 Start with the quickstart guide →**