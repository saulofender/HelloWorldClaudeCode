const CELL = 20;
const COLS = 20;
const ROWS = 20;
const POINTS_PER_FOOD = 10;
const POINTS_PER_LEVEL = 50;
const BASE_INTERVAL = 150;
const INTERVAL_STEP = 15;
const MIN_INTERVAL = 60;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const actionBtn = document.getElementById('action-btn');

const gridCanvas = document.createElement('canvas');
gridCanvas.width = canvas.width;
gridCanvas.height = canvas.height;
const gridCtx = gridCanvas.getContext('2d');
gridCtx.strokeStyle = '#ede8da';
gridCtx.lineWidth = 0.5;
for (let x = 0; x <= COLS; x++) {
  gridCtx.beginPath();
  gridCtx.moveTo(x * CELL, 0);
  gridCtx.lineTo(x * CELL, canvas.height);
  gridCtx.stroke();
}
for (let y = 0; y <= ROWS; y++) {
  gridCtx.beginPath();
  gridCtx.moveTo(0, y * CELL);
  gridCtx.lineTo(canvas.width, y * CELL);
  gridCtx.stroke();
}

let snake, dir, nextDir, food, score, level, highScore, loopId, running;

highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
highScoreEl.textContent = highScore;

function init() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  level = 1;
  scoreEl.textContent = score;
  levelEl.textContent = level;
  food = spawnFood();
  running = true;
}

function spawnFood() {
  const empty = [];
  for (let x = 0; x < COLS; x++)
    for (let y = 0; y < ROWS; y++)
      if (!snake.some(s => s.x === x && s.y === y)) empty.push({ x, y });
  if (empty.length === 0) { endGame(); return null; }
  return empty[Math.floor(Math.random() * empty.length)];
}

function intervalForLevel(lvl) {
  return Math.max(MIN_INTERVAL, BASE_INTERVAL - (lvl - 1) * INTERVAL_STEP);
}

function startLoop() {
  clearInterval(loopId);
  loopId = setInterval(tick, intervalForLevel(level));
}

function tick() {
  dir = { ...nextDir };
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return endGame();
  }
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += POINTS_PER_FOOD;
    scoreEl.textContent = score;
    scoreEl.classList.remove('score-flash');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-flash');

    const newLevel = Math.floor(score / POINTS_PER_LEVEL) + 1;
    if (newLevel > level) {
      level = newLevel;
      levelEl.textContent = level;
      startLoop();
    }

    food = spawnFood();
    if (!food) return;
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(gridCanvas, 0, 0);

  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#3a5a40' : '#5a8a60';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 4);
    } else {
      ctx.rect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    }
    ctx.fill();
  });

  if (food) {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2 - 3, food.y * CELL + CELL / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function endGame() {
  running = false;
  clearInterval(loopId);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore);
    highScoreEl.textContent = highScore;
  }

  overlayTitle.textContent = 'Fim de Jogo!';
  overlayMessage.textContent = `Pontuação: ${score} — Recorde: ${highScore}`;
  actionBtn.textContent = 'Jogar Novamente';
  overlay.classList.remove('hidden');
}

function startGame() {
  overlay.classList.add('hidden');
  init();
  draw();
  startLoop();
}

actionBtn.addEventListener('click', startGame);

document.addEventListener('keydown', e => {
  const keyMap = {
    ArrowUp:    { x: 0,  y: -1 },
    ArrowDown:  { x: 0,  y: 1  },
    ArrowLeft:  { x: -1, y: 0  },
    ArrowRight: { x: 1,  y: 0  },
    w: { x: 0,  y: -1 },
    s: { x: 0,  y: 1  },
    a: { x: -1, y: 0  },
    d: { x: 1,  y: 0  },
  };

  if (e.key === 'Enter' && !running) {
    startGame();
    return;
  }

  const newDir = keyMap[e.key];
  if (!newDir) return;

  if (newDir.x !== -nextDir.x || newDir.y !== -nextDir.y) {
    nextDir = newDir;
  }

  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','s'].includes(e.key)) {
    e.preventDefault();
  }
});

let touchStartX = 0, touchStartY = 0;

canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
  let newDir;
  if (Math.abs(dx) > Math.abs(dy)) {
    newDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    if (newDir.x !== -nextDir.x) nextDir = newDir;
  } else {
    newDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    if (newDir.y !== -nextDir.y) nextDir = newDir;
  }
  e.preventDefault();
}, { passive: false });
