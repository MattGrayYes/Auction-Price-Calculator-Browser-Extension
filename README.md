# Auction Price Calculator Browser Extension

A browser extension that automatically calculates the full price (including buyer's premium and VAT) for auction websites.
The extension is designed to work across multiple auction sites.

* Add to Chrome: [Auction Price Calculator Chrome Extension](https://chromewebstore.google.com/detail/auction-price-calculator/jobmbfcaagopgnlbkgdaejokamgedkhf)
* Add to Firefox: [Auction Price Calculator Firefox Extension](https://addons.mozilla.org/en-GB/firefox/addon/auction-price-calculator/) (awaiting review)

This project has been entirely vibecoded with Github Copilot + Claude Sonnet 4.5, because I wanted a quick solution.

## Features

- **Extensible Architecture**: Easy to add support for new auction sites
- **Privacy-focused**: No permissions required, all calculations done locally

## Currently Supported Sites

### BidSpotter
- Individual listing pages with live bid updates
- Search results pages with multiple lots
- Automatic fee detection from auction catalogues
- Fallback to default rates when fees cant be found
- **Default Rates**: 20% buyer's premium + 20% VAT

## Installation

### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Navigate to the extension folder and select `manifest.json`
5. The extension will be loaded temporarily (until browser restart)

### Chrome/Edge
1. Download or clone this repository
2. Open your browser and navigate to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
3. Enable **Developer mode** (toggle in the top right corner)
4. Click **Load unpacked**
5. Select the extension folder (containing `manifest.json`)
6. The extension will now run automatically on supported sites


## Adding Support for New Auction Sites

### 1. Create a Site-Specific Script

Copy the template and customize it:

```bash
cp sites/_template.js sites/yoursite.js
```

Edit `sites/yoursite.js`:

```javascript
const config = {
    buyersPremiumPercent: 25,  // e.g., 25%
    vatPercent: 20,            // e.g., 20%
    selectors: {
        amount: '.bid-amount strong',      // CSS selector for bid amount
        currency: '.currency-symbol',      // CSS selector for currency (optional)
        container: '.bid-container'        // Where to insert calculated price
    }
};
```

### 2. Update the Manifest

Add the new site to `manifest.json`:

```json
{
  "matches": ["*://*.yoursite.com/*"],
  "js": ["sites/yoursite.js"],
  "run_at": "document_idle"
}
```

### 3. Test and Reload

1. Reload the extension in your browser
2. Visit the auction site
3. Check browser console for any errors

### Finding CSS Selectors

1. Visit the auction site
2. Right-click on the bid amount → **Inspect**
3. In DevTools, right-click the highlighted element
4. Select **Copy** → **Copy selector**
5. Use this selector in your configuration

# Credits
Icon: [Gavel by pexel verse from Noun Project](https://thenounproject.com/icon/gavel-7672030/) (CC BY 3.0)
