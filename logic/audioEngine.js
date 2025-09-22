// Audio Engine: Gestisce context audio, buffer, riproduzione

export class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.buffers = {};
  }

  // Inizializza AudioContext on-demand (lazy loading)
  getAudioContext() {
    if (!this.audioCtx) {
      console.log('Inizializzazione AudioContext...');
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioCtx;
  }

  // Assicura che l'AudioContext sia attivo
  async ensureAudioContext() {
    const ctx = this.getAudioContext();
    console.log(`AudioContext state: ${ctx.state}`);
    if (ctx.state === 'suspended') {
      console.log('Riattivo AudioContext...');
      try {
        await ctx.resume();
        console.log(`AudioContext resumed. New state: ${ctx.state}`);
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        throw error;
      }
    }
    return ctx;
  }

  // Carica buffer audio on-demand
  loadAudioBuffer(track, onLoaded, onError) {
    if (this.buffers[track.soundPath]) {
      // Buffer già caricato
      onLoaded(this.buffers[track.soundPath]);
      return;
    }

    const trackEl = document.querySelector(`[data-path="${track.soundPath}"]`);
    if (trackEl) {
      // Aggiungi indicatore di caricamento avanzato
      const addButton = trackEl.querySelector('.add-sound');
      if (addButton) {
        addButton.className = 'add-sound loading';
        addButton.innerHTML = `
          <span class="loading-indicator">⏳ Caricamento...</span>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
        `;
      }
    }

    fetch(track.soundPath)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then(arrayBuffer => this.getAudioContext().decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.buffers[track.soundPath] = audioBuffer;
        if (onLoaded) onLoaded(audioBuffer);

        // Update UI on successful load
        if (trackEl) {
          const addButton = trackEl.querySelector('.add-sound');
          if (addButton) {
            const originalFileName = track.soundPath.split('/').pop();
            addButton.className = 'add-sound success';
            // Temporarily show success before reverting to normal
            setTimeout(() => {
              addButton.className = 'add-sound';
            }, 1000);
          }
        }
      })
      .catch(error => {
        console.error(`Errore caricamento ${track.soundPath}:`, error);
        if (trackEl) {
          // Update button to show error state
          const addButton = trackEl.querySelector('.add-sound');
          if (addButton) {
            addButton.className = 'add-sound error';
            addButton.innerHTML = `<span class="error-indicator">❌ Errore</span>`;
            // Allow retry after error
            setTimeout(() => {
              const originalFileName = track.soundPath.split('/').pop();
              addButton.className = 'add-sound';
              addButton.textContent = originalFileName;
            }, 3000);
          }
        }

        if (onError) onError(error);
      });
  }

  // Riproduci traccia singola
  playTrack(track) {
    console.log(`Attempting to play track: ${track.soundPath}, loopMode: ${track.loopMode}`);

    if (track.isRemoved) return;

    if (this.buffers[track.soundPath]) {
      // Buffer già disponibile, riproduci con fade-in
      const ctx = this.getAudioContext();
      console.log(`AudioContext state during playback: ${ctx.state}, buffers available: ${Object.keys(this.buffers).length}`);

      try {
        const source = ctx.createBufferSource();
        console.log(`Created BufferSourceNode, buffer duration: ${this.buffers[track.soundPath].duration} seconds`);
        source.buffer = this.buffers[track.soundPath];
        source.loop = (track.loopMode === 'loop');

        console.log(`Source loop set to: ${source.loop}, volume: ${track.volume}, pan: ${track.pan}`);

        // Crea catena audio: Source → Gain → Panner → Destination
        const gainNode = ctx.createGain();
        const pannerNode = ctx.createStereoPanner();

        // Connetti la catena
        source.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(ctx.destination);

        console.log('Audio nodes connected: source → gain → panner → destination');

        // Imposta valori iniziali
        console.log(`Setting initial audio parameters: volume=${track.volume}, pan=${track.pan}, fadeIn=${track.fadeInEnabled}`);
        if (track.fadeInEnabled) {
          gainNode.gain.setValueAtTime(0, ctx.currentTime); // Inizia da zero per fade-in
          gainNode.gain.linearRampToValueAtTime(track.volume, ctx.currentTime + track.fadeInDuration);
          console.log(`Fade-in enabled: duration ${track.fadeInDuration}s, target volume: ${track.volume}`);
        } else {
          gainNode.gain.setValueAtTime(track.volume, ctx.currentTime); // Inizia direttamente al volume
          console.log(`Immediate playback at volume: ${track.volume}`);
        }

        pannerNode.pan.value = track.pan;

        track.source = source;
        track.gainNode = gainNode;
        track.pannerNode = pannerNode;

        console.log('Starting audio playback...');
        source.start();
        console.log('Audio playback started successfully');

        // Gestisci fine riproduzione basata sui loop modes
        if (track.loopMode === 'interval') {
          console.log(`Setting up interval loop: ${track.intervalSec}s`);
          source.onended = () => {
            console.log('Audio ended, scheduling next interval play');
            track.timeoutId = setTimeout(() => {
              this.playTrack(track);
            }, track.intervalSec * 1000);
          };
        } else if (track.loopMode === 'random-interval') {
          console.log(`Setting up random interval loop: ${track.minIntervalSec}-${track.maxIntervalSec}s`);
          source.onended = () => {
            // Usa range configurabile tra minIntervalSec e maxIntervalSec
            const randomRange = Math.abs(track.maxIntervalSec - track.minIntervalSec);
            const randomDelay = (Math.min(track.minIntervalSec, track.maxIntervalSec) + Math.random() * randomRange) * 1000;
            console.log(`Audio ended, scheduling next random play in ${Math.round(randomDelay/1000)}s`);
            track.timeoutId = setTimeout(() => {
              this.playTrack(track);
            }, randomDelay);
          };
        } else if (track.loopMode === 'play-once') {
          console.log('Setting up play-once mode');
          // Applica fade out automatico quando finisce
          source.onended = () => {
            console.log('Audio ended, stopping track');
            this.stopTrack(track);
          };
        } else {
          console.log(`Loop mode: ${track.loopMode} (continuous loop)`);
        }
      } catch (error) {
        console.error('Error during audio playback setup:', error);
        throw error;
      }
    } else {
      console.log('Buffer not available, loading first...');
      // Buffer non ancora caricato, carica prima
      this.loadAudioBuffer(track,
        (audioBuffer) => {
          console.log('Buffer loaded, now playing...');
          // Buffer caricato, ora riproduci
          this.playTrack(track);
        },
        (error) => {
          console.error('Errore caricamento audio per playTrack:', error);
        }
      );
    }
  }

  // Ferma traccia
  stopTrack(track, immediate = false) {
    if (track.source && track.gainNode) {
      // Se immediate o fade out disabilitato, interrompi immediatamente
      if (immediate || !track.fadeOutEnabled) {
        if (track.source) {
          track.source.stop();
          track.source.disconnect();
          track.source = null;
        }
        if (track.gainNode) {
          track.gainNode.disconnect();
          track.gainNode = null;
        }
        if (track.pannerNode) {
          track.pannerNode.disconnect();
          track.pannerNode = null;
        }

      } else {
        // Applica fade-out
        const ctx = this.getAudioContext();
        const fadeTime = track.fadeOutDuration;
        const currentTime = ctx.currentTime;

        track.gainNode.gain.cancelScheduledValues(currentTime);
        track.gainNode.gain.setValueAtTime(track.gainNode.gain.value, currentTime);
        track.gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeTime);

        // Stop dopo il fade
        setTimeout(() => {
          if (track.source) {
            track.source.stop();
            track.source.disconnect();
            track.source = null;
          }
          if (track.gainNode) {
            track.gainNode.disconnect();
            track.gainNode = null;
          }
          if (track.pannerNode) {
            track.pannerNode.disconnect();
            track.pannerNode = null;
          }

        }, fadeTime * 1000);
      }
    }
    if (track.timeoutId) {
      clearTimeout(track.timeoutId);
      track.timeoutId = null;
    }
  }
}
