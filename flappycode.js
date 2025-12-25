// --- SES SİSTEMİ ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSynthSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'coin') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'dead') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

// --- PHASER AYARLARI ---
const isMobile = window.innerWidth < 768;
const config = {
    type: Phaser.AUTO,
    width: isMobile ? window.innerWidth : 400,
    height: isMobile ? window.innerHeight : 600,
    transparent: true,
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 1100 }, 
            debug: false 
        }
    },
    scene: { create: create, update: update }
};

// --- DEĞİŞKENLER ---
let bird, pipes, coins;
let score = 0;
let bestScore = parseInt(localStorage.getItem('flappy_best')) || 0;
let totalCoins = parseInt(localStorage.getItem('flappy_coins')) || 0;
let gameHasStarted = false;
let gameOverFlag = false;

// UI İlk Yükleme
if(document.getElementById('best-score')) document.getElementById('best-score').innerText = bestScore;
if(document.getElementById('total-coins')) document.getElementById('total-coins').innerText = totalCoins;

const game = new Phaser.Game(config);

// --- CREATE FONKSİYONU ---
function create() {
    // GRAFİKLER
    let cloudG = this.make.graphics();
    cloudG.fillStyle(0xFFFFFF, 1);
    cloudG.fillCircle(20, 20, 20); cloudG.fillCircle(45, 20, 25); cloudG.fillCircle(75, 20, 20);
    cloudG.generateTexture('cloud', 100, 50);
    
    this.add.image(config.width * 0.2, config.height * 0.2, 'cloud').setAlpha(0.6);
    this.add.image(config.width * 0.8, config.height * 0.3, 'cloud').setAlpha(0.5).setScale(0.8);
    this.add.image(config.width * 0.5, config.height * 0.1, 'cloud').setAlpha(0.4).setScale(1.2);

    let groundG = this.make.graphics();
    groundG.fillStyle(0xDED895, 1); groundG.fillRect(0, 15, 400, 100);
    groundG.fillStyle(0x73BF2E, 1); groundG.fillRect(0, 0, 400, 15);
    groundG.lineStyle(3, 0x558C22, 1); groundG.strokeRect(0, 0, 400, 15);
    groundG.generateTexture('ground', 400, 110);

    let coinG = this.make.graphics();
    coinG.fillStyle(0xFFD700, 1); coinG.fillCircle(16, 16, 16);
    coinG.lineStyle(2, 0xB8860B, 1); coinG.strokeCircle(16, 16, 16);
    coinG.fillStyle(0xFFFACD, 1); coinG.fillCircle(16, 16, 10);
    coinG.fillStyle(0xB8860B, 1); coinG.fillRect(14, 9, 4, 14); 
    coinG.generateTexture('coin', 32, 32);

    let pipeG = this.make.graphics();
    pipeG.fillStyle(0x73BF2E, 1); pipeG.fillRect(2, 2, 54, 600);
    pipeG.lineStyle(4, 0x558C22, 1); pipeG.strokeRect(0, 0, 58, 600);
    pipeG.fillStyle(0x73BF2E, 1); pipeG.fillRect(0, 0, 58, 28);
    pipeG.strokeRect(0, 0, 58, 28);
    pipeG.generateTexture('pipe', 60, 600);

    let birdG = this.make.graphics();
    birdG.fillStyle(0xFF69B4, 1);
    birdG.fillTriangle(10, 8, 14, 0, 18, 8); birdG.fillTriangle(18, 8, 22, -2, 26, 8); birdG.fillTriangle(26, 8, 30, 0, 34, 8);
    birdG.fillStyle(0xF4CE42, 1); birdG.fillCircle(22, 20, 14);
    birdG.fillStyle(0xFFFFFF, 1); birdG.fillCircle(28, 16, 6);
    birdG.fillStyle(0x000000, 1); birdG.fillCircle(30, 16, 2);
    birdG.fillStyle(0xF39C12, 1); birdG.fillTriangle(32, 20, 44, 23, 32, 26);
    birdG.generateTexture('bird', 45, 40);

    pipes = this.physics.add.group();
    coins = this.physics.add.group();

    bird = this.physics.add.sprite(config.width / 4, config.height / 2, 'bird');
    bird.setDepth(10);
    bird.body.setCircle(13, 9, 7); 
    
    this.ground = this.add.tileSprite(config.width/2, config.height, config.width, 110, 'ground').setOrigin(0.5, 1).setDepth(20);
    this.physics.add.existing(this.ground, true);

    this.input.on('pointerdown', jump, this);
    this.input.keyboard.on('keydown-SPACE', jump, this);

    this.physics.add.collider(bird, pipes, gameOver, null, this);
    this.physics.add.collider(bird, this.ground, gameOver, null, this);
    this.physics.add.overlap(bird, coins, collectCoin, null, this);

    this.pipeTimer = this.time.addEvent({
        delay: 1500,
        callback: addPipeColumn,
        callbackScope: this,
        loop: true,
        paused: true
    });
}

// --- UPDATE ---
function update() {
    if (!gameHasStarted) {
        bird.body.allowGravity = false;
        bird.y = (config.height / 2) + Math.sin(this.time.now / 300) * 8;
        return;
    }
    if (gameOverFlag) return;

    this.ground.tilePositionX += 2.5;
    if (bird.angle < 30) bird.angle += 2.5;
    if (bird.y < -50 || bird.y > config.height) gameOver.call(this);
}

// --- ZIPLAMA ---
function jump() {
    // Modal açıksa zıplama
    const modal = document.getElementById('login-modal');
    if (modal && !modal.classList.contains('hidden')) return;

    if (gameOverFlag) {
        restartGame.call(this);
        return;
    }

    if (!gameHasStarted) {
        gameHasStarted = true;
        bird.body.allowGravity = true;
        this.pipeTimer.paused = false;
        document.getElementById('start-msg').style.display = 'none';
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    bird.setVelocityY(-350);
    this.tweens.add({ targets: bird, angle: -25, duration: 100 });
    playSynthSound('jump');
}

// --- BORU EKLEME ---
function addPipeColumn() {
    if (gameOverFlag) return;

    let currentGap = Math.max(85, 140 - (score * 0.5));
    const minPipePiece = 80; 
    const maxAvailableY = config.height - 110 - currentGap - minPipePiece;

    let pipeY;
    let isExtreme = Math.random() < 0.50;

    if (isExtreme) {
        let goTop = Math.random() < 0.5;
        pipeY = goTop ? minPipePiece : maxAvailableY;
    } else {
        pipeY = Phaser.Math.Between(minPipePiece, maxAvailableY);
    }

    let topPipe = pipes.create(config.width + 80, pipeY, 'pipe').setOrigin(0.5, 1).setFlipY(true);
    let bottomPipe = pipes.create(config.width + 80, pipeY + currentGap, 'pipe').setOrigin(0.5, 0);

    [topPipe, bottomPipe].forEach(p => {
        p.body.allowGravity = false;
        p.setVelocityX(-200);
    });

    let coinY = pipeY + (currentGap / 2);
    let coin = coins.create(config.width + 80, coinY, 'coin');
    coin.setVelocityX(-200);
    coin.body.allowGravity = false;
    
    this.tweens.add({
        targets: coin, scaleX: 0, duration: 600, yoyo: true, repeat: -1
    });

    this.time.delayedCall(1500, () => {
         if (!gameOverFlag && gameHasStarted) {
            score += 1;
            document.getElementById('current-score').innerText = score;
         }
    });
}

// --- ALTIN TOPLAMA ---
function collectCoin(bird, coin) {
    coin.disableBody(true, true);
    totalCoins += 1;
    document.getElementById('total-coins').innerText = totalCoins;
    playSynthSound('coin');
}

// --- OYUN BİTİŞİ (DATABASE BAĞLANTISI BURADA) ---
function gameOver() {
    if (gameOverFlag) return;
    gameOverFlag = true;
    
    this.physics.pause();
    bird.setTint(0xff0000);
    playSynthSound('dead');

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappy_best', bestScore);
    }
    localStorage.setItem('flappy_coins', totalCoins);

    // >> SKORU DATABASE'E GÖNDER <<
    if (typeof skoruDatabaseYaz === "function") {
        skoruDatabaseYaz(score, totalCoins);
    }

    document.getElementById('start-msg').innerText = "TEKRAR DENE";
    document.getElementById('start-msg').style.display = 'block';
}

function restartGame() {
    gameOverFlag = false;
    gameHasStarted = false;
    score = 0;
    document.getElementById('current-score').innerText = "0";
    this.scene.restart();
}
