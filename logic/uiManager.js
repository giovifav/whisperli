// UI Manager: Gestisce l'interfaccia utente (categorie, eventi)

import { soundFiles, soundData } from '../data/soundData.js';

// Helper to get display name from filename
function getDisplayName(filename) {
  const sound = soundData.find(s => s.filename === filename);
  return sound ? sound.displayName : filename.replace(/\.\w+$/, '').replace(/_/g, ' ');
}

export class UIManager {
  constructor(audioEngine, mixerController) {
    this.audioEngine = audioEngine;
    this.mixerController = mixerController;
    this.categoryElements = {};
    // Update sliders smoothly to reflect current automated values
    this.updatePlaying = () => {
      this.updatePlayingTrackSliders();
      requestAnimationFrame(this.updatePlaying);
    };
    this.sliderUpdateInterval = requestAnimationFrame(this.updatePlaying);

    // Event listener for window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  // Helper method to check if in desktop mode
  isDesktopMode() {
    return window.innerWidth > 768; // Using 768px as a breakpoint for desktop
  }

  // Inizializza categorie nell'UI
  initCategories() {
    const categoriesEl = document.getElementById('categories');
    Object.keys(soundFiles).forEach(category => {
      const catDiv = document.createElement('div');
      catDiv.className = 'category'; // Start without collapsed/expanded class
      catDiv.innerHTML = `<h3>${category.toUpperCase()}</h3><div class="sound-list">`;
      const soundList = catDiv.querySelector('.sound-list');
      console.log(`Initializing category: ${category}, sounds count: ${soundFiles[category].length}`);
      soundFiles[category].forEach(sound => {
        console.log(`Sound: ${sound.filename} -> ${sound.displayName}`);
        const soundDiv = document.createElement('div');
        soundDiv.className = 'sound';
        soundDiv.innerHTML = `<button class="add-sound" data-path="sounds/${sound.category}/${sound.filename}">${sound.displayName}</button>`;
        soundList.appendChild(soundDiv);
      });
      categoriesEl.appendChild(catDiv);
      this.categoryElements[category] = catDiv;

      // Set categories as collapsed by default
      catDiv.classList.add('collapsed');

      // Click handler per espandere/collassare
      const h3 = catDiv.querySelector('h3');
      h3.addEventListener('click', () => {
        const isExpanded = soundList.classList.contains('show');
        if (!isExpanded) {
          soundList.classList.add('show');
          catDiv.classList.add('expanded');
          catDiv.classList.remove('collapsed');
        } else {
          soundList.classList.remove('show');
          catDiv.classList.remove('expanded');
          catDiv.classList.add('collapsed');
        }
      });
    });

    // Add search functionality
    const searchInput = document.getElementById('sound-search');
    searchInput.addEventListener('input', (e) => this.applySearchFilter(e.target.value));

    // Inizializzato categorie con click semplice
  }

  // Handle window resize to adjust category states
  handleResize() {
    const isDesktop = this.isDesktopMode();
    Object.keys(this.categoryElements).forEach(category => {
      const catDiv = this.categoryElements[category];
      const soundList = catDiv.querySelector('.sound-list');
      const h3 = catDiv.querySelector('h3');

      if (isDesktop) {
        soundList.classList.add('show');
        catDiv.classList.add('expanded');
        catDiv.classList.remove('collapsed');
      } else {
        // If not in desktop mode, revert to collapsed state
        soundList.classList.remove('show');
        catDiv.classList.remove('expanded');
        catDiv.classList.add('collapsed');
      }
    });
  }

  // Sistema click semplice per aggiungere suoni

  // Aggiungi suono al mixer
  addToMixer(soundPath) {
    console.log('addToMixer called for:', soundPath);
    let track = this.mixerController.getTrack(soundPath);
    console.log('existing track?', !!track);
    if (!track) {
      track = this.mixerController.addTrack(soundPath);
      console.log('added new track?', !!track);
    }
    if (!track) {
      console.log('failed to add track');
      return; // Non riuscito ad aggiungere
    }

    const uiExists = document.querySelector(`#tracks [data-path="${soundPath}"]`);
    console.log('UI already exists?', !!uiExists);
    if (uiExists) {
      console.log('UI already in mixer, returning');
      return; // Già presente nell'UI
    }

    console.log('creating UI for track');
    const trackEl = document.createElement('div');
    trackEl.className = 'track';
    trackEl.dataset.path = soundPath;
    trackEl.innerHTML = `
      <div class="track-header">
      <div class="track-info">
        <h4>${getDisplayName(soundPath.split('/').pop())}</h4>
        <div class="control-group">
          <label><i class="fas fa-volume-up"></i> Volume</label>
          <input type="range" min="0" max="1" step="0.01" value="0.5" class="volume-slider">
        </div>
        <div class="volume-indicator">
          <div class="volume-level">
            <div class="volume-fill"></div>
          </div>
        </div>
      </div>
        <div class="track-actions">
          <button class="remove-track" title="Rimuovi traccia"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="advanced-toggle">
        <button class="toggle-advanced" title="Opzioni avanzate"><i class="fas fa-cog"></i> Advanced Controls</button>
      </div>
      <div class="track-controls advanced hidden">
        <!-- Tab Navigation -->
        <div class="control-tabs">
          <button class="tab-button active" data-tab="basic">Basic</button>
          <button class="tab-button" data-tab="loop">Loop</button>
          <button class="tab-button" data-tab="automation">Automation</button>
        </div>

        <!-- Basic Tab -->
        <div class="tab-content active" data-tab="basic">
          <div class="control-row">
            <div class="control-group">
              <label><i class="fas fa-sliders-h"></i> Pan</label>
              <input type="range" min="-1" max="1" step="0.01" value="0" class="pan-slider">
            </div>
          </div>

          <div class="control-row">
            <div class="control-group">
              <label>
                <input type="checkbox" checked class="fade-in-enabled"> <i class="fas fa-sun"></i> Fade In
              </label>
              <input type="range" min="0" max="5" step="0.1" value="1.0" class="fade-in-slider">
              <span class="fade-value">1.0s</span>
            </div>
            <div class="control-group">
              <label>
                <input type="checkbox" checked class="fade-out-enabled"> <i class="fas fa-moon"></i> Fade Out
              </label>
              <input type="range" min="0" max="5" step="0.1" value="1.0" class="fade-out-slider">
              <span class="fade-value">1.0s</span>
            </div>
          </div>
        </div>

        <!-- Loop Tab -->
        <div class="tab-content" data-tab="loop">
          <div class="control-row">
            <div class="control-group full-width">
              <label><i class="fas fa-redo"></i> Loop Mode</label>
              <select class="loop-mode">
                <option value="loop">Loop</option>
                <option value="interval">Interval</option>
                <option value="random-interval">Random Interval</option>
                <option value="play-once">Play Once</option>
              </select>
              <div class="interval-settings" style="display:none;">
                <div class="interval-input-container">
                  <span class="interval-label">Sec:</span>
                  <input type="number" min="1" max="300" value="30" class="interval-sec" aria-label="Seconds">
                  <span class="random-interval-label" style="display:none;">Range:</span>
                  <input type="number" min="1" max="300" value="15" class="min-interval-sec" aria-label="Min Seconds" style="display:none;">
                  <span class="to-label" style="display:none;">to</span>
                  <input type="number" min="1" max="300" value="45" class="max-interval-sec" aria-label="Max Seconds" style="display:none;">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Automation Tab -->
        <div class="tab-content" data-tab="automation">
          <div class="control-row">
            <div class="control-group full-width">
              <label>
                <input type="checkbox" class="automation-enabled"> <i class="fas fa-bolt"></i> Temporal Automation
              </label>
            </div>
          </div>
          <div class="control-row temporali-automatismi hidden">
            <div class="control-group">
              <label><i class="fas fa-chart-line"></i> Volume Automation:</label>
              <select class="volume-automation-type">
                <option value="linear">Linear</option>
                <option value="exponential">Exponential</option>
                <option value="sinusoidal">Sinusoidal</option>
              </select>
              <br>
              <label>Duration (s):</label>
              <input type="number" min="1" max="300" value="10" class="volume-automation-duration">
              <label>Start Vol:</label>
              <input type="range" min="0" max="1" step="0.01" value="0.0" class="volume-automation-start">
              <label>End Vol:</label>
              <input type="range" min="0" max="1" step="0.01" value="0.8" class="volume-automation-end">
              <br>
              <label><input type="checkbox" class="volume-automation-cycle"> Cyclic</label>
            </div>
            <div class="control-group">
              <label>
                <input type="checkbox" class="pan-automation-enabled"> <i class="fas fa-sliders-h"></i> Pan Automation
              </label>
              <br>
              <label>Duration (s):</label>
              <input type="number" min="1" max="300" value="10" class="pan-automation-duration">
              <label>Direction:</label>
              <select class="pan-automation-direction">
                <option value="left-right">Left → Right</option>
                <option value="right-left">Right → Left</option>
                <option value="bouncing">Bouncing</option>
              </select>
              <br>
              <label><input type="checkbox" class="pan-automation-cycle"> Cyclic</label>
            </div>
            <div class="control-group">
              <label>
                <input type="checkbox" class="probabilistic-spawn-enabled"> <i class="fas fa-dice"></i> Probabilistic Spawn
              </label>
              <br>
              <label>Min Interval (s):</label>
              <input type="number" min="1" max="300" value="10" class="spawn-min-interval">
              <label>Max Interval (s):</label>
              <input type="number" min="1" max="300" value="30" class="spawn-max-interval">
              <label>Probability:</label>
              <input type="range" min="0.01" max="1" step="0.01" value="0.3" class="spawn-probability">
            </div>
          </div>
        </div>
      </div>
    `;

    console.log('appending trackEl to #tracks');
    const tracksEl = document.getElementById('tracks');
    console.log('#tracks element found:', !!tracksEl);
    tracksEl.appendChild(trackEl);
    console.log('tracks children count after append:', tracksEl.children.length);
    tracksEl.scrollTop = tracksEl.scrollHeight; // Scroll to show the newly added track

    // Event listeners per la track
    const volumeSlider = trackEl.querySelector('.volume-slider');
    const panSlider = trackEl.querySelector('.pan-slider');
    const fadeInEnabled = trackEl.querySelector('.fade-in-enabled');
    const fadeOutEnabled = trackEl.querySelector('.fade-out-enabled');
    const fadeInSlider = trackEl.querySelector('.fade-in-slider');
    const fadeOutSlider = trackEl.querySelector('.fade-out-slider');
    const loopModeSelect = trackEl.querySelector('.loop-mode');
    const intervalSecInput = trackEl.querySelector('.interval-sec');
    const minIntervalSecInput = trackEl.querySelector('.min-interval-sec');
    const maxIntervalSecInput = trackEl.querySelector('.max-interval-sec');
    const intervalLabel = trackEl.querySelector('.interval-label');
    const randomIntervalLabel = trackEl.querySelector('.random-interval-label');
    const toLabel = trackEl.querySelector('.to-label');

    volumeSlider.addEventListener('input', (e) => {
      track.volume = parseFloat(e.target.value);
      if (track.gainNode) {
        const ctx = this.audioEngine.getAudioContext();
        track.gainNode.gain.setValueAtTime(track.volume, ctx.currentTime);
      }
    });

    panSlider.addEventListener('input', (e) => {
      track.pan = parseFloat(e.target.value);
      if (track.pannerNode) track.pannerNode.pan.value = track.pan;
    });



    fadeInEnabled.addEventListener('change', (e) => {
      track.fadeInEnabled = e.target.checked;
    });

    fadeOutEnabled.addEventListener('change', (e) => {
      track.fadeOutEnabled = e.target.checked;
    });

    fadeInSlider.addEventListener('input', (e) => {
      track.fadeInDuration = parseFloat(e.target.value);
      e.target.nextElementSibling.textContent = `${track.fadeInDuration.toFixed(1)}s`;
    });

    fadeOutSlider.addEventListener('input', (e) => {
      track.fadeOutDuration = parseFloat(e.target.value);
      e.target.nextElementSibling.textContent = `${track.fadeOutDuration.toFixed(1)}s`;
    });

    loopModeSelect.addEventListener('change', (e) => {
      track.loopMode = e.target.value;
      const intervalSettings = trackEl.querySelector('.interval-settings');
      intervalSettings.style.display = (track.loopMode === 'interval' || track.loopMode === 'random-interval') ? 'block' : 'none';

      // Mostra/nasconde campi specifici
      this.updateIntervalUI(trackEl, track.loopMode);
    });

    intervalSecInput.addEventListener('input', (e) => {
      track.intervalSec = parseInt(e.target.value) || 30;
    });

    minIntervalSecInput.addEventListener('input', (e) => {
      track.minIntervalSec = parseInt(e.target.value) || 15;
    });

    maxIntervalSecInput.addEventListener('input', (e) => {
      track.maxIntervalSec = parseInt(e.target.value) || 45;
    });

    // Event listeners per automatismi temporali
    const automationEnabled = trackEl.querySelector('.automation-enabled');
    const temporaliAutomatismiDiv = trackEl.querySelector('.temporali-automatismi');

    automationEnabled.addEventListener('change', (e) => {
      track.automationEnabled = e.target.checked;
      temporaliAutomatismiDiv.classList.toggle('hidden', !e.target.checked);
      // Hide/show volume slider based on automation state
      const volumeSlider = trackEl.querySelector('.volume-slider');
      volumeSlider.style.display = e.target.checked ? 'none' : 'inline-block';
      if (track.source) {
        // Apply immediately if playing
        this.audioEngine.applyAutomationsToPlayingTrack(track);
      }
    });

    // Volume automation
    const volumeAutomationType = trackEl.querySelector('.volume-automation-type');
    const volumeAutomationDuration = trackEl.querySelector('.volume-automation-duration');
    const volumeAutomationStart = trackEl.querySelector('.volume-automation-start');
    const volumeAutomationEnd = trackEl.querySelector('.volume-automation-end');

    volumeAutomationType.addEventListener('change', (e) => {
      track.volumeAutomation.type = e.target.value;
      if (track.source) this.audioEngine.applyAutomationsToPlayingTrack(track);
    });

    volumeAutomationDuration.addEventListener('input', (e) => {
      track.volumeAutomation.duration = parseInt(e.target.value) || 10;
      if (track.source) this.audioEngine.applyAutomationsToPlayingTrack(track);
    });

    volumeAutomationStart.addEventListener('input', (e) => {
      track.volumeAutomation.startVol = parseFloat(e.target.value);
      if (track.source) this.audioEngine.applyAutomationsToPlayingTrack(track);
    });

    volumeAutomationEnd.addEventListener('input', (e) => {
      track.volumeAutomation.endVol = parseFloat(e.target.value);
      if (track.source) this.audioEngine.applyAutomationsToPlayingTrack(track);
    });

    const volumeAutomationCycle = trackEl.querySelector('.volume-automation-cycle');
    volumeAutomationCycle.addEventListener('change', (e) => {
      track.volumeAutomation.cycle = e.target.checked;
      if (track.source) this.audioEngine.applyAutomationsToPlayingTrack(track);
    });

    // Pan automation
    const panAutomationEnabled = trackEl.querySelector('.pan-automation-enabled');
    const panAutomationDuration = trackEl.querySelector('.pan-automation-duration');
    const panAutomationDirection = trackEl.querySelector('.pan-automation-direction');

    panAutomationEnabled.addEventListener('change', (e) => {
      track.panAutomation.enabled = e.target.checked;
      // Hide/show pan slider based on pan automation state
      const panSlider = trackEl.querySelector('.pan-slider');
      panSlider.style.display = e.target.checked ? 'none' : 'inline-block';
      if (track.source) this.audioEngine.applyAutomationsToPlayingTrack(track);
    });

    panAutomationDuration.addEventListener('input', (e) => {
      track.panAutomation.duration = parseInt(e.target.value) || 10;
      if (track.source) this.audioEngine.applyAutomationsToPlayingTrack(track);
    });

    panAutomationDirection.addEventListener('change', (e) => {
      track.panAutomation.direction = e.target.value;
      if (track.source) this.audioEngine.applyAutomationsToPlayingTrack(track);
    });

    const panAutomationCycle = trackEl.querySelector('.pan-automation-cycle');
    panAutomationCycle.addEventListener('change', (e) => {
      track.panAutomation.cycle = e.target.checked;
      if (track.source) this.audioEngine.applyAutomationsToPlayingTrack(track);
    });

    // Probabilistic spawn
    const probabilisticSpawnEnabled = trackEl.querySelector('.probabilistic-spawn-enabled');
    const spawnMinInterval = trackEl.querySelector('.spawn-min-interval');
    const spawnMaxInterval = trackEl.querySelector('.spawn-max-interval');
    const spawnProbability = trackEl.querySelector('.spawn-probability');

    probabilisticSpawnEnabled.addEventListener('change', (e) => {
      track.probabilisticSpawn.enabled = e.target.checked;
    });

    spawnMinInterval.addEventListener('input', (e) => {
      track.probabilisticSpawn.minInterval = parseInt(e.target.value) || 10;
    });

    spawnMaxInterval.addEventListener('input', (e) => {
      track.probabilisticSpawn.maxInterval = parseInt(e.target.value) || 30;
    });

    spawnProbability.addEventListener('input', (e) => {
      track.probabilisticSpawn.spawnProbability = parseFloat(e.target.value);
    });

    // Toggle advanced options
    const toggleBtn = trackEl.querySelector('.toggle-advanced');
    const advancedControls = trackEl.querySelector('.track-controls.advanced');

    toggleBtn.addEventListener('click', () => {
      const isHidden = advancedControls.classList.contains('hidden');
      advancedControls.classList.toggle('hidden', !isHidden);
      toggleBtn.innerHTML = isHidden ? '<i class="fas fa-cog"></i> Hide Advanced' : '<i class="fas fa-cog"></i> Advanced Controls';
    });

    // Tab switching functionality
    const tabButtons = trackEl.querySelectorAll('.tab-button');
    const tabContents = trackEl.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;

        // Remove active class from all tabs and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        e.target.classList.add('active');
        const targetContent = trackEl.querySelector(`.tab-content[data-tab="${targetTab}"]`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });

    trackEl.querySelector('.remove-track').addEventListener('click', () => {
      this.mixerController.removeTrack(track);
      trackEl.remove();
    });

    // Imposta initial display per loop mode
    this.updateIntervalUI(trackEl, track.loopMode);
  }

  // Aggiorna UI di una track dopo load mix
  updateTrackUI(track) {
    const trackEl = document.querySelector(`[data-path="${track.soundPath}"]`);
    if (trackEl) {
      // Update volume (always visible)
      trackEl.querySelector('.volume-slider').value = track.volume;

      // Update advanced controls (need to check if they exist since they might be hidden)
      const panSlider = trackEl.querySelector('.pan-slider');
      if (panSlider) panSlider.value = track.pan;



      const fadeInEnabled = trackEl.querySelector('.fade-in-enabled');
      if (fadeInEnabled) fadeInEnabled.checked = track.fadeInEnabled !== false;

      const fadeOutEnabled = trackEl.querySelector('.fade-out-enabled');
      if (fadeOutEnabled) fadeOutEnabled.checked = track.fadeOutEnabled !== false;

      const fadeInSlider = trackEl.querySelector('.fade-in-slider');
      if (fadeInSlider) {
        fadeInSlider.value = track.fadeInDuration;
        fadeInSlider.nextElementSibling.textContent = `${track.fadeInDuration.toFixed(1)}s`;
      }

      const fadeOutSlider = trackEl.querySelector('.fade-out-slider');
      if (fadeOutSlider) {
        fadeOutSlider.value = track.fadeOutDuration;
        fadeOutSlider.nextElementSibling.textContent = `${track.fadeOutDuration.toFixed(1)}s`;
      }

      const loopModeSelect = trackEl.querySelector('.loop-mode');
      if (loopModeSelect) loopModeSelect.value = track.loopMode;

      const intervalSecInput = trackEl.querySelector('.interval-sec');
      if (intervalSecInput) intervalSecInput.value = track.intervalSec;

      if (track.minIntervalSec !== undefined) {
        const minIntervalSecInput = trackEl.querySelector('.min-interval-sec');
        if (minIntervalSecInput) minIntervalSecInput.value = track.minIntervalSec;
      }

      if (track.maxIntervalSec !== undefined) {
        const maxIntervalSecInput = trackEl.querySelector('.max-interval-sec');
        if (maxIntervalSecInput) maxIntervalSecInput.value = track.maxIntervalSec;
      }

      const intervalSettings = trackEl.querySelector('.interval-settings');
      if (intervalSettings) {
        intervalSettings.style.display = (track.loopMode === 'interval' || track.loopMode === 'random-interval') ? 'inline' : 'none';
      }

      // Nuovo: Aggiorna automatismi temporali
      const automationEnabled = trackEl.querySelector('.automation-enabled');
      if (automationEnabled) {
        automationEnabled.checked = track.automationEnabled || false;
        const temporaliAutomatismiDiv = trackEl.querySelector('.temporali-automatismi');
        if (temporaliAutomatismiDiv) {
          temporaliAutomatismiDiv.classList.toggle('hidden', !(track.automationEnabled || false));
        }
        // Hide/show volume slider based on automation state
        const volumeSlider = trackEl.querySelector('.volume-slider');
        if (volumeSlider) volumeSlider.style.display = (track.automationEnabled || false) ? 'none' : 'inline-block';
      }

      if (track.volumeAutomation) {
        const volumeAutomationType = trackEl.querySelector('.volume-automation-type');
        const volumeAutomationDuration = trackEl.querySelector('.volume-automation-duration');
        const volumeAutomationStart = trackEl.querySelector('.volume-automation-start');
        const volumeAutomationEnd = trackEl.querySelector('.volume-automation-end');

        if (volumeAutomationType) volumeAutomationType.value = track.volumeAutomation.type || 'linear';
        if (volumeAutomationDuration) volumeAutomationDuration.value = track.volumeAutomation.duration || 10;
        if (volumeAutomationStart) volumeAutomationStart.value = track.volumeAutomation.startVol || 0.0;
        if (volumeAutomationEnd) volumeAutomationEnd.value = track.volumeAutomation.endVol || 0.8;
      }

      if (track.volumeAutomation && track.volumeAutomation.cycle !== undefined) {
        const volumeAutomationCycle = trackEl.querySelector('.volume-automation-cycle');
        if (volumeAutomationCycle) volumeAutomationCycle.checked = track.volumeAutomation.cycle;
      }

      if (track.panAutomation) {
        const panAutomationEnabled = trackEl.querySelector('.pan-automation-enabled');
        const panAutomationDuration = trackEl.querySelector('.pan-automation-duration');
        const panAutomationDirection = trackEl.querySelector('.pan-automation-direction');

        if (panAutomationEnabled) {
          panAutomationEnabled.checked = track.panAutomation.enabled || false;
          // Hide/show pan slider based on pan automation state
          const panSlider = trackEl.querySelector('.pan-slider');
          if (panSlider) panSlider.style.display = (track.panAutomation.enabled || false) ? 'none' : 'inline-block';
        }
        if (panAutomationDuration) panAutomationDuration.value = track.panAutomation.duration || 10;
        if (panAutomationDirection) panAutomationDirection.value = track.panAutomation.direction || 'left-right';
      }

      if (track.panAutomation && track.panAutomation.cycle !== undefined) {
        const panAutomationCycle = trackEl.querySelector('.pan-automation-cycle');
        if (panAutomationCycle) panAutomationCycle.checked = track.panAutomation.cycle;
      }

      if (track.probabilisticSpawn) {
        const probabilisticSpawnEnabled = trackEl.querySelector('.probabilistic-spawn-enabled');
        const spawnMinInterval = trackEl.querySelector('.spawn-min-interval');
        const spawnMaxInterval = trackEl.querySelector('.spawn-max-interval');
        const spawnProbability = trackEl.querySelector('.spawn-probability');

        if (probabilisticSpawnEnabled) probabilisticSpawnEnabled.checked = track.probabilisticSpawn.enabled || false;
        if (spawnMinInterval) spawnMinInterval.value = track.probabilisticSpawn.minInterval || 10;
        if (spawnMaxInterval) spawnMaxInterval.value = track.probabilisticSpawn.maxInterval || 30;
        if (spawnProbability) spawnProbability.value = track.probabilisticSpawn.spawnProbability || 0.3;
      }

      // Aggiorna display per loop mode
      this.updateIntervalUI(trackEl, track.loopMode);
    }
  }

  // Helper per aggiornare la visibilità degli elementi di intervalo
  updateIntervalUI(trackEl, loopMode) {
    const intervalSecInput = trackEl.querySelector('.interval-sec');
    const intervalLabel = trackEl.querySelector('.interval-label');
    const randomIntervalLabel = trackEl.querySelector('.random-interval-label');
    const minIntervalSecInput = trackEl.querySelector('.min-interval-sec');
    const toLabel = trackEl.querySelector('.to-label');
    const maxIntervalSecInput = trackEl.querySelector('.max-interval-sec');

    // Mostra/nasconde campi specifici
    const isInterval = loopMode === 'interval';
    const isRandomInterval = loopMode === 'random-interval';

    // Usa display flexbox per disposizione orizzontale appropriata
    const flexDisplay = 'inline-flex';
    const hideDisplay = 'none';

    intervalSecInput.style.display = isInterval ? flexDisplay : hideDisplay;
    intervalLabel.style.display = isInterval ? flexDisplay : hideDisplay;
    randomIntervalLabel.style.display = isRandomInterval ? flexDisplay : hideDisplay;
    minIntervalSecInput.style.display = isRandomInterval ? flexDisplay : hideDisplay;
    toLabel.style.display = isRandomInterval ? flexDisplay : hideDisplay;
    maxIntervalSecInput.style.display = isRandomInterval ? flexDisplay : hideDisplay;
  }

  // Get current automated volume value
  getCurrentAutomatedVolume(track) {
    if (!track.automationEnabled || !track.volumeAutomationStartTime) {
      return track.gainNode ? track.gainNode.gain.value : track.volume;
    }

    const auto = track.volumeAutomation;
    const ctx = this.audioEngine.getAudioContext();
    const elapsed = ctx.currentTime - track.volumeAutomationStartTime;
    const progress = Math.min(elapsed / auto.duration, 1.0); // Cap at 1.0 for finished automation

    if (auto.type === 'linear') {
      return auto.startVol + progress * (auto.endVol - auto.startVol);
    } else if (auto.type === 'exponential') {
      const startVol = Math.max(auto.startVol, 0.01);
      const endVol = Math.max(auto.endVol, 0.01);
      const ratio = endVol / startVol;
      return startVol * Math.pow(ratio, progress);
    } else if (auto.type === 'sinusoidal') {
      const sinVal = Math.sin(2 * Math.PI * progress - Math.PI / 2);
      const normalized = (sinVal + 1) / 2; // 0 to 1
      return auto.startVol + (auto.endVol - auto.startVol) * normalized;
    }

    return track.volume;
  }

  // Get current automated pan value
  getCurrentAutomatedPan(track) {
    if (!track.panAutomation.enabled || !track.panAutomationStartTime) {
      return track.pannerNode ? track.pannerNode.pan.value : track.pan;
    }

    const auto = track.panAutomation;
    const ctx = this.audioEngine.getAudioContext();
    const elapsed = ctx.currentTime - track.panAutomationStartTime;
    const progress = Math.min(elapsed / auto.duration, 1.0);

    if (auto.direction === 'left-right') {
      return -1 + progress * 2; // from -1 to 1
    } else if (auto.direction === 'right-left') {
      return 1 - progress * 2; // from 1 to -1
    } else if (auto.direction === 'bouncing') {
      // For bouncing, calculate the position based on bouncing pattern
      const steps = 10;
      const stepProgress = (elapsed % (auto.duration / steps)) / (auto.duration / steps);
      const currentStep = Math.floor((elapsed / auto.duration) * steps) % steps;
      const start = currentStep % 2 === 0 ? -1 : 1;
      const end = currentStep % 2 === 0 ? 1 : -1;
      return start + stepProgress * (end - start);
    }

    return track.pan;
  }

  // Update sliders and visual indicators to reflect current automated values every frame
  updatePlayingTrackSliders() {
    const tracks = this.mixerController.getTracks();
    tracks.forEach(track => {
      const trackEl = document.querySelector(`[data-path="${track.soundPath}"]`);
      if (!trackEl) return;

      // Update track status classes
      this.updateTrackStatus(trackEl, track);

      // Update sliders for automation feedback
      if (track.source) {
        const volumeSlider = trackEl.querySelector('.volume-slider');
        if (volumeSlider) {
          const currentVol = this.getCurrentAutomatedVolume(track);
          volumeSlider.value = currentVol;
        }
        const panSlider = trackEl.querySelector('.pan-slider');
        if (panSlider) {
          const currentPan = this.getCurrentAutomatedPan(track);
          panSlider.value = currentPan;
        }
      }

      // Update audio level indicator
      this.updateAudioLevelIndicator(trackEl, track);
    });
  }

  // Update visual track status indicators
  updateTrackStatus(trackEl, track) {
    // Remove existing status classes
    trackEl.classList.remove('playing', 'loading', 'error', 'automation-active');

    // Add appropriate status classes
    if (track.source) {
      trackEl.classList.add('playing');
    }
    if (track.isLoading) {
      trackEl.classList.add('loading');
    }
    if (track.automationEnabled) {
      trackEl.classList.add('automation-active');
    }
  }

  // Update real-time audio level visualization
  updateAudioLevelIndicator(trackEl, track) {
    const volumeFill = trackEl.querySelector('.volume-fill');
    if (!volumeFill) return;

    let level = 0;

    if (track.source && track.gainNode) {
      // For playing tracks, show current volume level
      if (track.automationEnabled) {
        level = this.getCurrentAutomatedVolume(track);
      } else {
        level = track.gainNode.gain.value;
      }
    } else if (track.isLoading) {
      // Show loading animation
      level = Math.sin(Date.now() * 0.01) * 0.3 + 0.5; // Pulsing effect
    }

    // Smooth animation with CSS transition
    volumeFill.style.width = `${Math.max(0, Math.min(100, level * 100))}%`;

    // Color based on level (green to red)
    if (level > 0.8) {
      volumeFill.style.background = 'linear-gradient(90deg, var(--success-color), var(--warning-color), var(--error-color))';
    } else if (level > 0.6) {
      volumeFill.style.background = 'linear-gradient(90deg, var(--success-color), var(--warning-color))';
    } else {
      volumeFill.style.background = 'var(--success-color)';
    }
  }

  // Apply search filter to categories and sounds
  applySearchFilter(query) {
    const lowerQuery = query.toLowerCase().trim();
    console.log(`Searching for: "${lowerQuery}"`);
    Object.keys(this.categoryElements).forEach(category => {
      const catEl = this.categoryElements[category];
      const soundList = catEl.querySelector('.sound-list');
      const h3 = catEl.querySelector('h3');
      let hasVisibleSounds = false;
      let categoryMatches = false;

      // Check if category name matches
      if (category.toLowerCase().includes(lowerQuery)) {
        categoryMatches = true;
      }

      if (lowerQuery === '') {
        // No search query, reset to collapsed state
        soundList.classList.remove('show');
        soundList.style.removeProperty('display');
        catEl.classList.remove('search-matched', 'expanded', 'show');
        catEl.classList.add('collapsed');
      } else {
        // Filter individual sounds
        const soundButtons = soundList.querySelectorAll('.add-sound');
        soundButtons.forEach(button => {
          const soundPath = button.dataset.path;
          const filename = soundPath.split('/').pop();
          const soundObj = soundData.find(s => s.filename === filename);
          let matches = false;

          if (soundObj) {
            // Check display name, category, and tags
            if (soundObj.displayName.toLowerCase().includes(lowerQuery) ||
                soundObj.category.toLowerCase().includes(lowerQuery) ||
                soundObj.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
              matches = true;
            }
          }

          const soundDiv = button.parentElement;
          soundDiv.style.display = matches ? 'inline-block' : 'none';
          if (matches) hasVisibleSounds = true;
        });

        // Show/hide category based on matches
        if (categoryMatches || hasVisibleSounds) {
          // Force category open for search results
          soundList.classList.add('show');
          catEl.classList.remove('collapsed');
          catEl.classList.add('expanded', 'search-matched');
          soundList.style.display = 'block'; // Make sure visible
        } else {
          soundList.classList.remove('show');
          soundList.style.removeProperty('display');
          catEl.classList.remove('expanded', 'search-matched');
          catEl.classList.add('collapsed');
        }
      }
    });
  }
}
