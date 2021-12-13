const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const canvasNext = document.getElementById('next');
const ctxNext = canvasNext.getContext('2d');

let accountValues = {
  score: 0,
  level: 0,
  lines: 0
};

let flagPause = false;

function updateAccount(key, value) {
  let element = document.getElementById(key);
  if (element) {
    element.textContent = value;
  }
}

let account = new Proxy(accountValues, {
  set: (target, key, value) => {
    target[key] = value;
    updateAccount(key, value);
    return true;
  }
});

let requestId = null;
let time = null;

const moves = {
  [KEY.LEFT]: (p) => ({ ...p, x: p.x - 1 }),
  [KEY.RIGHT]: (p) => ({ ...p, x: p.x + 1 }),
  [KEY.DOWN]: (p) => ({ ...p, y: p.y + 1 }),
  [KEY.SPACE]: (p) => ({ ...p, y: p.y + 1 }),
  [KEY.UP]: (p) => board.rotate(p, ROTATION.RIGHT)
};

let board = new Board(ctx, ctxNext);

initNext();
showHighScores();

function initNext() {
  // Calculate size of canvas from constants.
  ctxNext.canvas.width = 4 * BLOCK_SIZE;
  ctxNext.canvas.height = 4 * BLOCK_SIZE;
  ctxNext.scale(BLOCK_SIZE, BLOCK_SIZE);
}

function addEventListener() {
  document.removeEventListener('keydown', handleKeyPress);
  document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(event) {
  if (event.keyCode === KEY.P) {
    pause();
  }
  if(!flagPause){
    return;
  }
  if (event.keyCode === KEY.ESC) {
    gameOver();
  }
  else if (moves[event.keyCode]) {
    event.preventDefault();
    // Get new state
    let p = moves[event.keyCode](board.piece);
    if (event.keyCode === KEY.SPACE) {
      // Hard drop
      if (document.querySelector('#pause-btn').style.display === 'block') {
          dropSound.play();
      }
      else {
        return;
      }

      while (board.valid(p)) {
        account.score += POINTS.HARD_DROP;
        board.piece.move(p);
        p = moves[KEY.DOWN](board.piece);
      }
      board.piece.hardDrop();
    }
    else if (board.valid(p)) {
      if (document.querySelector('#pause-btn').style.display === 'block') {
        movesSound.play();
      }
      board.piece.move(p);
      if (event.keyCode === KEY.DOWN &&
          document.querySelector('#pause-btn').style.display === 'block') {
        account.score += POINTS.SOFT_DROP;
      }
    }
  }
}

function resetGame() {
  account.score = 0;
  account.lines = 0;
  account.level = 0;
  board.reset();
  time = { start: performance.now(), elapsed: 0, level: LEVEL[account.level] };
}

function play() {
  addEventListener();
  if (document.querySelector('#play-btn').style.display == '') {
    flagPause = false;
    resetGame();
  }

  // If we have an old game running then cancel it
  if (requestId) {
    cancelAnimationFrame(requestId);
  }

  animate();
  document.querySelector('#play-btn').style.display = 'none';
  document.querySelector('#pause-btn').style.display = 'block';
  document.getElementById("left-arrow").disabled = false;
  document.getElementById("right-arrow").disabled = false;
  document.getElementById("down-arrow").disabled = false;
  document.getElementById("up-arrow").disabled = false;
  flagPause = true;
  backgroundSound.play();
}

function animate(now = 0) {
  time.elapsed = now - time.start;
  if (time.elapsed > time.level) {
    time.start = now;
    if (!board.drop()) {
      gameOver();
      return;
    }
  }

  // Clear board before drawing new state.
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  board.draw();
  requestId = requestAnimationFrame(animate);
}

function gameOver() {
  cancelAnimationFrame(requestId);

  ctx.fillStyle = 'black';
  ctx.fillRect(1, 3, 8, 1.2);
  ctx.font = '1px Arial';
  ctx.fillStyle = 'red';
  ctx.fillText('GAME OVER', 1.8, 4);

  sound.pause();
  finishSound.play();
  checkHighScore(account.score);

  flagPause = false;
  document.querySelector('#pause-btn').style.display = 'none';
  document.querySelector('#play-btn').style.display = '';
}

function pause() {
  if (!requestId) {
    document.querySelector('#play-btn').style.display = 'none';
    document.querySelector('#pause-btn').style.display = 'block';
    animate();
    backgroundSound.play();
    return;
  }

  cancelAnimationFrame(requestId);
  requestId = null;

  ctx.fillStyle = 'black';
  ctx.fillRect(1, 3, 8, 1.2);
  ctx.font = '1px Arial';
  ctx.fillStyle = 'yellow';
  ctx.fillText('PAUSED', 3, 4);
  flagPause = false;
  document.querySelector('#play-btn').style.display = 'block';
  document.querySelector('#pause-btn').style.display = 'none';
  document.getElementById("left-arrow").disabled = true;
  document.getElementById("right-arrow").disabled = true;
  document.getElementById("down-arrow").disabled = true;
  document.getElementById("up-arrow").disabled = true;
  sound.pause();
}

function left() {
  let p = moves[KEY.LEFT](board.piece);
  if (board.valid(p)) {
    if (document.querySelector('#pause-btn').style.display === 'block') {
      movesSound.play();
    }
    board.piece.move(p);
  }
}

function right() {
  let p = moves[KEY.RIGHT](board.piece);
  if (board.valid(p) && flagPause) {
    if (document.querySelector('#pause-btn').style.display === 'block') {
      movesSound.play();
    }
    board.piece.move(p);
  }
}

function up() {
  let p = moves[KEY.UP](board.piece);
  if (board.valid(p) && flagPause) {
    if (document.querySelector('#pause-btn').style.display === 'block') {
      movesSound.play();
    }
    board.piece.move(p);
  }
}

function down() {
  let p = moves[KEY.DOWN](board.piece);
  if (board.valid(p) && flagPause) {
    if (document.querySelector('#pause-btn').style.display === 'block') {
      movesSound.play();
    }
    board.piece.move(p);
  }
}

function showHighScores() {
  const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  const highScoreList = document.getElementById('highScores');

  highScoreList.innerHTML = highScores
    .map((score) => `<li>${score.score} - ${score.name}`)
    .join('');
}

function checkHighScore(score) {
  const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  const lowestScore = highScores[NO_OF_HIGH_SCORES - 1]?.score ?? 0;

  if (score > lowestScore) {
    const name = prompt('You got a high score! Enter name:');
    const newScore = { score, name };
    saveHighScore(newScore, highScores);
    showHighScores();
  }
}

function saveHighScore(score, highScores) {
  highScores.push(score);
  highScores.sort((a, b) => b.score - a.score);
  highScores.splice(NO_OF_HIGH_SCORES);

  localStorage.setItem('highScores', JSON.stringify(highScores));
}
