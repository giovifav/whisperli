// Storage Manager: Gestisce salvataggio e caricamento mix

export class StorageManager {
  constructor(mixerController, uiManager) {
    this.mixerController = mixerController;
    this.uiManager = uiManager;
  }

  // Salva mix nel localStorage
  saveMix(name) {
    if (!name || this.mixerController.getTracks().length === 0) return false;

    const mix = {
      name,
      tracks: this.mixerController.getTracks().map(t => ({
        soundPath: t.soundPath,
        volume: t.volume,
        pan: t.pan,
        loopMode: t.loopMode,
        intervalSec: t.intervalSec,
        minIntervalSec: t.minIntervalSec,
        maxIntervalSec: t.maxIntervalSec,
        fadeInDuration: t.fadeInDuration,
        fadeOutDuration: t.fadeOutDuration,
        fadeInEnabled: t.fadeInEnabled,
        fadeOutEnabled: t.fadeOutEnabled
      })),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(name, JSON.stringify(mix));
    return true;
  }

  // Carica mix dal localStorage
  loadMix(name) {
    try {
      const storedValue = localStorage.getItem(name);
      if (!storedValue || storedValue.trim() === '') {
        console.warn(`Mix "${name}" non trovato o vuoto`);
        return false;
      }

      // Verifica che sia JSON valido
      if (storedValue.charAt(0) !== '{') {
        console.error(`Mix "${name}" non è un JSON valido`);
        return false;
      }

      const mix = JSON.parse(storedValue);

      // Validazione struttura dati
      if (!mix || typeof mix !== 'object' || !mix.name || !Array.isArray(mix.tracks)) {
        console.error(`Mix "${name}" struttura invalida`);
        return false;
      }

      // Clear current mixer
      this.mixerController.clearTracks();
      document.getElementById('tracks').innerHTML = '';

      // Add tracks with defaults for old mixes
      let loadedTracks = 0;
      mix.tracks.forEach(t => {
        try {
          if (t && t.soundPath) {
            const track = this.mixerController.addTrack(t.soundPath);
            if (track) {
              track.volume = (typeof t.volume === 'number') ? t.volume : 0.5;
              track.pan = (typeof t.pan === 'number') ? t.pan : 0;
              track.loopMode = t.loopMode || 'loop';
              track.intervalSec = (typeof t.intervalSec === 'number') ? t.intervalSec : 30;
              track.minIntervalSec = (typeof t.minIntervalSec === 'number') ? t.minIntervalSec : 15;
              track.maxIntervalSec = (typeof t.maxIntervalSec === 'number') ? t.maxIntervalSec : 45;
              track.fadeInDuration = (typeof t.fadeInDuration === 'number') ? t.fadeInDuration : 1.0;
              track.fadeOutDuration = (typeof t.fadeOutDuration === 'number') ? t.fadeOutDuration : 1.0;
              track.fadeInEnabled = (typeof t.fadeInEnabled === 'boolean') ? t.fadeInEnabled : true;
              track.fadeOutEnabled = (typeof t.fadeOutEnabled === 'boolean') ? t.fadeOutEnabled : true;


              // Crea UI per la track
              this.uiManager.addToMixer(track.soundPath);
              this.uiManager.updateTrackUI(track);
              loadedTracks++;
            }
          }
        } catch (trackError) {
          console.warn(`Errore caricamento traccia in mix "${name}":`, trackError);
        }
      });

      console.log(`Mix "${name}" caricato con ${loadedTracks} tracce`);
      return loadedTracks > 0;
    } catch (error) {
      console.error(`Errore caricamento mix "${name}":`, error);
      return false;
    }
  }

  // Cancella mix
  deleteMix(name) {
    localStorage.removeItem(name);
  }

  // Aggiorna lista mix salvati nell'UI
  updateSavedMixes() {
    const select = document.getElementById('saved-mixes');
    if (!select) return;

    select.innerHTML = '<option value="">Seleziona mix</option>';

    // Array per interagire senza modificare durante l'iterazione
    const keysToProcess = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null) {
        keysToProcess.push(key);
      }
    }

    keysToProcess.forEach(key => {
      try {
        // Salta chiavi che potrebbero contenere valori non JSON (come "theme", "selectedBackground")
        if (key === 'theme' || key === 'selectedBackground' || key === 'soundscape' || key === 'ui-settings') {
          return; // Salta queste chiavi
        }

        const storedValue = localStorage.getItem(key);
        if (!storedValue || storedValue.trim() === '') {
          console.warn(`Key "${key}" è vuota o null, ignorata`);
          return;
        }

        // Verifica che sia JSON valido prima del parse
        if (storedValue.charAt(0) !== '{') {
          console.warn(`Key "${key}" non è un JSON valido: ${storedValue.substring(0, 50)}...`);
          return;
        }

        const mix = JSON.parse(storedValue);

        // Validazione struttura dati
        if (mix && typeof mix === 'object' && mix.name && Array.isArray(mix.tracks)) {
          const option = document.createElement('option');
          option.value = key;
          option.textContent = `${mix.name} (${new Date(mix.timestamp || Date.now()).toLocaleDateString()})`;
          select.appendChild(option);
        } else {
          console.warn(`Mix "${key}" struttura invalida`);
        }
      } catch (error) {
        console.error(`Errore caricamento mix "${key}":`, error);
      }
    });
  }
}
