function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  textSize(24);
}

function draw() {
  background(255);

  fill(200);
  const rectWidth = 200;
  const rectHeight = 100;
  rect(width / 2, height / 2, rectWidth, rectHeight, 10);

  fill(50);
  text('Click Me', width / 2, height / 2);
}
