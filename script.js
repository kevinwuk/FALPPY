const canvas=document.getElementById('gameCanvas');
  const ctx=canvas.getContext('2d');

const menuOverlay = document.getElementById('menu-overlay');
 const gameoverOverlay = document.getElementById('gameover-overlay');
  const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

  const finalScoreEl = document.getElementById('final-score');
 const bestScoreEl = document.getElementById('best-score');
const medalEl = document.getElementById('medal');

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioCtx.state === 'suspended') {
 audioCtx.resume();
  }
   const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
osc.connect(gain);
  gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

  if (type === 'jump') {
 osc.type = 'sine';
   osc.frequency.setValueAtTime(400, now);
 osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
   gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  osc.start(now);
   osc.stop(now + 0.1);
} else if (type === 'score') {
   osc.type = 'triangle';
  osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
 gain.gain.setValueAtTime(0.2, now);
   gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  osc.start(now);
 osc.stop(now + 0.2);
 } else if (type === 'hit') {
   osc.type = 'sawtooth';
 osc.frequency.setValueAtTime(150, now);
   osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
  gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
 osc.start(now);
   osc.stop(now + 0.2);
  }
}

let gameState = 'MENU';
 let frames = 0;
  let score = 0;
let highScore = localStorage.getItem('flappy_best') || 0;

const bird = {
 x: 80,
  y: 250,
    w: 34,
   h: 24,
  gravity: 0.25,
 jumpStrength: -5.5,
  velocity: 0,
   rotation: 0,
 wingState: 0,
  
  reset() {
  this.y = 250;
    this.velocity = 0;
   this.rotation = 0;
  },

 flap() {
   this.velocity = this.jumpStrength;
  playSound('jump');
 },

 update() {
   this.velocity += this.gravity;
  this.y += this.velocity;

    if (frames % 5 === 0) {
   this.wingState = (this.wingState + 1) % 3;
    }

   if (this.velocity < 0) {
  this.rotation = -0.3;
    } else {
   this.rotation += 0.03;
 if (this.rotation > 1.2) this.rotation = 1.2;
  }

  if (this.y + this.h / 2 >= canvas.height - 100) {
    this.y = canvas.height - 100 - this.h / 2;
   endGame();
  }

 if (this.y - this.h / 2 <= 0) {
   this.y = this.h / 2;
     this.velocity = 0;
  }
 },

 draw() {
   ctx.save();
  ctx.translate(this.x, this.y);
 ctx.rotate(this.rotation);

  ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
  ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
 ctx.fill();
    ctx.strokeStyle = '#543847';
   ctx.lineWidth = 2;
  ctx.stroke();

    ctx.fillStyle = '#fff';
  ctx.beginPath();
 ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
   ctx.fillStyle = '#000';
  ctx.beginPath();
 ctx.arc(7, -4, 2, 0, Math.PI * 2);
    ctx.fill();

   ctx.fillStyle = '#e67e22';
  ctx.beginPath();
    ctx.moveTo(8, 0);
   ctx.lineTo(16, 3);
  ctx.lineTo(8, 7);
 ctx.closePath();
   ctx.fill();
  ctx.stroke();

 ctx.fillStyle = '#f39c12';
    ctx.beginPath();
  const wingY = this.wingState === 0 ? 0 : this.wingState === 1 ? -4 : 4;
   ctx.ellipse(-6, wingY, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
 ctx.stroke();

   ctx.restore();
 }
};

const pipes = {
  position: [],
 w: 52,
   gap: 120,
  dx: 2,

 reset() {
  this.position = [];
 },

 update() {
    if (frames % 100 === 0) {
   const minTop = 50;
  const maxTop = canvas.height - 100 - this.gap - 50;
    const topH = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

   this.position.push({
  x: canvas.width,
     top: topH,
    passed: false
   });
  }

  for (let i = 0; i < this.position.length; i++) {
   let p = this.position[i];
  p.x -= this.dx;

     if (!p.passed && p.x + this.w < bird.x) {
    p.passed = true;
   score++;
  playSound('score');
   }

  const birdBox = {
     left: bird.x - bird.w / 2 + 3,
    right: bird.x + bird.w / 2 - 3,
   top: bird.y - bird.h / 2 + 3,
      bottom: bird.y + bird.h / 2 - 3
    };

    if (
  birdBox.right > p.x &&
    birdBox.left < p.x + this.w &&
   birdBox.top < p.top
  ) {
    endGame();
   }

     const bottomPipeTop = p.top + this.gap;
  if (
     birdBox.right > p.x &&
    birdBox.left < p.x + this.w &&
   birdBox.bottom > bottomPipeTop
  ) {
    endGame();
   }
  }

  if (this.position.length && this.position[0].x < -this.w) {
    this.position.shift();
  }
 },

 draw() {
    for (let i = 0; i < this.position.length; i++) {
   let p = this.position[i];

  ctx.fillStyle = '#73bf2e';
     ctx.fillRect(p.x, 0, this.w, p.top);
    ctx.strokeStyle = '#543847';
   ctx.lineWidth = 2;
  ctx.strokeRect(p.x, 0, this.w, p.top);

  ctx.fillRect(p.x - 3, p.top - 20, this.w + 6, 20);
    ctx.strokeRect(p.x - 3, p.top - 20, this.w + 6, 20);

   const bottomTop = p.top + this.gap;
  const bottomH = canvas.height - 100 - bottomTop;

     ctx.fillRect(p.x, bottomTop, this.w, bottomH);
    ctx.strokeRect(p.x, bottomTop, this.w, bottomH);

   ctx.fillRect(p.x - 3, bottomTop, this.w + 6, 20);
  ctx.strokeRect(p.x - 3, bottomTop, this.w + 6, 20);
    }
 }
};

function drawBackground() {
  ctx.fillStyle = '#70c5ce';
 ctx.fillRect(0, 0, canvas.width, canvas.height);

   ctx.fillStyle = '#00a896';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(i * 90, canvas.height - 160, 60, 60);
 }

  ctx.fillStyle = '#ded895';
 ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

   ctx.fillStyle = '#73bf2e';
  ctx.fillRect(0, canvas.height - 100, canvas.width, 15);
 ctx.strokeStyle = '#543847';
   ctx.lineWidth = 2;
  ctx.beginPath();
 ctx.moveTo(0, canvas.height - 100);
   ctx.lineTo(canvas.width, canvas.height - 100);
  ctx.stroke();
}

function drawScore() {
  if (gameState !== 'PLAYING') return;
 ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
   ctx.lineWidth = 3;
  ctx.font = 'bold 36px Courier New';
 ctx.textAlign = 'center';
   ctx.strokeText(score, canvas.width / 2, 60);
  ctx.fillText(score, canvas.width / 2, 60);
}

function startGame() {
  gameState = 'PLAYING';
 score = 0;
   frames = 0;
  bird.reset();
 pipes.reset();
   menuOverlay.classList.remove('active');
  gameoverOverlay.classList.remove('active');
}

function endGame() {
  if (gameState === 'GAMEOVER') return;
 playSound('hit');
   gameState = 'GAMEOVER';

  if (score > highScore) {
    highScore = score;
   localStorage.setItem('flappy_best', highScore);
  }

   finalScoreEl.textContent = score;
  bestScoreEl.textContent = highScore;

 medalEl.className = 'medal';
   if (score >= 40) medalEl.classList.add('platinum');
  else if (score >= 30) medalEl.classList.add('gold');
 else if (score >= 20) medalEl.classList.add('silver');
   else if (score >= 10) medalEl.classList.add('bronze');

  gameoverOverlay.classList.add('active');
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

  if (gameState === 'PLAYING') {
    bird.update();
   pipes.update();
  frames++;
  }

 pipes.draw();
   bird.draw();
  drawScore();

    requestAnimationFrame(loop);
}

function handleAction() {
   if (gameState === 'PLAYING') {
  bird.flap();
   }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
 handleAction();
   }
});

canvas.addEventListener('click', handleAction);

startBtn.addEventListener('click', startGame);
 restartBtn.addEventListener('click', startGame);

loop();