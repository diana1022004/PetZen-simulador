const storageKey = 'petzenData';

export const defaultData = {
  user: { name: 'Diana', email: '' },
  pet: { name: 'Toby', breed: 'Beagle', sex: 'Macho', age: 3, weight: 11.2, activity: 'Moderado', neutered: true, allergies: ['Pollo', 'Trigo'] },
  feederLinked: true,
  remindersEnabled: true,
  schedules: { '08:00': true, '18:00': true },
  records: [],
  cart: []
};

export function loadData(){
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? {
      ...defaultData,
      ...saved,
      user: { ...defaultData.user, ...saved.user },
      pet: { ...defaultData.pet, ...saved.pet },
      schedules: { ...defaultData.schedules, ...saved.schedules },
      records: Array.isArray(saved.records) ? saved.records : [],
      cart: Array.isArray(saved.cart) ? saved.cart : []
    } : structuredClone(defaultData);
  } catch (error) {
    return structuredClone(defaultData);
  }
}

export function saveData(data){
  localStorage.setItem(storageKey, JSON.stringify(data));
}
