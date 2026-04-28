const rectWidth = 200;
const rectHeight = 100;
const zombieWindows = [];

function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  textSize(24);
}

function draw() {
  background(255);

  fill(200);
  rect(width / 2, height / 2, rectWidth, rectHeight, 10);

  fill(50);
  text('Click Me', width / 2, height / 2);

  fill(128, 128); // semi-transparent grey
  for (const windowRect of zombieWindows) {
    rect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);
  }
}

function mousePressed() {
  const halfWidth = rectWidth / 2;
  const halfHeight = rectHeight / 2;
  const withinX = mouseX >= width / 2 - halfWidth && mouseX <= width / 2 + halfWidth;
  const withinY = mouseY >= height / 2 - halfHeight && mouseY <= height / 2 + halfHeight;

  if (withinX && withinY) {
    for (let i = 0; i < 10; i++) {
      const rectW = random(50, 150);
      const rectH = random(50, 150);
      zombieWindows.push({
        x: random(width),
        y: random(height),
        width: rectW,
        height: rectH,
      });
    }
  }
}
