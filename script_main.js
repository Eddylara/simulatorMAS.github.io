let scene = document.querySelector("#canvas"); // Canvas en HTML
let $pos = document.querySelector("#pos"); // Espacio posición
let $vel = document.querySelector("#vel"); // Espacio velocidad
let $ace = document.querySelector("#ace"); // Espacio aceleración
let ctx = scene.getContext("2d");

// Entrada de masa
let $masaInput = document.querySelector("#masa");
$masaInput.value = 600;
// Entrada de constante del resorte
let $constResorte = document.querySelector("#resorte_const");
$constResorte.value = 50;
// Botón para iniciar/detener la animación
let $playBt = document.querySelector("#btnPlay");
// Boton para reiniciar
let $btnRestart = document.querySelector("#btn-restart");

// Variables de control
let isDragging = false;
let possibleDragging = true;
let widthMasa = massToPixel(600);
let heightMasa = massToPixel(600);
let amplitude = canvas.width / 2 - widthMasa / 2 - 42; // Amplitud
let omega = Math.sqrt($constResorte.value / ($masaInput.value / 1000)); // Frecuencia angular
let period = ((2 * Math.PI) / omega) * 1000; // Período en milisegundos
let phase = 0; // Fase inicial
let startTime = null; // Tiempo de inicio
let elapsedTime = null;
let timeSave = 0;

// Variables para la animación
let posx = 0; // Posición
let velocity = 0; // Velocidad
let acceleration = 0; // Aceleración
let isAnimating = false; // Estado de la animación
let animationId = null; // ID de la animación para detenerla

function dibujarSuelo() {
  ctx.fillStyle = "#8B4513"; // Color marrón para el suelo
  ctx.fillRect(0, scene.height / 2 + heightMasa / 2 + 60, scene.width, 10); // Suelo
}

function drawSpring(x1, y1, x2, y2, coils = 10) {
  const spacing = (x2 - x1) / (coils * 2); // Espaciado entre las bobinas
  const amplitude = 10; // Amplitud de la onda (ajustable)

  ctx.beginPath();
  for (let i = 0; i <= coils * 2; i++) {
    const x = x1 + i * spacing;
    const y = y1 + (i % 2 === 0 ? amplitude : -amplitude); // Alterna arriba y abajo

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = "#A7A8AA";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function dibujarEquilibrio() {
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(
    canvas.width / 2 + 40,
    canvas.height / 2 - heightMasa / 2 + 20 // Punto de inicio (fijo)
  );
  ctx.lineTo(
    canvas.width / 2 + 40,
    canvas.height / 2 + heightMasa / 2 + 100 // Punto final (fijo)
  );
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]); // Limpiar el estilo de línea punteada
}

function massToPixel(masa) {
  return Math.round(17980 / 599.8 + (70 * masa) / 599.8);
}

function dibujarEscena() {
  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar el cuadrado en la posición actual
  ctx.fillStyle = "black";
  ctx.fillRect(
    posx + canvas.width / 2 - widthMasa / 2 + 40,
    canvas.height / 2 - heightMasa / 2 + 60,
    widthMasa,
    heightMasa
  );

  // Dibujar el resorte
  const springStartX = 0;
  const springEndX = posx + canvas.width / 2 + 40 - heightMasa / 2;
  const springY = canvas.height / 2 + 60;
  drawSpring(springStartX, springY, springEndX, springY);

  // Dibujar Suelo
  dibujarSuelo();

  // Dibujar Punto de equilibrio
  dibujarEquilibrio();
}
amplitude = canvas.width / 2 - widthMasa / 2 - 42; // Amplitud Maxima
function animate(timestamp) {
  let hh = !startTime;

  if (!startTime) {
    startTime = timestamp;
    console.log("HOLAAA");
  } // Marcar el inicio

  elapsedTime = (timestamp - startTime) / 1000; // Calcular tiempo transcurrido

  console.log("Amplitud ", amplitude);
  console.log("Omega: ", omega);
  posx = amplitude * Math.sin(omega * elapsedTime + phase);

  // Calcular velocidad
  velocity = (amplitude / 100) * omega * Math.cos(omega * elapsedTime + phase);

  // Calcular aceleración
  acceleration =
    (-amplitude / 100) * omega * omega * Math.sin(omega * elapsedTime + phase);

  // Dibujar la escena
  dibujarEscena();

  // Mostrar información (opcional)
  $pos.innerHTML = `x = ${Math.round(posx.toFixed(3) * 100) / 10000}`;
  $vel.innerHTML = `v = ${Math.round(velocity.toFixed(5) * 10000) / 10000}`;
  $ace.innerHTML = `a = ${Math.round(acceleration.toFixed(5) * 10000) / 10000}`;

  // Continuar la animación solo si está activa
  if (isAnimating) {
    animationId = requestAnimationFrame(animate);
  }
}

// EVENTOS

let offsetXFromMass = 0; // Diferencia entre la posición del mouse y la masa

scene.addEventListener("mousedown", function (event) {
  // Comprobar si el mouse está sobre la masa
  console.log("HOALAA");
  const rect = scene.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  if (
    offsetX >= canvas.width / 2 - widthMasa / 2 + 40 &&
    offsetX <= canvas.width / 2 + widthMasa / 2 + 40 &&
    offsetY >= canvas.height / 2 - heightMasa / 2 + 60 &&
    offsetY <= canvas.height / 2 + heightMasa / 2 + 60 &&
    possibleDragging
  ) {
    isDragging = true; // Iniciar el arrastre
    console.log("IS DRAGGING");

    // Calcular la diferencia entre el clic y la posición actual de la masa
    offsetXFromMass = offsetX - (canvas.width / 2 + 40 - widthMasa / 2);
  }
});

scene.addEventListener("mousemove", function (event) {
  if (isDragging) {
    // Calcular la posición del mouse respecto al centro del canvas
    let mouseXCurrent = event.clientX - canvas.getBoundingClientRect().left; // Ajustar coordenadas del mouse respecto al canvas
    let centerX = canvas.width / 2 + 40 - widthMasa / 2; // Posición del centro del resorte
    let amplitudMax = canvas.width / 2 - widthMasa / 2 - 42; // Amplitud máxima permitida

    // Calcular la nueva posición de la masa utilizando la diferencia
    posx = mouseXCurrent - centerX - offsetXFromMass;

    // Limitar la posición de la masa para que no exceda la amplitud máxima
    if (posx > amplitudMax) {
      posx = amplitudMax; // Limitar a la amplitud máxima positiva
    } else if (posx < -amplitudMax) {
      posx = -amplitudMax; // Limitar a la amplitud máxima negativa
    }

    amplitude = Math.abs(posx); // Establecer la amplitud como la distancia desde el centro
    dibujarEscena(); // Redibujar la escena
  }
});

scene.addEventListener("mouseup", function () {
  if (isDragging) {
    isDragging = false; // Detener el arrastre
    startTime = performance.now(); // Iniciar el tiempo al soltar la masa
    isAnimating = true; // Iniciar la animación
    possibleDragging = false;

    // Establecer la fase y la velocidad al soltar
    if (posx > 0) {
      phase = Math.PI / 2; // Ajustar la fase para x positivo con t = 0
    } else {
      phase = (3 * Math.PI) / 2; // Ajustar la fase para x negativo con t = 0
    }

    velocity = 0; // Velocidad inicial al soltar
    requestAnimationFrame(animate); // Comenzar la animación
    $playBt.textContent = "Detener"; // Cambiar el texto del botón
  }
});

// Evento touchstart
scene.addEventListener("touchstart", (event) => {
  event.preventDefault(); // Prevenir el comportamiento predeterminado

  const touch = event.changedTouches[0]; // Obtener el primer toque
  const rect = scene.getBoundingClientRect(); // Obtener el rectángulo del elemento

  // Calcular las coordenadas del toque con respecto al elemento
  const touchX = (touch.clientX - rect.left) * 1.941747573; // Coordenada X
  const touchY = (touch.clientY - rect.top) * 1.941747573; // Coordenada Y

  // Comprobar si el toque está sobre la masa
  if (
    touchX >= canvas.width / 2 - widthMasa / 2 + 40 &&
    touchX <= canvas.width / 2 + widthMasa / 2 + 40 &&
    touchY >= canvas.height / 2 - heightMasa / 2 + 60 &&
    touchY <= canvas.height / 2 + heightMasa / 2 + 60 &&
    possibleDragging
  ) {
    isDragging = true; // Iniciar el arrastre
    console.log("IS DRAGGING");

    // Calcular la diferencia entre el toque y la posición actual de la masa
    offsetXFromMass = touchX - (canvas.width / 2 + 40 - widthMasa / 2);
  }
});

// Evento touchmove
scene.addEventListener("touchmove", (event) => {
  if (isDragging) {
    const touch = event.changedTouches[0]; // Obtener el primer toque
    const rect = scene.getBoundingClientRect(); // Obtener el rectángulo del elemento

    // Calcular la posición del toque
    let touchXCurrent = (touch.clientX - rect.left) * 1.941747573; // Ajustar coordenadas del toque
    let centerX = canvas.width / 2 + 40 - widthMasa / 2; // Posición del centro del resorte
    let amplitudMax = canvas.width / 2 - widthMasa / 2 - 42; // Amplitud máxima permitida

    // Calcular la nueva posición de la masa utilizando la diferencia
    posx = touchXCurrent - centerX - offsetXFromMass;

    // Limitar la posición de la masa para que no exceda la amplitud máxima
    if (posx > amplitudMax) {
      posx = amplitudMax; // Limitar a la amplitud máxima positiva
    } else if (posx < -amplitudMax) {
      posx = -amplitudMax; // Limitar a la amplitud máxima negativa
    }

    amplitude = Math.abs(posx); // Establecer la amplitud como la distancia desde el centro
    dibujarEscena(); // Redibujar la escena
  }
});

// Evento touchend
scene.addEventListener("touchend", () => {
  if (isDragging) {
    isDragging = false; // Detener el arrastre
    startTime = performance.now(); // Iniciar el tiempo al soltar la masa
    isAnimating = true; // Iniciar la animación
    possibleDragging = false;

    // Establecer la fase y la velocidad al soltar
    if (posx > 0) {
      phase = Math.PI / 2; // Ajustar la fase para x positivo con t = 0
    } else {
      phase = (3 * Math.PI) / 2; // Ajustar la fase para x negativo con t = 0
    }

    velocity = 0; // Velocidad inicial al soltar
    requestAnimationFrame(animate); // Comenzar la animación
    $playBt.textContent = "Detener"; // Cambiar el texto del botón
  }
});

$masaInput.addEventListener("input", function () {
  let value = parseFloat($masaInput.value);

  if (value < 0.2 || value > 600) {
    $masaInput.value = ""; // Limpiar el campo si el valor es inválido
  } else {
    widthMasa = massToPixel($masaInput.value);
    heightMasa = massToPixel($masaInput.value);

    // Recalcular omega y el período
    let resorteValue = parseFloat($constResorte.value);
    if (resorteValue) {
      let masa = parseFloat($masaInput.value) / 1000;
      omega = Math.sqrt(resorteValue / masa);
      period = ((2 * Math.PI) / omega) * 1000;
    }

    dibujarEscena(); // Redibujar la escena cuando cambie la masa
    isDragging = false; // Detener el arrastre
    isAnimating = false; // Detener la animación
    startTime = null; // Reiniciar el tiempo de inicio
    timeSave = 0; // Reiniciar el tiempo guardado
    posx = 0; // Posición inicial
    velocity = 0; // Velocidad inicial
    acceleration = 0; // Aceleración inicial
    amplitude = 0; // Reiniciar la amplitud
    phase = 0; // Reiniciar la fase
    possibleDragging = true;
  }
});

$constResorte.addEventListener("input", () => {
  let value = parseFloat($constResorte.value);

  if (value < 0.5 || value > 2500) {
    $constResorte.value = ""; // Limpiar el campo si el valor es inválido
  } else {
    let masa = parseFloat($masaInput.value) / 1000;
    omega = Math.sqrt(value / masa); // Recalcular omega
    period = ((2 * Math.PI) / omega) * 1000;

    isDragging = false; // Detener el arrastre
    isAnimating = false; // Detener la animación
    startTime = null; // Reiniciar el tiempo de inicio
    timeSave = 0; // Reiniciar el tiempo guardado
    posx = 0; // Posición inicial
    velocity = 0; // Velocidad inicial
    acceleration = 0; // Aceleración inicial
    amplitude = 0; // Reiniciar la amplitud
    phase = 0; // Reiniciar la fase
    possibleDragging = true;
  }
});

function pararAnimacion() {
  if (isAnimating) {
    cancelAnimationFrame(animationId); // Detener la animación actual
    isAnimating = false;
  }
  startTime = null; // Reiniciar el tiempo de inicio
  timeSave = 0; // Reiniciar el tiempo guardado
  // Reiniciar la posición y otros valores
  posx = 0; // Posición inicial
  velocity = 0; // Velocidad inicial
  acceleration = 0; // Aceleración inicial

  dibujarEscena(); // Redibujar la escena para mostrar la posición inicial
}

$playBt.addEventListener("click", function () {
  if (isAnimating) {
    // Detener la animación
    cancelAnimationFrame(animationId);
    timeSave = elapsedTime; // Guardar el tiempo transcurrido
    isAnimating = false;
    $playBt.textContent = "Iniciar";
  } else {
    // Iniciar la animación desde el punto donde se detuvo
    isAnimating = true;
    startTime = performance.now() - timeSave * 1000; // Ajustar startTime al tiempo acumulado
    requestAnimationFrame(animate);
    $playBt.textContent = "Detener";
  }
});

$btnRestart.addEventListener("click", () => {
  resetSimulation();
});
function resetSimulation() {
  // Reiniciar todas las variables
  isDragging = false; // Detener el arrastre
  isAnimating = false; // Detener la animación
  startTime = null; // Reiniciar el tiempo de inicio
  timeSave = 0; // Reiniciar el tiempo guardado
  posx = 0; // Posición inicial
  velocity = 0; // Velocidad inicial
  acceleration = 0; // Aceleración inicial
  amplitude = 0; // Reiniciar la amplitud
  phase = 0; // Reiniciar la fase
  possibleDragging = true;

  // Reiniciar entradas de usuario
  $masaInput.value = 600; // Valor predeterminado para la masa
  $constResorte.value = 50; // Valor predeterminado para la constante del resorte

  // Redibujar la escena
  widthMasa = massToPixel($masaInput.value);
  heightMasa = massToPixel($masaInput.value);
  dibujarEscena(); // Redibujar la escena para mostrar la posición inicial
}

// Dibujar la escena inicial antes de iniciar la animación
dibujarEscena();
