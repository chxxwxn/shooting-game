const player = document.getElementById('player');
const gameContainer = document.getElementById('game');
let timeSurvived = 0;
let zombiesKilled = 0;
let playing = false;
let timerInterval;
let enemyInterval;
let powerUpInterval;
let bulletSpeed = 15;
let initialEnemySpeed = 1;
let enemySpeed = 1;
let playerSpeed = 7;
let targetPosition = player.offsetLeft;
let lives = 3;
let initialEnemyInterval = 2000;
const maxEnemies = 10;
let dualShotActive = false;
const milestones = [50, 100, 150, 200, 250, 300];
const comments = ["good", "great", "excellent", "amazing", "unbelievable", "fantastic"];
const shootSound = document.getElementById('shoot-sound');
const explosionSound = document.getElementById('explosion-sound');
const gameOverSound = document.getElementById('game-over-sound');
let keys = {};
let bossAlive = false;
let bossDamageCount = 0;
let lastBulletTime = 0; // 마지막 총알 발사 시간
const bulletDelay = 150; // 총알 발사 딜레이 (밀리초 단위)
let laserActive = false;
let laserDuration = 3000; // 레이저 지속 시간 (밀리초)
let laserDamageInterval = 1000; // 1초마다 적에 데미지를 가함

function startGame() {
  document.getElementById('main-screen').classList.add('hidden');
  document.querySelector('.game-container').classList.remove('hidden');
  document.getElementById('game').classList.remove('blur');
  resetGame();
  startTimer();
  
  playing = true;
  requestAnimationFrame(gameLoop);

  enemyInterval = setInterval(createEnemy, initialEnemyInterval);
  powerUpInterval = setInterval(createPowerUp, 10000);
  
  const userId = localStorage.getItem("userId") || "알 수 없음";
  const scriptUrl = "https://script.google.com/macros/s/AKfycbzHPs-RfCEDJiujwmQMRT0Feosu08SH2UGDe8OK50gULjT7Wz5TEW91QtT2CTdKC7aL/exec";

  fetch(scriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: userId,
      message: "게임 시작",
      comment: "start"
    })
  })
  .then(() => {
      console.log("게임 시작 로그 기록 시도");
  })
  .catch(error => {
      console.error("fetch 요청 오류 발생:", error.message);
  });
}

// 키보드 이벤트 리스너 설정
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// 게임 루프: 이동 및 발사를 동시에 처리
function gameLoop() {
  movePlayer();
  
  if (keys[' '] && canShoot()) { // 스페이스바가 눌렸고 발사 가능할 때
    shootBullet();
  }
  
  if (playing) {
    requestAnimationFrame(gameLoop);
  }
}

// 총알 발사 가능 여부를 체크하는 함수
function canShoot() {
  const currentTime = Date.now();
  if (currentTime - lastBulletTime >= bulletDelay) {
    lastBulletTime = currentTime;
    return true;
  }
  return false;
}

function movePlayer() {
  const currentLeft = player.offsetLeft;
  const expandedBoundaryRight = 20; // 오른쪽으로 이동할 수 있는 추가 범위

  if (keys['ArrowLeft']) {
    targetPosition = Math.max(0, currentLeft - playerSpeed); // 왼쪽은 화면 밖으로 나가지 않도록 제한
  } else if (keys['ArrowRight']) {
    targetPosition = Math.min(gameContainer.offsetWidth - player.offsetWidth + expandedBoundaryRight, currentLeft + playerSpeed); // 오른쪽은 추가 범위 포함
  }

  player.style.left = `${targetPosition}px`;
}

// `shootBullet` 함수
function shootBullet() {
  if (!playing) return;

  const bulletLeftPositions = dualShotActive
    ? [player.offsetLeft + player.offsetWidth / 2 - 33, player.offsetLeft + player.offsetWidth / 2 + 15]
    : [player.offsetLeft + player.offsetWidth / 2 - 5];

  bulletLeftPositions.forEach((leftPosition) => {
    createBullet(leftPosition);
  });
}

function createBullet(leftPosition) {
  const bullet = document.createElement('div');
  bullet.classList.add('bullet');
  
  bullet.style.left = `${leftPosition}px`;
  bullet.style.bottom = '60px';
  gameContainer.appendChild(bullet);
  shootSound.play();

  const moveBullet = setInterval(() => {
    if (!playing) {
      bullet.remove();
      clearInterval(moveBullet);
      return;
    }

    bullet.style.bottom = `${parseInt(bullet.style.bottom) + bulletSpeed}px`;

    if (parseInt(bullet.style.bottom) > gameContainer.offsetHeight) {
      bullet.remove();
      clearInterval(moveBullet);
    }

    const hitEnemy = Array.from(document.querySelectorAll('.enemy')).find(enemy => checkCollision(bullet, enemy));
    const hitBoss = document.querySelector('#boss') && checkCollision(bullet, document.querySelector('#boss'));

    if (hitEnemy) {
      explosionSound.play();
      bullet.remove();
      hitEnemy.remove();
      zombiesKilled++;
      clearInterval(moveBullet);
      createEnemy();
    }

    if (hitBoss) {
      bullet.remove();
      hitBoss.takeDamage(1);
      clearInterval(moveBullet);
    }
  }, 20);
}

// 나머지 코드는 그대로 유지
function increaseEnemySpeed() {
  enemySpeed += 0.5; // 적의 속도 0.5씩 증가
  console.log(`적의 속도 증가: 현재 속도 ${enemySpeed}`);
}

// 50초마다 적의 속도 증가
setInterval(increaseEnemySpeed, 50000);

function createEnemy() {
  if (!playing || document.querySelectorAll('.enemy').length >= maxEnemies) return;

  const enemy = document.createElement('div');
  enemy.classList.add('enemy');

  let enemyLeft = Math.floor(Math.random() * (gameContainer.offsetWidth - 50));
  enemy.style.left = enemyLeft + 'px';
  enemy.style.top = '0px';
  gameContainer.appendChild(enemy);

  let horizontalMovement = Math.random() * 2 - 1;
  const moveEnemy = setInterval(() => {
    if (!playing) {
      enemy.remove();
      clearInterval(moveEnemy);
      return;
    }

    enemy.style.top = `${enemy.offsetTop + enemySpeed}px`;
    enemy.style.left = `${Math.min(Math.max(enemy.offsetLeft + horizontalMovement, 0), gameContainer.offsetWidth - enemy.offsetWidth)}px`;

    if (enemy.offsetTop >= gameContainer.offsetHeight - enemy.offsetHeight) {
      enemy.remove();
      reduceLife();
      clearInterval(moveEnemy);
    }

    if (checkCollision(enemy, player)) {
      enemy.remove();
      reduceLife();
      clearInterval(moveEnemy);
    }
  }, 20);
}

function createPowerUp() {
  if (!playing) return;

  const powerUp = document.createElement('div');
  powerUp.classList.add('power-up');

  powerUp.style.left = `${Math.floor(Math.random() * (gameContainer.offsetWidth - 30))}px`;
  powerUp.style.top = '0px'; // 상단에서 시작하도록 설정
  gameContainer.appendChild(powerUp);

  const movePowerUp = setInterval(() => {
    if (!playing) {
      powerUp.remove();
      clearInterval(movePowerUp);
      return;
    }

    powerUp.style.top = `${parseInt(powerUp.style.top) + 2}px`; // 파워업의 하강 속도

    if (parseInt(powerUp.style.top) > gameContainer.offsetHeight) {
      powerUp.remove();
      clearInterval(movePowerUp);
    }

    if (checkCollision(powerUp, player)) {
      powerUp.remove();
      clearInterval(movePowerUp);
      activatePowerUpEffect(); // 충돌 시 파워업 효과 활성화
    }
  }, 20);
}

function activatePowerUpEffect() {
  powerUpsCollected++; // 파워업 획득 수 증가
  dualShotActive = true; // 두 발 발사 모드 활성화
  playerSpeed *= 2;
  bulletSpeed += 10;

  if (powerUpsCollected >= 2 && !bossAlive) {
    createBoss(); // 별 5개 이상 먹었을 때 보스 생성
  }
  
  setTimeout(() => {
    dualShotActive = false; // 5초 후 두 발 발사 모드 해제
    playerSpeed /= 2;
    bulletSpeed -= 10;
  }, 5000);
}

function createLaserPowerUp() {
  if (!playing) return;

  const powerUp = document.createElement('div');
  powerUp.classList.add('power-up', 'laser-item'); // 레이저 아이템 표시를 위한 클래스 추가

  powerUp.style.left = `${Math.floor(Math.random() * (gameContainer.offsetWidth - 30))}px`;
  powerUp.style.top = '0px';
  gameContainer.appendChild(powerUp);

  const movePowerUp = setInterval(() => {
    if (!playing) {
      powerUp.remove();
      clearInterval(movePowerUp);
      return;
    }

    powerUp.style.top = `${parseInt(powerUp.style.top) + 2}px`;

    if (parseInt(powerUp.style.top) > gameContainer.offsetHeight) {
      powerUp.remove();
      clearInterval(movePowerUp);
    }

    if (checkCollision(powerUp, player)) {
      powerUp.remove();
      clearInterval(movePowerUp);
      activateLaser(); // 레이저 활성화
    }
  }, 20);
}

function activateLaser() {
  if (laserActive) return; // 이미 레이저가 활성화되어 있으면 실행하지 않음
  laserActive = true;

  const laser = document.createElement('div');
  laser.classList.add('laser');
  laser.style.left = `${player.offsetLeft + player.offsetWidth / 2 - 2}px`;
  laser.style.bottom = '60px';
  laser.style.height = `${gameContainer.offsetHeight - 60}px`; // 게임 화면 끝까지 닿도록 높이 설정
  gameContainer.appendChild(laser);

  const laserDamage = setInterval(() => {
    if (!playing || !laserActive) {
      clearInterval(laserDamage);
      laser.remove();
      return;
    }

    // 레이저에 닿은 적에게 데미지 입히기
    const hitEnemies = Array.from(document.querySelectorAll('.enemy')).filter(enemy => checkCollision(laser, enemy));
    hitEnemies.forEach(enemy => {
      explosionSound.play();
      enemy.remove(); // 적 제거 (1초 동안 닿으면 데미지)
      zombiesKilled++;
    });
  }, laserDamageInterval);

  setTimeout(() => {
    laserActive = false; // 레이저 비활성화
    laser.remove();
    clearInterval(laserDamage);
  }, laserDuration); // 3초 후 레이저 제거
}

// 레이저 아이템 생성 주기 설정 (예: 20초마다 생성)
setInterval(createLaserPowerUp, 20000);

function createBoss() {
  bossAlive = true;

  const boss = document.createElement('div');
  boss.id = 'boss';
  boss.classList.add('enemy');
  boss.style.backgroundImage = 'url("boss.png")'; // 보스 이미지
  boss.style.left = `${Math.floor(Math.random() * (gameContainer.offsetWidth - 100))}px`; // 위치 설정
  boss.style.top = '0px'; // 상단에 위치
  gameContainer.appendChild(boss);

  // 보스 체력 바 생성
  const bossHealthBar = document.createElement('div');
  bossHealthBar.classList.add('boss-health-bar');
  boss.appendChild(bossHealthBar);

  const bossHealth = document.createElement('div');
  bossHealth.classList.add('boss-health');
  bossHealthBar.appendChild(bossHealth);

  // 보스의 초기 체력 설정 (5번 맞아야 죽음)
  boss.health = 5;

  // 보스가 데미지를 받으면 체력 표시 갱신
  boss.takeDamage = function () {
    this.health -= 1; // 맞을 때마다 체력 감소
    bossHealth.style.width = `${(this.health / 5) * 100}%`; // 체력 바 갱신
    if (this.health <= 0) {
      boss.remove();
      bossHealthBar.remove();
      bossAlive = false;
      zombiesKilled++;
    }
  };

  // 보스의 이동 설정
  let horizontalMovement = Math.random() * 2 - 1; // 좌우 이동
  const moveBoss = setInterval(() => {
    if (!playing) {
      boss.remove();
      clearInterval(moveBoss);
      return;
    }

    // 보스의 수직 이동 (느리게 설정)
    boss.style.top = `${parseInt(boss.style.top) + 1}px`; // 보스는 천천히 내려옵니다.

    // 보스의 좌우 이동 (느리게 설정)
    boss.style.left = `${Math.min(Math.max(boss.offsetLeft + horizontalMovement, 0), gameContainer.offsetWidth - boss.offsetWidth)}px`;

    if (boss.offsetTop >= gameContainer.offsetHeight - boss.offsetHeight) {
      boss.remove();
      clearInterval(moveBoss);
    }

    if (checkCollision(boss, player)) {
      boss.remove();
      reduceLife();
      clearInterval(moveBoss);
    }
  }, 20); // 보스 이동 주기를 20ms로 설정하여 부드럽게 움직이게 합니다.

  return boss;
}

function shootBullet() {
  const bullets = [];
  createBullet(player.offsetLeft + player.offsetWidth / 2 - 33); // 첫 번째 총알 생성
  
  if (dualShotActive) {
    createBullet(player.offsetLeft + player.offsetWidth / 2 + 15); // 두 번째 총알 위치 조정
  }
}

function createBullet(leftPosition) {
  const bullet = document.createElement('div');
  bullet.classList.add('bullet');
  
  bullet.style.left = `${leftPosition}px`;
  bullet.style.bottom = '60px';
  gameContainer.appendChild(bullet);
  shootSound.play();

  const moveBullet = setInterval(() => {
    if (!playing) {
      bullet.remove();
      clearInterval(moveBullet);
      return;
    }

    bullet.style.bottom = `${parseInt(bullet.style.bottom) + bulletSpeed}px`;

    if (parseInt(bullet.style.bottom) > gameContainer.offsetHeight) {
      bullet.remove();
      clearInterval(moveBullet);
    }

    // 보스를 맞추면 체력 감소
    const hitBoss = document.querySelector('#boss');
    if (hitBoss && checkCollision(bullet, hitBoss)) {
      explosionSound.play();
      bullet.remove();
      hitBoss.takeDamage(); // 총알 맞으면 보스의 체력 감소
      clearInterval(moveBullet);
    }

    // 적을 맞추면 적 제거
    const hitEnemy = Array.from(document.querySelectorAll('.enemy')).find(enemy => checkCollision(bullet, enemy));
    if (hitEnemy) {
      explosionSound.play();
      bullet.remove();
      hitEnemy.remove();
      zombiesKilled++;
      clearInterval(moveBullet);
      createEnemy();
    }
  }, 20);
}



function reduceLife() {
  lives--;
  document.getElementById('lives').innerText = lives;
  if (lives <= 0) {
    endGame();
  }
}

function startTimer() {
  timeSurvived = 0;
  document.getElementById('timer').innerText = timeSurvived;
  timerInterval = setInterval(() => {
    if (playing) {
      timeSurvived++;
      document.getElementById('timer').innerText = timeSurvived;
    }

    if (timeSurvived % 20 === 0) {
      if (initialEnemyInterval > 1000) {
        initialEnemyInterval -= 100;
        clearInterval(enemyInterval);
        enemyInterval = setInterval(createEnemy, initialEnemyInterval);
      }
    }
  }, 1000);
}

function endGame() {
  playing = false;
  clearInterval(timerInterval);
  clearInterval(enemyInterval);
  clearInterval(powerUpInterval);
  document.getElementById('game').classList.add('blur');

  const finalScore = zombiesKilled * timeSurvived;
  logToSpreadsheet(finalScore, timeSurvived, "die");

  document.getElementById('final-score').innerText = `처치한 적: ${zombiesKilled}명 | 생존 시간: ${timeSurvived}초 | 점수: ${finalScore}`;
  document.getElementById('game-over').classList.remove('hidden');
  gameOverSound.play();

  // localStorage에서 userId를 가져와 Google Apps Script로 죽음 로그 전송
  const userId = localStorage.getItem("userId") || "알 수 없음";
  const scriptUrl = "https://script.google.com/macros/s/AKfycbzHPs-RfCEDJiujwmQMRT0Feosu08SH2UGDe8OK50gULjT7Wz5TEW91QtT2CTdKC7aL/exec"; // 정확한 URL로 대체

  fetch(scriptUrl, {
    method: "POST",
    mode: "no-cors", // no-cors 모드 추가
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: userId,
      message: "죽음",
      comment: "die"
    })
  })
  .then(() => {
    console.log("게임 오버 로그 기록 시도");
  })
  .catch(error => {
    console.error("게임 오버 시 fetch 요청 오류 발생:", error.message);
  });

  // 모든 총알, 적, 파워업 요소 제거
  document.querySelectorAll('.bullet').forEach(bullet => bullet.remove());
  document.querySelectorAll('.enemy').forEach(enemy => enemy.remove());
  document.querySelectorAll('.power-up').forEach(powerUp => powerUp.remove());
}

function updateZombiesKilledDisplay() {
  const scoreDisplay = document.getElementById("score"); // 점수 표시 엘리먼트
  if (scoreDisplay) {
    scoreDisplay.textContent = `${zombiesKilled}마리 잡음`;
  }
}



function logToSpreadsheet(score, timeSurvived, comment) {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzHPs-RfCEDJiujwmQMRT0Feosu08SH2UGDe8OK50gULjT7Wz5TEW91QtT2CTdKC7aL/exec"; // Google Apps Script URL을 여기에 입력
    
    fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ score, timeSurvived, comment })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Logged to spreadsheet:", data);
    })
    .catch(error => {
      console.error("Error logging to spreadsheet:", error);
    });
  }

function resetGame() {
  playing = true;
  lives = 3;
  zombiesKilled = 0;
  enemySpeed = initialEnemySpeed;
  initialEnemyInterval = 2000;
  powerUpsCollected = 0; // 파워업 획득 수 초기화
  bossAlive = false; // 보스 상태 초기화
  document.getElementById('timer').innerText = 0;
  document.getElementById('lives').innerText = lives;
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('game').classList.remove('blur');
  clearInterval(timerInterval);
  clearInterval(enemyInterval);
  clearInterval(powerUpInterval);
  document.querySelectorAll('.bullet').forEach(bullet => bullet.remove());
  document.querySelectorAll('.enemy').forEach(enemy => enemy.remove());
  document.querySelectorAll('.power-up').forEach(powerUp => powerUp.remove());
  startTimer();
  enemyInterval = setInterval(createEnemy, initialEnemyInterval);
}

function checkCollision(obj1, obj2) {
  const rect1 = obj1.getBoundingClientRect();
  const rect2 = obj2.getBoundingClientRect();
  return (
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top
  );
}
