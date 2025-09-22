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
  }

  // Inizializza categorie nell'UI
  initCategories() {
    const categoriesEl = document.getElementById('categories');
    Object.keys(soundFiles).forEach(category => {
      const catDiv = document.createElement('div');
      catDiv.className = 'category collapsed';
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
            <label>🔊 Volume</label>
            <input type="range" min="0" max="1" step="0.01" value="0.5" class="volume-slider">
          </div>
        </div>
        <div class="track-actions">
          <button class="remove-track" title="Rimuovi traccia">🗑️</button>
        </div>
      </div>
      <div class="advanced-toggle">
        <button class="toggle-advanced" title="Opzioni avanzate">⚙️ Advanced</button>
      </div>
      <div class="track-controls advanced hidden">
        <div class="control-row">
          <div class="control-group">
            <label>📍 Pan</label>
            <input type="range" min="-1" max="1" step="0.01" value="0" class="pan-slider">
          </div>
        </div>

        <div class="control-row">
          <div class="control-group">
            <label>
              <input type="checkbox" checked class="fade-in-enabled"> 🌅 Fade In
            </label>
            <input type="range" min="0" max="5" step="0.1" value="1.0" class="fade-in-slider">
            <span class="fade-value">1.0s</span>
          </div>
          <div class="control-group">
            <label>
              <input type="checkbox" checked class="fade-out-enabled"> 🌆 Fade Out
            </label>
            <input type="range" min="0" max="5" step="0.1" value="1.0" class="fade-out-slider">
            <span class="fade-value">1.0s</span>
          </div>
        </div>
        <div class="control-row">
          <div class="control-group full-width">
            <label>🔄 Loop Mode</label>
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
      intervalSettings.style.display = (track.loopMode === 'interval' || track.loopMode === 'random-interval') ? 'inline' : 'none';

      // Mostra/nasconde campi specifici
      const isInterval = track.loopMode === 'interval';
      const isRandomInterval = track.loopMode === 'random-interval';

      intervalSecInput.style.display = isInterval ? 'inline' : 'none';
      intervalLabel.style.display = isInterval ? 'inline' : 'none';
      randomIntervalLabel.style.display = isRandomInterval ? 'inline' : 'none';
      minIntervalSecInput.style.display = isRandomInterval ? 'inline' : 'none';
      toLabel.style.display = isRandomInterval ? 'inline' : 'none';
      maxIntervalSecInput.style.display = isRandomInterval ? 'inline' : 'none';
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

    // Toggle advanced options
    const toggleBtn = trackEl.querySelector('.toggle-advanced');
    const advancedControls = trackEl.querySelector('.track-controls.advanced');

    toggleBtn.addEventListener('click', () => {
      const isHidden = advancedControls.classList.contains('hidden');
      advancedControls.classList.toggle('hidden', !isHidden);
      toggleBtn.textContent = isHidden ? '⚙️ Hide Advanced' : '⚙️ Advanced';
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

    intervalSecInput.style.display = isInterval ? 'inline' : 'none';
    intervalLabel.style.display = isInterval ? 'inline' : 'none';
    randomIntervalLabel.style.display = isRandomInterval ? 'inline' : 'none';
    minIntervalSecInput.style.display = isRandomInterval ? 'inline' : 'none';
    toLabel.style.display = isRandomInterval ? 'inline' : 'none';
    maxIntervalSecInput.style.display = isRandomInterval ? 'inline' : 'none';
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
