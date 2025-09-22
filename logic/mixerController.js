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
      source: null,
      gainNode: null,
      pannerNode: null,
      timeoutId: null,
      isLoading: false,
      isLoaded: false,
      isRemoved: false
    };

    this.mixerTracks.push(track);
    return track;
  }

  // Rimuovi traccia
  removeTrack(track) {
    track.isRemoved = true;
    this.audioEngine.stopTrack(track, true);
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

  // Clear tracks
  clearTracks() {
    this.stopAll();
    this.mixerTracks = [];
  }
}
