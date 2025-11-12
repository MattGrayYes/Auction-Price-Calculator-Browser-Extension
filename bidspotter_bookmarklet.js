/*
<div class="Rtable-cell Rtable-cell--1of3 currentBid">
    <span class="data" id="currentBid">
        <span id="price"><span class="amount"><strong>140</strong></span></span> <span class="currency" id="currency"><span><strong>GBP</strong></span></span>
    </span>
</div>
*/

// bookmarklet code here:
javascript:(function(){const amountEl=document.querySelector('.currentBid .amount strong');if(!amountEl)return alert('Amount not found');const amount=parseFloat(amountEl.textContent.replace(/,/g,''));if(isNaN(amount))return alert('Invalid amount');const calculated=(amount*1.26*1.2).toFixed(2);const currentBidSpan=document.querySelector('#currentBid');if(!currentBidSpan)return alert('currentBid element not found');let fullPriceSpan=document.querySelector('#fullPrice');if(!fullPriceSpan){fullPriceSpan=document.createElement('span');fullPriceSpan.id='fullPrice';currentBidSpan.appendChild(fullPriceSpan);}fullPriceSpan.textContent=' ('+calculated+')';})();

// Readable version:
(function() {
    // Find the amount element
    const amountEl = document.querySelector('.currentBid .amount strong');
    if (!amountEl) return alert('Amount not found');
    
    // Get the amount value and parse it
    const amount = parseFloat(amountEl.textContent.replace(/,/g, ''));
    if (isNaN(amount)) return alert('Invalid amount');
    
    // Calculate: amount * 1.26 * 1.2
    const calculated = (amount * 1.26 * 1.2).toFixed(2);
    
    // Find the currentBid span
    const currentBidSpan = document.querySelector('#currentBid');
    if (!currentBidSpan) return alert('currentBid element not found');
    
    // Create or find the fullPrice span
    let fullPriceSpan = document.querySelector('#fullPrice');
    if (!fullPriceSpan) {
        fullPriceSpan = document.createElement('span');
        fullPriceSpan.id = 'fullPrice';
        // Append as the final child of currentBid
        currentBidSpan.appendChild(fullPriceSpan);
    }
    
    // Set the calculated value in brackets
    fullPriceSpan.textContent = ' (' + calculated + ')';
})();
