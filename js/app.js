import { loadData, saveData as persistData } from './storage.js';

let appData = loadData();
let authMode = 'register';
let actionMode = '';
let toastTimer;
let dispensing = false;
let cart = appData.cart;

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

function openPetEditor(firstRegistration){
  const pet = appData.pet;
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

function closePetEditor(){ document.getElementById('petModal').classList.remove('open'); }

function savePet(event){
  event.preventDefault();
  appData.pet = {
    name: document.getElementById('petNameInput').value.trim(),
    breed: document.getElementById('petBreedInput').value.trim(),
    sex: document.getElementById('petSexInput').value,
    age: Number(document.getElementById('petAgeInput').value),
    weight: Number(document.getElementById('petWeightInput').value),
    activity: document.getElementById('petActivityInput').value,
    neutered: document.getElementById('petNeuteredInput').value === 'true',
    allergies: document.getElementById('petAllergiesInput').value.split(',').map(item => item.trim()).filter(Boolean)
  };
  saveData();
  renderProfile();
  closePetEditor();
  goApp();
  toast('Información guardada correctamente');
}

function renderProfile(){
  const pet = appData.pet;
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
  document.querySelectorAll('.dashboard-allergy').forEach((element, index) => {
    const allergy = pet.allergies[index];
    element.textContent = allergy ? `⚠ Alergia: ${allergy.toLowerCase()}` : '';
    element.style.display = allergy ? 'inline-flex' : 'none';
  });
  document.getElementById('allergyList').innerHTML = pet.allergies.length ? pet.allergies.map(allergy => `<span class="tag-chip">${allergy}</span>`).join('') : '<span class="empty-note">Sin alergias registradas</span>';
  renderPreferences();
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
    return `<div class="list-item"><div class="list-icon">🕘</div><div><div class="list-title">${time}</div><div class="list-sub">60 g · Alimento seco</div></div><div class="switch${enabled ? ' on' : ''}" data-schedule="${time}" onclick="toggleSchedule(this, '${time}')" role="switch" aria-checked="${enabled}"></div></div>`;
  }).join('');
}

function toggleReminders(){
  appData.remindersEnabled = !appData.remindersEnabled;
  saveData(); renderPreferences();
  toast(appData.remindersEnabled ? 'Recordatorios activados' : 'Recordatorios pausados');
}

function addControlRecord(){ openActionModal('record'); }

function renderControlRecords(){
  const section = document.getElementById('controlRecords');
  if (!section) return;
  section.innerHTML = appData.records.map(record => `<div class="list-item"><div class="list-icon">${record.type.toLowerCase().includes('vacun') ? '💉' : record.type.toLowerCase().includes('medic') ? '💊' : '🩺'}</div><div><div class="list-title">${record.detail}</div><div class="list-sub">${record.type} · ${record.date}</div></div></div>`).join('');
}

function addAllergy(){ openActionModal('allergy'); }

function openActionModal(mode){
  actionMode = mode;
  const isRecord = mode === 'record';
  document.getElementById('actionModalTitle').textContent = mode === 'allergy' ? 'Agregar alergia' : mode === 'schedule' ? 'Agregar horario' : 'Registrar actividad';
  document.getElementById('actionTypeField').style.display = isRecord ? 'block' : 'none';
  document.getElementById('actionValueLabel').textContent = mode === 'allergy' ? 'Alergia' : mode === 'schedule' ? 'Hora (HH:MM)' : 'Detalle';
  document.getElementById('actionValue').placeholder = mode === 'allergy' ? 'Ej. Pollo' : mode === 'schedule' ? '20:00' : 'Ej. Vacuna triple felina';
  document.getElementById('actionValue').value = '';
  document.getElementById('actionModal').classList.add('open');
}

function closeActionModal(){ document.getElementById('actionModal').classList.remove('open'); }

function submitAction(event){
  event.preventDefault();
  const value = document.getElementById('actionValue').value.trim();
  if (actionMode === 'allergy'){
    if (!appData.pet.allergies.some(item => item.toLowerCase() === value.toLowerCase())) appData.pet.allergies.push(value);
    saveData(); renderProfile(); closeActionModal(); toast('Alergia guardada');
  } else if (actionMode === 'schedule'){
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)){ toast('Usa un formato válido, por ejemplo 20:00'); return; }
    appData.schedules[value] = true;
    saveData(); renderSchedules(); closeActionModal(); toast(`Horario de las ${value} agregado`);
  } else {
    appData.records.unshift({ type: document.getElementById('actionType').value, detail: value, date: new Date().toLocaleDateString('es-CO') });
    saveData(); renderControlRecords(); closeActionModal(); toast('Registro guardado');
  }
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
    item.innerHTML = '<div class="list-icon">🍽️</div><div><div class="list-title">Dispensado manual</div><div class="list-sub">Hoy · ' + hh + ':' + mm + ' · 60 g</div></div>';
    log.prepend(item);
    toast(`${appData.pet.name} fue alimentado — evento registrado`);
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

Object.assign(window, {
  toggleAuthMode, submitAuth, goApp, openPetEditor, closePetEditor, savePet,
  toggleFeeder, toggleSchedule, addSchedule, toggleReminders, addControlRecord,
  addAllergy, openActionModal, closeActionModal, submitAction, showApp, toast,
  dispense, showTab, addToCart, checkout
});

renderCart();
