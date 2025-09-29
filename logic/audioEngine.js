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

    if (track.isRemoved || track.isPlaying || track.isLoading) return;

    track.isLoading = true;

    if (this.buffers[track.soundPath]) {
      track.isLoading = false;
      this.doPlayTrack(track);
    } else {
      console.log('Buffer not available, loading first...');
      // Buffer non ancora caricato, carica prima
      this.loadAudioBuffer(track,
        (audioBuffer) => {
          console.log('Buffer loaded, now playing...');
          track.isLoading = false;
          this.doPlayTrack(track);
        },
        (error) => {
          console.error('Errore caricamento audio per playTrack:', error);
          track.isLoading = false;
        }
      );
    }
  }

  // Effettua la riproduzione effettiva del traccia, assumes buffer is loaded
  doPlayTrack(track) {
    track.isPlaying = true;

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

      // Apply automation immediately after starting playback
      if (track.automationEnabled) {
        this.applyVolumeAutomation(track, ctx, source, gainNode);
        this.applyPanAutomation(track, ctx, pannerNode);
      }

      // Gestisci probabilistic spawn se abilitato
      if (track.probabilisticSpawn.enabled) {
        this.scheduleProbabilisticSpawn(track);
      }

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
      track.isPlaying = false;
      throw error;
    }
  }

  // Apply volume automation dynamically
  applyVolumeAutomation(track, ctx, source, gainNode, forceReplay = false) {
    if (!gainNode || !track.gainNode || !track.automationEnabled) return;

    const auto = track.volumeAutomation;
    const duration = auto.duration;
    const startVol = auto.startVol;
    const endVol = auto.endVol;
    const currentTime = ctx.currentTime;

    console.log(`Applying ${auto.type} volume automation: ${startVol} to ${endVol} over ${duration}s`);

    // Track automation start time for manual value calculation
    track.volumeAutomationStartTime = currentTime;

    // Cancella eventuali automazioni precedenti
    gainNode.gain.cancelScheduledValues(currentTime);

    // Imposta volume iniziale
    gainNode.gain.setValueAtTime(startVol, currentTime);

    // Applica il tipo di automazione
    if (auto.type === 'linear') {
      gainNode.gain.linearRampToValueAtTime(endVol, currentTime + duration);
    } else if (auto.type === 'exponential') {
      // Per exponential, evitiamo valori zero che causano errori
      const safeStartVol = Math.max(startVol, 0.01);
      const safeEndVol = Math.max(endVol, 0.01);
      gainNode.gain.setValueAtTime(safeStartVol, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(safeEndVol, currentTime + duration);
    } else if (auto.type === 'sinusoidal') {
      // Applica oscillazione sinusoidale ciclica
      this.applySinusoidalVolumeAutomation(gainNode.gain, auto, currentTime);
    }

    // If cycling is enabled and not forced replay, schedule next application with swapped values for smoothness
    if (auto.cycle && !forceReplay) {
      const originalStart = auto.startVol;
      auto.startVol = auto.endVol;
      auto.endVol = originalStart;
      track.volumeAutomationTimeout = setTimeout(() => {
        if (track.source && !track.isRemoved && track.automationEnabled) {
          this.applyVolumeAutomation(track, ctx, source, gainNode);
        }
      }, duration * 1000);
    }
  }

  // Apply pan automation dynamically
  applyPanAutomation(track, ctx, pannerNode, forceReplay = false) {
    if (!pannerNode || !track.pannerNode || !track.panAutomation.enabled) return;

    const auto = track.panAutomation;
    const duration = auto.duration;
    const direction = auto.direction;
    const currentTime = ctx.currentTime;

    console.log(`Applying pan automation: ${direction} over ${duration}s`);

    // Track automation start time for manual value calculation
    track.panAutomationStartTime = currentTime;

    pannerNode.pan.cancelScheduledValues(currentTime);

    if (direction === 'left-right') {
      pannerNode.pan.setValueAtTime(-1, currentTime);
      pannerNode.pan.linearRampToValueAtTime(1, currentTime + duration);
    } else if (direction === 'right-left') {
      pannerNode.pan.setValueAtTime(1, currentTime);
      pannerNode.pan.linearRampToValueAtTime(-1, currentTime + duration);
    } else if (direction === 'bouncing') {
      // Applica oscillazioni ripetute
      this.applyBouncingPanAutomation(pannerNode.pan, duration, currentTime);
    }

    // If cycling is enabled and not forced replay, schedule next application with reversed direction for smoothness
    if (auto.cycle && !forceReplay) {
      // Swap direction for continuous cycling
      if (auto.direction === 'left-right') {
        auto.direction = 'right-left';
      } else if (auto.direction === 'right-left') {
        auto.direction = 'left-right';
      }
      // For bouncing, no change needed as it cycles internally
      track.panAutomationTimeout = setTimeout(() => {
        if (track.source && !track.isRemoved && track.panAutomation.enabled) {
          this.applyPanAutomation(track, ctx, pannerNode);
        }
      }, duration * 1000);
    }
  }

  // Apply sinusoidal volume automation (cyclic based on cycle)
  applySinusoidalVolumeAutomation(gainParam, auto, startTime) {
    const duration = auto.duration;
    const startVol = auto.startVol;
    const endVol = auto.endVol;
    const steps = Math.ceil(duration * 100); // 100 points per second for smoothness

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const sinVal = Math.sin(2 * Math.PI * progress - Math.PI / 2);
      const normalized = (sinVal + 1) / 2; // 0 to 1
      const value = startVol + (endVol - startVol) * normalized;
      const time = startTime + progress * duration;
      gainParam.setValueAtTime(Math.max(0.01, value), time);
    }
  }

  // Apply bouncing pan automation (cyclic based on cycle)
  applyBouncingPanAutomation(panParam, duration, startTime) {
    const steps = 10; // 10 bounces
    const stepDuration = duration / steps;
    let time = startTime;
    for (let i = 0; i < steps; i++) {
      panParam.setValueAtTime(i % 2 === 0 ? -1 : 1, time);
      panParam.linearRampToValueAtTime(i % 2 === 0 ? 1 : -1, time + stepDuration);
      time += stepDuration;
    }
  }

  // Pianifica spawn probabilistico
  scheduleProbabilisticSpawn(track) {
    // Cancella precedente timeout se esiste
    if (track.probabilisticSpawnTimeoutId) {
      clearTimeout(track.probabilisticSpawnTimeoutId);
      track.probabilisticSpawnTimeoutId = null;
    }

    // Non pianificare se probabilistic spawn non è abilitato o traccia è rimossa
    if (!track.probabilisticSpawn.enabled || track.isRemoved) {
      return;
    }

    const spawn = track.probabilisticSpawn;
    const minDelay = spawn.minInterval;
    const maxDelay = spawn.maxInterval;
    const probability = spawn.spawnProbability;

    const scheduleNextSpawn = () => {
      const delayMs = (minDelay + Math.random() * (maxDelay - minDelay)) * 1000;
      console.log(`Scheduling next probabilistic spawn for ${track.soundPath} in ${(delayMs/1000).toFixed(1)}s`);

      track.probabilisticSpawnTimeoutId = setTimeout(() => {
        // Double check conditions before executing
        if (track.isRemoved || !track.probabilisticSpawn.enabled) {
          return;
        }

        // Controlla probabilità
        if (Math.random() < probability) {
          console.log(`🎲 Probabilistic spawn triggered for ${track.soundPath}, will play after fade-in`);
          // Riproduci se non sta già suonando
          if (!track.source) {
            this.playTrack(track);
          }
        }

        // Continua solo se probabilistic spawn è ancora abilitato e traccia valida
        if (track.probabilisticSpawn.enabled && !track.isRemoved) {
          scheduleNextSpawn();
        }
      }, delayMs);
    };

    scheduleNextSpawn();
  }

  // Ferma traccia
  stopTrack(track, immediate = false) {
    track.isPlaying = false;

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

    // Clear automation timeouts
    if (track.volumeAutomationTimeout) {
      clearTimeout(track.volumeAutomationTimeout);
      track.volumeAutomationTimeout = null;
    }
    if (track.panAutomationTimeout) {
      clearTimeout(track.panAutomationTimeout);
      track.panAutomationTimeout = null;
    }
    if (track.probabilisticSpawnTimeoutId) {
      clearTimeout(track.probabilisticSpawnTimeoutId);
      track.probabilisticSpawnTimeoutId = null;
    }
    if (track.timeoutId) {
      clearTimeout(track.timeoutId);
      track.timeoutId = null;
    }
  }

  // Apply automations for a playing track
  applyAutomationsToPlayingTrack(track) {
    if (!track.source || !track.gainNode || !track.pannerNode) return;

    const ctx = this.getAudioContext();

    if (track.automationEnabled) {
      this.applyVolumeAutomation(track, ctx, track.source, track.gainNode, true);
      this.applyPanAutomation(track, ctx, track.pannerNode, true);
    }

    if (track.probabilisticSpawn.enabled) {
      this.scheduleProbabilisticSpawn(track);
    }
  }
}
