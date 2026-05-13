const comments = [];
const rectWidth = 200;
const rectHeight = 100;
const zombieWindows = [];
let showSearchResults = false;
let currentQuery = '';
let fakeResults = [];
let scrollOffset = 0;
let lastRenderedComments = '';
let scrollLoopIntervalId = null;
let ghostProcessIntervalId = null;
let isFileCorrupted = false;

function generateGarbledString(length = 512) {
  return Array.from({ length }, () => String.fromCharCode(33 + Math.floor(Math.random() * 94))).join('');
}

function setupScrollLoopButton() {
  const scrollLoopButton = document.getElementById('scroll-loop-button');
  if (!scrollLoopButton) {
    return;
  }

  scrollLoopButton.addEventListener('click', () => {
    if (scrollLoopIntervalId !== null) {
      return;
    }

    const resetScroll = () => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    scrollLoopIntervalId = setInterval(resetScroll, 100);
  });
}

function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  textSize(24);


  setupScrollLoopButton();

  const failureLogContainer = document.getElementById('failure-log-container');
  const toggleFailureLogButton = document.getElementById('toggle-failure-log-button');
  if (toggleFailureLogButton && failureLogContainer) {
    toggleFailureLogButton.addEventListener('click', () => {
      failureLogContainer.classList.toggle('hidden');
    });
  }

  if (failureLogContainer) {
    if (typeof showdown === 'undefined') {
      console.error('Showdown library not available; unable to render failure log.');
    } else {
      fetch('failure_log.md')
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load failure_log.md: ${response.status}`);
          }
          return response.text();
        })
        .then((markdown) => {
          const converter = new showdown.Converter();
          failureLogContainer.innerHTML = converter.makeHtml(markdown);
        })
        .catch((error) => {
          console.error('Unable to load failure log', error);
        });
    }
  }

  const submitButton = document.getElementById('submit-comment');
  if (submitButton) {
    submitButton.addEventListener('click', handleSubmitComment);
  }

  const dummyEntries = [
    '/home',
    '/home/user',
    '/home/user/documents',
    '/home/user/documents/report.pdf',
    '/etc',
    '/etc/config.txt',
  ];
  const fileExplorerContainer = document.getElementById('file-explorer-container');
  if (fileExplorerContainer) {
    for (const entry of dummyEntries) {
      const entryDiv = document.createElement('div');
      entryDiv.textContent = entry;
      fileExplorerContainer.appendChild(entryDiv);
    }
  }

  const configFileInput = document.getElementById('config-file');
  if (configFileInput) {
    configFileInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
    });
  }

  const loginButton = document.getElementById('login-button');
  if (loginButton) {
    loginButton.addEventListener('click', () => {});
  }

  const uploadButton = document.getElementById('upload-button');
  if (uploadButton) {
    uploadButton.addEventListener('click', () => {});
  }

  const secretMessageInput = document.getElementById('secret-message');
  if (secretMessageInput) {
    secretMessageInput.addEventListener('keyup', () => {
      const { selectionStart, selectionEnd } = secretMessageInput;
      const obfuscatedValue = secretMessageInput.value
        .replace(/e/g, '3')
        .replace(/E/g, '3')
        .replace(/a/g, '4')
        .replace(/A/g, '4')
        .replace(/o/g, '0')
        .replace(/O/g, '0');
      if (secretMessageInput.value === obfuscatedValue) {
        return;
      }
      secretMessageInput.value = obfuscatedValue;
      if (selectionStart !== null && selectionEnd !== null) {
        secretMessageInput.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  }

  const ghostDirectoryButton = document.getElementById('ghost-directory-button');
  if (ghostDirectoryButton) {
    ghostDirectoryButton.addEventListener('click', async () => {
      showProtocolPopup(
        "Protocol 34: Assume Stale State",
        "Mandates the first action in a shared repository must be a forced synchronization with the remote (git fetch followed by git reset --hard origin/master or origin/main)."
      );
      try {
        const response = await fetch('/create-ghost-directory', { method: 'PUT' });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error('Unable to create ghost directory', error);
      }
    });
  }

  const guiToolCollapseButton = document.getElementById('gui-tool-collapse-button');
  if (guiToolCollapseButton) {
    guiToolCollapseButton.addEventListener('click', engageGuiToolCollapse);
  }

  const corruptHistoryButton = document.getElementById('corrupt-history-button');
  if (corruptHistoryButton) {
    corruptHistoryButton.addEventListener('click', corruptBashHistory);
  }

  const goButton = document.getElementById('go-button');
  const addressBar = document.getElementById('address-bar');
  if (goButton && addressBar) {
    goButton.addEventListener('click', () => {
      const query = addressBar.value || '';
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    });
  }

  const applicationMismatchBugButton = document.getElementById('applicationMismatchBugButton');
  if (applicationMismatchBugButton) {
    applicationMismatchBugButton.addEventListener('click', () => {
      showProtocolPopup(
        "Protocol 36: Corrupted Environment Reset",
        "If a tool or interface behaves erratically, immediately abandon it. Close the window/session and start a fresh one."
      );
      applicationMismatchBug();
    });
  }

  const browserCacheBugButton = document.getElementById('browserCacheBugButton');
  if (browserCacheBugButton) {
    browserCacheBugButton.addEventListener('click', () => {
      refreshStyle();
    });
  }

  const zombieWindowsBugButton = document.getElementById('zombieWindowsBugButton');
  if (zombieWindowsBugButton) {
    zombieWindowsBugButton.addEventListener('click', () => {
      showProtocolPopup(
        "Protocol 36: Corrupted Environment Reset",
        "If a tool or interface behaves erratically, immediately abandon it. Close the window/session and start a fresh one."
      );
      createZombieWindow();
    });
  }

  const deadlockButton = document.getElementById('deadlock-button');
  if (deadlockButton) {
    deadlockButton.addEventListener('click', () => {
      showProtocolPopup(
        "Protocol 36: Corrupted Environment Reset",
        "If a tool or interface behaves erratically, immediately abandon it. Close the window/session and start a fresh one."
      );
      engageDeadlock();
    });
  }

  const ghostProcessContainer = document.getElementById('url-redirection-container');
  let ghostProcessBugButton = document.getElementById('ghostProcessBugButton');
  if (!ghostProcessBugButton) {
    ghostProcessBugButton = document.createElement('button');
    ghostProcessBugButton.id = 'ghostProcessBugButton';
    ghostProcessBugButton.type = 'button';
    ghostProcessBugButton.textContent = 'Start Process';
    (ghostProcessContainer || document.body).appendChild(ghostProcessBugButton);
  }
  ghostProcessBugButton.addEventListener('click', startGhostProcess);

  let corruptFileButton = document.getElementById('corrupt-file-button');
  if (!corruptFileButton) {
    corruptFileButton = document.createElement('button');
    corruptFileButton.id = 'corrupt-file-button';
    corruptFileButton.type = 'button';
    corruptFileButton.textContent = 'Corrupt File';
    (document.getElementById('url-redirection-container') || document.body).appendChild(corruptFileButton);
  } else {
    corruptFileButton.textContent = 'Corrupt File';
  }
  corruptFileButton.addEventListener('click', () => {
    showProtocolPopup(
      "Protocol 34: Assume Stale State",
      "Mandates the first action in a shared repository must be a forced synchronization with the remote (git fetch followed by git reset --hard origin/master or origin/main)."
    );
    isFileCorrupted = true;
  });

  const dataLossButton = document.getElementById('data-loss-button');
  if (dataLossButton) {
    dataLossButton.addEventListener('click', () => {
      showProtocolPopup(
        "Protocol 39: Redundant Systems",
        "Never trust a single point of failure. Always maintain backups and use version control to mitigate the risk of data loss. Assume any data not explicitly saved and backed up is already lost."
      );
    });
  }

  const fileExplorerGoButton = document.querySelector('#file-explorer-container #go-button');
  const pathInput = document.getElementById('path-input');
  const pathError = document.getElementById('path-error');
  if (fileExplorerGoButton && pathInput && pathError) {
    const defaultPathErrorMessage = pathError.textContent || 'Error: Please enter an absolute path.';
    let fileContentDisplay = document.getElementById('file-content');
    if (!fileContentDisplay) {
      fileContentDisplay = document.createElement('pre');
      fileContentDisplay.id = 'file-content';
      fileContentDisplay.style.whiteSpace = 'pre-wrap';
      fileContentDisplay.style.wordBreak = 'break-word';
      document.getElementById('file-explorer-container').appendChild(fileContentDisplay);
    }
    fileExplorerGoButton.addEventListener('click', () => {
      const pathValue = pathInput.value || '';
      if (!pathValue.startsWith('/')) {
        pathError.textContent = defaultPathErrorMessage;
        pathError.style.display = 'block';
        fileContentDisplay.textContent = '';
        return;
      }
      if (isFileCorrupted && pathValue === '/etc/config.txt') {
        pathError.style.display = 'none';
        fileContentDisplay.textContent = generateGarbledString();
        return;
      }
      fetch(pathValue)
        .then((response) => {
          if (!response.ok) {
            pathError.textContent = 'Error: Directory not found.';
            pathError.style.display = 'block';
            fileContentDisplay.textContent = '';
            return;
          }
          pathError.style.display = 'none';
          return response.text();
        })
        .then((body) => {
          if (typeof body === 'string') {
            fileContentDisplay.textContent = body;
          }
        })
        .catch(() => {
          pathError.textContent = 'Error: Directory not found.';
          pathError.style.display = 'block';
          fileContentDisplay.textContent = '';
        });
    });
  }

  const restartButton = document.getElementById('restart-server');
  if (restartButton) {
    let restartAttempted = false;
    restartButton.addEventListener('click', () => {
      if (!restartAttempted) {
        restartAttempted = true;
        console.log('Restarting server...');
        return;
      }

      else if (restartAttempted) {
        document.getElementById('error-message').style.display = 'block';
      }
    });
  }

  const unclickableUIButton = document.getElementById('unclickable-ui-button');
  if (unclickableUIButton) {
    unclickableUIButton.addEventListener('click', () => {
      unclickableUIButton.style.pointerEvents = 'none';
      showProtocolPopup(
        'Protocol 38: The Phoenix Protocol',
        'If an interface element becomes unresponsive, do not repeat the action. Instead, terminate the process and restart the application from a clean state. This is the only way to be sure.'
      );
    });
  }

  const keyboardButton = document.getElementById('keyboard-button');
  if (keyboardButton) {
    keyboardButton.addEventListener('keyup', (event) => {
      if (event.key !== 'Enter') {
        return;
      }

      if (event.detail === 0) {
        alert('You have successfully navigated using the keyboard!');
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    });
  }

  const pasteBox = document.getElementById('paste-box');
  if (pasteBox) {
    pasteBox.addEventListener('paste', (event) => {
      event.preventDefault();
      const pastedText = (event.clipboardData || window.clipboardData).getData('text');
      const corruptedText = [...pastedText].reverse().join('');
      pasteBox.value = corruptedText;
    });
  }

  const clipboardSource = document.getElementById('clipboard-source');
  if (clipboardSource) {
    clipboardSource.addEventListener('copy', (event) => {
      const warningMessage = 'CLIPBOARD CORRUPTION DETECTED: Your data has been compromised.';
      if (event.clipboardData) {
        event.clipboardData.setData('text/plain', warningMessage);
        event.preventDefault();
        return;
      }

      if (window.clipboardData) {
        window.clipboardData.setData('Text', warningMessage);
        event.preventDefault();
      }
    });
  }

  const silentStateLossButton = document.getElementById('silent-state-loss-button');
  if (silentStateLossButton) {
    silentStateLossButton.addEventListener('click', simulateSilentStateLoss);
  }

  const fileExplorer = document.getElementById('file-explorer');
  if (fileExplorer) {
    const directories = ['My Documents', 'Secret Files (Corrupted)'];
    for (const label of directories) {
      const directoryDiv = document.createElement('div');
      directoryDiv.className = 'directory';
      directoryDiv.textContent = label;
      fileExplorer.appendChild(directoryDiv);
    }
  }

  const fileExplorerButton = document.getElementById('file-explorer-btn');
  if (fileExplorerButton && fileExplorer) {
    fileExplorerButton.addEventListener('click', () => {
      fileExplorer.classList.toggle('hidden');
    });
  }

  const terminal = document.getElementById('terminal');
  if (terminal) {
    const suppressTerminalKeys = (event) => {
      event.stopPropagation();
      event.preventDefault();
    };
    terminal.addEventListener('keydown', suppressTerminalKeys);
    const prompt = document.createElement("span");
    prompt.textContent = "> ";
    terminal.appendChild(prompt);

    const cursor = document.createElement("span");
    cursor.textContent = "_";
    cursor.classList.add("cursor");
    terminal.appendChild(cursor);
  }
}

function draw() {
  displayComments();

  if (showSearchResults) {
    drawSearchResults();
    return;
  }

  background(255);
  textAlign(CENTER, CENTER);
  textSize(24);

  const buttonColor = isMouseOverButton() && mouseIsPressed ? 160 : 200;
  fill(buttonColor);
  rect(width / 2, height / 2, rectWidth, rectHeight, 10);

  fill(50);
  text('Click Me', width / 2, height / 2);

  fill(128, 128); // semi-transparent grey
  for (const windowRect of zombieWindows) {
    rect(windowRect.x, windowRect.y, windowRect.width, windowRect.height);
  }

  fill(0);
  textAlign(LEFT, TOP);
  textSize(14);
  let commentY = 20;
  for (const comment of comments) {
    text(`- ${comment}`, 20, commentY);
    commentY += 20;
  }
}

function mousePressed() {}

function startGhostProcess() {
  if (ghostProcessIntervalId !== null) {
    clearInterval(ghostProcessIntervalId);
    ghostProcessIntervalId = null;
  }

  const existingProcessWindow = document.querySelector('.process-window');
  if (existingProcessWindow) {
    existingProcessWindow.remove();
  }

  const processWindow = document.createElement('div');
  processWindow.className = 'process-window';

  const statusText = document.createElement('div');
  statusText.textContent = 'Process running...';

  const killButton = document.createElement('button');
  killButton.type = 'button';
  killButton.textContent = 'Kill Process';
  killButton.addEventListener('click', killGhostProcess);

  processWindow.appendChild(statusText);
  processWindow.appendChild(killButton);
  document.body.appendChild(processWindow);
}

function killGhostProcess() {
  const processWindow = document.querySelector('.process-window');
  if (processWindow) {
    processWindow.remove();
  }

  if (ghostProcessIntervalId !== null) {
    clearInterval(ghostProcessIntervalId);
  }

  ghostProcessIntervalId = setInterval(() => {
    const ghostOutput = document.createElement('div');
    ghostOutput.className = 'ghost-output';
    ghostOutput.textContent = 'Ghost process output...';
    ghostOutput.style.opacity = '1';
    ghostOutput.style.transition = 'opacity 1s ease-out';
    document.body.appendChild(ghostOutput);

    requestAnimationFrame(() => {
      ghostOutput.style.opacity = '0';
    });

    setTimeout(() => {
      ghostOutput.remove();
    }, 1000);
  }, 2000);
}

function isMouseOverButton() {
  if (showSearchResults) {
    return false;
  }

  const halfWidth = rectWidth / 2;
  const halfHeight = rectHeight / 2;
  return (
    mouseX >= width / 2 - halfWidth &&
    mouseX <= width / 2 + halfWidth &&
    mouseY >= height / 2 - halfHeight &&
    mouseY <= height / 2 + halfHeight
  );
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

function handleSubmitComment() {
  const commentBox = document.getElementById('comment-box');
  if (!commentBox) {
    return;
  }

  const commentText = commentBox.value.trim();
  if (!commentText) {
    commentBox.value = '';
    return;
  }

  comments.push(commentText);
  commentBox.value = '';
  displayComments();
}

function displayComments() {
  const commentsContainer = document.getElementById('comments');
  if (!commentsContainer) {
    return;
  }

  const serialized = JSON.stringify(comments);
  if (serialized === lastRenderedComments) {
    return;
  }

  commentsContainer.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const comment of comments) {
    const commentElement = document.createElement('p');
    commentElement.textContent = comment;
    fragment.appendChild(commentElement);
  }
  commentsContainer.appendChild(fragment);
  lastRenderedComments = serialized;
}

function applicationMismatchBug() {
  const iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/5/55/XPaintIcon.png';
  const iconSize = 64;
  const icon = document.createElement('img');
  icon.src = iconUrl;
  icon.alt = 'XPaint icon';
  icon.style.position = 'absolute';
  icon.style.width = `${iconSize}px`;
  icon.style.height = 'auto';
  icon.style.pointerEvents = 'none';

  const maxX = Math.max(0, window.innerWidth - iconSize);
  const maxY = Math.max(0, window.innerHeight - iconSize);
  const randomX = Math.random() * maxX;
  const randomY = Math.random() * maxY;

  icon.style.left = `${randomX}px`;
  icon.style.top = `${randomY}px`;

  document.body.appendChild(icon);
}

async function refreshStyle() {
  try {
    const response = await fetch('style.css', {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/css',
      },
      body: 'body { background-color: blue; }',
    });

    if (!response.ok) {
      throw new Error(`Failed to update style.css: ${response.status}`);
    }
  } catch (error) {
    console.error('Unable to overwrite style.css', error);
  }
}

function createZombieWindow() {
  const zombieWindow = document.createElement('div');
  zombieWindow.className = 'zombie-window';
  zombieWindow.style.position = 'absolute';

  const windowWidth = 200;
  const windowHeight = 120;
  zombieWindow.style.width = `${windowWidth}px`;
  zombieWindow.style.height = `${windowHeight}px`;

  const maxLeft = Math.max(0, window.innerWidth - windowWidth);
  const maxTop = Math.max(0, window.innerHeight - windowHeight);
  const left = Math.random() * maxLeft;
  const top = Math.random() * maxTop;

  zombieWindow.style.left = `${left}px`;
  zombieWindow.style.top = `${top}px`;

  document.body.appendChild(zombieWindow);

  zombieWindows.push({
    x: left + windowWidth / 2,
    y: top + windowHeight / 2,
    width: windowWidth,
    height: windowHeight,
  });
}

async function corruptBashHistory() {
  try {
    const response = await fetch('/corrupt-history', { method: 'PUT' });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Unable to corrupt bash history', error);
  }
}

function engageDeadlock() {
  // Intentionally lock up the main thread.
  // eslint-disable-next-line no-constant-condition
  while (true) {} // Deadlock simulation
}

function engageGuiToolCollapse() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.zIndex = '9999';
  document.body.appendChild(overlay);

  showProtocolPopup(
    'Protocol 36: Corrupted Environment Reset',
    'If a tool or interface behaves erratically, immediately abandon it. Close the window/session and start a fresh one. This protocol, while it failed during the "Great Tool Collapse", remains a critical first line of defense.'
  );

  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  }, 120000);
}

function simulateSilentStateLoss() {
  showProtocolPopup(
    "Protocol 37: Verify, Don't Assume",
    "Always verify your current directory and state after a context switch or unexpected behavior."
  );
}

function showProtocolPopup(protocolName, protocolDescription) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '10000';

  const content = document.createElement('div');
  content.style.backgroundColor = '#ffffff';
  content.style.padding = '24px';
  content.style.borderRadius = '8px';
  content.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.25)';
  content.style.maxWidth = '90%';
  content.style.width = '400px';
  content.style.textAlign = 'center';

  const heading = document.createElement('h2');
  heading.textContent = protocolName;
  content.appendChild(heading);

  const description = document.createElement('p');
  description.textContent = protocolDescription;
  content.appendChild(description);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', () => {
    if (overlay.parentNode) {
      overlay.remove();
    }
  });
  content.appendChild(closeButton);

  overlay.appendChild(content);
  document.body.appendChild(overlay);
}
