/*
 * auctions.kitplus.com Auction Calculator
 * 
 * Calculates and displays total auction prices (hammer price + buyer's premium + VAT)
 * inline next to existing prices on auctions.kitplus.com.
 * 
 * DETECTION & BEHAVIOR:
 * - Works on both detail pages (single lot) and search/catalog pages (multiple lots)
 * - Detail pages: Extracts fees from #buyers_premium #value and #lcf_vat #value elements
 * - Search pages: Extracts fees from each lot's .item-cbuyers_premium .value and .item-cvat .value elements
 * - Displays calculated total price inline as (£amount) or (£amountish) if using defaults
*/

(function() {
    'use strict';
    
    // Configuration for KitPlus
    const config = {
        // Default values (fallback if extraction fails)
        buyersPremiumPercent: 15,  
        vatPercent: 20,
        
        selectors: {
            currentBid: '#currentBid',
            buyersPremium: '#buyers_premium #value',
            vat: '#lcf_vat #value',
            container: '#currentBid' // Where to append the calculated price
        }
    };
    
    // Extract numeric value from text (handles currency symbols, percentages, etc.)
    function extractNumber(text) {
        if (!text) return null;
        
        // Remove currency symbols, commas, and other non-numeric characters except decimal point
        const cleaned = text.replace(/[£$€,\s%]/g, '');
        const number = parseFloat(cleaned);
        
        return isNaN(number) ? null : number;
    }
    
    // Extract fees from the page (or from a specific lot element on search pages)
    function extractFees(lotElement = null) {
        let premium = config.buyersPremiumPercent;
        let vat = config.vatPercent;
        let usingDefaults = true;
        
        // If a lot element is provided (search page), look within it
        if (lotElement) {
            const bdInfo = lotElement.closest('.item-block');
            if (bdInfo) {
                // Extract buyer's premium from search page lot
                const premiumLi = bdInfo.querySelector('.item-cbuyers_premium .value');
                if (premiumLi) {
                    const extractedPremium = extractNumber(premiumLi.textContent);
                    if (extractedPremium !== null) {
                        premium = extractedPremium;
                        usingDefaults = false;
                    }
                }
                
                // Extract VAT from search page lot
                const vatLi = bdInfo.querySelector('.item-cvat .value');
                if (vatLi) {
                    const extractedVat = extractNumber(vatLi.textContent);
                    if (extractedVat !== null) {
                        vat = extractedVat;
                    }
                }
            }
        } else {
            // Detail page: try to extract from page-level elements
            const premiumEl = document.querySelector(config.selectors.buyersPremium);
            if (premiumEl) {
                const premiumText = premiumEl.textContent.trim();
                const extractedPremium = extractNumber(premiumText);
                
                if (extractedPremium !== null) {
                    premium = extractedPremium;
                    usingDefaults = false;
                }
            }
            
            const vatEl = document.querySelector(config.selectors.vat);
            if (vatEl) {
                const vatText = vatEl.textContent.trim();
                const extractedVat = extractNumber(vatText);
                
                if (extractedVat !== null) {
                    vat = extractedVat;
                }
            }
        }
        
        return { premium, vat, usingDefaults };
    }
    
    // Calculate the full price with premium and VAT
    function calculateTotal(amount, fees) {
        return amount * (1 + fees.premium / 100) * (1 + fees.vat / 100);
    }
    
    // Process a single price element (works on both detail and search pages)
    function processPrice(priceSpan, fees) {
        if (!priceSpan) return;
        
        // Check if we already processed this element
        if (priceSpan.parentElement.querySelector('.auction-full-price')) {
            return;
        }
        
        // Get the amount value and parse it
        const amountText = priceSpan.textContent.trim();
        const amount = extractNumber(amountText);
        
        if (amount === null || amount === 0) {
            return;
        }
        
        // Calculate the full price
        const fullPrice = calculateTotal(amount, fees);
        const calculated = fullPrice.toFixed(2);
        
        // Create the span for calculated price
        const fullPriceSpan = document.createElement('span');
        fullPriceSpan.className = 'auction-full-price';
        fullPriceSpan.style.marginLeft = '1em';
        fullPriceSpan.style.cursor = 'help';
        
        // Format percentages for display
        const formatPercent = (value) => {
            return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
        };
        
        const premiumPercentStr = formatPercent(fees.premium);
        const vatPercentStr = formatPercent(fees.vat);
        
        // Set the calculated value with tooltip (using [£amount] format)
        const currencySymbol = '£';
        const displayText = fees.usingDefaults ? ` (${currencySymbol}${calculated}ish)` : ` (${currencySymbol}${calculated})`;
        fullPriceSpan.textContent = displayText;
        
        const tooltipPrefix = fees.usingDefaults ? 'Estimated premium and vat values. ' : '';
        fullPriceSpan.title = `${tooltipPrefix}Estimated full price including ${premiumPercentStr}% premium and ${vatPercentStr}% VAT`;
        
        // Insert after the price span
        priceSpan.parentElement.insertBefore(fullPriceSpan, priceSpan.nextSibling);
    }
    
    // Main calculation and display function
    function calculateFullPrice() {
        // Check if we're on a detail page (single lot)
        const detailPagePrice = document.querySelector(config.selectors.currentBid + ' .exratetip');
        if (detailPagePrice) {
            const fees = extractFees();
            processPrice(detailPagePrice, fees);
        }
        
        // Check if we're on a search/catalog page (multiple lots)
        const searchPagePrices = document.querySelectorAll('.bd-info .exratetip');
        if (searchPagePrices.length > 0) {
            searchPagePrices.forEach(priceSpan => {
                // Extract fees for each lot individually on search pages
                const fees = extractFees(priceSpan);
                processPrice(priceSpan, fees);
            });
        }
    }
    
    // Run initially
    calculateFullPrice();
    
    // Watch for changes in case the bid updates dynamically
    const observer = new MutationObserver(() => {
        calculateFullPrice();
    });
    
    // Observe the detail page container if it exists
    const containerEl = document.querySelector(config.selectors.container);
    if (containerEl) {
        observer.observe(containerEl, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    // Observe the search page container if it exists
    const searchContainer = document.querySelector('.auclist');
    if (searchContainer) {
        observer.observe(searchContainer, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    // Also observe the premium and VAT elements in case they change
    const premiumEl = document.querySelector(config.selectors.buyersPremium);
    if (premiumEl) {
        observer.observe(premiumEl, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
    const vatEl = document.querySelector(config.selectors.vat);
    if (vatEl) {
        observer.observe(vatEl, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
})();
