// Entry point: inizializza l'applicazione usando i moduli

import { AudioEngine } from './logic/audioEngine.js';
import { UIManager } from './logic/uiManager.js';
import { MixerController } from './logic/mixerController.js';
import { StorageManager } from './logic/storageManager.js';

// Splash screen management
const splashScreen = document.getElementById('splash-screen');
const loaderFill = splashScreen.querySelector('.loader-fill');

// Show splash screen initially
function showSplash() {
  splashScreen.classList.remove('hide');
  loaderFill.style.width = '10%';
}

// Hide splash screen with animation
function hideSplash() {
  setTimeout(() => {
    splashScreen.classList.add('hide');
  }, 500);
}

// Simulate loading progress
function updateLoader(progress) {
  const percentage = Math.min(100, Math.max(0, progress));
  loaderFill.style.width = `${percentage}%`;

  if (percentage >= 100) {
    setTimeout(hideSplash, 800);
  }
}

// Modal functionality
function showModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

function hideAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('show');
  });
}

// Initialize app with progress updates
async function initializeApp() {
  showSplash();

  try {
    // Step 1: Initialize components (20%)
    const audioEngine = new AudioEngine();
    const mixerController = new MixerController(audioEngine);
    const uiManager = new UIManager(audioEngine, mixerController);
    updateLoader(30);

    // Step 2: Initialize UI categories (50%)
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for visible progress
    uiManager.initCategories();

    // Initialize mobile settings: hide sound list by default on mobile
    if (window.innerWidth <= 768) {
      document.getElementById('container').classList.add('sound-list-hidden');
      const toggleBtn = document.getElementById('toggle-sounds');
      if (toggleBtn) {
        toggleBtn.style.display = 'inline-block';
        toggleBtn.innerHTML = `<i class="fas fa-volume-off"></i><span id="toggle-sounds-text" class="text">Toggle Sounds</span>`;
        toggleBtn.title = 'Mostra lista suoni';
      }
    }

    updateLoader(60);

    // Step 3: Initialize storage and background system (80%)
    const storageManager = new StorageManager(mixerController, uiManager);
    storageManager.updateSavedMixes();
    initBackgroundSystem();
    updateLoader(90);

    // Step 4: Final setup (100%)
    await new Promise(resolve => setTimeout(resolve, 200));
    updateLoader(100);

    return { audioEngine, mixerController, uiManager, storageManager };
  } catch (error) {
    console.error('Error during app initialization:', error);
    loaderFill.style.background = 'var(--error-color)';
    splashScreen.querySelector('.loading-text').textContent = 'Error loading app';
    return null;
  }
}

// Initialize the app with proper async scoping
(async () => {
  const appComponents = await initializeApp();
  if (!appComponents) {
    // Handle initialization failure
    return;
  }

  const { audioEngine, mixerController, uiManager, storageManager } = appComponents;

  // Close modals when clicking on backdrop or close button
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-close')) {
      hideAllModals();
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideAllModals();
    }
  });

  // Funzione per aggiornare lo stato del bottone Play/Stop
  function updatePlayStopButton() {
    const button = document.getElementById('play-stop');
    const buttonText = document.getElementById('play-stop-text');
    if (mixerController.isPlaying) {
      button.innerHTML = `<i class="fas fa-stop"></i><span id="play-stop-text" class="text">Stop</span>`;
      button.title = 'Stop Mix';
    } else {
      button.innerHTML = `<i class="fas fa-play"></i><span id="play-stop-text" class="text">Play</span>`;
      button.title = 'Play Mix';
    }
  }

  // Event listener per il bottone unificato Play/Stop
  document.getElementById('play-stop').addEventListener('click', async () => {
    try {
      if (!mixerController.isPlaying) {
        console.log('Play button clicked');
        // Assicura che AudioContext sia attivo prima di riprodurre
        await audioEngine.ensureAudioContext();
        console.log('AudioContext ensured, calling playAll');
        mixerController.playAll();
      } else {
        console.log('Stop button clicked');
        mixerController.stopAll();
      }
      updatePlayStopButton();
    } catch (error) {
      console.error('Errore gestione riproduzione:', error);
      // Provide user feedback about the error
      alert('Errore nella riproduzione audio. Controlla la console per dettagli.');
    }
  });

  // Inizializza lo stato del bottone
  updatePlayStopButton();

  // Funzione per toggolare visibilità lista suoni (per mobile)
  function toggleSoundList() {
    const container = document.getElementById('container');
    const toggleBtn = document.getElementById('toggle-sounds');
    const categories = document.getElementById('categories');

    // Controlla se è mobile (schermo piccolo)
    if (window.innerWidth <= 768) {
      const isHidden = categories.style.display === 'none';

      if (isHidden) {
        // Mostra lista suoni
        categories.style.display = 'block';
        toggleBtn.innerHTML = `<i class="fas fa-volume-up"></i><span id="toggle-sounds-text" class="text">Toggle Sounds</span>`;
        toggleBtn.title = 'Nascondi lista suoni';
      } else {
        // Nasconde lista suoni
        categories.style.display = 'none';
        toggleBtn.innerHTML = `<i class="fas fa-volume-off"></i><span id="toggle-sounds-text" class="text">Toggle Sounds</span>`;
        toggleBtn.title = 'Mostra lista suoni';
      }
    }
  }

  // Toolbar button event listeners
  document.getElementById('toggle-sounds').addEventListener('click', () => {
    toggleSoundList();
  });

  document.getElementById('save-mix-btn').addEventListener('click', () => {
    showModal('save-modal');
  });

  document.getElementById('load-mix-btn').addEventListener('click', () => {
    storageManager.updateSavedMixes();
    showModal('load-modal');
  });

  // Salva mix
  document.getElementById('save-mix').addEventListener('click', () => {
    const name = document.getElementById('mix-name').value.trim();
    if (!name) return alert('Nome mix necessario.');
    if (storageManager.saveMix(name)) {
      document.getElementById('mix-name').value = '';
      storageManager.updateSavedMixes();
      hideModal('save-modal'); // Close modal after successful save
    } else {
      alert('Errore salvataggio mix. Aggiungi suoni.');
    }
  });

  // Carica mix
  document.getElementById('load-mix').addEventListener('click', () => {
    const name = document.getElementById('saved-mixes').value;
    if (!name) return;
    storageManager.loadMix(name);
    hideModal('load-modal'); // Close modal after loading
  });

  // Cancella mix
  document.getElementById('delete-mix').addEventListener('click', () => {
    const name = document.getElementById('saved-mixes').value;
    if (!name) return;
    storageManager.deleteMix(name);
    storageManager.updateSavedMixes();
  });

  // Event listener per aggiungere suoni categorie
  const categoriesEl = document.getElementById('categories');
  categoriesEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-sound')) {
      const path = e.target.dataset.path;
      console.log('Click suono:', path); // Debug
      uiManager.addToMixer(path);
    }
  });

  // Tema gestione
  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';

  function updateThemeButton(theme) {
    // Use consistent, intuitive icons: sun for light theme, moon for dark theme
    themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    themeToggle.title = theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeButton(theme);
  }

  setTheme(currentTheme);

  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
})();

// Caricamento automatico mix disabilitato
// Per evitare che suoni partano automaticamente al refresh della pagina
/*
if (localStorage.length > 0) {
  setTimeout(() => {
    try {
      // Trova il primo mix valido nel localStorage
      const firstValidKey = findFirstValidMix();

      if (firstValidKey) {
        console.log(`Caricamento automatico mix: ${firstValidKey}`);
        storageManager.loadMix(firstValidKey);
      }
    } catch (error) {
      console.error('Errore caricamento automatico mix:', error);
    }
  }, 100); // Piccolo delay per garantire che l'UI sia pronta
}
*/

/* Background Selection System */
const backgroundFiles = [
  "amazing-beautiful-beauty-blue.jpg",
  "antelope-canyon-lower-canyon-arizona.jpg",
  "baboons-monkey-mammal-freeze-60023.jpeg",
  "bellingrath-gardens-alabama-landscape-scenic-158028.jpeg",
  "bellingrath-gardens-alabama-landscape-scenic-158063.jpeg",
  "bora-bora-french-polynesia-sunset-ocean.jpg",
  "cows-curious-cattle-agriculture.jpg",
  "elephant-cub-tsavo-kenya-66898.jpeg",
  "flamingo-valentine-heart-valentine-s-day-39627.jpeg",
  "horse-herd-fog-nature-52500.jpeg",
  "leaf-nature-green-spring-158780.jpeg",
  "leaf-rain-coffee-water-38435.jpeg",
  "pexels-photo-38012.jpeg",
  "pexels-photo-63340.jpeg",
  "pexels-photo-87812.jpeg",
  "pexels-photo-91153.jpeg",
  "pexels-photo-106606.jpeg",
  "pexels-photo-111963.jpeg",
  "pexels-photo-125510.jpeg",
  "pexels-photo-133459.jpeg",
  "pexels-photo-135018.jpeg",
  "pexels-photo-137077.jpeg",
  "pexels-photo-164175.jpeg",
  "pexels-photo-167684.jpeg",
  "pexels-photo-169647.jpeg",
  "pexels-photo-175773.jpeg",
  "pexels-photo-206359.jpeg",
  "pexels-photo-208821.jpeg",
  "pexels-photo-212324.jpeg",
  "pexels-photo-220067.jpeg",
  "pexels-photo-220836.jpeg",
  "pexels-photo-235721.jpeg",
  "pexels-photo-237272.jpeg",
  "pexels-photo-242124.jpeg",
  "pexels-photo-243971.jpeg",
  "pexels-photo-247376.jpeg",
  "pexels-photo-247599.jpeg",
  "pexels-photo-247600.jpeg",
  "pexels-photo-257092.jpeg",
  "pexels-photo-258122.jpeg",
  "pexels-photo-258149.jpeg",
  "pexels-photo-258160.jpeg",
  "pexels-photo-259554.jpeg",
  "pexels-photo-261403.jpeg",
  "pexels-photo-262367.jpeg",
  "pexels-photo-268917.jpeg",
  "pexels-photo-280221.jpeg",
  "pexels-photo-288621.jpeg",
  "pexels-photo-289586.jpeg",
  "pexels-photo-312839.jpeg",
  "pexels-photo-314726.jpeg",
  "pexels-photo-314937.jpeg",
  "pexels-photo-315191.jpeg",
  "pexels-photo-316093.jpeg",
  "pexels-photo-325185.jpeg",
  "pexels-photo-325944.jpeg",
  "pexels-photo-346529.jpeg",
  "pexels-photo-355465.jpeg",
  "pexels-photo-356807.jpeg",
  "pexels-photo-358499.jpeg",
  "pexels-photo-378271.jpeg",
  "pexels-photo-378442.jpeg",
  "pexels-photo-378570.jpeg",
  "pexels-photo-414491.jpeg",
  "pexels-photo-414612.jpeg",
  "pexels-photo-417074.jpeg",
  "pexels-photo-417122.jpeg",
  "pexels-photo-421759.jpeg",
  "pexels-photo-426894.jpeg",
  "pexels-photo-443446.jpeg",
  "pexels-photo-451589.jpeg",
  "pexels-photo-457876.jpeg",
  "pexels-photo-457881.jpeg",
  "pexels-photo-457882.jpeg",
  "pexels-photo-459451.jpeg",
  "pexels-photo-531767.jpeg",
  "pexels-photo-534049.jpeg",
  "pexels-photo-534174.jpeg",
  "pexels-photo-547114.jpeg",
  "pexels-photo-547119.jpeg",
  "pexels-photo-547494.jpeg",
  "pexels-photo-552784.jpeg",
  "pexels-photo-552785.jpeg",
  "pexels-photo-561654.jpeg",
  "pexels-photo-590178.jpeg",
  "pexels-photo-618079.jpeg",
  "pexels-photo-620337.jpeg",
  "pexels-photo-635725.jpeg",
  "pexels-photo-689784.jpeg",
  "pexels-photo-707344.jpeg",
  "pexels-photo-709552.jpeg",
  "pexels-photo-732548.jpeg",
  "pexels-photo-753619.jpeg",
  "pexels-photo-763398.jpeg",
  "pexels-photo-772429.jpeg",
  "pexels-photo-792381.jpeg",
  "pexels-photo-826388.jpeg",
  "pexels-photo-847402.jpeg",
  "pexels-photo-869258.jpeg",
  "pexels-photo-889929.jpeg",
  "pexels-photo-949587.jpeg",
  "pexels-photo-950223.jpeg",
  "pexels-photo-962312.jpeg",
  "pexels-photo-982230.jpeg",
  "pexels-photo-994605.jpeg",
  "pexels-photo-1029604.jpeg",
  "pexels-photo-1044329.jpeg",
  "pexels-photo-1045534.jpeg",
  "pexels-photo-1048033.jpeg",
  "pexels-photo-1076130.jpeg",
  "pexels-photo-1102915.jpeg",
  "pexels-photo-1105389.jpeg",
  "pexels-photo-1110656.jpeg",
  "pexels-photo-1114688.jpeg",
  "pexels-photo-1118874.jpeg",
  "pexels-photo-1126379.jpeg",
  "pexels-photo-1144176.jpeg",
  "pexels-photo-1154510.jpeg",
  "pexels-photo-1165981.jpeg",
  "pexels-photo-1165991.jpeg",
  "pexels-photo-1166209.jpeg",
  "pexels-photo-1181181.jpeg",
  "pexels-photo-1216482.jpeg",
  "pexels-photo-1227513.jpeg",
  "pexels-photo-1259713.jpeg",
  "pexels-photo-1278952.jpeg",
  "pexels-photo-1313807.jpeg",
  "pexels-photo-1316294.jpeg",
  "pexels-photo-1320684.jpeg",
  "pexels-photo-1323550.jpeg",
  "pexels-photo-1350197.jpeg",
  "pexels-photo-1366957.jpeg",
  "pexels-photo-1408221.jpeg",
  "pexels-photo-1413100.jpeg",
  "pexels-photo-1430677.jpeg",
  "pexels-photo-1449767.jpeg",
  "pexels-photo-1450353.jpeg",
  "pexels-photo-1478685.jpeg",
  "pexels-photo-1542493.jpeg",
  "pexels-photo-1546901.jpeg",
  "pexels-photo-1563355.jpeg",
  "pexels-photo-1574181.jpeg",
  "pexels-photo-1579413.jpeg",
  "pexels-photo-1655166.jpeg",
  "pexels-photo-1726310.jpeg",
  "pexels-photo-1770808.jpeg",
  "pexels-photo-2068411.jpeg",
  "pexels-photo-2078264.jpeg",
  "pexels-photo-2091351.jpeg",
  "pexels-photo-2124894.jpeg",
  "pexels-photo-2166711.jpeg",
  "pexels-photo-2172499.jpeg",
  "pexels-photo-2187605.jpeg",
  "pexels-photo-2253573.jpeg",
  "pexels-photo-2295744.jpeg",
  "pexels-photo-2325447.jpeg",
  "pexels-photo-2536643.jpeg",
  "pexels-photo-2649403.jpeg",
  "pexels-photo-2662116.jpeg",
  "pexels-photo-2693155.jpeg",
  "pexels-photo-2780477.jpeg",
  "pexels-photo-2886284.jpeg",
  "pexels-photo-3205988.jpeg",
  "pexels-photo-3224155.jpeg",
  "pexels-photo-3314864.jpeg",
  "pexels-photo-3396657.jpeg",
  "pexels-photo-3567942.png",
  "pexels-photo-3608263.jpeg",
  "pexels-photo-3779187.jpeg",
  "pexels-photo-3779816.jpeg",
  "pexels-photo-3802666.jpeg",
  "pexels-photo-4451434.jpeg",
  "pexels-photo-4558327.jpeg",
  "pexels-photo-4666751.jpeg",
  "pexels-photo-5273517.jpeg",
  "pexels-photo-5282585.jpeg",
  "pexels-photo-6228016.jpeg",
  "pexels-photo-6243260.jpeg",
  "pexels-photo-7907896.jpeg",
  "pexels-photo-10013470.jpeg",
  "pexels-photo-10058980.jpeg",
  "pexels-photo-12431988.jpeg",
  "pexels-photo-13010464.jpeg",
  "pexels-photo-14868786.jpeg",
  "pexels-photo-15188440.jpeg",
  "pexels-photo-15618172.jpeg",
  "pexels-photo-15796414.jpeg",
  "pexels-photo-16037614.jpeg",
  "pexels-photo-18717290.jpeg",
  "pexels-photo-27829279.jpeg",
  "pexels-photo-30625291.jpeg",
  "pexels-photo-30650186.jpeg",
  "pexels-photo-31275582.jpeg",
  "pexels-photo-31727068.jpeg",
  "pexels-photo-31927548.jpeg",
  "pexels-photo-33286840.jpeg",
  "pexels-photo-33307475.jpeg",
  "pexels-photo.jpg",
  "polar-bear-bear-teddy-sleep-65320.jpeg"
];

// Cache per le immagini caricate
const loadedImages = new Map();
let currentBackground = localStorage.getItem('selectedBackground') || null;

// Funzione per applicare un background
function applyBackground(filename) {
  const body = document.body;

  if (filename) {
    body.style.backgroundImage = `url('backgrounds/${filename}')`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.transition = 'background-image 0.3s ease';
  } else {
    // Rimuovi background
    body.style.backgroundImage = '';
  }

  // Salva la scelta
  localStorage.setItem('selectedBackground', filename || '');
}

// Crea un nome visualizzato dalle aree della stringa di filename
function createDisplayName(filename) {
  return filename
    .replace(/\.\w+$/, '') // Rimuovi estensione
    .replace(/-/g, ' ') // Sostituisci dash con spazi
    .replace(/_/g, ' ') // Sostituisci underscore con spazi
    .replace(/\s+/g, ' ') // Collassa spazi multipli
    .trim();
}

// Popola la griglia background
function populateBackgroundGrid(filteredFiles = backgroundFiles) {
  const grid = document.getElementById('background-grid');
  grid.innerHTML = '';

  filteredFiles.forEach(filename => {
    const item = document.createElement('div');
    item.className = 'background-item';
    item.dataset.filename = filename;

    // Controlla se è il background attualmente selezionato
    if (filename === currentBackground) {
      item.classList.add('selected');
    }

    // Mostra placeholder inizialmente
    showPlaceholder(item, filename);

    // Aggiungi all'osservatore per lazy loading
    imageObserver.observe(item);

    // Click handler per selezionare
    item.addEventListener('click', () => selectBackground(filename, item));

    grid.appendChild(item);
  });
}

// Mostra placeholder con nome
function showPlaceholder(item, filename) {
  const placeholder = document.createElement('div');
  placeholder.className = 'background-placeholder';
  placeholder.textContent = createDisplayName(filename);
  item.appendChild(placeholder);
}

// Mostra caricamento
function showLoading(item) {
  const loading = document.createElement('div');
  loading.className = 'background-loading';
  loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  item.innerHTML = '';
  item.appendChild(loading);
}

// Carica immagine quando necessaria
async function loadBackgroundImage(item, filename) {
  const cacheKey = filename;

  // Se già in cache, usa quella
  if (loadedImages.has(cacheKey)) {
    showBackgroundImage(item, loadedImages.get(cacheKey));
    return;
  }

  showLoading(item);

  try {
    const img = new Image();
    const src = `backgrounds/${filename}`;

    img.onload = () => {
      loadedImages.set(cacheKey, src);
      showBackgroundImage(item, src);
    };

    img.onerror = () => {
      showError(item, filename);
    };

    img.src = src;
  } catch (error) {
    showError(item, filename);
  }
}

// Mostra immagine caricata
function showBackgroundImage(item, src) {
  item.innerHTML = '';
  const img = document.createElement('img');
  img.className = 'background-image';
  img.src = src;
  img.onload = () => img.classList.add('loaded');
  item.appendChild(img);
}

// Mostra errore caricamento
function showError(item, filename) {
  const placeholder = document.createElement('div');
  placeholder.className = 'background-placeholder';
  placeholder.textContent = `Errore: ${createDisplayName(filename)}`;
  placeholder.style.color = 'var(--error-color)';
  item.innerHTML = '';
  item.appendChild(placeholder);
}

// Seleziona background
function selectBackground(filename, item) {
  // Rimuovi selezione precedente
  document.querySelectorAll('.background-item.selected').forEach(el => {
    el.classList.remove('selected');
  });

  // Applica selezione nuova
  item.classList.add('selected');

  // Applica il background
  applyBackground(filename);

  currentBackground = filename;
}

// IntersectionObserver per lazy loading
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const item = entry.target;
      const filename = item.dataset.filename;

      if (filename && !item.querySelector('.background-image') && !item.querySelector('.background-loading')) {
        loadBackgroundImage(item, filename);
      }
    }
  });
}, {
  root: document.getElementById('background-grid'),
  threshold: 0.1,
  rootMargin: '50px 0px'
});

// Ricerca background
function filterBackgrounds(query) {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    populateBackgroundGrid();
    return;
  }

  const filtered = backgroundFiles.filter(filename => {
    const displayName = createDisplayName(filename);
    return displayName.toLowerCase().includes(lowerQuery);
  });

  populateBackgroundGrid(filtered);
}

// Inizializza sistema background
function initBackgroundSystem() {
  // Applica background salvato all'avvio
  applyBackground(currentBackground);

  // Event listener per pulsante background
  document.getElementById('background-btn').addEventListener('click', () => {
    showModal('background-modal');
    populateBackgroundGrid();
  });

  // Event listener per ricerca
  document.getElementById('background-search').addEventListener('input', (e) => {
    filterBackgrounds(e.target.value);
  });

  // Event listener per rimuovi background
  document.getElementById('clear-background').addEventListener('click', () => {
    // Rimuovi selezione precedente
    document.querySelectorAll('.background-item.selected').forEach(el => {
      el.classList.remove('selected');
    });

    // Applica sfondo nullo
    applyBackground(null);
    currentBackground = null;
  });
}

// Funzione helper per trovare un mix valido
function findFirstValidMix() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Salta chiavi non JSON
    if (key === 'theme' || key === 'selectedBackground' || key === 'soundscape' || key === 'ui-settings') {
      continue;
    }

    try {
      const value = localStorage.getItem(key);
      if (!value || value.trim() === '' || value.charAt(0) !== '{') {
        continue;
      }

      const mix = JSON.parse(value);
      if (mix && typeof mix === 'object' && mix.name && Array.isArray(mix.tracks) && mix.tracks.length > 0) {
        return key;
      }
    } catch (parseError) {
      console.warn(`Ignorando key "${key}" - invalid JSON`);
      continue;
    }
  }
  return null;
}
