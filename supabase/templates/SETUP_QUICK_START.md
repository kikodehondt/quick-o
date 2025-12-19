# 🚀 Quick Setup Guide - Supabase Email Templates

## ⚡ 5-Minute Setup

### 1️⃣ Open Supabase Dashboard
- Go to your Supabase project
- Click **Authentication** in the left sidebar
- Select **Email Templates**

### 2️⃣ Copy-Paste Templates

For each email type below:

```
confirm-signup.html → Confirm sign-up
change-email.html → Change email
reset-password.html → Reset password
reauthentication.html → Reauthentication
```

Click on each, **remove the default template**, paste the new one, and **Save**.

### 3️⃣ That's It! 🎉

Your email templates are now live!

---

## 🧪 Test Your Setup

### Create a Test Account
1. Go to your Quick-O website
2. Click "Sign Up"
3. Enter a test email address
4. Check your inbox for the confirmation email

### Check The Email
- ✓ Layout looks good?
- ✓ Logo appears?
- ✓ Link works?
- ✓ Colors match Quick-O branding?

---

## 🎨 Each Template Has:

| Feature | Status |
|---------|--------|
| Quick-O Logo | ✅ Animated |
| Gradient Background | ✅ Moving/Animated |
| Responsive Design | ✅ Mobile-friendly |
| Interactive Buttons | ✅ Hover effects |
| Verification Code | ✅ Fallback provided |
| Security Information | ✅ Included |
| Dutch Language | ✅ Fully Dutch |
| Professional Design | ✅ Premium look |

---

## 📧 What's Included

```
supabase/templates/emails/
├── confirm-signup.html      ← Sign-up verification
├── change-email.html        ← Email change verification
├── reset-password.html      ← Password reset
├── reauthentication.html    ← Account security verification
└── README.md                ← Full documentation
```

---

## 🎯 Template Features Summary

### Confirm Sign-Up
- Welcome message
- Benefits list
- Feature highlights
- 24-hour expiration notice

### Change Email
- Information about the change
- Security assurance
- Verification code as fallback
- Clear instructions

### Reset Password
- Security notice
- Warning about unauthorized requests
- 24-hour timer
- Best practice tips

### Reauthentication
- Security badge
- Account protection emphasis
- Activity explanation
- Multiple verification methods

---

## 🔗 Template Variables Used

All templates use these Supabase variables (automatically filled):

| Variable | Purpose |
|----------|---------|
| `{{ .ConfirmationURL }}` | The action/verification link |
| `{{ .TokenHash }}` | Code for manual entry |
| `{{ .SiteURL }}` | Your website URL |
| `{{ .Email }}` | User's email address |

**Don't modify these!** Supabase handles them automatically.

---

## 💡 Pro Tips

1. **Test First** → Send yourself a test before rolling out
2. **Mobile Test** → Open on your phone to verify layout
3. **Check Links** → Make sure the confirmation link works
4. **Monitor Emails** → Check Supabase logs for delivery issues

---

## ❓ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Images not showing | Check Supabase storage is public |
| Links broken | Verify Supabase URL in project settings |
| Text looks strange | Some email clients don't support all CSS |
| Mobile layout broken | Test in actual mobile email app |

---

## 📞 Need Help?

- **Supabase Docs:** https://supabase.com/docs/guides/auth/auth-email-templates
- **Quick-O Website:** https://quick-o.kikodehondt.be
- **Email Tester:** https://www.emailonacid.com/

---

**That's it! Your beautiful email templates are ready to impress your users! 🎉**