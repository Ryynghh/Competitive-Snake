// Configuration & DOM Elements
const GRID = 20, TICK = 140, MAX_FOOD = 5;
const $ = (id) => document.getElementById(id);
const canvas = $('game-canvas'), ctx = canvas.getContext('2d'), CELL = canvas.width / GRID;
let state = 'START', pSnake = [], bSnake = [], pDir = 'RIGHT', nextPDir = 'RIGHT', bDir = 'LEFT', foods = [], timer = 60;
let gameInt, timerInt, audioCtx;

// Centralized Audio System
const playSound = (type) => {
    if ($('mute-checkbox').checked) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const play = (f, t, d, v, rampTo) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain(), now = audioCtx.currentTime;
        o.type = t; o.frequency.setValueAtTime(f, now);
        if (rampTo) o.frequency.exponentialRampToValueAtTime(rampTo, now + d);
        g.gain.setValueAtTime(v, now); g.gain.linearRampToValueAtTime(0.001, now + d);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(now); o.stop(now + d);
    };

    if (type === 'eat') play(523.25, 'sine', 0.1, 0.08, 880);
    else if (type === 'crash') play(130, 'sawtooth', 0.5, 0.15, 40);
    else if (type === 'tick') play(600, 'triangle', 0.05, 0.05);
    else if (type === 'win') [261.63, 329.63, 392.00, 523.25].forEach((f, i) => setTimeout(() => play(f, 'triangle', 0.1, 0.08), i * 120));
};

// Helper Logic (Coordinates, Collisions, Pathfinding & Spawning)
const isOccupied = (x, y) => [...pSnake, ...bSnake, ...foods].some(s => s.x === x && s.y === y);
const getNextHead = (h, d) => ({ x: h.x + (d === 'RIGHT' ? 1 : d === 'LEFT' ? -1 : 0), y: h.y + (d === 'DOWN' ? 1 : d === 'UP' ? -1 : 0) });
const getNeighbors = (p) => [{ x: p.x, y: p.y - 1, d: 'UP' }, { x: p.x, y: p.y + 1, d: 'DOWN' }, { x: p.x - 1, y: p.y, d: 'LEFT' }, { x: p.x + 1, y: p.y, d: 'RIGHT' }].filter(n => n.x >= 0 && n.x < GRID && n.y >= 0 && n.y < GRID);

const spawnFood = () => {
    let empty = [];
    for (let x = 0; x < GRID; x++) for (let y = 0; y < GRID; y++) if (!isOccupied(x, y)) empty.push({ x, y });
    if (empty.length) foods.push(empty[Math.floor(Math.random() * empty.length)]);
};

const getBotDir = (head, targets, obs) => {
    if (Math.random() < 0.4) targets = [];
    let q = [[head]], vis = new Set([`${head.x},${head.y}`]), tSet = new Set(targets.map(t => `${t.x},${t.y}`));

    while (q.length) {
        let path = q.shift(), curr = path[path.length - 1];
        if (tSet.has(`${curr.x},${curr.y}`)) return path[1] ? getNeighbors(head).find(n => n.x === path[1].x && n.y === path[1].y).d : null;
        getNeighbors(curr).forEach(n => {
            let key = `${n.x},${n.y}`;
            if (!vis.has(key) && !obs.has(key)) { vis.add(key); q.push([...path, n]); }
        });
    }
    let safe = getNeighbors(head).filter(n => !obs.has(`${n.x},${n.y}`));
    return safe.length ? safe.sort((a, b) => getNeighbors(b).filter(n => !obs.has(`${n.x},${n.y}`)).length - getNeighbors(a).filter(n => !obs.has(`${n.x},${n.y}`)).length)[0].d : 'LEFT';
};

// Core Game Loop & Status Evaluation
const gameTick = () => {
    pDir = nextPDir;
    let obs = new Set([...pSnake, ...bSnake.slice(1)].map(s => `${s.x},${s.y}`));
    bDir = getBotDir(bSnake[0], foods, obs) || bDir;

    let nP = getNextHead(pSnake[0], pDir), nB = getNextHead(bSnake[0], bDir);
    let pDead = nP.x < 0 || nP.x >= GRID || nP.y < 0 || nP.y >= GRID || [...pSnake, ...bSnake].some(s => s.x === nP.x && s.y === nP.y) || (nP.x === nB.x && nP.y === nB.y);
    let bDead = nB.x < 0 || nB.x >= GRID || nB.y < 0 || nB.y >= GRID || [...pSnake, ...bSnake.slice(1)].some(s => s.x === nB.x && s.y === nB.y) || (nP.x === nB.x && nP.y === nB.y);

    if (pDead || bDead) return endGame(pDead, bDead, pDead && bDead ? "Head-on or mutual collision!" : pDead ? "You hit a wall/body!" : "Bot hit a wall/body!");

    const move = (snake, head, isBot) => {
        let fIdx = foods.findIndex(f => f.x === head.x && f.y === head.y);
        if (fIdx > -1) { foods.splice(fIdx, 1); spawnFood(); if (!isBot) playSound('eat'); }
        else snake.pop();
        snake.unshift(head);
    };

    move(pSnake, nP, false); move(bSnake, nB, true);
    $('player-len').textContent = pSnake.length; $('bot-len').textContent = bSnake.length;
    draw();
};

const endGame = (pDead, bDead, reason = "Time's up!") => {
    clearInterval(gameInt); clearInterval(timerInt); state = 'GAMEOVER';
    let [pLen, bLen] = [pSnake.length, bSnake.length];
    let win = !pDead && bDead ? true : (pDead && !bDead ? false : pLen > bLen);
    let drawGame = pDead === bDead && pLen === bLen;

    $('overlay-title').textContent = drawGame ? "IT'S A DRAW!" : win ? "YOU WIN!" : "YOU LOSE!";
    $('overlay-desc').innerHTML = `${reason}<br>You: ${pLen} | Bot: ${bLen}`;
    $('start-btn').textContent = "PLAY AGAIN";
    $('overlay').className = 'overlay-visible';
    playSound(drawGame || !win ? 'crash' : 'win');
    draw();
};

// Visual Rendering System
const draw = () => {
    ctx.fillStyle = '#0c0c0e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a24'; ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }

    foods.forEach(f => {
        let cx = f.x * CELL + CELL / 2, cy = f.y * CELL + CELL / 2;
        ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(cx, cy, CELL / 2 - 2, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#4eff4e'; ctx.beginPath(); ctx.ellipse(cx + 3, cy - 5, 2, 4, Math.PI / 4, 0, 2 * Math.PI); ctx.fill();
    });

    const drawSnake = (snk, hc, bc, d) => {
        if (!snk.length) return;
        snk.forEach((s, i) => {
            ctx.fillStyle = i === 0 ? hc : bc;
            ctx.fillRect(s.x * CELL + (i ? 2 : 1), s.y * CELL + (i ? 2 : 1), CELL - (i ? 4 : 2), CELL - (i ? 4 : 2));
        });

        let ex = snk[0].x * CELL + 1, ey = snk[0].y * CELL + 1, hz = CELL - 2;
        let e1 = { x: d === 'RIGHT' ? ex + hz - 9 : ex + 5, y: d === 'DOWN' ? ey + hz - 9 : ey + 5 };
        let e2 = { x: d === 'LEFT' ? ex + 5 : ex + hz - 9, y: d === 'UP' ? ey + 5 : ey + hz - 9 };

        ctx.fillStyle = '#fff';
        ctx.fillRect(e1.x, e1.y, 4, 4); ctx.fillRect(e2.x, e2.y, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(e1.x + 1, e1.y + 1, 2, 2); ctx.fillRect(e2.x + 1, e2.y + 1, 2, 2);
    };
    drawSnake(pSnake, '#4eff4e', '#1c5e1c', pDir); drawSnake(bSnake, '#ff4e4e', '#b71c1c', bDir);
};

// Initialization & Event Listeners
const start = () => {
    pSnake = [{ x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }]; bSnake = [{ x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }];
    pDir = nextPDir = 'RIGHT'; bDir = 'LEFT'; foods = []; timer = 60; state = 'PLAYING';
    for (let i = 0; i < MAX_FOOD; i++) spawnFood();

    $('overlay').className = 'overlay-hidden'; $('timer-val').textContent = timer; $('timer-val').classList.remove('text-red');
    playSound('win'); clearInterval(gameInt); clearInterval(timerInt);
    gameInt = setInterval(gameTick, TICK);

    timerInt = setInterval(() => {
        $('timer-val').textContent = --timer;
        if (timer <= 10) { $('timer-val').classList.add('text-red'); playSound('tick'); }
        if (timer <= 0) endGame(false, false);
    }, 1000);
    draw();
};

$('start-btn').addEventListener('click', start);
window.addEventListener('keydown', e => {
    if (state !== 'PLAYING') return [' ', 'Enter'].includes(e.key) && start();
    const map = { ArrowUp: 'UP', w: 'UP', ArrowDown: 'DOWN', s: 'DOWN', ArrowLeft: 'LEFT', a: 'LEFT', ArrowRight: 'RIGHT', d: 'RIGHT' };
    let d = map[e.key] || map[e.key.toLowerCase()];
    if (d && !(d === 'UP' && pDir === 'DOWN') && !(d === 'DOWN' && pDir === 'UP') && !(d === 'LEFT' && pDir === 'RIGHT') && !(d === 'RIGHT' && pDir === 'LEFT')) nextPDir = d;
});

['up', 'down', 'left', 'right'].forEach(d => {
    const dUp = d.toUpperCase(), opp = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }[dUp];
    let el = $(`btn-${d}`);
    if (el) ['touchstart', 'mousedown'].forEach(ev => el.addEventListener(ev, e => {
        e.preventDefault();
        if (state === 'PLAYING' && pDir !== opp) nextPDir = dUp;
    }, { passive: false }));
});

draw();