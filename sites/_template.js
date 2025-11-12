// Template for adding new auction site rules
// Copy this template and modify for each new site

/*
 * SITE NAME: [Your Auction Site]
 * URL Pattern: [e.g., *.example.com]
 * Buyer's Premium: [e.g., 25%]
 * VAT: [e.g., 20%]
 */

(function() {
    'use strict';
    
    // Configuration for [SITE NAME]
    const config = {
        buyersPremiumPercent: 25,  // 25% - adjust this
        vatPercent: 20,            // 20% - adjust this
        selectors: {
            amount: '[CSS SELECTOR FOR AMOUNT]',      // Update this selector
            currency: '[CSS SELECTOR FOR CURRENCY]',  // Update this selector (optional)
            container: '[CSS SELECTOR FOR CONTAINER]' // Update this selector
        }
    };
    
    function calculateFullPrice() {
        // Find the amount element
        const amountEl = document.querySelector(config.selectors.amount);
        if (!amountEl) {
            console.log('Auction Price Calculator: Amount element not found');
            return;
        }
        
        // Get the amount value and parse it
        const amountText = amountEl.textContent.trim();
        const amount = parseFloat(amountText.replace(/[,\s]/g, ''));
        
        if (isNaN(amount)) {
            console.log('Auction Price Calculator: Invalid amount:', amountText);
            return;
        }
        
        // Calculate: amount * buyer's premium * VAT
        const fullPrice = amount * (1 + config.buyersPremiumPercent / 100) * (1 + config.vatPercent / 100);
        const calculated = fullPrice.toFixed(2);
        
        // Find the container to append the full price
        const container = document.querySelector(config.selectors.container);
        if (!container) {
            console.log('Auction Price Calculator: Container element not found');
            return;
        }
        
        // Create or update the fullPrice span
        let fullPriceSpan = container.querySelector('.auction-full-price');
        if (!fullPriceSpan) {
            fullPriceSpan = document.createElement('span');
            fullPriceSpan.className = 'auction-full-price';
            fullPriceSpan.style.color = '#008000';  // Green color to distinguish it
            fullPriceSpan.style.fontWeight = 'bold';
            fullPriceSpan.style.marginLeft = '8px';
            fullPriceSpan.style.cursor = 'help';  // Show help cursor on hover
            container.appendChild(fullPriceSpan);
        }
        
        // Calculate percentages for display
        const premiumPercent = config.buyersPremiumPercent;
        const vatPercent = config.vatPercent;
        
        // Format percentages with same precision as the numbers
        const formatPercent = (value) => {
            return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
        };
        
        const premiumPercentStr = formatPercent(premiumPercent);
        const vatPercentStr = formatPercent(vatPercent);
        
        // Set the calculated value with tooltip
        fullPriceSpan.textContent = '(' + calculated + ')';
        fullPriceSpan.title = `Estimated full price including ${premiumPercentStr}% premium and ${vatPercentStr}% VAT`;
        
        console.log(`Auction Price Calculator: ${amount} → ${calculated}`);
    }
    
    // Run initially
    calculateFullPrice();
    
    // Watch for changes in case the bid updates dynamically
    const observer = new MutationObserver(() => {
        calculateFullPrice();
    });
    
    // Start observing when the container element exists
    const containerEl = document.querySelector(config.selectors.container);
    if (containerEl) {
        observer.observe(containerEl, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    
})();
