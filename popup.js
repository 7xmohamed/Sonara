document.addEventListener('DOMContentLoaded', async () => {
    const slider = document.getElementById('volume-slider');
    const label = document.getElementById('percentage-label');
    const track = document.getElementById('slider-track');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const statusIndicator = document.getElementById('status-indicator');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tab.id;
    let isCapturing = false;

    // Update tab-url label with current hostname
    try {
        const url = new URL(tab.url);
        document.getElementById('tab-url').textContent = url.hostname;
    } catch (e) {
        document.getElementById('tab-url').textContent = 'Current Tab';
    }

    const stored = await chrome.storage.local.get(tabId.toString());
    let currentVolume = stored[tabId.toString()] || 100;

    const updateUI = (val) => {
        slider.value = val;
        
        if (val === 0) {
            label.textContent = 'MUTED';
            label.style.opacity = '0.6';
        } else {
            label.textContent = `${val}%`;
            label.style.opacity = '1';
        }
        
        const percent = (val / 600) * 100;
        track.style.width = `${percent}%`;

        if (val === 0) {
            label.classList.remove('high-boost');
            statusIndicator.textContent = 'MUTED';
            statusIndicator.style.color = '#777';
            statusIndicator.style.borderColor = 'rgba(119, 119, 119, 0.2)';
        } else if (val > 100) {
            label.classList.add('high-boost');
            statusIndicator.textContent = 'BOOSTED';
            statusIndicator.style.color = '#ff007f';
            statusIndicator.style.borderColor = 'rgba(255, 0, 127, 0.3)';
        } else if (val === 100) {
            label.classList.remove('high-boost');
            statusIndicator.textContent = 'NORMAL';
            statusIndicator.style.color = '#00f2fe';
            statusIndicator.style.borderColor = 'rgba(0, 242, 254, 0.2)';
        } else {
            label.classList.remove('high-boost');
            statusIndicator.textContent = 'REDUCED';
            statusIndicator.style.color = '#00f2fe';
            statusIndicator.style.borderColor = 'rgba(0, 242, 254, 0.2)';
        }
    };

    updateUI(currentVolume);

    /**
     * Communicates with background for tab capture boosting.
     * Starts capture directly in popup context to satisfy user gesture.
     */
    const applyVolume = async (val) => {
        // Save volume locally for the tab
        chrome.storage.local.set({ [tabId.toString()]: val });

        if (!isCapturing && val !== 100) {
            // Initiate tab capture - must be within this event listener thread for gesture
            chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
                if (chrome.runtime.lastError) {
                    // This can happen if capture is already active on this tab
                    chrome.runtime.sendMessage({ action: 'setVolume', value: val, tabId: tabId });
                    return;
                }
                
                isCapturing = true;
                chrome.runtime.sendMessage({
                    action: 'startCapture',
                    tabId: tabId,
                    streamId: streamId,
                    value: val
                });
            });
        } else {
            // Already capturing, just update volume
            chrome.runtime.sendMessage({
                action: 'setVolume',
                value: val,
                tabId: tabId
            });
        }
    };

    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        updateUI(val);
        applyVolume(val);
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.value);
            updateUI(val);
            applyVolume(val);
        });
    });

    // Open GitHub in new tab
    document.getElementById('github-link').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/7xmohamed/Sonara' });
    });
});
