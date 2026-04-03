/**
 * Sonara - Offscreen Audio Processor
 */

let context = null;
let source = null;
let gainNode = null;

chrome.runtime.onMessage.addListener(async (request) => {
    if (request.target !== 'offscreen') return;

    if (request.action === 'startCapture') {
        const streamId = request.streamId;
        const volume = request.volume || 100;
        await startCapture(streamId, volume);
    } else if (request.action === 'setVolume') {
        if (gainNode) {
            const calculateGain = (percent) => {
                if (percent === 0) return 0;
                if (percent <= 100) return Math.pow(percent / 100, 0.5);
                return percent / 100;
            };
            gainNode.gain.setTargetAtTime(calculateGain(request.volume), context.currentTime, 0.1);
        }
    }
});

async function startCapture(streamId, initialVolume) {
    try {
        // Close existing context if any
        if (context) {
            await context.close();
        }

        // Modern getUserMedia constraints for tabCapture
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            }
        });

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
        
        source = context.createMediaStreamSource(stream);
        gainNode = context.createGain();

        const calculateGain = (percent) => {
            if (percent === 0) return 0;
            if (percent <= 100) return Math.pow(percent / 100, 0.5);
            return percent / 100;
        };
        
        gainNode.gain.value = calculateGain(initialVolume);

        source.connect(gainNode);
        gainNode.connect(context.destination);

        // Explicitly resume to ensure playback starts in all browsers
        if (context.state === 'suspended') {
            await context.resume();
        }
        
        // Keep the stream alive
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();
        audio.muted = true;

    } catch (e) {
        console.error('Offscreen capture error:', e);
    }
}
