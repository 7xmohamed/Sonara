/**
 * Sonara - Content Script
 */

(function() {
    /**
     * Re-injection handler for orphaned scripts.
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
    let initialized = false;

    /**
     * Gets or creates the shared AudioContext.
     */
    function getContext() {
        if (!sharedContext || sharedContext.state === 'closed') {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            sharedContext = new AudioContext({ latencyHint: 'playback' });
        }
        return sharedContext;
    }

    /**
     * Set up the audio chain for a media element.
     * This is only called when we are sure we want to/can hook the element.
     */
    function hookElement(element) {
        if (!element || !(element instanceof HTMLMediaElement)) return null;
        if (sources.has(element)) return gainNodes.get(element);

        try {
            const ctx = getContext();

            // Handling CORS - critical for Brave
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

            return gain;
        } catch (e) {
            // Usually means already connected by site or blocked by strict shields
            return null;
        }
    }

    /**
     * Updates the gain for an element based on currentVolume.
     */
    function updateVolume(element) {
        const gainNode = hookElement(element);
        if (gainNode) {
            const calculateGain = (percent) => {
                if (percent === 0) return 0;
                if (percent <= 100) return Math.pow(percent / 100, 0.5);
                return percent / 100;
            };
            
            const targetValue = calculateGain(currentVolume);
            // Some specialized browsers (Brave/Librewolf) prefer direct value over setTargetAtTime
            // when Shields are high.
            gainNode.gain.value = targetValue;
            
            const ctx = getContext();
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
        }
    }

    /**
     * Finds all elements and ensures they are hooked if they are playing.
     */
    function processElements() {
        if (!initialized && !sharedContext) return;

        const findAndHook = (root) => {
            const elements = root.querySelectorAll('video, audio');
            elements.forEach(el => {
                // To avoid breaking elements before they start, we wait for 'play'
                // BUT we also check if it's already playing.
                if (!el.paused || el.currentTime > 0) {
                    updateVolume(el);
                } else {
                    // One-time listener to hook when it starts
                    const onPlay = () => {
                        updateVolume(el);
                        el.removeEventListener('play', onPlay);
                    };
                    el.addEventListener('play', onPlay);
                }
            });
        };

        findAndHook(document);

        // Scan Shadow Roots
        const all = document.getElementsByTagName('*');
        for (let i = 0; i < all.length; i++) {
            if (all[i].shadowRoot) findAndHook(all[i].shadowRoot);
        }
    }

    window._sonaraSetVolume = (value) => {
        currentVolume = value;
        if (initialized) {
            processElements();
        }
    };

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'setVolume') {
            window._sonaraSetVolume(request.value);
            sendResponse({ success: true, volume: currentVolume });
        }
    });

    const triggerInit = () => {
        if (!initialized) {
            initialized = true;
            getContext();
            processElements();
        } else if (sharedContext && sharedContext.state === 'suspended') {
            sharedContext.resume();
        }
    };

    // User gesture listeners
    ['mousedown', 'click', 'keydown', 'touchstart'].forEach(type => {
        document.addEventListener(type, triggerInit, { once: true, capture: true });
    });

    // Handle SPA navigation and dynamic element insertion
    const observer = new MutationObserver(() => {
        if (initialized) processElements();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Periodic check for stubborn SPA players (like YouTube's mini-player)
    setInterval(() => {
        if (initialized && currentVolume !== 100) processElements();
    }, 2000);

})();
