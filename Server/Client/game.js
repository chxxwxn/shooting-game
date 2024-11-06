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
let enemySpeed = initialEnemySpeed;
let playerSpeed = 7;
let targetPosition = player.offsetLeft;
let lives = 3;
let initialEnemyInterval = 2000;
const maxEnemies = 10; // 최대 적 수를 10명으로 설정
let dualShotActive = false; // 두 발 발사 여부를 저장하는 변수
const milestones = [50, 100, 150, 200, 250, 300];
const comments = ["good", "great", "excellent", "amazing", "unbelievable", "fantastic"];
const shootSound = document.getElementById('shoot-sound');
const explosionSound = document.getElementById('explosion-sound');
const gameOverSound = document.getElementById('game-over-sound');
let moveDirection = null;

let bossAlive = false;
let bossDamageCount = 0; // 보스가 맞은 총알 수 추적

function startGame() {
  document.getElementById('main-screen').classList.add('hidden');
  document.querySelector('.game-container').classList.remove('hidden');
  document.getElementById('game').classList.remove('blur');
  resetGame();
  startTimer();
  
  // `playing` 상태를 true로 설정하여 게임이 시작됨을 명확히 함
  playing = true;

  // 플레이어 이동 함수 호출
  requestAnimationFrame(movePlayer);

  // 주기적으로 적을 생성하고 파워업을 생성하도록 설정
  enemyInterval = setInterval(createEnemy, initialEnemyInterval);
  powerUpInterval = setInterval(createPowerUp, 10000); // 10초마다 파워업 생성

  // Google Apps Script에 게임 시작 로그를 기록
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
  if (e.key === 'ArrowLeft') {
    moveDirection = 'left';
  } else if (e.key === 'ArrowRight') {
    moveDirection = 'right';
  } else if (e.key === ' ' && playing) {
    shootBullet();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' && moveDirection === 'left') {
    moveDirection = null;
  } else if (e.key === 'ArrowRight' && moveDirection === 'right') {
    moveDirection = null;
  }
});

// `movePlayer` 함수 예시
function movePlayer() {
  const currentLeft = player.offsetLeft;

  if (moveDirection === 'left') {
    targetPosition = Math.max(0, currentLeft - playerSpeed);
  } else if (moveDirection === 'right') {
    targetPosition = Math.min(gameContainer.offsetWidth - player.offsetWidth, currentLeft + playerSpeed);
  }

  player.style.left = `${targetPosition}px`;
  if (playing) {
    requestAnimationFrame(movePlayer);
  }
}

// `shootBullet` 함수 예시
function shootBullet() {
  const bullet = document.createElement('div');
  bullet.classList.add('bullet');
  
  bullet.style.left = `${player.offsetLeft + player.offsetWidth / 2 - 5}px`; // 총알 위치 조정
  bullet.style.bottom = '60px';
  gameContainer.appendChild(bullet);
  shootSound.play();

  // 총알 이동 설정
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
  }, 20);
}

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' && moveDirection === 'left') {
    moveDirection = null;
  } else if (e.key === 'ArrowRight' && moveDirection === 'right') {
    moveDirection = null;
  }
});

function movePlayer() {
  const currentLeft = player.offsetLeft;

  if (moveDirection === 'left') {
    targetPosition = Math.max(0, currentLeft - playerSpeed);
  } else if (moveDirection === 'right') {
    targetPosition = Math.min(gameContainer.offsetWidth - player.offsetWidth, currentLeft + playerSpeed);
  }

  player.style.left = `${targetPosition}px`;
  requestAnimationFrame(movePlayer);
}

function shootBullet() {
  createBullet(player.offsetLeft + player.offsetWidth / 2 - 33); // 첫 번째 총알 생성
  
  if (dualShotActive) {
    createBullet(player.offsetLeft + player.offsetWidth / 2 + 15); // 두 번째 총알 위치 조정
  }
}

function checkMilestone() {
  const index = milestones.indexOf(zombiesKilled);
  if (index !== -1) {
    const userId = localStorage.getItem("userId") || "알 수 없음";
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzHPs-RfCEDJiujwmQMRT0Feosu08SH2UGDe8OK50gULjT7Wz5TEW91QtT2CTdKC7aL/exec"; // 정확한 URL로 대체

    // milestone에 맞는 로그 기록 요청 (응답 불필요)
    fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors", // no-cors 모드 추가
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: userId,
        message: `${zombiesKilled}마리 잡음`,
        comment: comments[index]
      })
    })
    .then(() => {
      console.log(`${zombiesKilled}마리 잡음 로그 기록 시도`);
    })
    .catch(error => {
      console.error("몹 처치 milestone 시 fetch 요청 오류 발생:", error.message);
    });
  }
}

// 기존의 몹 처치 코드에서 `zombiesKilled` 변수 증가 후 호출
function killEnemy() {
  zombiesKilled++; // 몹 처치 시 갱신
  updateZombiesKilledDisplay(); // 화면에 업데이트된 몹 처치 수 표시
  checkMilestone(); // milestone 달성 여부 확인 및 로그 기록
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
