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
    if (ctx.state === 'suspended') {
      console.log('Riattivo AudioContext...');
      await ctx.resume();
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
    if (this.buffers[track.soundPath]) {
      // Buffer già disponibile, riproduci con fade-in
      const ctx = this.getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = this.buffers[track.soundPath];
      source.loop = (track.loopMode === 'loop');

      // Crea catena audio: Source → Gain → EQ Filters → Panner → Destination
      const gainNode = ctx.createGain();
      const pannerNode = ctx.createStereoPanner();

      // Equalization filters
      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowshelf';
      lowFilter.frequency.value = 250;
      lowFilter.gain.value = track.eq.low;

      const midFilter = ctx.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.value = 1000;
      midFilter.Q.value = 1;
      midFilter.gain.value = track.eq.mid;

      const highFilter = ctx.createBiquadFilter();
      highFilter.type = 'highshelf';
      highFilter.frequency.value = 4000;
      highFilter.gain.value = track.eq.high;

      // Connetti la catena
      source.connect(gainNode);
      gainNode.connect(lowFilter);
      lowFilter.connect(midFilter);
      midFilter.connect(highFilter);
      highFilter.connect(pannerNode);
      pannerNode.connect(ctx.destination);

      // Imposta valori iniziali
      if (track.fadeInEnabled) {
        gainNode.gain.setValueAtTime(0, ctx.currentTime); // Inizia da zero per fade-in
        gainNode.gain.linearRampToValueAtTime(track.volume, ctx.currentTime + track.fadeInDuration);
      } else {
        gainNode.gain.setValueAtTime(track.volume, ctx.currentTime); // Inizia direttamente al volume
      }
      pannerNode.pan.value = track.pan;

      track.source = source;
      track.gainNode = gainNode;
      track.pannerNode = pannerNode;
      track.lowFilter = lowFilter;
      track.midFilter = midFilter;
      track.highFilter = highFilter;

      source.start();

      // Gestisci fine riproduzione basata sui loop modes
      if (track.loopMode === 'interval') {
        source.onended = () => {
          track.timeoutId = setTimeout(() => {
            this.playTrack(track);
          }, track.intervalSec * 1000);
        };
      } else if (track.loopMode === 'random-interval') {
        source.onended = () => {
          // Usa range configurabile tra minIntervalSec e maxIntervalSec
          const randomRange = track.maxIntervalSec - track.minIntervalSec;
          const randomDelay = (track.minIntervalSec + Math.random() * randomRange) * 1000;
          track.timeoutId = setTimeout(() => {
            this.playTrack(track);
          }, randomDelay);
        };
      } else if (track.loopMode === 'play-once') {
        // Applica fade out automatico quando finisce
        source.onended = () => {
          this.stopTrack(track);
        };
      }
    } else {
      // Buffer non ancora caricato, carica prima
      this.loadAudioBuffer(track,
        (audioBuffer) => {
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
  stopTrack(track) {
    if (track.source && track.gainNode) {
      // Se fade out è disabilitato, interrompi immediatamente
      if (!track.fadeOutEnabled) {
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
        if (track.lowFilter) track.lowFilter.disconnect();
        if (track.midFilter) track.midFilter.disconnect();
        if (track.highFilter) track.highFilter.disconnect();
        track.lowFilter = null;
        track.midFilter = null;
        track.highFilter = null;
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
          if (track.lowFilter) track.lowFilter.disconnect();
          if (track.midFilter) track.midFilter.disconnect();
          if (track.highFilter) track.highFilter.disconnect();
          track.lowFilter = null;
          track.midFilter = null;
          track.highFilter = null;
        }, fadeTime * 1000);
      }
    }
    if (track.timeoutId) {
      clearTimeout(track.timeoutId);
      track.timeoutId = null;
    }
  }
}
