const clockElement = document.getElementById('clock');

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const tenths = Math.floor(now.getMilliseconds() / 100);

  clockElement.textContent = `${hours}:${minutes}:${seconds}.${tenths}`;
}

setInterval(updateClock, 100);
updateClock();

const drawer = document.getElementById('drawer');
const toolsTab = document.getElementById('toolsTab');
const closeBtn = document.getElementById('closeBtn');
const navButtons = document.querySelectorAll('.nav-btn');
const toolViews = document.querySelectorAll('.tool-view');

toolsTab.addEventListener('click', () => {
  drawer.classList.add('open');
  toolsTab.classList.add('tab-hidden');
});

closeBtn.addEventListener('click', () => {
  drawer.classList.remove('open');
  toolsTab.classList.remove('tab-hidden');
});

document.addEventListener('click', (e) => {
  if (
    drawer.classList.contains('open') &&
    !drawer.contains(e.target) &&
    !toolsTab.contains(e.target)
  ) {
    drawer.classList.remove('open');
    toolsTab.classList.remove('tab-hidden');
  }
});

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    navButtons.forEach(b => b.classList.remove('active'));
    toolViews.forEach(v => v.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

let testQueue = [];
let currentTestIndex = 0;
let unblockedLinks = [];
let blockedLinks = [];

function startIframeTesting() {
  const input = document.getElementById('testerInput').value.trim();
  if (!input) return alert('Please enter at least one link to test!');

  testQueue = input.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (testQueue.length === 0) return;

  currentTestIndex = 0;
  unblockedLinks = [];
  blockedLinks = [];

  document.getElementById('testerOutput').innerHTML = '';
  document.getElementById('iframeContainer').style.display = 'block';

  updateQueueStats();
  loadNextIframe();
}

function loadNextIframe() {
  if (currentTestIndex >= testQueue.length) {
    document.getElementById('iframeContainer').style.display = 'none';
    document.getElementById('testerOutput').innerHTML += `\n<strong>--- Batch Testing Complete! ---</strong>`;
    return;
  }

  let url = testQueue[currentTestIndex];
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
    testQueue[currentTestIndex] = url;
  }

  document.getElementById('currentTestingUrl').innerText = url;
  document.getElementById('previewIframe').src = url;

  updateQueueStats();
}

function markLink(isUnblocked) {
  const currentUrl = testQueue[currentTestIndex];
  const outputBox = document.getElementById('testerOutput');

  if (isUnblocked) {
    unblockedLinks.push(currentUrl);
    const line = document.createElement('div');
    line.className = 'clean-text';
    line.innerText = `[UNBLOCKED] ${currentUrl}`;
    outputBox.appendChild(line);
  } else {
    blockedLinks.push(currentUrl);
    const line = document.createElement('div');
    line.className = 'flagged-text';
    line.innerText = `[BLOCKED] ${currentUrl}`;
    outputBox.appendChild(line);
  }

  currentTestIndex++;
  loadNextIframe();
}

function updateQueueStats() {
  const remaining = testQueue.length - currentTestIndex;
  document.getElementById('testerRemaining').innerText = remaining;
  document.getElementById('testerUnblockedCount').innerText = unblockedLinks.length;
  document.getElementById('testerBlockedCount').innerText = blockedLinks.length;
}

function copyUnblockedTesterLinks() {
  if (!unblockedLinks.length) return alert('No unblocked links to copy yet!');
  navigator.clipboard.writeText(unblockedLinks.join('\n')).then(() => alert('Unblocked links copied to clipboard!'));
}

let currentCleanList = [];

function processFilter() {
  const rawText = document.getElementById('filterInput').value;
  const lines = rawText.split('\n');

  currentCleanList = [];
  const flaggedList = [];

  lines.forEach(line => {
    let trimmed = line.trim();
    if (!trimmed) return;

    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }

    try {
      const parsedUrl = new URL(trimmed);
      const parts = parsedUrl.hostname.split('.');
      const tld = parts[parts.length - 1];

      if (/^[a-zA-Z]{2}$/.test(tld)) {
        flaggedList.push(trimmed);
      } else {
        currentCleanList.push(trimmed);
      }
    } catch (e) {
      flaggedList.push(trimmed + ' (Invalid format)');
    }
  });

  document.getElementById('cleanCount').innerText = currentCleanList.length;
  document.getElementById('flaggedCount').innerText = flaggedList.length;

  document.getElementById('cleanOutput').innerText = currentCleanList.length 
    ? currentCleanList.join('\n') 
    : 'No clean links found.';

  document.getElementById('flaggedOutput').innerText = flaggedList.length 
    ? flaggedList.join('\n') 
    : 'No flagged links found.';
}

function copyCleanList() {
  if (!currentCleanList.length) return alert('No clean links to copy!');
  navigator.clipboard.writeText(currentCleanList.join('\n')).then(() => alert('Clean links copied!'));
}

function generateJSON() {
  const key = document.getElementById('jsonKey').value.trim() || 'links';
  const rawText = document.getElementById('jsonInput').value.trim();

  if (!rawText) return;

  const urls = rawText.split('\n').map(l => {
    let trimmed = l.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  }).filter(l => l.length > 0);

  const jsonObject = {};
  jsonObject[key] = urls;

  const formattedJSON = JSON.stringify(jsonObject, null, 2);
  document.getElementById('jsonOutput').innerText = formattedJSON;
}

function copyJSON() {
  const jsonText = document.getElementById('jsonOutput').innerText;
  if (!jsonText || jsonText.startsWith('Formatted JSON')) return alert('Generate JSON first!');
  navigator.clipboard.writeText(jsonText).then(() => alert('JSON copied to clipboard!'));
}