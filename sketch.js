const rectWidth = 200;
const rectHeight = 100;
const zombieWindows = [];
let showSearchResults = false;
let currentQuery = '';
let fakeResults = [];
let scrollOffset = 0;

function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  textSize(24);
}

function draw() {
  if (showSearchResults) {
    drawSearchResults();
    return;
  }

  background(255);
  textAlign(CENTER, CENTER);
  textSize(24);

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

function mouseWheel(event) {
  if (event.delta > 0) {
    scrollOffset = 0;
  } else {
    scrollOffset += event.delta;
  }
  return false;
}

function keyPressed() {
  if (keyCode !== ENTER) {
    return;
  }

  const urlInput = document.getElementById('url-bar');
  if (!urlInput) {
    return;
  }

  currentQuery = urlInput.value.trim() || 'GitHub';
  const slug = currentQuery.toLowerCase().replace(/\s+/g, '-');
  fakeResults = [
    {
      title: `${currentQuery} Toolkit`,
      description: `Handy utilities and helpers tailored for ${currentQuery} workflows.`,
      url: `https://github.com/example/${slug}-toolkit`,
    },
    {
      title: `${currentQuery} Starter`,
      description: `Opinionated starter template to kick off your ${currentQuery} projects quickly.`,
      url: `https://github.com/example/${slug}-starter`,
    },
    {
      title: `${currentQuery} Showcase`,
      description: `Community-driven showcase highlighting the best ${currentQuery} experiments.`,
      url: `https://github.com/example/${slug}-showcase`,
    },
  ];
  zombieWindows.length = 0;
  showSearchResults = true;
}

function drawSearchResults() {
  background(255);
  const padding = 20;
  const searchBarHeight = 40;

  const resultsToRender = fakeResults.slice();
  const slug = currentQuery.toLowerCase().replace(/\s+/g, '-') || 'search';
  while (resultsToRender.length < 20) {
    const index = resultsToRender.length + 1;
    resultsToRender.push({
      title: `${currentQuery} Resource ${index}`,
      description: `Curated insights and guides helping you master ${currentQuery} topic ${index}.`,
      url: `https://example.com/${slug}/resource-${index}`,
    });
  }

  noStroke();
  fill(240);
  rect(padding, padding, width - padding * 2, searchBarHeight, 6);

  fill(0);
  textAlign(LEFT, CENTER);
  textSize(18);
  text(currentQuery, padding + 12, padding + searchBarHeight / 2);

  let y = padding + searchBarHeight + 20 + scrollOffset;
  textAlign(LEFT, TOP);
  for (const result of resultsToRender) {
    fill(36);
    textSize(16);
    text(result.title, padding, y);
    y += 24;

    fill(80);
    textSize(13);
    text(result.description, padding, y);
    y += 20;

    fill(70, 100, 180);
    textSize(12);
    text(result.url, padding, y);
    y += 32;
  }
}
