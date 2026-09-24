# PetZen — Prototipo interactivo

Prototipo funcional (HTML + CSS + JS puro, sin dependencias) de la app PetZen:
perfil unificado, nutrición algorítmica, alimentación con comedero inteligente,
centro de control (vacunas, medicamentos, citas, recordatorios) y carrito
unificado (veterinarios, supermercados, accesorios).

La interfaz vive en `index.html` y la lógica está
separada en módulos ES reutilizables:

- `js/app.js`: flujos de autenticación, mascota, alimentación, control y carrito.
- `js/storage.js`: modelo inicial y persistencia en `localStorage`.

El registro de usuario, la mascota y sus ediciones permanecen al recargar en el mismo dispositivo
y navegador.

Para trabajar con módulos ES se recomienda abrirlo con **Live Server**. Algunos navegadores
bloquean imports JavaScript cuando se abre directamente con `file://`.

## Flujo de navegación

- **Inicio → Mascota → Alimentación → Control → Carrito** (barra inferior).
- En **Alimentación**, el botón "Dispensar ahora" simula el flujo completo:
  App → Software PetZen → Comedero → Dispensa → Registra el evento.
- En **Carrito**, "+" agrega servicios/productos y "Confirmar pedido" simula el checkout.
- En la pantalla inicial puedes crear una cuenta, registrar la mascota y luego editar sus datos
  desde **Mascota → Editar información de la mascota**. Para entrar después de recargar, usa el
  mismo correo y contraseña.
