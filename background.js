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

chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'startCapture') {
        await createOffscreen();
        
        chrome.runtime.sendMessage({
            target: 'offscreen',
            action: 'startCapture',
            streamId: request.streamId,
            volume: request.value,
            tabId: request.tabId
        });
    } else if (request.action === 'setVolume') {
        const existing = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        
        if (existing.length > 0) {
            chrome.runtime.sendMessage({
                target: 'offscreen',
                action: 'setVolume',
                volume: request.value
            });
        }
    }
});
