/**
 * Sonara - Service Worker (Background Script)
 */

let isOffscreenCreated = false;

async function createOffscreen() {
    if (isOffscreenCreated) return;

    const existing = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existing.length > 0) {
        isOffscreenCreated = true;
        return;
    }

    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'To process and boost tab audio using Web Audio API.'
    });
    isOffscreenCreated = true;
}

/**
 * Sends a message to the offscreen document, retrying a few times if the
 * receiving end isn't ready yet (can happen in the brief window between
 * createDocument resolving and the offscreen script registering its listener).
 */
async function sendToOffscreen(message, retries = 5, delayMs = 100) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await chrome.runtime.sendMessage(message);
            return; // success
        } catch (e) {
            const isNotReady = e?.message?.includes('Receiving end does not exist') ||
                               e?.message?.includes('Could not establish connection');
            if (isNotReady && attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else if (!isNotReady) {
                // Unexpected error — surface it
                console.error('Sonara: sendToOffscreen error:', e);
                return;
            }
        }
    }
    console.warn('Sonara: offscreen document not ready after', retries, 'attempts.');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startCapture') {
        (async () => {
            await createOffscreen();
            await sendToOffscreen({
                target: 'offscreen',
                action: 'startCapture',
                streamId: request.streamId,
                volume: request.value,
                tabId: request.tabId
            });
        })();
        return true; // keep channel open for async response
    } else if (request.action === 'setVolume') {
        (async () => {
            const existing = await chrome.runtime.getContexts({
                contextTypes: ['OFFSCREEN_DOCUMENT']
            });
            if (existing.length > 0) {
                await sendToOffscreen({
                    target: 'offscreen',
                    action: 'setVolume',
                    volume: request.value
                });
            }
        })();
        return true;
    }
});
