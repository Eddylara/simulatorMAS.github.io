let canvas = document.querySelector("#canvas");
let $pos = document.querySelector("#pos");
let $vel = document.querySelector("#vel");
let $ace = document.querySelector("#ace");
let ctx = canvas.getContext("2d");

// Entrada de masa
let $masaInput = document.querySelector("#masa");
$masaInput.value = 600;
// Entrada de constante del resorte
let $constResorte = document.querySelector("#resorte_const");
$constResorte.value = 50;
// Botón para iniciar/detener la animación
let $playBt = document.querySelector("#btnPlay");
// Botón para reiniciar
let $btnRestart = document.querySelector("#btn-restart");
// Checkbox para mostrar equilibrio
let $checkboxEquilibrio = document.querySelector("#ver_equilibrio");
let mostrarEquilibrio = $checkboxEquilibrio.checked;

// ECUACIONES
let $divEcuPos = document.querySelector("#eqPos");
let $divEcuVel = document.querySelector("#eqVelo");
let $divEcuAce = document.querySelector("#eqAce");

function restaurarEcua() {
  $divEcuPos.innerHTML = "x(t) = Asen(&omega;t + &phi;) [m]";
  $divEcuVel.innerHTML = "v(t) = A&omega;cos(&omega;t + &phi;) [m/s]";
  $divEcuAce.innerHTML =
    "a(t) = -A&omega;<sup>2</sup>sen(&omega;t + &phi;) [m/s<sup>2</sup>]";
}

function actualizarEcua() {
  let samplitude = Math.round(amplitudeMeters * 1000) / 1000;
  let somega = Math.round(omega * 1000) / 1000;
  let coe2 = Math.round(amplitudeMeters * omega * 1000) / 1000;
  let coe3 = Math.round(amplitudeMeters * omega * omega * 1000) / 1000;
  let sphase = phase >= 0 ? "+ " : "- ";
  sphase +=
    Math.abs(phase) === Math.PI / 2
      ? "<sup>1</sup>/<sub>2</sub>&pi;"
      : (Math.abs(phase) / Math.PI).toFixed(2) + "&pi;";
  $divEcuPos.innerHTML = `x(t) = ${samplitude}sen(${somega}t ${sphase}) [m]`;
  $divEcuVel.innerHTML = `v(t) = ${coe2}cos(${somega}t ${sphase}) [m/s]`;
  $divEcuAce.innerHTML = `a(t) = -${coe3}sen(${somega}t ${sphase}) [m/s<sup>2</sup>]`;
}

// Variables de control
let isDragging = false;
let possibleDragging = true;
let widthMasa = massToPixel(600);
let heightMasa = massToPixel(600);
let escalaPixelsPorMetro = 100; // Número de píxeles que representan 1 metro

let amplitudeMeters = 0; // Amplitud en metros (inicialmente 0)
let amplitudeMaxMeters =
  (canvas.width / 2 - widthMasa / 2 - 42) / escalaPixelsPorMetro; // Amplitud máxima en metros
let amplitude = amplitudeMeters * escalaPixelsPorMetro; // Amplitud en píxeles

let omega = Math.sqrt($constResorte.value / ($masaInput.value / 1000)); // Frecuencia angular
let period = ((2 * Math.PI) / omega) * 1000; // Período en milisegundos
let phase = 0; // Fase inicial
let startTime = null; // Tiempo de inicio
let elapsedTime = 0;
let timeSave = 0;

// Variables para la animación
let posx = 0; // Posición en píxeles
let posxMeters = 0; // Posición en metros
let velocity = 0; // Velocidad
let acceleration = 0; // Aceleración
let isAnimating = false; // Estado de la animación
let animationId = null; // ID de la animación para detenerla

// Evento para el checkbox de mostrar equilibrio
$checkboxEquilibrio.addEventListener("change", function () {
  mostrarEquilibrio = this.checked;
  dibujarEscena();
});

function dibujarSuelo() {
  ctx.fillStyle = "#8B4513"; // Color marrón para el suelo
  ctx.fillRect(0, canvas.height / 2 + heightMasa / 2 + 60, canvas.width, 10); // Suelo
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
  const equilibriumX = canvas.width / 2 + 40;
  ctx.moveTo(
    equilibriumX,
    canvas.height / 2 - heightMasa / 2 + 20 // Punto de inicio (fijo)
  );
  ctx.lineTo(
    equilibriumX,
    canvas.height / 2 + heightMasa / 2 + 100 // Punto final (fijo)
  );
  ctx.strokeStyle = "grey";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]); // Limpiar el estilo de línea punteada
}

function massToPixel(masa) {
  return Math.round(17980 / 599.8 + (70 * masa) / 599.8);
}

function dibujarRegla() {
  const reglaY = canvas.height / 2 + heightMasa / 2 + 70; // Posición vertical de la regla
  const equilibriumX = canvas.width / 2 + 40; // Posición X del punto de equilibrio
  const numDivisiones = 10; // Número de divisiones positivas y negativas
  const divisionLength = 10; // Longitud de las marcas pequeñas
  const longDivisionLength = 15; // Longitud de las marcas largas

  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.beginPath();

  // Dibujar línea base de la regla
  ctx.moveTo(equilibriumX - numDivisiones * escalaPixelsPorMetro, reglaY);
  ctx.lineTo(equilibriumX + numDivisiones * escalaPixelsPorMetro, reglaY);
  ctx.stroke();

  // Dibujar divisiones y etiquetas
  for (let i = -numDivisiones; i <= numDivisiones; i++) {
    const x = equilibriumX + i * escalaPixelsPorMetro;
    ctx.beginPath();
    ctx.moveTo(x, reglaY);
    ctx.lineTo(x, reglaY + (i % 1 === 0 ? longDivisionLength : divisionLength));
    ctx.stroke();

    // Agregar etiquetas cada 1 metro
    if (i % 1 === 0) {
      ctx.font = "12px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText(i.toString(), x, reglaY + 25);
    }
  }
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
  const springEndX = posx + canvas.width / 2 + 40 - widthMasa / 2;
  const springY = canvas.height / 2 + 60;
  drawSpring(springStartX, springY, springEndX, springY);

  // Dibujar Suelo
  dibujarSuelo();

  // Dibujar Punto de equilibrio si está seleccionado
  if (mostrarEquilibrio) {
    dibujarEquilibrio();
  }

  // Dibujar la regla métrica
  dibujarRegla();

  // Dibujar el cronómetro en la esquina superior derecha
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "right";
  ctx.fillText(`Tiempo: ${elapsedTime.toFixed(2)} s`, canvas.width - 10, 30);

  // Mostrar posición actual al arrastrar en la esquina inferior izquierda
  if (isDragging) {
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(
      `Posición: ${posxMeters.toFixed(3)} m`,
      10,
      canvas.height - 10
    );
  }
}

function metrosAPixeles(metros) {
  return metros * escalaPixelsPorMetro;
}

function pixelesAMetros(pixeles) {
  return pixeles / escalaPixelsPorMetro;
}

function animate(timestamp) {
  if (!startTime) {
    startTime = timestamp;
  } // Marcar el inicio

  elapsedTime = (timestamp - startTime) / 1000; // Calcular tiempo transcurrido

  posxMeters = amplitudeMeters * Math.sin(omega * elapsedTime + phase);
  posx = metrosAPixeles(posxMeters);

  // Calcular velocidad
  velocity = amplitudeMeters * omega * Math.cos(omega * elapsedTime + phase);

  // Calcular aceleración
  acceleration =
    -amplitudeMeters * omega * omega * Math.sin(omega * elapsedTime + phase);

  // Dibujar la escena
  dibujarEscena();

  // Mostrar información
  $pos.innerHTML = `x = ${posxMeters.toFixed(3)} m`;
  $vel.innerHTML = `v = ${velocity.toFixed(3)} m/s`;
  $ace.innerHTML = `a = ${acceleration.toFixed(3)} m/s<sup>2</sup>`;

  // Continuar la animación solo si está activa
  if (isAnimating) {
    animationId = requestAnimationFrame(animate);
  }
}

// EVENTOS

let offsetXFromMass = 0; // Diferencia entre la posición del mouse y la masa en píxeles

// Eventos de mouse
canvas.addEventListener("mousedown", function (event) {
  // Comprobar si el mouse está sobre la masa
  const rect = canvas.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  const masaX = posx + canvas.width / 2 - widthMasa / 2 + 40;
  const masaY = canvas.height / 2 - heightMasa / 2 + 60;

  if (
    offsetX >= masaX &&
    offsetX <= masaX + widthMasa &&
    offsetY >= masaY &&
    offsetY <= masaY + heightMasa &&
    possibleDragging
  ) {
    isDragging = true; // Iniciar el arrastre

    // Calcular la diferencia entre el clic y la posición actual de la masa
    offsetXFromMass = offsetX - masaX;
  }
});

canvas.addEventListener("mousemove", function (event) {
  if (isDragging) {
    // Calcular la posición del mouse respecto al canvas
    let mouseXCurrent = event.clientX - canvas.getBoundingClientRect().left; // Ajustar coordenadas del mouse respecto al canvas
    let equilibriumX = canvas.width / 2 + 40 - widthMasa / 2; // Posición del punto de equilibrio
    let maxAmplitudePixels = amplitudeMaxMeters * escalaPixelsPorMetro; // Amplitud máxima en píxeles

    // Calcular la nueva posición de la masa utilizando la diferencia
    posx = mouseXCurrent - equilibriumX - offsetXFromMass;

    // Limitar la posición de la masa para que no exceda la amplitud máxima
    if (posx > maxAmplitudePixels) {
      posx = maxAmplitudePixels; // Limitar a la amplitud máxima positiva
    } else if (posx < -maxAmplitudePixels) {
      posx = -maxAmplitudePixels; // Limitar a la amplitud máxima negativa
    }

    posxMeters = pixelesAMetros(posx);
    amplitudeMeters = Math.abs(posxMeters); // Establecer la amplitud como la distancia desde el equilibrio

    // Actualizar la escena
    dibujarEscena();
  }
});

canvas.addEventListener("mouseup", function () {
  if (isDragging) {
    isDragging = false; // Detener el arrastre
    startTime = performance.now(); // Iniciar el tiempo al soltar la masa
    isAnimating = true; // Iniciar la animación
    possibleDragging = false;

    // Establecer la fase y la velocidad al soltar
    if (posxMeters > 0) {
      phase = Math.PI / 2; // Ajustar la fase para x positivo con t = 0
    } else {
      phase = -Math.PI / 2; // Ajustar la fase para x negativo con t = 0
    }

    velocity = 0; // Velocidad inicial al soltar
    actualizarEcua(); // Actualizar las ecuaciones con los nuevos valores
    requestAnimationFrame(animate); // Comenzar la animación
    $playBt.style.display = "block";
    $playBt.textContent = "Detener"; // Cambiar el texto del botón
  }
});

// Eventos táctiles
canvas.addEventListener("touchstart", function (event) {
  event.preventDefault(); // Prevenir el comportamiento predeterminado

  const touch = event.changedTouches[0]; // Obtener el primer toque
  const rect = canvas.getBoundingClientRect(); // Obtener el rectángulo del canvas

  // Calcular factores de escala
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Calcular las coordenadas del toque con respecto al canvas
  const touchX = (touch.clientX - rect.left) * scaleX;
  const touchY = (touch.clientY - rect.top) * scaleY;

  const masaX = posx + canvas.width / 2 - widthMasa / 2 + 40;
  const masaY = canvas.height / 2 - heightMasa / 2 + 60;

  // Comprobar si el toque está sobre la masa
  if (
    touchX >= masaX &&
    touchX <= masaX + widthMasa &&
    touchY >= masaY &&
    touchY <= masaY + heightMasa &&
    possibleDragging
  ) {
    isDragging = true; // Iniciar el arrastre

    // Calcular la diferencia entre el toque y la posición actual de la masa
    offsetXFromMass = touchX - masaX;
  }
});

canvas.addEventListener("touchmove", function (event) {
  if (isDragging) {
    event.preventDefault(); // Prevenir el comportamiento predeterminado

    const touch = event.changedTouches[0]; // Obtener el primer toque
    const rect = canvas.getBoundingClientRect(); // Obtener el rectángulo del canvas

    // Calcular factores de escala
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calcular la posición del toque respecto al canvas
    let touchXCurrent = (touch.clientX - rect.left) * scaleX;
    let equilibriumX = canvas.width / 2 + 40 - widthMasa / 2;
    let maxAmplitudePixels = amplitudeMaxMeters * escalaPixelsPorMetro;

    // Calcular la nueva posición de la masa utilizando la diferencia
    posx = touchXCurrent - equilibriumX - offsetXFromMass;

    // Limitar la posición de la masa para que no exceda la amplitud máxima
    if (posx > maxAmplitudePixels) {
      posx = maxAmplitudePixels;
    } else if (posx < -maxAmplitudePixels) {
      posx = -maxAmplitudePixels;
    }

    posxMeters = pixelesAMetros(posx);
    amplitudeMeters = Math.abs(posxMeters);

    // Actualizar la escena
    dibujarEscena();
  }
});

canvas.addEventListener("touchend", function () {
  if (isDragging) {
    isDragging = false; // Detener el arrastre
    startTime = performance.now(); // Iniciar el tiempo al soltar la masa
    isAnimating = true; // Iniciar la animación
    possibleDragging = false;

    // Establecer la fase y la velocidad al soltar
    if (posxMeters > 0) {
      phase = Math.PI / 2;
    } else {
      phase = -Math.PI / 2;
    }

    velocity = 0; // Velocidad inicial al soltar
    actualizarEcua(); // Actualizar las ecuaciones con los nuevos valores
    requestAnimationFrame(animate); // Comenzar la animación
    $playBt.style.display = "block";
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

    // Recalcular amplitud máxima
    amplitudeMaxMeters =
      (canvas.width / 2 - widthMasa / 2 - 42) / escalaPixelsPorMetro;

    dibujarEscena(); // Redibujar la escena cuando cambie la masa
    $playBt.style.display = "none";
    isDragging = false; // Detener el arrastre
    isAnimating = false; // Detener la animación
    startTime = null; // Reiniciar el tiempo de inicio
    timeSave = 0; // Reiniciar el tiempo guardado
    elapsedTime = 0; // Reiniciar el tiempo transcurrido
    posx = 0; // Posición inicial
    posxMeters = 0;
    velocity = 0; // Velocidad inicial
    acceleration = 0; // Aceleración inicial
    amplitudeMeters = 0; // Reiniciar la amplitud en metros
    amplitude = 0; // Reiniciar la amplitud en píxeles
    phase = 0; // Reiniciar la fase
    possibleDragging = true;

    // Restablecer los valores mostrados
    $pos.innerHTML = `x = 0.000 m`;
    $vel.innerHTML = `v = 0.000 m/s`;
    $ace.innerHTML = `a = 0.000 m/s<sup>2</sup>`;
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
    $playBt.style.display = "none";
    isDragging = false; // Detener el arrastre
    isAnimating = false; // Detener la animación
    startTime = null; // Reiniciar el tiempo de inicio
    timeSave = 0; // Reiniciar el tiempo guardado
    elapsedTime = 0; // Reiniciar el tiempo transcurrido
    posx = 0; // Posición inicial
    posxMeters = 0;
    velocity = 0; // Velocidad inicial
    acceleration = 0; // Aceleración inicial
    amplitudeMeters = 0; // Reiniciar la amplitud en metros
    amplitude = 0; // Reiniciar la amplitud en píxeles
    phase = 0; // Reiniciar la fase
    possibleDragging = true;

    // Restablecer los valores mostrados
    $pos.innerHTML = `x = 0.000 m`;
    $vel.innerHTML = `v = 0.000 m/s`;
    $ace.innerHTML = `a = 0.000 m/s<sup>2</sup>`;
  }
});

$playBt.addEventListener("click", function () {
  if (isAnimating) {
    // Detener la animación
    cancelAnimationFrame(animationId);
    timeSave = elapsedTime; // Guardar el tiempo transcurrido
    isAnimating = false;
    $playBt.textContent = "Continuar";
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
  restaurarEcua();
  $playBt.style.display = "none";
  // Reiniciar todas las variables
  isDragging = false; // Detener el arrastre
  isAnimating = false; // Detener la animación
  startTime = null; // Reiniciar el tiempo de inicio
  timeSave = 0; // Reiniciar el tiempo guardado
  elapsedTime = 0; // Reiniciar el tiempo transcurrido
  posx = 0; // Posición inicial
  posxMeters = 0;
  velocity = 0; // Velocidad inicial
  acceleration = 0; // Aceleración inicial
  amplitudeMeters = 0; // Reiniciar la amplitud en metros
  amplitude = 0; // Reiniciar la amplitud en píxeles
  phase = 0; // Reiniciar la fase
  possibleDragging = true;

  // Reiniciar entradas de usuario
  $masaInput.value = 600; // Valor predeterminado para la masa
  $constResorte.value = 50; // Valor predeterminado para la constante del resorte
  $checkboxEquilibrio.checked = true; // Reiniciar el checkbox
  mostrarEquilibrio = true;

  // Recalcular amplitud máxima
  widthMasa = massToPixel($masaInput.value);
  heightMasa = massToPixel($masaInput.value);
  amplitudeMaxMeters =
    (canvas.width / 2 - widthMasa / 2 - 42) / escalaPixelsPorMetro;

  // Restablecer los valores mostrados
  $pos.innerHTML = `x = 0.000 m`;
  $vel.innerHTML = `v = 0.000 m/s`;
  $ace.innerHTML = `a = 0.000 m/s<sup>2</sup>`;

  dibujarEscena(); // Redibujar la escena para mostrar la posición inicial
}

// Ajustar el tamaño del canvas para dispositivos con alta densidad de píxeles
/*function resizeCanvasToDisplaySize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  const width = rect.width * dpr;
  const height = rect.height * dpr;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }

  return false;


// Llama a esta función al iniciar
resizeCanvasToDisplaySize(canvas);}*/

// Dibujar la escena inicial antes de iniciar la animación
dibujarEscena();
