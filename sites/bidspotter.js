/*
 * BidSpotter.co.uk Auction Calculator
 * 
 * Calculates and displays total auction prices (hammer price + buyer's premium + VAT)
 * inline next to existing prices on BidSpotter.co.uk.
 * 
 * DETECTION & BEHAVIOR:
 * 
 * check if the page has a catalogue header and extract fees from there
 * If that fails, try to fetch info from the additional fees link's data-url
 * 
*/

(function() {
    'use strict';
    
    // Configuration for BidSpotter
    const config = {
        // Default values (fallback if extraction fails)
        buyersPremiumPercent: 20,  
        vatPercent: 20,            
        
        // Price types to process - works for both search results and individual listing pages
        priceTypes: {
            searchResults: [
                { id: 'current-price', selector: '.current-price', priceSelector: 'span[id^="price-"] strong', label: 'Current bid' },
                { id: 'minbidprice', selector: '.minBidPrice', priceSelector: 'span[id^="minBidPrice-"] span', label: 'MinBid' },
                { id: 'buyitnowprice', selector: '.buyItNowPrice', priceSelector: 'span[id^="buyItNowPrice-"] span', label: 'Buy it now' },
                { id: 'opening-price', selector: '.opening-price', priceSelector: 'span[id^="openingPrice-"] span', label: 'Opening price' },
                { id: 'your-max-bid', selector: '.your-max-bid', priceSelector: '.your-maximum-bid-value', label: 'Your max bid' }
            ],
            listingPage: [
                { id: 'current-bid', selector: '#currentBid', priceSelector: '#price', container: '#currentBid', label: 'Current bid' }
            ]
        }
    };
    
    // Cache for catalogue fees - key: catalogue-id, value: {premium, vat, usingDefaults}
    const catalogueFeeCache = new Map();
    
    // Pending fetch promises to avoid duplicate requests
    const pendingFetches = new Map();
    
    // Extract catalogue ID from a URL
    function extractCatalogueId(url) {
        const match = url.match(/catalogue-id-([^\/]+)/);
        return match ? match[1] : null;
    }
    
    // Fetch fees from data-url endpoint
    async function fetchFeesFromUrl(url, catalogueId) {
        // Check cache first
        if (catalogueFeeCache.has(catalogueId)) {
            return catalogueFeeCache.get(catalogueId);
        }
        
        // Check if already fetching this catalogue
        if (pendingFetches.has(catalogueId)) {
            return pendingFetches.get(catalogueId);
        }
        
        // Create fetch promise
        const fetchPromise = (async () => {
            try {
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const contentType = response.headers.get('content-type');
                let premium = config.buyersPremiumPercent;
                let vat = config.vatPercent;
                let usingDefaults = true;
                
                // Check if response is JSON
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    
                    // Extract from JSON structure
                    if (data.commissions && typeof data.commissions.CommissionsExVat === 'number') {
                        premium = data.commissions.CommissionsExVat;
                        usingDefaults = false;
                    }
                    
                    if (typeof data.vatRate === 'number') {
                        vat = data.vatRate;
                    }
                } else {
                    // Try parsing as HTML (fallback for other pages)
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    const premiumSpan = doc.querySelector('.commissions-ex-vat');
                    const vatSpan = doc.querySelector('.vat-rate');
                    
                    if (premiumSpan && premiumSpan.textContent.trim()) {
                        const match = premiumSpan.textContent.match(/(\d+(?:\.\d+)?)/);
                        if (match) {
                            premium = parseFloat(match[1]);
                            usingDefaults = false;
                        }
                    }
                    
                    if (vatSpan && vatSpan.textContent.trim()) {
                        const match = vatSpan.textContent.match(/(\d+(?:\.\d+)?)/);
                        if (match) {
                            vat = parseFloat(match[1]);
                        }
                    }
                }
                
                const fees = { premium, vat, usingDefaults };
                catalogueFeeCache.set(catalogueId, fees);
                return fees;
                
            } catch (error) {
                console.warn('Failed to fetch fees from URL:', error);
                const fees = {
                    premium: config.buyersPremiumPercent,
                    vat: config.vatPercent,
                    usingDefaults: true
                };
                catalogueFeeCache.set(catalogueId, fees);
                return fees;
            } finally {
                pendingFetches.delete(catalogueId);
            }
        })();
        
        pendingFetches.set(catalogueId, fetchPromise);
        return fetchPromise;
    }    
    
    // Extract fees from the page or a specific container
    async function extractFees(container = document) {
        let premium = config.buyersPremiumPercent;
        let vat = config.vatPercent;
        let usingDefaults = true;
        
        // First, try to extract from auction catalogue header (highest priority)
        const auctionCommissions = document.querySelector('#auctionCommissionsExVAT');
        if (auctionCommissions) {
            const commissionText = auctionCommissions.textContent.trim();
            const match = commissionText.match(/(\d+(?:\.\d+)?)/);
            if (match) {
                premium = parseFloat(match[1]);
                usingDefaults = false;
            }
        }
        
        const auctionVat = document.querySelector('#auctionVatRate');
        if (auctionVat) {
            const vatText = auctionVat.textContent.trim();
            const match = vatText.match(/(\d+(?:\.\d+)?)/);
            if (match) {
                vat = parseFloat(match[1]);
            }
        }
        
        // If still using defaults, try to fetch from data-url (for search results)
        if (usingDefaults && container !== document) {
            const additionalFeesLink = container.querySelector('.additional-fees-toggle[data-url]');
            if (additionalFeesLink) {
                const dataUrl = additionalFeesLink.getAttribute('data-url');
                const catalogueId = extractCatalogueId(dataUrl);
                
                if (catalogueId) {
                    // Check cache first
                    if (catalogueFeeCache.has(catalogueId)) {
                        return catalogueFeeCache.get(catalogueId);
                    }
                    
                    // Fetch fees from the URL
                    const fetchedFees = await fetchFeesFromUrl(dataUrl, catalogueId);
                    return fetchedFees;
                }
            }
        }
        
        // Try to find fees in the commissions popup script tag (listing page)
        if (usingDefaults) {
            const commissionsPopup = container.querySelector('#commissions-popup, script#commissions-popup');
            if (commissionsPopup) {
                const popupHTML = commissionsPopup.textContent || commissionsPopup.innerHTML;
                
                // Extract buyer's premium - match both id and class
                const premiumMatch = popupHTML.match(/(?:id|class)="commissionsExVAT"[^>]*>(\d+(?:\.\d+)?)%?<\/span>/i) ||
                                     popupHTML.match(/(?:id|class)="commissions-ex-vat"[^>]*>(\d+(?:\.\d+)?)%?<\/span>/i);
                if (premiumMatch) {
                    premium = parseFloat(premiumMatch[1]);
                    usingDefaults = false;
                }
                
                // Extract VAT - match both id and class
                const vatMatch = popupHTML.match(/(?:id|class)="vatRate"[^>]*>(\d+(?:\.\d+)?)%?<\/span>/i) ||
                                 popupHTML.match(/(?:id|class)="vat-rate"[^>]*>(\d+(?:\.\d+)?)%?<\/span>/i);
                if (vatMatch) {
                    vat = parseFloat(vatMatch[1]);
                }
            }
        }
        
        // Try popup-main-content or popup div
        if (usingDefaults) {
            const popupContent = container.querySelector('.popup-main-content, .popup');
            if (popupContent) {
                // Try to find commission span directly
                const commissionSpan = popupContent.querySelector('.commissions-ex-vat');
                if (commissionSpan) {
                    const commissionText = commissionSpan.textContent.trim();
                    const match = commissionText.match(/(\d+(?:\.\d+)?)/);
                    if (match) {
                        premium = parseFloat(match[1]);
                        usingDefaults = false;
                    }
                }
                
                // Try to find VAT span directly
                const vatSpan = popupContent.querySelector('.vat-rate');
                if (vatSpan) {
                    const vatText = vatSpan.textContent.trim();
                    const match = vatText.match(/(\d+(?:\.\d+)?)/);
                    if (match) {
                        vat = parseFloat(match[1]);
                        usingDefaults = false;
                    }
                }
            }
        }
        
        return { premium, vat, usingDefaults };
    }
    
    // Calculate the full price with premium and VAT
    function calculateTotal(amount, fees) {
        return amount * (1 + fees.premium / 100) * (1 + fees.vat / 100);
    }
    
    // Process a single price element
    function processPriceElement(priceElement, priceType, lotId, fees) {
        const priceSelector = priceType.priceSelector;
        const priceEl = priceElement.querySelector(priceSelector);
        
        if (!priceEl) {
            return;
        }
        
        // Get the amount value and parse it
        const amountText = priceEl.textContent.trim();
        const amount = parseFloat(amountText.replace(/,/g, ''));
        
        if (isNaN(amount) || amount === 0) {
            return;
        }
        
        // Calculate the full price
        const fullPrice = calculateTotal(amount, fees);
        const calculated = fullPrice.toFixed(2);
        
        // Create a unique ID for this calculated price
        const calculatedId = `calc-${priceType.id}-${lotId || 'main'}`;
        
        // Check if we already added the calculated price
        let calcSpan = priceElement.querySelector(`#${calculatedId}`);
        
        // If span exists and value hasn't changed, skip update
        if (calcSpan && calcSpan.textContent === `(${calculated})`) {
            return;
        }
        
        if (!calcSpan) {
            calcSpan = document.createElement('span');
            calcSpan.id = calculatedId;
            calcSpan.style.cursor = 'help';
            calcSpan.style.marginLeft = '4px';
            calcSpan.style.fontWeight = 'normal';
            
            // Add after the price element
            const priceContainer = priceEl.parentElement;
            if (priceContainer) {
                priceContainer.appendChild(calcSpan);
            }
        }
        
        // Set the calculated value
        calcSpan.textContent = `(${calculated}${fees.usingDefaults ? 'ish' : ''})`;
        const tooltipPrefix = fees.usingDefaults ? 'Estimated premium and vat values. ' : '';
        calcSpan.title = `${tooltipPrefix}Estimated full price including ${fees.premium}% premium and ${fees.vat}% VAT`;
    }
    
    // Process all lots on search results page
    async function processSearchResults() {
        const lots = document.querySelectorAll('.lot-single');
        
        if (lots.length === 0) {
            return false;
        }
        
        // Group lots by catalogue to minimize fetches
        const catalogueGroups = new Map();
        
        lots.forEach(lot => {
            const lotId = lot.id;
            const additionalFeesLink = lot.querySelector('.additional-fees-toggle[data-url]');
            
            if (additionalFeesLink) {
                const dataUrl = additionalFeesLink.getAttribute('data-url');
                const catalogueId = extractCatalogueId(dataUrl);
                
                if (catalogueId) {
                    if (!catalogueGroups.has(catalogueId)) {
                        catalogueGroups.set(catalogueId, {
                            dataUrl,
                            lots: []
                        });
                    }
                    catalogueGroups.get(catalogueId).lots.push({ lot, lotId });
                } else {
                    // No catalogue ID, process with defaults
                    catalogueGroups.set(`default-${lotId}`, {
                        dataUrl: null,
                        lots: [{ lot, lotId }]
                    });
                }
            } else {
                // No data URL, process with defaults
                catalogueGroups.set(`default-${lotId}`, {
                    dataUrl: null,
                    lots: [{ lot, lotId }]
                });
            }
        });
        
        // Process each catalogue group
        for (const [catalogueId, group] of catalogueGroups) {
            let fees;
            
            if (group.dataUrl && !catalogueFeeCache.has(catalogueId)) {
                // Fetch fees for this catalogue
                fees = await fetchFeesFromUrl(group.dataUrl, catalogueId);
            } else if (catalogueFeeCache.has(catalogueId)) {
                // Use cached fees
                fees = catalogueFeeCache.get(catalogueId);
            } else {
                // Use defaults
                fees = {
                    premium: config.buyersPremiumPercent,
                    vat: config.vatPercent,
                    usingDefaults: true
                };
            }
            
            // Process all lots in this group
            group.lots.forEach(({ lot, lotId }) => {
                config.priceTypes.searchResults.forEach(priceType => {
                    const priceElements = lot.querySelectorAll(priceType.selector);
                    
                    priceElements.forEach(priceElement => {
                        // Only process visible elements
                        if (priceElement.offsetParent !== null) {
                            processPriceElement(priceElement, priceType, lotId, fees);
                        }
                    });
                });
            });
        }
        
        return true;
    }
    
    // Process listing page (original functionality)
    async function processListingPage() {
        // Check if we're on a listing page by looking for the bid panel
        const bidPanel = document.querySelector('#bidPanel');
        if (!bidPanel) {
            return false;
        }
        
        // Extract fees for this listing
        const fees = await extractFees();
        
        // Process each price type configured for listing pages
        config.priceTypes.listingPage.forEach(priceType => {
            const priceElement = document.querySelector(priceType.selector);
            
            if (!priceElement) {
                return;
            }
            
            const priceEl = priceElement.querySelector(priceType.priceSelector);
            
            if (!priceEl) {
                return;
            }
            
            // Get the amount value and parse it
            const amountText = priceEl.textContent.trim();
            const amount = parseFloat(amountText.replace(/,/g, ''));
            
            if (isNaN(amount) || amount === 0) {
                return;
            }
            
            // Calculate the full price
            const fullPrice = calculateTotal(amount, fees);
            const calculated = fullPrice.toFixed(2);
            
            // Find the container to append the full price
            const container = document.querySelector(priceType.container);
            if (!container) {
                return;
            }
            
            // Create or update the fullPrice span
            let fullPriceSpan = document.querySelector('#fullPrice');
            
            // If span exists and value hasn't changed, skip update
            if (fullPriceSpan && fullPriceSpan.textContent === ` (${calculated}${fees.usingDefaults ? 'ish' : ''})`) {
                return;
            } else if (fullPriceSpan) {
                // Value changed, will update
            }
            
            if (!fullPriceSpan) {
                fullPriceSpan = document.createElement('span');
                fullPriceSpan.id = 'fullPrice';
                fullPriceSpan.style.cursor = 'help';
                container.appendChild(fullPriceSpan);
            }
            
            // Set the calculated value in brackets with tooltip
            fullPriceSpan.textContent = ' (' + calculated + (fees.usingDefaults ? 'ish' : '') + ')';
            const tooltipPrefix = fees.usingDefaults ? 'Estimated premium and vat values. ' : '';
            fullPriceSpan.title = `${tooltipPrefix}Estimated full price including ${fees.premium}% premium and ${fees.vat}% VAT`;
        });
        
        return true;
    }
    
    // Throttle function to limit execution frequency
    function throttle(func, delay) {
        let timeoutId = null;
        let lastRun = 0;
        
        return function(...args) {
            const now = Date.now();
            
            if (now - lastRun >= delay) {
                func.apply(this, args);
                lastRun = now;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastRun = Date.now();
                }, delay);
            }
        };
    }
    
    // Track processed elements to avoid redundant calculations
    const processedElements = new WeakSet();
    
    // Main processing function with performance tracking
    async function processPage() {
        // Try search results first
        if (await processSearchResults()) {
            return;
        }
        
        // Fall back to listing page
        if (await processListingPage()) {
            return;
        }
    }
    
    // Throttled version - only runs once per 500ms
    const throttledProcessPage = throttle(processListingPage, 500);
    
    // Run initially
    processPage();
    
    // Only set up mutation observer for listing pages (not search results)
    const listingPage = document.querySelector('#currentBid');
    
    if (listingPage) {
        // Watch for changes only on listing pages where bids update dynamically
        const observer = new MutationObserver((mutations) => {
            // Only process if mutations affect price-related elements
            const shouldProcess = mutations.some(mutation => {
                if (mutation.type === 'characterData') {
                    const parent = mutation.target.parentElement;
                    if (parent && (
                        parent.id?.includes('price') ||
                        parent.className?.includes('price')
                    )) {
                        return true;
                    }
                }
                
                if (mutation.type === 'childList') {
                    return Array.from(mutation.addedNodes).some(node => 
                        node.nodeType === 1 && node.querySelector?.('#currentBid')
                    );
                }
                
                return false;
            });
            
            if (shouldProcess) {
                throttledProcessPage();
            }
        });
        
        // Only observe the bid container on listing pages
        observer.observe(listingPage, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    // Note: No observer for search results - they are processed once on page load only
    
})();
