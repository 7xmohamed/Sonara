document.addEventListener('DOMContentLoaded', async () => {
    const slider = document.getElementById('volume-slider');
    const label = document.getElementById('percentage-label');
    const track = document.getElementById('slider-track');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const statusIndicator = document.getElementById('status-indicator');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tab.id.toString();
    
    // Update tab-url label with current hostname
    try {
        const url = new URL(tab.url);
        document.getElementById('tab-url').textContent = url.hostname;
    } catch (e) {
        document.getElementById('tab-url').textContent = 'Current Tab';
    }

    const stored = await chrome.storage.local.get(tabId);
    let currentVolume = stored[tabId] || 100;

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
     * Sends the volume value to the content script.
     * Handles re-injection if the script has been purged from the tab's context.
     */
    const applyVolume = async (val) => {
        try {
            await chrome.tabs.sendMessage(tab.id, { action: 'setVolume', value: val });
            chrome.storage.local.set({ [tabId]: val });
        } catch (e) {
            // Attempt to re-inject and retry if communication fails
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            await chrome.tabs.sendMessage(tab.id, { action: 'setVolume', value: val });
            chrome.storage.local.set({ [tabId]: val });
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
