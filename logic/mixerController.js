// Mixer Controller: Gestisce le traces\t mixer (aggiunta, riproduzione, controllo)

export class MixerController {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.mixerTracks = [];
    this.isPlaying = false;
  }

  // Get traccia esistente
  getTrack(soundPath) {
    return this.mixerTracks.find(t => t.soundPath === soundPath);
  }

  // Aggiungi traccia
  addTrack(soundPath) {
    if (this.mixerTracks.find(t => t.soundPath === soundPath)) return null;

    const track = {
      soundPath,
      volume: 0.5,
      pan: 0,
      loopMode: 'loop',
      intervalSec: 30,
      minIntervalSec: 15, // Nuovo campo per random-interval minimo
      maxIntervalSec: 45, // Nuovo campo per random-interval massimo
      fadeInDuration: 1.0,
      fadeOutDuration: 1.0,
      fadeInEnabled: true,
      fadeOutEnabled: true,
      // Nuove proprietà per automatismi temporali
      automationEnabled: false,
      volumeAutomation: {
        type: 'linear',
        duration: 10,
        startVol: 0.0,
        endVol: 0.8,
        cycle: false
      },
      panAutomation: {
        enabled: false,
        duration: 10,
        direction: 'left-right',
        cycle: false
      },
      probabilisticSpawn: {
        enabled: false,
        minInterval: 10,
        maxInterval: 30,
        spawnProbability: 0.3
      },
      source: null,
      gainNode: null,
      pannerNode: null,
      timeoutId: null,
      isLoading: false,
      isLoaded: false,
      isRemoved: false,
      isPlaying: false
    };

    this.mixerTracks.push(track);

    // Se il mix è in riproduzione, questa nuova traccia deve iniziare immediatamente
    if (this.isPlaying) {
      console.log(`Auto-playing newly added track: ${soundPath}`);
      this.audioEngine.playTrack(track);
    }

    return track;
  }

  // Rimuovi traccia
  removeTrack(track) {
    track.isRemoved = true;
    this.audioEngine.stopTrack(track, true);
    if (track.probabilisticSpawnTimeoutId) {
      clearTimeout(track.probabilisticSpawnTimeoutId);
    }
    this.mixerTracks = this.mixerTracks.filter(t => t !== track);
  }

  // Play tutti i suoni selezionati
  playAll() {
    console.log(`Playing all tracks. Total tracks: ${this.mixerTracks.length}`);
    this.mixerTracks.forEach(track => {
      console.log(`Track: ${track.soundPath}, has source: ${!!track.source}`);
      if (!track.source) {
        this.audioEngine.playTrack(track);
      }
    });
    this.isPlaying = true;
    return true;
  }

  // Stop tutti
  stopAll() {
    this.mixerTracks.forEach(track => {
      this.audioEngine.stopTrack(track);
    });
    this.isPlaying = false;
    return false;
  }

  // Get tracks
  getTracks() {
    return this.mixerTracks;
  }

  // Clear tracks with proper cleanup
  clearTracks() {
    this.stopAll();
    // Ensure all tracks are marked as removed and fully cleaned up
    this.mixerTracks.forEach(track => {
      track.isRemoved = true;
      // Clear any remaining timeouts that might not have been caught by stopTrack
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
    });
    this.mixerTracks = [];
  }
}
