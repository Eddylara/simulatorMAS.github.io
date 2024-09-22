let scene = document.querySelector("#canvas");

let ctx = scene.getContext("2d");
posx = 0;
ida = true;
function animate() {
  ctx.clearRect(0, 0, 600, 440); // Limpiar el canvas
  ctx.strokeStyle = "black";
  ctx.fillRect(posx, 0, 100, 100);
  if (posx < 300 && ida) {
    posx += 2;
  }
  // Mover el cuadrado hacia la izquierda
  else if (posx > 0 && !ida) {
    posx -= 2;
  }

  // Cambiar la dirección en los límites
  if (posx >= 300) {
    ida = false; // Cambiar de ida a vuelta
  } else if (posx <= 0) {
    ida = true; // Cambiar de vuelta a ida
  }

  requestAnimationFrame(animate);
}
animate();
