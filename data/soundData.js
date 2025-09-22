// Updated complete sound list from /sounds directory
const soundFilesData = [
  // Animals
  { filename: 'beehive.mp3', category: 'animals', displayName: 'Beehive', tags: ['animal', 'nature', 'insect', 'ambience'] },
  { filename: 'birds-long.mp3', category: 'animals', displayName: 'Birds Long', tags: ['animal', 'nature', 'outdoor', 'relaxing', 'loopable'] },
  { filename: 'birds.mp3', category: 'animals', displayName: 'Birds', tags: ['animal', 'nature', 'outdoor', 'ambience'] },
  { filename: 'cat-purring.mp3', category: 'animals', displayName: 'Cat Purring', tags: ['animal', 'pet', 'indoor', 'relaxing'] },
  { filename: 'cat.mp3', category: 'animals', displayName: 'Cat', tags: ['animal', 'pet', 'indoor'] },
  { filename: 'chickens.mp3', category: 'animals', displayName: 'Chickens', tags: ['animal', 'farm', 'outdoor'] },
  { filename: 'cows.mp3', category: 'animals', displayName: 'Cows', tags: ['animal', 'farm', 'nature'] },
  { filename: 'crickets-long.mp3', category: 'animals', displayName: 'Crickets Long', tags: ['insect', 'nature', 'night', 'loopable', 'ambience'] },
  { filename: 'crickets.mp3', category: 'animals', displayName: 'Crickets', tags: ['insect', 'nature', 'night', 'ambience'] },
  { filename: 'crows.mp3', category: 'animals', displayName: 'Crows', tags: ['animal', 'urban', 'outdoor'] },
  { filename: 'dog-barking.mp3', category: 'animals', displayName: 'Dog Barking', tags: ['animal', 'pet', 'indoor', 'urban'] },
  { filename: 'frog.mp3', category: 'animals', displayName: 'Frog', tags: ['animal', 'nature', 'water', 'night'] },
  { filename: 'frogs.mp3', category: 'animals', displayName: 'Frogs', tags: ['animal', 'nature', 'water', 'night'] },
  { filename: 'horse-gallop.mp3', category: 'animals', displayName: 'Horse Gallop', tags: ['animal', 'farm', 'nature'] },
  { filename: 'open-field-crickets.mp3', category: 'animals', displayName: 'Open Field Crickets', tags: ['insect', 'nature', 'field', 'night', 'ambience'] },
  { filename: 'owl.mp3', category: 'animals', displayName: 'Owl', tags: ['animal', 'nature', 'night', 'forest'] },
  { filename: 'seagulls.mp3', category: 'animals', displayName: 'Seagulls', tags: ['animal', 'coastal', 'urban', 'nature'] },
  { filename: 'sheep-farm.mp3', category: 'animals', displayName: 'Sheep Farm', tags: ['animal', 'farm', 'nature'] },
  { filename: 'sheep.mp3', category: 'animals', displayName: 'Sheep', tags: ['animal', 'farm'] },
  { filename: 'whale.mp3', category: 'animals', displayName: 'Whale', tags: ['animal', 'ocean', 'nature'] },
  { filename: 'wolf.mp3', category: 'animals', displayName: 'Wolf', tags: ['animal', 'wild', 'nature', 'night'] },
  { filename: 'woodpecker.mp3', category: 'animals', displayName: 'Woodpecker', tags: ['animal', 'bird', 'forest', 'nature'] },

  // Nature
  { filename: 'campfire-busy-crackles.mp3', category: 'nature', displayName: 'Campfire Busy Crackles', tags: ['fire', 'nature', 'outdoor', 'ambience', 'relaxing'] },
  { filename: 'campfire.mp3', category: 'nature', displayName: 'Campfire', tags: ['fire', 'nature', 'outdoor', 'relaxing'] },
  { filename: 'driving-wind.mp3', category: 'nature', displayName: 'Driving Wind', tags: ['wind', 'nature', 'outdoor', 'weather'] },
  { filename: 'droplets.mp3', category: 'nature', displayName: 'Droplets', tags: ['water', 'rain', 'nature', 'forecast', 'relaxing'] },
  { filename: 'fireplace.mp3', category: 'nature', displayName: 'Fireplace', tags: ['fire', 'indoor', 'relaxing', 'winter'] },
  { filename: 'forest.mp3', category: 'nature', displayName: 'Forest', tags: ['forest', 'nature', 'trees', 'ambience'] },
  { filename: 'jungle-long.mp3', category: 'nature', displayName: 'Jungle Long', tags: ['jungle', 'nature', 'wild', 'tropical', 'loopable'] },
  { filename: 'jungle.mp3', category: 'nature', displayName: 'Jungle', tags: ['jungle', 'nature', 'wild', 'tropical'] },
  { filename: 'mid-waterfall.mp3', category: 'nature', displayName: 'Mid Waterfall', tags: ['water', 'nature', 'outdoor', 'relaxing'] },
  { filename: 'nature_various.mp3', category: 'nature', displayName: 'Nature Various', tags: ['nature', 'composite', 'ambience'] },
  { filename: 'ocean.mp3', category: 'nature', displayName: 'Ocean', tags: ['ocean', 'water', 'coastal', 'relaxing'] },
  { filename: 'river-long.mp3', category: 'nature', displayName: 'River Long', tags: ['river', 'water', 'nature', 'outdoor'] },
  { filename: 'river.mp3', category: 'nature', displayName: 'River', tags: ['river', 'water', 'nature'] },
  { filename: 'sea.mp3', category: 'nature', displayName: 'Sea', tags: ['sea', 'ocean', 'coastal'] },
  { filename: 'stream.mp3', category: 'nature', displayName: 'Stream', tags: ['water', 'river', 'nature'] },
  { filename: 'underwater.mp3', category: 'nature', displayName: 'Underwater', tags: ['ocean', 'water', 'submarine'] },
  { filename: 'walk-in-snow.mp3', category: 'nature', displayName: 'Walk In Snow', tags: ['snow', 'winter', 'nature', 'outdoor'] },
  { filename: 'walk-on-gravel.mp3', category: 'nature', displayName: 'Walk On Gravel', tags: ['walk', 'gravel', 'outdoor'] },
  { filename: 'walk-on-leaves.mp3', category: 'nature', displayName: 'Walk On Leaves', tags: ['walk', 'forest', 'nature'] },
  { filename: 'waterfall.mp3', category: 'nature', displayName: 'Waterfall', tags: ['water', 'nature', 'outdoor'] },
  { filename: 'waves.mp3', category: 'nature', displayName: 'Waves', tags: ['ocean', 'water', 'coastal'] },
  { filename: 'wind-in-trees.mp3', category: 'nature', displayName: 'Wind In Trees', tags: ['wind', 'forest', 'nature'] },
  { filename: 'wind-long.mp3', category: 'nature', displayName: 'Wind Long', tags: ['wind', 'nature', 'loopable'] },
  { filename: 'wind.mp3', category: 'nature', displayName: 'Wind', tags: ['wind', 'nature'] },

  // Places
  { filename: 'airport.mp3', category: 'places', displayName: 'Airport', tags: ['urban', 'transport', 'travel'] },
  { filename: 'alpine.mp3', category: 'places', displayName: 'Alpine', tags: ['mountain', 'nature', 'outdoor'] },
  { filename: 'bar.mp3', category: 'places', displayName: 'Bar', tags: ['social', 'urban', 'crowd'] },
  { filename: 'cafe.mp3', category: 'places', displayName: 'Cafe', tags: ['social', 'urban', 'coffee'] },
  { filename: 'cafeteria.mp3', category: 'places', displayName: 'Cafeteria', tags: ['social', 'urban', 'food'] },
  { filename: 'church.mp3', category: 'places', displayName: 'Church', tags: ['religious', 'quiet', 'indoor'] },
  { filename: 'construction-site.mp3', category: 'places', displayName: 'Construction Site', tags: ['urban', 'work', 'industrial'] },
  { filename: 'crowded-bar.mp3', category: 'places', displayName: 'Crowded Bar', tags: ['social', 'urban', 'crowd'] },
  { filename: 'laboratory.mp3', category: 'places', displayName: 'Laboratory', tags: ['industrial', 'science', 'indoor'] },
  { filename: 'laundry-room.mp3', category: 'places', displayName: 'Laundry Room', tags: ['indoor', 'urban', 'mechanical'] },
  { filename: 'library-long.mp3', category: 'places', displayName: 'Library Long', tags: ['quiet', 'study', 'indoor', 'loopable'] },
  { filename: 'library.mp3', category: 'places', displayName: 'Library', tags: ['quiet', 'study', 'indoor'] },
  { filename: 'marketplace.mp3', category: 'places', displayName: 'Marketplace', tags: ['social', 'urban', 'commerce'] },
  { filename: 'night-village.mp3', category: 'places', displayName: 'Night Village', tags: ['village', 'night', 'quiet'] },
  { filename: 'office.mp3', category: 'places', displayName: 'Office', tags: ['work', 'urban', 'indoor'] },
  { filename: 'park.mp3', category: 'places', displayName: 'Park', tags: ['nature', 'urban', 'outdoor'] },
  { filename: 'restaurant.mp3', category: 'places', displayName: 'Restaurant', tags: ['food', 'social', 'urban'] },
  { filename: 'subway-station.mp3', category: 'places', displayName: 'Subway Station', tags: ['transport', 'urban', 'crowd'] },
  { filename: 'supermarket.mp3', category: 'places', displayName: 'Supermarket', tags: ['shopping', 'urban', 'indoor'] },
  { filename: 'temple.mp3', category: 'places', displayName: 'Temple', tags: ['religious', 'quiet', 'spiritual'] },

  // Rain
  { filename: 'aspen-rain.mp3', category: 'rain', displayName: 'Aspen Rain', tags: ['rain', 'nature', 'weather', 'relaxing'] },
  { filename: 'dripping.mp3', category: 'rain', displayName: 'Dripping', tags: ['water', 'rain', 'indoor', 'relaxing'] },
  { filename: 'inside.mp3', category: 'rain', displayName: 'Inside', tags: ['rain', 'indoor', 'weather'] },
  { filename: 'light-rain.mp3', category: 'rain', displayName: 'Light Rain', tags: ['rain', 'weather', 'relaxing'] },
  { filename: 'rain-interior-light.mp3', category: 'rain', displayName: 'Rain Interior Light', tags: ['rain', 'indoor', 'light'] },
  { filename: 'rain-long.mp3', category: 'rain', displayName: 'Rain Long', tags: ['rain', 'weather', 'loopable'] },
  { filename: 'rain-on-car-roof.mp3', category: 'rain', displayName: 'Rain On Car Roof', tags: ['rain', 'urban', 'car'] },
  { filename: 'rain-on-leaves.mp3', category: 'rain', displayName: 'Rain On Leaves', tags: ['rain', 'forest', 'nature'] },
  { filename: 'rain-on-tent.mp3', category: 'rain', displayName: 'Rain On Tent', tags: ['rain', 'camping', 'outdoor'] },
  { filename: 'rain-on-umbrella.mp3', category: 'rain', displayName: 'Rain On Umbrella', tags: ['rain', 'urban', 'weather'] },
  { filename: 'rain-on-window.mp3', category: 'rain', displayName: 'Rain On Window', tags: ['rain', 'indoor', 'window'] },
  { filename: 'rain-thunder.mp3', category: 'rain', displayName: 'Rain Thunder', tags: ['rain', 'thunder', 'storm', 'weather'] },

  // Things
  { filename: 'bubbles.mp3', category: 'things', displayName: 'Bubbles', tags: ['water', 'relaxing', 'indoor'] },
  { filename: 'ceiling-fan.mp3', category: 'things', displayName: 'Ceiling Fan', tags: ['indoor', 'fan', 'mechanical'] },
  { filename: 'clock.mp3', category: 'things', displayName: 'Clock', tags: ['time', 'tick', 'indoor'] },
  { filename: 'coffee-grinder.mp3', category: 'things', displayName: 'Coffee Grinder', tags: ['coffee', 'kitchen', 'morning'] },
  { filename: 'dryer.mp3', category: 'things', displayName: 'Dryer', tags: ['laundry', 'mechanical', 'indoor'] },
  { filename: 'generator.mp3', category: 'things', displayName: 'Generator', tags: ['industrial', 'power', 'mechanical'] },
  { filename: 'keyboard.mp3', category: 'things', displayName: 'Keyboard', tags: ['computer', 'typing', 'indoor'] },
  { filename: 'making-coffee.mp3', category: 'things', displayName: 'Making Coffee', tags: ['coffee', 'kitchen', 'morning'] },
  { filename: 'morse-code.mp3', category: 'things', displayName: 'Morse Code', tags: ['communication', 'telegraph'] },
  { filename: 'paper.mp3', category: 'things', displayName: 'Paper', tags: ['office', 'writing'] },
  { filename: 'pencil.mp3', category: 'things', displayName: 'Pencil', tags: ['office', 'writing'] },
  { filename: 'singing-bowl.mp3', category: 'things', displayName: 'Singing Bowl', tags: ['meditation', 'spiritual', 'tibetan'] },
  { filename: 'slide-projector.mp3', category: 'things', displayName: 'Slide Projector', tags: ['presentation', 'mechanical'] },
  { filename: 'tuning-radio.mp3', category: 'things', displayName: 'Tuning Radio', tags: ['radio', 'static', 'vintage'] },
  { filename: 'typewriter.mp3', category: 'things', displayName: 'Typewriter', tags: ['writing', 'vintage', 'office'] },
  { filename: 'vinyl-effect.mp3', category: 'things', displayName: 'Vinyl Effect', tags: ['music', 'crackles', 'vintage'] },
  { filename: 'washing-machine.mp3', category: 'things', displayName: 'Washing Machine', tags: ['laundry', 'mechanical', 'indoor'] },
  { filename: 'windshield-wipers.mp3', category: 'things', displayName: 'Windshield Wipers', tags: ['car', 'rain', 'driver'] },
  { filename: 'wind-chimes.mp3', category: 'things', displayName: 'Wind Chimes', tags: ['wind', 'decoration', 'relaxing'] },

  // Transport
  { filename: 'airplane.mp3', category: 'transport', displayName: 'Airplane', tags: ['airplane', 'flight', 'travel'] },
  { filename: 'car-driving.mp3', category: 'transport', displayName: 'Car Driving', tags: ['car', 'driving', 'urban'] },
  { filename: 'car.mp3', category: 'transport', displayName: 'Car', tags: ['car', 'vehicle', 'urban'] },
  { filename: 'inside-a-train.mp3', category: 'transport', displayName: 'Inside A Train', tags: ['train', 'rail', 'journey'] },
  { filename: 'train.mp3', category: 'transport', displayName: 'Train', tags: ['train', 'rail', 'transport'] },
  { filename: 'subway.mp3', category: 'transport', displayName: 'Subway', tags: ['subway', 'urban', 'transport'] },

  // Urban
  { filename: 'walking.mp3', category: 'urban', displayName: 'Walking', tags: ['footsteps', 'urban', 'walking'] },

  // Noise
  { filename: 'brown-noise.wav', category: 'noise', displayName: 'Brown Noise', tags: ['noise', 'white', 'brown', 'sleep'] },
  { filename: 'pink-noise.wav', category: 'noise', displayName: 'Pink Noise', tags: ['noise', 'white', 'pink', 'sleep'] },
  { filename: 'white-noise.wav', category: 'noise', displayName: 'White Noise', tags: ['noise', 'white', 'sleep', 'concentration'] }
];

// Function to group sounds by category for backward compatibility
function groupSoundsByCategory(sounds) {
  const grouped = {};
  sounds.forEach(sound => {
    if (!grouped[sound.category]) grouped[sound.category] = [];
    grouped[sound.category].push(sound);
  });
  return grouped;
}

export const soundFiles = groupSoundsByCategory(soundFilesData);

// Full data export for advanced features
export const soundData = soundFilesData;
