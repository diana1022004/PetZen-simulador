import { loadData, saveData as persistData, Pet } from './storage.js';

let appData = loadData();
let authMode = 'register';
let actionMode = '';
let toastTimer;
let dispensing = false;
let cart = appData.cart;

function activePet(){
  return appData.pets.find(pet => pet.id === appData.activePetId) || appData.pets[0];
}

function setActivePet(id){
  if (!appData.pets.some(pet => pet.id === id)) return;
  appData.activePetId = id;
  saveData();
  renderProfile();
}

function saveData(){
  appData.cart = cart;
  persistData(appData);
}

function toggleAuthMode(){
  authMode = authMode === 'register' ? 'login' : 'register';
  document.getElementById('loginNameField').style.display = authMode === 'register' ? 'block' : 'none';
  document.getElementById('authButton').textContent = authMode === 'register' ? 'Crear cuenta y registrar mascota' : 'Iniciar sesión';
  document.getElementById('authSwitchText').textContent = authMode === 'register' ? '¿Ya tienes una cuenta?' : '¿Aún no tienes una cuenta?';
  document.getElementById('authSwitchButton').textContent = authMode === 'register' ? 'Iniciar sesión' : 'Crear cuenta';
  document.getElementById('authError').textContent = '';
}

function submitAuth(){
  const name = document.getElementById('loginName').value.trim();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const error = document.getElementById('authError');
  error.textContent = '';
  if (!email || !email.includes('@') || password.length < 6 || (authMode === 'register' && !name)){
    error.textContent = authMode === 'register' ? 'Completa tu nombre, un correo válido y una contraseña de 6 caracteres.' : 'Escribe un correo válido y tu contraseña.';
    return;
  }
  if (authMode === 'login'){
    if (!appData.user.password || appData.user.email !== email || appData.user.password !== password){
      error.textContent = 'El correo o la contraseña no coinciden con la cuenta guardada.';
      return;
    }
  } else {
    if (appData.user.email && appData.user.email !== email){
      error.textContent = 'Ya existe una cuenta local. Usa otro correo o inicia sesión.';
      return;
    }
    appData.user = { name, email, password };
    saveData();
    openPetEditor(true);
    return;
  }
  goApp();
}

function goApp(){
  renderProfile();
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('navbar').style.display = 'flex';
  showApp('dashboard');
}

function logout(){
  appData.session = false;
  saveData();
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('navbar').style.display = 'none';
  toast('Sesión cerrada');
}

function openPetEditor(firstRegistration){
  const pet = activePet();
  document.getElementById('petModalTitle').textContent = firstRegistration ? 'Registra a tu mascota' : 'Editar información';
  document.getElementById('petNameInput').value = firstRegistration ? '' : pet.name;
  document.getElementById('petBreedInput').value = firstRegistration ? '' : pet.breed;
  document.getElementById('petSexInput').value = pet.sex;
  document.getElementById('petAgeInput').value = firstRegistration ? '' : pet.age;
  document.getElementById('petWeightInput').value = firstRegistration ? '' : pet.weight;
  document.getElementById('petActivityInput').value = pet.activity;
  document.getElementById('petNeuteredInput').value = String(pet.neutered);
  document.getElementById('petAllergiesInput').value = pet.allergies.join(', ');
  document.getElementById('petModal').classList.add('open');
}

function addPet(){
  const pet = new Pet({ name: '', breed: '', age: 0, weight: 0, allergies: [] });
  appData.pets.push(pet);
  appData.activePetId = pet.id;
  saveData();
  openPetEditor(false);
}

function openProfileEditor(){
  actionMode = 'profile';
  document.getElementById('actionModalTitle').textContent = 'Editar perfil';
  document.getElementById('actionTypeField').style.display = 'none';
  document.getElementById('actionDateField').style.display = 'none';
  document.getElementById('actionTimeField').style.display = 'none';
  document.getElementById('actionValueLabel').textContent = 'Nombre';
  document.getElementById('actionValue').placeholder = 'Tu nombre';
  document.getElementById('actionValue').value = appData.user.name || '';
  document.getElementById('actionModal').classList.add('open');
}

function closePetEditor(){ document.getElementById('petModal').classList.remove('open'); }

function savePet(event){
  event.preventDefault();
  const pet = new Pet({
    ...activePet(),
    name: document.getElementById('petNameInput').value.trim(),
    breed: document.getElementById('petBreedInput').value.trim(),
    sex: document.getElementById('petSexInput').value,
    age: Number(document.getElementById('petAgeInput').value),
    weight: Number(document.getElementById('petWeightInput').value),
    activity: document.getElementById('petActivityInput').value,
    neutered: document.getElementById('petNeuteredInput').value === 'true',
    allergies: document.getElementById('petAllergiesInput').value.split(',').map(item => item.trim()).filter(Boolean)
  });
  const petIndex = appData.pets.findIndex(item => item.id === appData.activePetId);
  if (petIndex >= 0) appData.pets[petIndex] = pet;
  else { appData.pets.push(pet); appData.activePetId = pet.id; }
  pet.weightHistory.push({ weight: pet.weight, date: new Date().toISOString().slice(0, 10) });
  saveData();
  renderProfile();
  closePetEditor();
  goApp();
  toast('Información guardada correctamente');
}

function renderProfile(){
  const pet = activePet();
  const userName = appData.user.name || 'Diana';
  document.querySelector('.greet-name').textContent = userName;
  document.querySelectorAll('.pet-name').forEach(element => element.textContent = pet.name);
  document.querySelectorAll('.pet-summary').forEach(element => element.textContent = `${pet.breed} · ${pet.age} años · ${pet.weight} kg`);
  document.querySelectorAll('.pet-profile-summary').forEach(element => element.textContent = `${pet.breed} · ${pet.sex} · ${pet.age} años`);
  document.querySelector('.pet-age').textContent = `${pet.age} años`;
  document.querySelector('.pet-breed').textContent = pet.breed;
  document.querySelector('.pet-weight').textContent = `${pet.weight} kg`;
  document.querySelector('.pet-activity').textContent = pet.activity;
  document.querySelector('.pet-neutered').textContent = pet.neutered ? 'Sí' : 'No';
  document.querySelectorAll('.pet-reference').forEach(element => element.textContent = element.classList.contains('sub') ? `Recomendación generada a partir del perfil de ${pet.name}` : `Calculado a partir de raza, peso, nivel de actividad y alergias registradas en el perfil de ${pet.name}. Se ajusta automáticamente con cada nuevo dato del comedero.`);
  document.querySelector('.pet-weight-event').textContent = `Peso actualizado: ${pet.weight} kg`;
  const weightHistory = document.getElementById('weightHistoryList');
  if (weightHistory) weightHistory.innerHTML = pet.weightHistory.slice(-6).reverse().map(entry => `<div class="list-item"><div class="list-icon">⚖️</div><div><div class="list-title">${entry.weight} kg</div><div class="list-sub">${entry.date}</div></div></div>`).join('');
  document.querySelectorAll('.dashboard-allergy').forEach((element, index) => {
    const allergy = pet.allergies[index];
    element.textContent = allergy ? `⚠ Alergia: ${allergy.toLowerCase()}` : '';
    element.style.display = allergy ? 'inline-flex' : 'none';
  });
  document.getElementById('allergyList').innerHTML = pet.allergies.length ? pet.allergies.map(allergy => `<span class="tag-chip">${allergy}</span>`).join('') : '<span class="empty-note">Sin alergias registradas</span>';
  renderPetSelector();
  renderPreferences();
}

function renderPetSelector(){
  const selector = document.getElementById('petSelector');
  if (!selector) return;
  selector.innerHTML = appData.pets.map(pet => `<option value="${pet.id}">${pet.name || 'Nueva mascota'}</option>`).join('');
  selector.value = appData.activePetId;
}

function renderPreferences(){
  const feederButton = document.getElementById('feederToggleBtn');
  const feederSub = document.getElementById('feederSub');
  const feederLight = document.getElementById('feederLight');
  if (feederButton){
    feederButton.textContent = appData.feederLinked ? 'Desvincular' : 'Vincular comedero';
    feederSub.textContent = appData.feederLinked ? 'Vinculado · Nivel de alimento 72%' : 'Sin vincular';
    feederLight.className = appData.feederLinked ? 'feeder-light on' : 'feeder-light';
  }
  renderSchedules();
  const remindersSwitch = document.getElementById('remindersSwitch');
  if (remindersSwitch){
    remindersSwitch.classList.toggle('on', appData.remindersEnabled);
    remindersSwitch.setAttribute('aria-checked', String(appData.remindersEnabled));
  }
  renderControlRecords();
  renderReminders();
}

function toggleFeeder(){
  appData.feederLinked = !appData.feederLinked;
  saveData(); renderPreferences();
  toast(appData.feederLinked ? 'Comedero vinculado' : 'Comedero desvinculado');
}

function toggleSchedule(element, time){
  appData.schedules[time] = !appData.schedules[time];
  saveData(); renderPreferences();
  toast(`Horario de las ${time} ${appData.schedules[time] ? 'activado' : 'pausado'}`);
}

function addSchedule(){ openActionModal('schedule'); }

function renderSchedules(){
  const scheduleCard = document.getElementById('scheduleCard');
  if (!scheduleCard) return;
  scheduleCard.innerHTML = Object.keys(appData.schedules).sort().map(time => {
    const enabled = appData.schedules[time] !== false;
    return `<div class="list-item"><div class="list-icon">🕘</div><div><div class="list-title">${time}</div><div class="list-sub">${appData.feedingConfig.grams} g · ${appData.feedingConfig.foodType}</div></div><div class="switch${enabled ? ' on' : ''}" data-schedule="${time}" onclick="toggleSchedule(this, '${time}')" role="switch" aria-checked="${enabled}"></div></div>`;
  }).join('');
}

function toggleReminders(){
  appData.remindersEnabled = !appData.remindersEnabled;
  saveData(); renderPreferences();
  toast(appData.remindersEnabled ? 'Recordatorios activados' : 'Recordatorios pausados');
}

function addControlRecord(){ openActionModal('record'); }
function addReminder(){ openActionModal('reminder'); }

function renderControlRecords(){
  const section = document.getElementById('controlRecords');
  if (!section) return;
  section.innerHTML = appData.records.map(record => `<div class="list-item"><div class="list-icon">${record.type.toLowerCase().includes('vacun') ? '💉' : record.type.toLowerCase().includes('medic') ? '💊' : '🩺'}</div><div><div class="list-title">${record.detail}</div><div class="list-sub">${record.type} · ${record.date}</div></div></div>`).join('');
}

function addAllergy(){ openActionModal('allergy'); }

function openActionModal(mode){
  actionMode = mode;
  const isRecord = mode === 'record';
  const isReminder = mode === 'reminder';
  document.getElementById('actionModalTitle').textContent = mode === 'allergy' ? 'Agregar alergia' : mode === 'schedule' ? 'Agregar horario' : isReminder ? 'Configurar recordatorio' : 'Registrar actividad';
  document.getElementById('actionTypeField').style.display = isRecord ? 'block' : 'none';
  document.getElementById('actionDateField').style.display = isReminder ? 'block' : 'none';
  document.getElementById('actionTimeField').style.display = isReminder ? 'block' : 'none';
  document.getElementById('actionValueLabel').textContent = mode === 'allergy' ? 'Alergia' : mode === 'schedule' ? 'Hora (HH:MM)' : isReminder ? 'Título' : 'Detalle';
  document.getElementById('actionValue').placeholder = mode === 'allergy' ? 'Ej. Pollo' : mode === 'schedule' ? '20:00' : isReminder ? 'Ej. Dar medicamento' : 'Ej. Vacuna triple felina';
  document.getElementById('actionValue').value = '';
  document.getElementById('actionDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('actionTime').value = '18:00';
  document.getElementById('actionModal').classList.add('open');
}

function closeActionModal(){ document.getElementById('actionModal').classList.remove('open'); }

function submitAction(event){
  event.preventDefault();
  const value = document.getElementById('actionValue').value.trim();
  if (actionMode === 'allergy'){
    const pet = activePet();
    if (!pet.allergies.some(item => item.toLowerCase() === value.toLowerCase())) pet.allergies.push(value);
    saveData(); renderProfile(); closeActionModal(); toast('Alergia guardada');
  } else if (actionMode === 'schedule'){
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)){ toast('Usa un formato válido, por ejemplo 20:00'); return; }
    appData.schedules[value] = true;
    saveData(); renderSchedules(); closeActionModal(); toast(`Horario de las ${value} agregado`);
  } else {
    if (actionMode === 'profile'){
      appData.user.name = value;
      saveData(); renderProfile(); closeActionModal(); toast('Perfil actualizado');
      return;
    }
    if (actionMode === 'reminder'){
      appData.reminders.unshift({ title: value, date: document.getElementById('actionDate').value, time: document.getElementById('actionTime').value, enabled: true });
      saveData(); renderReminders(); closeActionModal(); toast('Recordatorio configurado');
      return;
    }
    appData.records.unshift({ type: document.getElementById('actionType').value, detail: value, date: new Date().toLocaleDateString('es-CO') });
    saveData(); renderControlRecords(); closeActionModal(); toast('Registro guardado');
  }
}

function renderReminders(){
  const list = document.getElementById('remindersList');
  if (!list) return;
  list.innerHTML = appData.reminders.length ? appData.reminders.map((reminder, index) => `<div class="list-item"><div class="list-icon">⏰</div><div><div class="list-title">${reminder.title}</div><div class="list-sub">${reminder.date} · ${reminder.time}</div></div><div class="switch${reminder.enabled ? ' on' : ''}" onclick="toggleReminder(${index})" role="switch" aria-checked="${reminder.enabled}"></div></div>`).join('') : '<p class="empty-note">No hay recordatorios configurados.</p>';
}

function toggleReminder(index){
  appData.reminders[index].enabled = !appData.reminders[index].enabled;
  saveData(); renderReminders();
  toast(appData.reminders[index].enabled ? 'Recordatorio activado' : 'Recordatorio pausado');
}

function showApp(name){
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.querySelectorAll('.navbtn').forEach(button => button.classList.toggle('active', button.dataset.screen === name));
}

function toast(message){
  const toastElement = document.getElementById('toast');
  toastElement.textContent = message;
  toastElement.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.remove('show'), 2200);
}

function dispense(){
  if (dispensing) return;
  dispensing = true;
  const light = document.getElementById('feederLight');
  const status = document.getElementById('feederStatus');
  const button = document.getElementById('dispenseBtn');
  button.style.opacity = '.55'; button.disabled = true;
  status.textContent = 'App → enviando instrucción al software PetZen…';
  light.className = 'feeder-light busy';
  setTimeout(() => { status.textContent = 'Software PetZen → transmitiendo orden al comedero…'; }, 900);
  setTimeout(() => { status.textContent = 'Comedero dispensando alimento…'; }, 1800);
  setTimeout(() => {
    light.className = 'feeder-light on';
    status.textContent = 'Listo. Evento registrado — la recomendación de mañana se ajustará con este dato.';
    button.style.opacity = '1'; button.disabled = false; dispensing = false;
    const log = document.getElementById('feedLog');
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = '<div class="list-icon">🍽️</div><div><div class="list-title">Dispensado manual</div><div class="list-sub">Hoy · ' + hh + ':' + mm + ' · ' + appData.feedingConfig.grams + ' g</div></div>';
    log.prepend(item);
    const pet = activePet();
    appData.feedingEvents.unshift({ petId: pet.id, grams: appData.feedingConfig.grams, date: new Date().toISOString(), manual: true });
    saveData();
    renderFeedingHistory();
    toast(`${pet.name} fue alimentado — evento registrado`);
  }, 2700);
}

function showTab(name){
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name));
  document.querySelectorAll('.tabpanel').forEach(panel => panel.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
}

function fmt(number){ return '$' + number.toLocaleString('es-CO'); }
function addToCart(name, price){
  cart.push({ name, price });
  saveData(); renderCart(); toast(name + ' agregado al carrito');
}
function renderCart(){
  const count = cart.length;
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  document.getElementById('cartCount').textContent = count + (count === 1 ? ' artículo en el carrito' : ' artículos en el carrito');
  document.getElementById('cartTotal').textContent = fmt(total);
  const badge = document.getElementById('navCartBadge');
  if (count > 0){ badge.style.display = 'flex'; badge.textContent = count > 9 ? '9+' : count; }
  else { badge.style.display = 'none'; }
}
function checkout(){
  if (cart.length === 0){ toast('Tu carrito está vacío'); return; }
  toast('Pedido confirmado — se coordinará con cada proveedor');
  cart = [];
  saveData(); renderCart();
}

function processScheduledFeeding(){
  if (!appData.feederLinked) return;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (appData.schedules[time] !== true) return;
  const pet = activePet();
  const alreadyRecorded = appData.feedingEvents.some(event => event.petId === pet.id && event.scheduledTime === time && event.date.slice(0, 10) === now.toISOString().slice(0, 10));
  if (alreadyRecorded) return;
  appData.feedingEvents.unshift({ petId: pet.id, grams: appData.feedingConfig.grams, scheduledTime: time, date: now.toISOString(), manual: false });
  saveData(); renderFeedingHistory(); toast(`${pet.name} recibió su alimentación programada`);
}

function renderFeedingHistory(){
  const log = document.getElementById('feedLog');
  if (!log) return;
  const petId = activePet().id;
  const events = appData.feedingEvents.filter(event => event.petId === petId);
  log.innerHTML = events.length ? events.map(event => `<div class="list-item"><div class="list-icon">🍽️</div><div><div class="list-title">${event.manual ? 'Dispensado manual' : 'Dispensado automático'}</div><div class="list-sub">${new Date(event.date).toLocaleString('es-CO')} · ${event.grams} g</div></div></div>`).join('') : '<p class="empty-note">Aún no hay eventos de alimentación.</p>';
}

function saveFeedingConfig(event){
  event.preventDefault();
  appData.feedingConfig = {
    grams: Number(document.getElementById('feedingGrams').value),
    foodType: document.getElementById('feedingType').value
  };
  saveData();
  renderFeedingConfig();
  renderSchedules();
  closeFeedingConfig();
  toast('Parámetros de alimentación guardados');
}

function openFeedingConfig(){
  document.getElementById('feedingGrams').value = appData.feedingConfig.grams;
  document.getElementById('feedingType').value = appData.feedingConfig.foodType;
  document.getElementById('feedingConfigModal').classList.add('open');
}

function closeFeedingConfig(){ document.getElementById('feedingConfigModal').classList.remove('open'); }

function renderFeedingConfig(){
  const text = document.getElementById('feedingConfigText');
  if (text) text.textContent = `${appData.feedingConfig.grams} g · ${appData.feedingConfig.foodType}`;
}

Object.assign(window, {
  toggleAuthMode, submitAuth, goApp, openPetEditor, closePetEditor, savePet,
  logout, addPet, setActivePet, openProfileEditor,
  toggleFeeder, toggleSchedule, addSchedule, toggleReminders, addControlRecord,
  addAllergy, openActionModal, closeActionModal, submitAction, showApp, toast,
  dispense, showTab, addToCart, checkout, renderFeedingHistory, addReminder, toggleReminder,
  saveFeedingConfig, openFeedingConfig, closeFeedingConfig
});

renderCart();
renderProfile();
renderFeedingConfig();
renderFeedingHistory();
setInterval(processScheduledFeeding, 30000);
