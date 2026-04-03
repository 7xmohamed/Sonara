/**
 * Sonara - Content Script
 */

(function() {
    if (window._sonaraInjected) return;
    window._sonaraInjected = true;

    /**
     * Set up or retrieve the Web Audio chain for a media element.
     * Uses WeakMap to associate AudioContexts with elements for automatic garbage collection.
     */
    function setupAudioChain(element) {
        if (!element || !(element instanceof HTMLMediaElement)) return null;
        
        try {
            if (!audioContexts.has(element)) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const context = new AudioContext();
                const source = context.createMediaElementSource(element);
                const gainNode = context.createGain();

                source.connect(gainNode);
                gainNode.connect(context.destination);

                audioContexts.set(element, context);
                gainNodes.set(element, gainNode);
            }
            
            const gainNode = gainNodes.get(element);
            const context = audioContexts.get(element);
            
            /**
             * Maps the slider percentage to a gain value.
             * Below 100% uses a square root curve (x^0.5) to mimic logarithmic volume perception.
             */
            const calculateGain = (percent) => {
                if (percent === 0) return 0;
                if (percent <= 100) {
                    return Math.pow(percent / 100, 0.5);
                }
                return percent / 100;
            };

            gainNode.gain.value = calculateGain(currentVolume);
            
            // Auto-resume if context was suspended by browser policy
            if (context.state === 'suspended') {
                context.resume();
            }

            return gainNode;
        } catch (e) {
            return null;
        }
    }

    function applyToAll() {
        const elements = document.querySelectorAll('video, audio');
        elements.forEach(setupAudioChain);
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'setVolume') {
            currentVolume = request.value;
            applyToAll();
            sendResponse({ success: true, volume: currentVolume });
        }
    });

    /**
     * Observe the DOM for dynamically added media elements (e.g., YouTube video swaps).
     */
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof HTMLMediaElement) {
                    setupAudioChain(node);
                } else if (node.querySelectorAll) {
                    node.querySelectorAll('video, audio').forEach(setupAudioChain);
                }
            }
        }
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });

    applyToAll();

    document.addEventListener('click', () => {
        const elements = document.querySelectorAll('video, audio');
        elements.forEach(el => {
            const ctx = audioContexts.get(el);
            if (ctx && ctx.state === 'suspended') {
                ctx.resume();
            }
        });
    }, { once: true });

})();
