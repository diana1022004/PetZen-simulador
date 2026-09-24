const storageKey = 'petzenData';

export class Pet {
  constructor(data = {}){
    this.id = data.id || `pet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.name = data.name || '';
    this.breed = data.breed || '';
    this.sex = data.sex || 'Macho';
    this.age = Number(data.age) || 0;
    this.weight = Number(data.weight) || 0;
    this.activity = data.activity || 'Moderado';
    this.neutered = Boolean(data.neutered);
    this.allergies = Array.isArray(data.allergies) ? data.allergies : [];
    this.weightHistory = Array.isArray(data.weightHistory) ? data.weightHistory : [];
  }
}

export const defaultData = {
  user: { name: 'Diana', email: '', password: '' },
  pets: [new Pet({ id: 'pet-default', name: 'Toby', breed: 'Beagle', sex: 'Macho', age: 3, weight: 11.2, activity: 'Moderado', neutered: true, allergies: ['Pollo', 'Trigo'], weightHistory: [{ weight: 11.2, date: '2026-09-20' }] })],
  activePetId: 'pet-default',
  feederLinked: true,
  remindersEnabled: true,
  feedingConfig: { grams: 60, foodType: 'Alimento seco' },
  schedules: { '08:00': true, '18:00': true },
  records: [],
  feedingEvents: [],
  reminders: [],
  cart: []
};

function migrate(saved){
  const legacyPet = saved.pet || defaultData.pets[0];
  const pets = Array.isArray(saved.pets) && saved.pets.length ? saved.pets : [legacyPet];
  const normalizedPets = pets.map(pet => new Pet(pet));
  return {
    ...defaultData,
    ...saved,
    user: { ...defaultData.user, ...saved.user },
    pets: normalizedPets,
    activePetId: saved.activePetId || normalizedPets[0].id,
    feedingConfig: { ...defaultData.feedingConfig, ...saved.feedingConfig },
    schedules: { ...defaultData.schedules, ...saved.schedules },
    records: Array.isArray(saved.records) ? saved.records : [],
    feedingEvents: Array.isArray(saved.feedingEvents) ? saved.feedingEvents : [],
    reminders: Array.isArray(saved.reminders) ? saved.reminders : [],
    cart: Array.isArray(saved.cart) ? saved.cart : []
  };
}

export function loadData(){
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? migrate(saved) : structuredClone(defaultData);
  } catch (error) {
    return structuredClone(defaultData);
  }
}

export function saveData(data){
  localStorage.setItem(storageKey, JSON.stringify(data));
}
