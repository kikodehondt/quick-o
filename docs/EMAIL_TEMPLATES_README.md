# 📧 Quick-O Supabase Email Templates

Beautiful, animated, and fully branded email templates for Supabase authentication. These templates are meticulously designed with the Quick-O branding to provide a premium user experience during the authentication journey.

## 🎨 Features

- **Fully Responsive Design** — Works perfectly on mobile, tablet, and desktop
- **Smooth Animations** — Engaging CSS animations and transitions
- **Moving Backgrounds** — Dynamic animated backgrounds on each email
- **Quick-O Branding** — Full brand consistency with the Quick-O website
- **Official Logo** — High-quality Quick-O logo with animations
- **Dark Gradient Backgrounds** — Beautiful gradient combinations unique to each email
- **Interactive Elements** — Hover effects and visual feedback
- **Accessibility** — Proper contrast ratios and readable fonts
- **Security Focused** — Clear security information and warnings where appropriate

## 📝 Email Templates Included

### 1. **Confirm Sign-Up** (`confirm-signup.html`)
Sent when a user registers for a new account.
- Animated floating shapes in the background
- Features list highlighting Quick-O benefits
- Clear call-to-action button with verification code fallback
- Welcome message with best practices

**Key Features:**
- Spinning logo animation
- Gradient background with particle effects
- Benefit icons with checkmarks
- 24-hour expiration notice

---

### 2. **Change Email Address** (`change-email.html`)
Sent when a user wants to verify a new email address.
- Animated particle background with moving elements
- Information box explaining the change process
- Clear security information
- Dual verification options (button + code)

**Key Features:**
- Animated floating particles
- Cyan/turquoise color scheme
- Important security note highlighted in yellow
- Code section with hover effects

---

### 3. **Reset Password** (`reset-password.html`)
Sent when a user requests a password reset.
- Elegant floating shape animations
- Alert box with security notice
- 24-hour countdown timer visualization
- Action notes and security tips

**Key Features:**
- Animated floating shapes with staggered timing
- 24-hour timer with glowing effect
- Security-focused design
- Green success indicators
- Warning box for unauthorized requests

---

### 4. **Reauthentication** (`reauthentication.html`)
Sent when unusual account activity is detected.
- Beautiful bubble animation effects
- Security badge highlighting protection measures
- Clear identity verification messaging
- Responsive action links

**Key Features:**
- Animated bubbles floating around the header
- Security-focused green badge
- Yellow info box with important details
- Multiple verification methods
- Account security emphasis

---

## 🚀 Setup Instructions

### Prerequisites
- Supabase account with a project
- Access to your Supabase project settings
- These HTML template files

### Step 1: Access Supabase Email Templates

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. You'll see the following email types:
   - Confirm Sign-up
   - Change Email
   - Reset Password
   - Reauthentication (or Magic Link if using passwordless)

### Step 2: Configure Each Template

#### For Confirm Sign-Up:
1. Click on **Confirm sign-up**
2. Paste the entire content from `confirm-signup.html` into the template editor
3. Click **Save**

#### For Change Email:
1. Click on **Change email**
2. Paste the entire content from `change-email.html` into the template editor
3. Click **Save**

#### For Reset Password:
1. Click on **Reset password**
2. Paste the entire content from `reset-password.html` into the template editor
3. Click **Save**

#### For Reauthentication:
1. Click on **Reauthentication** (or Magic Link depending on your setup)
2. Paste the entire content from `reauthentication.html` into the template editor
3. Click **Save**

### Step 3: Verify Template Variables

All templates use Supabase template variables:
- `{{ .ConfirmationURL }}` — The verification/action link
- `{{ .TokenHash }}` — The token code for manual entry
- `{{ .SiteURL }}` — Your application's URL
- `{{ .Email }}` — The user's email address

These are automatically populated by Supabase.

### Step 4: Test Your Templates

1. Create a test account or trigger each authentication action
2. Check your email inbox
3. Verify:
   - ✓ All animations display correctly
   - ✓ Links work properly
   - ✓ Images load (especially the Quick-O logo)
   - ✓ Mobile responsiveness
   - ✓ Email client compatibility

### Step 5: Email Client Testing

Test across different email clients:
- Gmail
- Outlook
- Apple Mail
- Mobile (Gmail app, Apple Mail app, Outlook app)

## 🎯 Design Highlights

### Color Palette
- **Primary Blue**: `#0ea5e9` (Sky blue)
- **Dark Blue**: `#0284c7` (Ocean blue)
- **Teal/Cyan**: `#06b6d4` (Modern cyan)
- **Navy**: `#0369a1` (Deep blue)
- **Accent Green**: `#22c55e` (Success green)
- **Warning Yellow**: `#f59e0b` (Alert yellow)
- **Neutral Gray**: `#64748b` (Text color)

### Typography
- **Headers**: Bold, large font sizes (26-34px)
- **Body**: Readable sans-serif (14-18px)
- **Code**: Monospace font for verification codes
- **Line Height**: 1.6-1.85 for comfortable reading

### Animations
1. **Fade In** — Elements appear smoothly
2. **Slide Down/Up/Left/Right** — Direction-specific entrances
3. **Bounce** — Gentle bouncing logo animation
4. **Float** — Smooth floating background elements
5. **Spin** — Rotating animations for logos
6. **Scale** — Size-based transitions
7. **Pop In** — Quick entrance animation
8. **Gradient Shift** — Smooth color transitions

### Responsive Design
- **Desktop**: Full width with proper spacing
- **Tablet**: Optimized padding and font sizes
- **Mobile**: Stacked layout with touch-friendly buttons

## 📱 Mobile Optimization

All templates include:
- Mobile-first responsive design
- Touch-friendly button sizes (44x44px minimum)
- Readable font sizes on small screens
- Simplified layouts for mobile
- Media queries for screens < 600px

## 🔒 Security Features

- **SSL/TLS Ready** — All links are HTTPS
- **No Tracking Pixels** — Clean email without tracking
- **Secure Link Variables** — Using Supabase's secure variables
- **Clear Security Notices** — Warnings for suspicious activity
- **Password Safety** — Never requests passwords via email

## 🎨 Customization Guide

### Changing Colors

Find and replace in all templates:
- `#0ea5e9` → Your primary color
- `#0284c7` → Your secondary color
- `#06b6d4` → Your accent color
- `#22c55e` → Your success color
- `#f59e0b` → Your warning color

### Changing Font

Replace in the `font-family` declarations:
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

### Updating Logo URL

Find and replace the logo URLs (currently):
```
https://pstldfuyzstudasfozft.supabase.co/storage/v1/object/public/bucket/Quick-O_logo.png
```

Replace with your own logo URL (keep the Supabase URL or upload to your own CDN).

### Adjusting Animation Speed

In the `@keyframes` and `animation` properties:
- `animation: fadeIn 1s ease-out` → Change `1s` to your desired duration
- `animation-delay: 0.3s` → Adjust delay timing

### Modifying Text Content

Simply find and replace:
- `Quick-O` → Your brand name
- `quick-o.kikodehondt.be` → Your website URL
- Contact information and social links

## 📧 Email Provider Compatibility

### Supported Email Clients
- ✅ Gmail
- ✅ Outlook
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Mobile email clients
- ✅ Thunderbird

### CSS Support
- Inline styles (primary method)
- Limited CSS3 support
- Fallbacks for unsupported features
- Vendor prefixes included

## 🐛 Troubleshooting

### Images Not Loading
1. Check the logo URL is accessible
2. Ensure your Supabase storage is public
3. Try a different CDN if needed

### Animations Not Showing
- Some email clients don't support CSS animations
- Fallback static designs are included
- This is normal and expected

### Links Not Working
1. Verify `{{ .ConfirmationURL }}` variable is correct
2. Test in a real email (not preview)
3. Check your Supabase URL configuration

### Mobile Layout Issues
1. Use a mobile device or responsive checker
2. Test in Gmail mobile app
3. Verify media queries are working

### Font Sizes Too Large/Small
1. Adjust font-size values in CSS
2. Keep readability in mind (minimum 14px for body)
3. Test on actual email clients

## 📊 Email Metrics

Monitor in your email service:
- **Open Rate** — Typically 20-40% for transactional emails
- **Click Rate** — 2-5% is normal
- **Bounce Rate** — Should be <1%
- **Unsubscribe Rate** — Transactional emails typically have 0%

## 🔍 Best Practices

1. **Always Test** — Send to yourself first
2. **Use Real Accounts** — Test with actual Supabase flows
3. **Check Multiple Clients** — Not all clients support all CSS
4. **Monitor Deliverability** — Use Supabase logs
5. **Keep Links Fresh** — Never hardcode URLs
6. **Use Template Variables** — Always use Supabase variables for dynamic content

## 📋 Checklist Before Going Live

- [ ] All four templates are configured in Supabase
- [ ] Tested on at least 2 different email clients (Gmail + 1 other)
- [ ] Mobile layout looks good on a real phone
- [ ] All links work correctly
- [ ] Logo loads without issues
- [ ] Text is readable and professional
- [ ] Animations don't distract from the message
- [ ] No spelling or grammar errors
- [ ] Contact information is accurate
- [ ] Brand colors are consistent

## 🤝 Support & Feedback

For issues or customization help:
1. Check the Supabase documentation: https://supabase.com/docs/guides/auth/auth-email-templates
2. Visit Quick-O website: https://quick-o.kikodehondt.be
3. Contact: Contact form on Quick-O website

## 📄 License

These email templates are created for Quick-O and are provided as-is. Feel free to customize them for your needs.

---

## 📚 Additional Resources

### Supabase Documentation
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Auth Setup](https://supabase.com/docs/guides/auth)

### Email Best Practices
- [Email Client CSS Support](https://www.campaignmonitor.com/css/)
- [MJML Framework](https://mjml.io/) (Alternative templating approach)
- [Email on Acid](https://www.emailonacid.com/) (Email testing)

### Quick-O Resources
- Website: https://quick-o.kikodehondt.be
- GitHub: https://github.com/kikodehondt
- LinkedIn: https://linkedin.com/in/kiko-dehondt

---

**Created with ❤️ for Quick-O**
*Beautiful emails for a beautiful learning experience.*