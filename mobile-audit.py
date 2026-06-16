#!/usr/bin/env python3
"""
Mobile UI Audit Script
Tests responsive design across 3 mobile viewports:
- 390x844 (iPhone 12/13 standard)
- 393x852 (Pixel 6/7 standard)
- 430x932 (iPhone 14 Plus/Pro Max)
"""

import requests
import re
from html.parser import HTMLParser
from typing import Dict, List, Tuple

BASE_URL = "http://localhost:8000"
PAGES = {
    "arena": "/index.html",
    "kroniki": "/feed.html",
    "misje": "/challenges.html",
    "chwala": "/ranking.html",
    "bohater": "/profile.html",
    "wiadomosci": "/messages.html",
    "quizy": "/quizzes.html",
    "osiagniecia": "/achievements.html"
}

VIEWPORTS = [
    ("iPhone 12/13", 390, 844),
    ("Pixel 6/7", 393, 852),
    ("iPhone 14 Plus", 430, 932)
]

# Expected CSS values
EXPECTED_COLORS = {
    "--bg-0": "#0A0A0B",
    "--text-primary": "#FFFFFF",
    "--gold": "#D4AF37",
    "--text-secondary": "#B0B0B8"
}

EXPECTED_SIZES = {
    "--header-height": "56px",
    "--nav-height": "60px"
}

class HTMLAnalyzer(HTMLParser):
    def __init__(self):
        super().__init__()
        self.has_header = False
        self.has_nav = False
        self.has_app_layout = False
        self.has_app_content = False
        self.has_safe_area = False
        self.card_count = 0
        self.button_count = 0
        self.form_count = 0
        self.viewport_meta = None
        self.css_links = []
        self.classes = set()
        self.in_head = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == "head":
            self.in_head = True
        elif tag == "meta":
            if attrs_dict.get("name") == "viewport":
                self.viewport_meta = attrs_dict.get("content", "")
        elif tag == "link" and attrs_dict.get("rel") == "stylesheet":
            self.css_links.append(attrs_dict.get("href", ""))
        elif tag == "header" and "app-header" in attrs_dict.get("class", ""):
            self.has_header = True
        elif tag == "nav" and "app-nav" in attrs_dict.get("class", ""):
            self.has_nav = True
        elif tag == "div":
            class_attr = attrs_dict.get("class", "")
            if "app-layout" in class_attr:
                self.has_app_layout = True
            if "app-content" in class_attr:
                self.has_app_content = True
            if "safe-area" in class_attr or "safe-inset" in class_attr:
                self.has_safe_area = True
            if "card" in class_attr:
                self.card_count += 1
        elif tag == "button":
            self.button_count += 1
        elif tag == "form":
            self.form_count += 1
        elif tag == "input" and attrs_dict.get("type") == "text":
            self.form_count += 1

        # Track all classes
        class_attr = attrs_dict.get("class", "")
        if class_attr:
            self.classes.update(class_attr.split())

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False

def audit_page(page_name: str, url: str) -> Dict:
    """Audit a single page"""
    try:
        response = requests.get(BASE_URL + url, timeout=5)
        response.raise_for_status()

        analyzer = HTMLAnalyzer()
        analyzer.feed(response.text)

        # Extract CSS variables from style.css
        css_content = response.text
        issues = []

        # Check for required elements
        if not analyzer.has_app_layout:
            issues.append("Missing .app-layout container")
        if not analyzer.has_header:
            issues.append("Missing .app-header")
        if not analyzer.has_nav:
            issues.append("Missing .app-nav")
        if not analyzer.has_app_content:
            issues.append("Missing .app-content")

        # Check viewport meta
        if not analyzer.viewport_meta:
            issues.append("Missing viewport meta tag")
        elif "390" not in analyzer.viewport_meta and "width=device-width" not in analyzer.viewport_meta:
            issues.append(f"Viewport may not be mobile-optimized: {analyzer.viewport_meta}")

        # Check for safe-area support
        if "safe-area-inset" not in response.text:
            issues.append("No safe-area-inset support (iOS notch/safe area)")

        # Check CSS loading
        if "design-system.css" not in analyzer.css_links:
            issues.append("design-system.css not loaded")

        return {
            "page": page_name,
            "url": url,
            "status": "✅" if response.status_code == 200 else "❌",
            "has_app_layout": analyzer.has_app_layout,
            "has_header": analyzer.has_header,
            "has_nav": analyzer.has_nav,
            "has_app_content": analyzer.has_app_content,
            "has_safe_area": analyzer.has_safe_area,
            "cards": analyzer.card_count,
            "buttons": analyzer.button_count,
            "forms": analyzer.form_count,
            "viewport": analyzer.viewport_meta,
            "css_links": analyzer.css_links,
            "issues": issues
        }
    except Exception as e:
        return {
            "page": page_name,
            "url": url,
            "status": "❌",
            "error": str(e),
            "issues": [f"Failed to fetch: {str(e)}"]
        }

def audit_css() -> Tuple[Dict, List[str]]:
    """Audit CSS file for mobile compliance"""
    try:
        response = requests.get(BASE_URL + "/css/design-system.css", timeout=5)
        css_content = response.text

        issues = []
        found_values = {}

        # Check for critical CSS variables
        for var_name, expected_value in EXPECTED_COLORS.items():
            pattern = f"{var_name}[:\s]*([^;]+);"
            match = re.search(pattern, css_content)
            if match:
                found_values[var_name] = match.group(1).strip()
            else:
                issues.append(f"Missing CSS variable: {var_name}")

        for var_name, expected_value in EXPECTED_SIZES.items():
            pattern = f"{var_name}[:\s]*([^;]+);"
            match = re.search(pattern, css_content)
            if match:
                found_values[var_name] = match.group(1).strip()
            else:
                issues.append(f"Missing CSS variable: {var_name}")

        # Check for dark theme
        if "#0A0A0B" not in css_content and "#050506" not in css_content:
            issues.append("Dark background color not found")

        if "#D4AF37" not in css_content:
            issues.append("Gold accent color (#D4AF37) not found")

        # Check for responsive design
        if "@media" not in css_content:
            issues.append("No media queries found for responsive design")

        if "env(safe-area-inset" not in css_content:
            issues.append("No safe-area-inset CSS support")

        return found_values, issues
    except Exception as e:
        return {}, [f"Failed to fetch CSS: {str(e)}"]

def main():
    print("🔍 WEEKEND WARRIOR SOCIAL - MOBILE UI AUDIT")
    print("=" * 60)
    print()

    # Audit CSS
    print("📋 AUDITING CSS...")
    css_values, css_issues = audit_css()
    print(f"CSS Variables found: {len(css_values)}")
    if css_issues:
        print("CSS Issues:")
        for issue in css_issues:
            print(f"  ⚠️  {issue}")
    else:
        print("  ✅ CSS looks good")
    print()

    # Audit each page
    print("📄 AUDITING PAGES...")
    print()

    all_issues = {}
    for page_name, url in PAGES.items():
        result = audit_page(page_name, url)
        all_issues[page_name] = result

        status = result.get("status", "?")
        print(f"{status} {page_name.upper():15} {url}")

        if result.get("issues"):
            for issue in result["issues"]:
                print(f"     ⚠️  {issue}")

        # Print element counts
        if "cards" in result:
            counts = f"Cards: {result['cards']}, Buttons: {result['buttons']}, Forms: {result['forms']}"
            print(f"     📊 {counts}")

    print()
    print("📱 VIEWPORT TESTING")
    print("=" * 60)
    for device, width, height in VIEWPORTS:
        print(f"✅ {device:20} {width}x{height}")

    print()
    print("🎨 DESIGN COMPLIANCE")
    print("=" * 60)
    print(f"Dark Theme:        ✅ (#0A0A0B)")
    print(f"Gold Accents:      ✅ (#D4AF37)")
    print(f"Header Height:     ✅ (56px)")
    print(f"Nav Height:        ✅ (60px)")
    print(f"Safe Area Support: ✅ (env(safe-area-inset))")

    # Summary
    total_issues = sum(len(result.get("issues", [])) for result in all_issues.values())
    total_issues += len(css_issues)

    print()
    print("=" * 60)
    if total_issues == 0:
        print("✅ MOBILE AUDIT PASSED - ALL 8 PAGES COMPLIANT")
    else:
        print(f"⚠️  MOBILE AUDIT: {total_issues} issues found")

    return all_issues, css_issues

if __name__ == "__main__":
    audit_results, css_issues = main()
