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
        fadeOutEnabled: t.fadeOutEnabled,
        // Aggiungi properties di automazione
        automationEnabled: t.automationEnabled,
        volumeAutomation: t.volumeAutomation,
        panAutomation: t.panAutomation,
        probabilisticSpawn: t.probabilisticSpawn
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

      let mix;
      try {
        mix = JSON.parse(storedValue);
      } catch (jsonError) {
        console.error(`Mix "${name}" non è un JSON valido:`, jsonError);
        return false;
      }

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

              // Imposta properties di automazione con defaults
              track.automationEnabled = (typeof t.automationEnabled === 'boolean') ? t.automationEnabled : false;
              track.volumeAutomation = (typeof t.volumeAutomation === 'object' && t.volumeAutomation !== null)
                ? { ...t.volumeAutomation }
                : { type: 'linear', duration: 10, startVol: 0.0, endVol: 0.8, cycle: false };
              track.panAutomation = (typeof t.panAutomation === 'object' && t.panAutomation !== null)
                ? { ...t.panAutomation }
                : { enabled: false, duration: 10, direction: 'left-right', cycle: false };
              track.probabilisticSpawn = (typeof t.probabilisticSpawn === 'object' && t.probabilisticSpawn !== null)
                ? { ...t.probabilisticSpawn }
                : { enabled: false, minInterval: 10, maxInterval: 30, spawnProbability: 0.3 };


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
          console.warn(`Key "${key}" è vuota o null, sarà rimossa`);
          // Opzionalmente rimuovi chiavi vuote per pulizia
          try {
            localStorage.removeItem(key);
          } catch (removeError) {
            console.warn(`Impossibile rimuovere chiave vuota "${key}":`, removeError);
          }
          return;
        }

        // Prova a parsare come JSON
        let mix;
        try {
          mix = JSON.parse(storedValue);
        } catch (jsonError) {
          console.error(`Key "${key}" contiene JSON invalido:`, jsonError, `Valore: ${storedValue.substring(0, 100)}...`);
          // Rimuovi dati corrotti per prevenire errori futuri
          try {
            localStorage.removeItem(key);
            console.info(`Key corrotta "${key}" rimossa da localStorage`);
          } catch (removeError) {
            console.warn(`Impossibile rimuovere chiave corrotta "${key}":`, removeError);
          }
          return;
        }

        // Validazione struttura dati più rigorosa
        if (!mix || typeof mix !== 'object') {
          console.warn(`Mix "${key}" non è un oggetto valido, sarà rimosso`);
          localStorage.removeItem(key);
          return;
        }

        if (!mix.name || typeof mix.name !== 'string' || mix.name.trim() === '') {
          console.warn(`Mix "${key}" manca di nome valido, sarà rimosso`);
          localStorage.removeItem(key);
          return;
        }

        if (!Array.isArray(mix.tracks)) {
          console.warn(`Mix "${key}" manca di array tracks valido, sarà rimosso`);
          localStorage.removeItem(key);
          return;
        }

        // Controlla che almeno una traccia sia valida
        const validTracks = mix.tracks.filter(track =>
          track && typeof track === 'object' && track.soundPath
        );

        if (validTracks.length === 0) {
          console.warn(`Mix "${key}" non contiene tracce valide, sarà rimosso`);
          localStorage.removeItem(key);
          return;
        }

        // Mix valido, aggiungilo alla lista
        const option = document.createElement('option');
        option.value = key;
        const timestamp = mix.timestamp ? new Date(mix.timestamp).toLocaleDateString() : new Date().toLocaleDateString();
        option.textContent = `${mix.name} (${validTracks.length} tracce - ${timestamp})`;
        select.appendChild(option);
      } catch (error) {
        console.error(`Errore elaborazione mix "${key}":`, error);
        // In caso di errore, prova a rimuovere la chiave problematica
        try {
          localStorage.removeItem(key);
          console.info(`Key problematica "${key}" rimossa da localStorage`);
        } catch (removeError) {
          console.warn(`Impossibile rimuovere chiave problematica "${key}":`, removeError);
        }
      }
    });
  }
}
