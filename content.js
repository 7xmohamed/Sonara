/**
 * Sonara - Content Script
 */

(function() {
    /**
     * Re-injection handler for orphaned scripts after extension updates/reloads.
     */
    if (window._sonaraInjectedState) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'setVolume') {
                if (typeof window._sonaraSetVolume === 'function') {
                    window._sonaraSetVolume(request.value);
                }
                sendResponse({ success: true, volume: request.value });
            }
        });
        return;
    }
    window._sonaraInjectedState = true;

    let sharedContext = null;
    const sources = new WeakMap();
    const gainNodes = new WeakMap();
    let currentVolume = 100;

    /**
     * Gets the shared AudioContext, creating it if it doesn't exist.
     */
    function getContext() {
        if (!sharedContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            sharedContext = new AudioContext();
        }
        return sharedContext;
    }

    /**
     * Set up or retrieve the Web Audio chain for a media element.
     */
    function setupAudioChain(element) {
        if (!element || !(element instanceof HTMLMediaElement)) return null;

        // Skip small elements (like some YouTube previews) that might be muted or irrelevant
        if (element.offsetWidth < 50 && element.offsetHeight < 50) {
            // But if it's the only one, hook it. YouTube main player is always large.
        }

        try {
            const ctx = getContext();

            if (!sources.has(element)) {
                // To avoid CORS issues hitting createMediaElementSource,
                // we ensure the element is set to anonymous if its source is not same-origin.
                if (element.src && !element.src.startsWith('blob:') && !element.src.startsWith(window.location.origin)) {
                    if (element.crossOrigin !== 'anonymous') {
                        element.crossOrigin = 'anonymous';
                    }
                }

                const source = ctx.createMediaElementSource(element);
                const gain = ctx.createGain();

                source.connect(gain);
                gain.connect(ctx.destination);

                sources.set(element, source);
                gainNodes.set(element, gain);
            }

            const gainNode = gainNodes.get(element);
            
            // Map percentage to gain value (square root curve for < 100% for natural feel)
            const calculateGain = (percent) => {
                if (percent === 0) return 0;
                if (percent <= 100) return Math.pow(percent / 100, 0.5);
                return percent / 100;
            };

            const targetGain = calculateGain(currentVolume);
            gainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);

            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            return gainNode;
        } catch (e) {
            // Already hooked or CORS error
            return null;
        }
    }

    function applyToAll() {
        // Standard elements
        const elements = document.querySelectorAll('video, audio');
        elements.forEach(setupAudioChain);

        // Search for elements in ALL shadow roots (common in complex players)
        const allElements = document.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i];
            if (el.shadowRoot) {
                el.shadowRoot.querySelectorAll('video, audio').forEach(setupAudioChain);
            }
        }
    }

    // Global setter for volume, used by re-injected scripts
    window._sonaraSetVolume = (value) => {
        currentVolume = value;
        applyToAll();
    };

    // Primary message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'setVolume') {
            window._sonaraSetVolume(request.value);
            sendResponse({ success: true, volume: currentVolume });
        }
    });

    // Observe for new elements or player state changes
    const observer = new MutationObserver((mutations) => {
        let changed = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) changed = true;
        }
        if (changed) {
            applyToAll();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Initial check and periodic retries for dynamic players
    applyToAll();
    setTimeout(applyToAll, 500);
    setTimeout(applyToAll, 2000);
    setTimeout(applyToAll, 5000);

    // Resume context on user gesture (required by Chrome policy)
    const resumeAll = () => {
        if (sharedContext && sharedContext.state === 'suspended') {
            sharedContext.resume();
        }
    };
    document.addEventListener('mousedown', resumeAll, { once: true });
    document.addEventListener('keydown', resumeAll, { once: true });
    document.addEventListener('touchstart', resumeAll, { once: true });
    document.addEventListener('click', resumeAll, { once: true });

})();
