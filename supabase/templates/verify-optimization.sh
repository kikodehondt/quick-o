#!/bin/bash
# EMAIL TEMPLATES OPTIMIZATION - VERIFICATION SCRIPT
# This script verifies that all email templates have been optimized

echo "🔍 Email Templates Optimization Verification"
echo "=============================================="
echo ""

# Define template files
TEMPLATES=(
    "confirm-signup.html"
    "reset-password.html"
    "change-email.html"
    "reauthentication.html"
    "email-changed.html"
    "password-changed.html"
)

TEMPLATE_DIR="supabase/templates/emails"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "✅ CHECKING FOR OPTIMIZATIONS IN ALL TEMPLATES"
echo ""

# Check for external URLs (bad - should not exist)
external_count=0
base64_count=0
unified_footer_count=0

for template in "${TEMPLATES[@]}"; do
    if [ -f "$TEMPLATE_DIR/$template" ]; then
        echo "📧 Checking: $template"
        
        # Check for external URLs (should be NONE)
        external_urls=$(grep -c "pstldfuyzstudasfozft.supabase.co" "$TEMPLATE_DIR/$template" || echo "0")
        if [ "$external_urls" -gt 0 ]; then
            echo -e "${RED}   ❌ Found $external_urls external URLs (NOT OPTIMIZED)${NC}"
            external_count=$((external_count + 1))
        else
            echo -e "${GREEN}   ✅ No external URLs found${NC}"
        fi
        
        # Check for base64 SVG (should be present)
        base64_present=$(grep -c "data:image/svg+xml;base64" "$TEMPLATE_DIR/$template" || echo "0")
        if [ "$base64_present" -gt 0 ]; then
            echo -e "${GREEN}   ✅ Base64 SVG logo found ($base64_present instances)${NC}"
            base64_count=$((base64_count + 1))
        else
            echo -e "${RED}   ❌ Base64 SVG logo NOT found${NC}"
        fi
        
        # Check for unified footer (should have email-footer div)
        footer_present=$(grep -c "email-footer" "$TEMPLATE_DIR/$template" || echo "0")
        if [ "$footer_present" -gt 0 ]; then
            echo -e "${GREEN}   ✅ Unified footer structure found${NC}"
            unified_footer_count=$((unified_footer_count + 1))
        else
            echo -e "${RED}   ❌ Unified footer NOT found${NC}"
        fi
        
        echo ""
    else
        echo -e "${RED}❌ $template NOT FOUND${NC}"
    fi
done

echo "=============================================="
echo ""
echo "📊 OPTIMIZATION RESULTS:"
echo ""
echo "External URLs found: ${RED}$external_count${NC} (should be 0)"
echo "Base64 SVG logos: ${GREEN}$base64_count${NC}/6"
echo "Unified footers: ${GREEN}$unified_footer_count${NC}/6"
echo ""

if [ "$external_count" -eq 0 ] && [ "$base64_count" -eq 6 ] && [ "$unified_footer_count" -eq 6 ]; then
    echo -e "${GREEN}✅ ALL TEMPLATES ARE OPTIMIZED!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Deploy to Supabase Dashboard"
    echo "2. Test email flows (signup, password reset, etc.)"
    echo "3. Verify in multiple email clients"
    exit 0
else
    echo -e "${RED}⚠️  SOME TEMPLATES NEED ATTENTION${NC}"
    echo ""
    echo "Issues found:"
    if [ "$external_count" -gt 0 ]; then
        echo "- $external_count template(s) still have external URLs"
    fi
    if [ "$base64_count" -lt 6 ]; then
        echo "- $((6 - base64_count)) template(s) missing base64 SVG"
    fi
    if [ "$unified_footer_count" -lt 6 ]; then
        echo "- $((6 - unified_footer_count)) template(s) missing unified footer"
    fi
    exit 1
fi
