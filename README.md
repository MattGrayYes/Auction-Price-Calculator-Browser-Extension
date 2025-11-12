# Auction Price Calculator Browser Extension

A browser extension that automatically calculates the full price (including buyer's premium and VAT) for various auction websites.

## Currently Supported Sites

- **BidSpotter** (bidspotter.com, bidspotter.co.uk)
  - Buyer's Premium: 26%
  - VAT: 20%

## Installation

### Chrome/Edge/Brave

1. Open your browser and navigate to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

2. Enable "Developer mode" (toggle in the top right corner)

3. Click "Load unpacked"

4. Select the extension folder (the folder containing `manifest.json`)

5. The extension is now installed and will automatically run on supported sites

### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`

2. Click "Load Temporary Add-on"

3. Navigate to the extension folder and select the `manifest.json` file

4. The extension will be loaded temporarily (until you restart Firefox)

## How It Works

When you visit a supported auction site, the extension:
1. Finds the current bid price in the page
2. Calculates the full price including buyer's premium and VAT
3. Displays the calculated price in green next to the current bid

The calculated price updates automatically when the bid changes.

## Adding Support for New Auction Sites

To add a new auction site:

1. Copy `sites/_template.js` to a new file (e.g., `sites/example-auction.js`)

2. Update the configuration:
   ```javascript
   const config = {
       buyersPremium: 1.25,  // e.g., 25% = 1.25
       vat: 1.20,             // e.g., 20% = 1.20
       selectors: {
           amount: '.bid-amount',      // CSS selector for bid amount
           currency: '.currency',       // CSS selector for currency (optional)
           container: '.bid-container'  // CSS selector where to insert the price
       }
   };
   ```

3. Add the new site to `manifest.json`:
   ```json
   {
     "matches": ["*://*.example-auction.com/*"],
     "js": ["sites/example-auction.js"],
     "run_at": "document_idle"
   }
   ```

4. Reload the extension in your browser

### Finding CSS Selectors

1. Visit the auction site
2. Right-click on the bid amount and select "Inspect"
3. In the developer tools, right-click the highlighted element
4. Select "Copy" → "Copy selector" to get the CSS selector

## Project Structure

```
.
├── manifest.json              # Extension configuration
├── sites/
│   ├── bidspotter.js         # BidSpotter.com implementation
│   └── _template.js          # Template for new sites
└── README.md                 # This file
```

## Notes

- The extension requires no special permissions
- All calculations are done locally in your browser
- The extension uses MutationObserver to detect bid updates automatically
- If the calculated price doesn't appear, check the browser console for error messages

## Troubleshooting

If the price doesn't appear:

1. Open the browser console (F12 → Console tab)
2. Look for messages starting with "Auction Price Calculator:"
3. The message will indicate which element couldn't be found
4. Adjust the CSS selectors in the site-specific file accordingly

## Future Enhancements

- Add an options page to customize buyer's premium and VAT rates per site
- Support for different currencies
- Popup showing all current prices on the page
- Export/import configuration
