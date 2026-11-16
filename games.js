/* Eisenberg Points arcade: four small original games on one canvas.
   Loaded on demand by index.html. Exposes window.EPGames.open(opts).
   opts: { game, test, left():sec, spend(sec), flush(), best():n, onScore(n), onClose() } */
(function(){
'use strict';
const W = 240, H = 320;
const rnd = n => Math.floor(Math.random()*n);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

/* ---------------- Snake ---------------- */
function snake(){
  const N = 20, C = W/N, R = H/N, DIR = {left:{x:-1,y:0}, right:{x:1,y:0}, up:{x:0,y:-1}, down:{x:0,y:1}};
  let s = [{x:6,y:8},{x:5,y:8},{x:4,y:8}], d = DIR.right, q = [], food, t = 0, step = 9;
  const g = {score:0, lives:null, over:false, pad:'dpad', hint:'Swipe or use the arrows to turn. Eat the apples. Don’t hit the walls or your own tail.'};
  const place = () => { do food = {x:rnd(C), y:rnd(R)}; while(s.some(p => p.x===food.x && p.y===food.y)); };
  place();
  g.update = inp => {
    for(const k of inp.tap) if(DIR[k] && q.length<2) q.push(DIR[k]);
    if(++t < step) return; t = 0;
    while(q.length){ const n = q.shift(); if(n.x !== -d.x || n.y !== -d.y){ d = n; break; } }
    const h = {x:s[0].x+d.x, y:s[0].y+d.y};
    if(h.x<0 || h.y<0 || h.x>=C || h.y>=R || s.slice(0,-1).some(p => p.x===h.x && p.y===h.y)){ g.over = true; return; }
    s.unshift(h);
    if(h.x===food.x && h.y===food.y){ g.score += 10; if(g.score%50===0 && step>4) step--; place(); } else s.pop();
  };
  g.draw = c => {
    c.fillStyle = '#10241b'; c.fillRect(0,0,W,H);
    c.fillStyle = '#143024'; for(let y=0;y<R;y++) for(let x=(y%2);x<C;x+=2) c.fillRect(x*N,y*N,N,N);
    c.fillStyle = '#ff5a5f'; c.fillRect(food.x*N+4, food.y*N+5, 12, 11); c.fillStyle = '#7bd389'; c.fillRect(food.x*N+10, food.y*N+2, 4, 4);
    s.forEach((p,i) => { c.fillStyle = i ? '#59c36a' : '#b6f09c'; c.fillRect(p.x*N+1, p.y*N+1, N-2, N-2); });
    c.fillStyle = '#10241b'; const hx = s[0].x*N, hy = s[0].y*N; c.fillRect(hx+5, hy+7, 3, 3); c.fillRect(hx+12, hy+7, 3, 3);
  };
  return g;
}

/* ---------------- Brick Breaker ---------------- */
function bricks(){
  const COLORS = ['#ff5a5f','#ff9f43','#ffd166','#59c36a','#4cc9f0','#b388ff'], PW = 44, PY = 294;
  let px = W/2, ball, list = [], level = 1, stuck = true;
  const g = {score:0, lives:3, over:false, pad:'lrfire', fireLabel:'Launch', hint:'Slide your finger or use the arrows to move the paddle. Tap Launch to start the ball.'};
  const fill = () => { list = []; for(let r=0;r<6;r++) for(let c=0;c<8;c++) list.push({x:8+c*28, y:44+r*14, w:26, h:10, r, alive:true}); };
  const reset = () => { stuck = true; ball = {x:px, y:PY-4, vx:0, vy:0}; };
  fill(); reset();
  g.update = inp => {
    if(inp.px != null) px += clamp(inp.px-px, -9, 9); else px += (inp.held.right?4:0) - (inp.held.left?4:0);
    px = clamp(px, PW/2, W-PW/2);
    if(stuck){
      ball.x = px; ball.y = PY-4;
      if(inp.tap.includes('fire') || inp.tap.includes('up')){ const sp = 2.5+level*0.3, a = -Math.PI/2 + (Math.random()-.5)*0.7; ball.vx = sp*Math.cos(a); ball.vy = sp*Math.sin(a); stuck = false; }
      return;
    }
    for(let i=0;i<2;i++){
      const ox = ball.x, oy = ball.y; ball.x += ball.vx/2; ball.y += ball.vy/2;
      if(ball.x<3){ ball.x = 3; ball.vx = Math.abs(ball.vx); } if(ball.x>W-3){ ball.x = W-3; ball.vx = -Math.abs(ball.vx); }
      if(ball.y<3){ ball.y = 3; ball.vy = Math.abs(ball.vy); }
      if(ball.vy>0 && ball.y>=PY-3 && ball.y<=PY+6 && Math.abs(ball.x-px)<=PW/2+3){
        const sp = Math.hypot(ball.vx, ball.vy), a = -Math.PI/2 + clamp((ball.x-px)/(PW/2), -1, 1)*1.05;
        ball.vx = sp*Math.cos(a); ball.vy = sp*Math.sin(a); ball.y = PY-3;
      }
      if(ball.y > H+8){ if(--g.lives<=0) g.over = true; else reset(); return; }
      for(const b of list){
        if(!b.alive || ball.x<b.x-3 || ball.x>b.x+b.w+3 || ball.y<b.y-3 || ball.y>b.y+b.h+3) continue;
        b.alive = false; g.score += 10 + (5-b.r)*5;
        if(ox<b.x-3 || ox>b.x+b.w+3) ball.vx = -ball.vx; else ball.vy = -ball.vy;
        break;
      }
    }
    if(!list.some(b => b.alive)){ level++; g.score += 100; fill(); reset(); }
  };
  g.draw = c => {
    c.fillStyle = '#161a2e'; c.fillRect(0,0,W,H);
    for(const b of list) if(b.alive){ c.fillStyle = COLORS[b.r]; c.fillRect(b.x,b.y,b.w,b.h); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(b.x,b.y,b.w,2); }
    c.fillStyle = '#e8ecff'; c.fillRect(px-PW/2, PY, PW, 7); c.fillStyle = '#4cc9f0'; c.fillRect(px-PW/2, PY, 6, 7); c.fillRect(px+PW/2-6, PY, 6, 7);
    c.fillStyle = '#fff'; c.fillRect(ball.x-3, ball.y-3, 6, 6);
  };
  return g;
}

/* ---------------- Space Blasters ---------------- */
function blasters(){
  const COLORS = ['#ff7eb6','#ffd166','#7bd389','#4cc9f0'], stars = Array.from({length:40}, () => ({x:rnd(W), y:rnd(H)}));
  let px = W/2, shots = [], bombs = [], al = [], dir = 1, wave = 1, cool = 0, tick = 0, hurt = 0;
  const g = {score:0, lives:3, over:false, pad:'lrfire', fireLabel:'Fire', hint:'Move with the arrows or slide your finger. Tap Fire to shoot. Clear them before they reach you.'};
  const spawn = () => { al = []; for(let r=0;r<4;r++) for(let c=0;c<8;c++) al.push({x:20+c*24, y:36+r*20, r, alive:true}); dir = 1; };
  spawn();
  g.update = inp => {
    tick++; if(hurt) hurt--;
    if(inp.px != null) px += clamp(inp.px-px, -4, 4); else px += (inp.held.right?2.6:0) - (inp.held.left?2.6:0);
    px = clamp(px, 10, W-10);
    if(cool) cool--;
    if((inp.held.fire || inp.tap.includes('fire')) && !cool && shots.length<2){ shots.push({x:px, y:286}); cool = 14; }
    shots.forEach(s => s.y -= 6); shots = shots.filter(s => s.y > -6);
    const live = al.filter(a => a.alive), n = live.length;
    if(!n){ wave++; g.score += 100; spawn(); bombs = []; shots = []; return; }
    const sp = (0.22 + wave*0.07) * (1 + (32-n)/32*2.4), dx = dir*sp;
    if(live.some(a => a.x+dx < 6 || a.x+dx > W-22)){ dir = -dir; al.forEach(a => a.y += 8); } else al.forEach(a => a.x += dx);
    if(Math.random() < 0.010 + wave*0.004){ const a = live[rnd(n)]; bombs.push({x:a.x+8, y:a.y+12}); }
    bombs.forEach(b => b.y += 1.8 + wave*0.2);
    for(const b of bombs) if(!hurt && Math.abs(b.x-px)<9 && b.y>284 && b.y<302){ bombs = []; hurt = 50; if(--g.lives<=0) g.over = true; break; }
    bombs = bombs.filter(b => b.y < H+6);
    for(const s of shots) for(const a of live){
      if(a.alive && s.x>a.x-1 && s.x<a.x+17 && s.y>a.y-2 && s.y<a.y+13){ a.alive = false; s.y = -99; g.score += (4-a.r)*10; break; }
    }
    if(live.some(a => a.alive && a.y+12 >= 284)) g.over = true;
  };
  g.draw = c => {
    c.fillStyle = '#0c0f24'; c.fillRect(0,0,W,H);
    c.fillStyle = '#39406b'; stars.forEach(s => c.fillRect(s.x, s.y, 1, 1));
    const f = Math.floor(tick/20)%2;
    for(const a of al) if(a.alive){
      c.fillStyle = COLORS[a.r]; c.fillRect(a.x+2, a.y, 12, 9); c.fillRect(a.x, a.y+3, 16, 4);
      c.fillRect(a.x+(f?1:3), a.y+9, 3, 3); c.fillRect(a.x+(f?12:10), a.y+9, 3, 3);
      c.fillStyle = '#0c0f24'; c.fillRect(a.x+4, a.y+3, 2, 3); c.fillRect(a.x+10, a.y+3, 2, 3);
    }
    if(!(hurt && tick%8<4)){ c.fillStyle = '#e8ecff'; c.fillRect(px-9, 292, 18, 6); c.fillRect(px-5, 288, 10, 4); c.fillStyle = '#4cc9f0'; c.fillRect(px-1, 284, 2, 4); }
    c.fillStyle = '#fff'; shots.forEach(s => c.fillRect(s.x-1, s.y, 2, 7));
    c.fillStyle = '#ffd166'; bombs.forEach(b => c.fillRect(b.x-1, b.y, 3, 6));
  };
  return g;
}

/* ---------------- Road Hopper ---------------- */
function hopper(){
  const T = 20, START = 15, GOAL = 3, CARS = ['#ff5a5f','#ffd166','#4cc9f0','#b388ff','#ff9f43'];
  let p, lanes = {}, level = 1, far = START, dead = 0, tick = 0;
  const g = {score:0, lives:3, over:false, pad:'dpad', hint:'Tap the arrows or swipe to hop. Dodge the cars, ride the logs, and reach the grass at the top.'};
  const isRoad = r => r>=10 && r<=14, isWater = r => r>=4 && r<=8;
  const build = () => {
    lanes = {};
    for(let r=4;r<=14;r++){
      if(r===9) continue;
      const road = isRoad(r), dirn = r%2 ? 1 : -1, n = 2 + rnd(2), items = [];
      const speed = dirn * (road ? 0.5 + Math.random()*0.5 + level*0.12 : 0.35 + Math.random()*0.35 + level*0.07);
      for(let i=0;i<n;i++) items.push({x: i*(W+60)/n + rnd(20), w: road ? 22 + rnd(3)*6 : 52 + rnd(3)*10, col: CARS[rnd(5)]});
      lanes[r] = {speed, items};
    }
  };
  const home = () => { p = {x:110, y:START*T}; far = START; };
  build(); home();
  const die = () => { g.lives--; dead = 40; };
  g.update = inp => {
    tick++;
    for(const r in lanes){ const L = lanes[r]; for(const it of L.items){ it.x += L.speed; if(L.speed>0 && it.x>W) it.x = -it.w; if(L.speed<0 && it.x+it.w<0) it.x = W; } }
    if(dead){ if(--dead===0){ if(g.lives<=0) g.over = true; else home(); } return; }
    const k = inp.tap.find(t => t==='up'||t==='down'||t==='left'||t==='right');
    if(k==='up') p.y = Math.max(GOAL*T, p.y-T); if(k==='down') p.y = Math.min(START*T, p.y+T);
    if(k==='left') p.x -= T; if(k==='right') p.x += T;
    let row = p.y/T;
    if(k && !isWater(row)) p.x = Math.round((p.x-10)/T)*T+10;
    p.x = clamp(p.x, 0, W-T);
    if(row < far){ g.score += 10; far = row; }
    if(isRoad(row)){ if(lanes[row].items.some(c => p.x+4 < c.x+c.w && p.x+T-4 > c.x)) return die(); }
    else if(isWater(row)){
      const L = lanes[row], mid = p.x+T/2;
      if(!L.items.some(l => mid>l.x && mid<l.x+l.w)) return die();
      p.x += L.speed; if(p.x < -6 || p.x > W-T+6) return die();
    }
    else if(row===GOAL){ g.score += 100; level++; build(); home(); }
  };
  g.draw = c => {
    c.fillStyle = '#16321f'; c.fillRect(0,0,W,H);
    c.fillStyle = '#2d6a3e'; c.fillRect(0,0,W,(GOAL+1)*T); c.fillRect(0,9*T,W,T); c.fillRect(0,START*T,W,T);
    c.fillStyle = '#3c8a52'; for(let x=6;x<W;x+=24){ c.fillRect(x,8,10,10); c.fillRect(x+12,34,10,10); }
    c.fillStyle = '#1d4e89'; c.fillRect(0,4*T,W,5*T);
    c.fillStyle = '#2a2d3a'; c.fillRect(0,10*T,W,5*T);
    c.fillStyle = '#555a70'; for(let r=11;r<=14;r++) for(let x=4;x<W;x+=24) c.fillRect(x, r*T-1, 12, 2);
    for(const r in lanes){ const L = lanes[r], y = r*T;
      for(const it of L.items){
        if(isRoad(+r)){ c.fillStyle = it.col; c.fillRect(it.x, y+4, it.w, 12); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(it.x+(L.speed>0?it.w-8:3), y+6, 5, 8); }
        else { c.fillStyle = '#8a5a2b'; c.fillRect(it.x, y+3, it.w, 14); c.fillStyle = '#a8733d'; c.fillRect(it.x+3, y+6, it.w-6, 2); c.fillRect(it.x+3, y+11, it.w-6, 2); }
      }
    }
    if(dead){ if(tick%8<4){ c.fillStyle = '#fff'; c.fillRect(p.x+3, p.y+3, 14, 14); } return; }
    c.fillStyle = '#ffd166'; c.fillRect(p.x+3, p.y+4, 14, 13); c.fillRect(p.x+5, p.y+2, 10, 3);
    c.fillStyle = '#ff9f43'; c.fillRect(p.x+8, p.y+1, 4, 3);
    c.fillStyle = '#2a2d3a'; c.fillRect(p.x+5, p.y+6, 2, 2); c.fillRect(p.x+13, p.y+6, 2, 2);
  };
  return g;
}

const MAKE = {snake, bricks, blasters, hopper};
const NAMES = {snake:'Snake', bricks:'Brick Breaker', blasters:'Space Blasters', hopper:'Road Hopper'};

/* ---------------- shell: overlay, input, loop ---------------- */
const CSS = `
#ep-game{position:fixed;inset:0;z-index:50;background:#0b0d1c;color:#fff;display:flex;flex-direction:column;font:500 16px/1.3 Fredoka,ui-rounded,system-ui,sans-serif;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none}
#ep-game button{font:inherit;color:inherit;border:0;cursor:pointer;touch-action:none}
.g-bar{display:flex;align-items:center;gap:10px;padding:8px 10px}
.g-bar .g-x,.g-bar .g-pause{background:#22264a;border-radius:10px;min-height:40px;min-width:44px;padding:0 10px;font-weight:600;flex:none}
.g-name{font-weight:600;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.g-stat{margin-left:auto;display:flex;gap:9px;flex:none;align-items:center;font-variant-numeric:tabular-nums;white-space:nowrap}
.g-score{font-weight:700;font-size:20px}
.g-lives{color:#ff7eb6;letter-spacing:2px}
.g-time{background:#ffc93c;color:#231c4f;border-radius:999px;padding:2px 10px;font-weight:700}
.g-time.out{background:#ff5a5f;color:#fff}
.g-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;position:relative}
.g-stage canvas{image-rendering:pixelated;image-rendering:crisp-edges;border-radius:8px;box-shadow:0 0 0 2px #22264a;background:#000}
.g-panel{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(11,13,28,.78);padding:20px}
.g-panel.on{display:flex}
.g-card{background:#fff;color:#231c4f;border-radius:22px;padding:22px 20px;max-width:340px;width:100%;text-align:center}
.g-card h2{margin:0 0 6px;font-size:26px;font-weight:700}
.g-card p{margin:0 0 14px;color:#6a6391;font-size:16px}
.g-card .big{font-size:54px;font-weight:700;line-height:1;margin:4px 0 6px}
.g-card button{display:block;width:100%;min-height:48px;border-radius:999px;font-weight:600;font-size:17px;margin-top:8px;background:#231c4f;color:#fff}
.g-card button.gold{background:#ffc93c;color:#231c4f}
.g-pad{display:flex;justify-content:space-between;align-items:center;padding:10px 18px 14px;gap:16px}
.g-dpad{display:grid;grid-template-columns:repeat(3,58px);grid-template-rows:repeat(2,54px);gap:6px}
.g-dpad button,.g-fire{background:#22264a;border-radius:14px;font-size:24px;font-weight:700}
.g-dpad button:active,.g-fire:active,.g-dpad button.dn,.g-fire.dn{background:#3a4080}
.g-dpad .u{grid-column:2;grid-row:1}.g-dpad .l{grid-column:1;grid-row:2}.g-dpad .d{grid-column:2;grid-row:2}.g-dpad .r{grid-column:3;grid-row:2}
.g-dpad.lr{grid-template-rows:64px;grid-template-columns:repeat(2,76px)}
.g-dpad.lr .l{grid-column:1;grid-row:1}.g-dpad.lr .r{grid-column:2;grid-row:1}
.g-fire{min-width:120px;height:64px;font-size:19px;background:#ffc93c!important;color:#231c4f!important}
.g-fire.dn{filter:brightness(.88)}
`;
let styled = false, current = null;

function open(opts){
  if(current) current.close(true);
  if(!styled){ const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const root = document.createElement('div'); root.id = 'ep-game';
  root.innerHTML = `<div class="g-bar"><button class="g-x" type="button" aria-label="Close game">✕</button><div class="g-name"></div>
      <div class="g-stat"><span class="g-lives"></span><span class="g-score">0</span><span class="g-time"></span></div><button class="g-pause" type="button" aria-label="Pause">\u275A\u275A</button></div>
    <div class="g-stage"><canvas width="${W}" height="${H}"></canvas><div class="g-panel"></div></div>
    <div class="g-pad"><div class="g-dpad"><button class="u" data-k="up" type="button" aria-label="Up">▲</button><button class="l" data-k="left" type="button" aria-label="Left">◀</button><button class="d" data-k="down" type="button" aria-label="Down">▼</button><button class="r" data-k="right" type="button" aria-label="Right">▶</button></div>
      <button class="g-fire" data-k="fire" type="button">Fire</button></div>`;
  document.body.appendChild(root);
  const q = s => root.querySelector(s), cv = q('canvas'), c = cv.getContext('2d'), panel = q('.g-panel'), stage = q('.g-stage');
  const inp = {held:{}, tap:[], px:null};
  let g = null, state = 'ready', raf = 0, last = 0, acc = 0, closed = false, lastHud = '';
  const left = () => opts.test ? Infinity : opts.left();
  q('.g-name').textContent = NAMES[opts.game];

  const fit = () => { const r = stage.getBoundingClientRect(), sc = Math.max(0.5, Math.min((r.width-12)/W, (r.height-8)/H)); cv.style.width = Math.floor(W*sc)+'px'; cv.style.height = Math.floor(H*sc)+'px'; };
  const fresh = () => { g = MAKE[opts.game](); inp.tap.length = 0; inp.held = {}; inp.px = null; acc = 0;
    q('.g-dpad').className = 'g-dpad' + (g.pad==='lrfire' ? ' lr' : ''); q('.g-dpad .u').hidden = q('.g-dpad .d').hidden = g.pad==='lrfire';
    q('.g-fire').style.display = g.pad==='lrfire' ? '' : 'none'; q('.g-fire').textContent = g.fireLabel || 'Fire'; fit(); };
  const show = html => { panel.innerHTML = `<div class="g-card">${html}</div>`; panel.classList.add('on'); };
  const hide = () => { panel.classList.remove('on'); panel.innerHTML = ''; };
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
  const hud = () => {
    const t = opts.test ? 'Test' : (left()>0 ? fmt(left()) : (state==='play' ? 'Last game' : '0:00'));
    const key = g.score+'|'+g.lives+'|'+t; if(key===lastHud) return; lastHud = key;
    q('.g-score').textContent = g.score; q('.g-lives').textContent = g.lives==null ? '' : '♥'.repeat(Math.max(0,g.lives));
    q('.g-time').textContent = t; q('.g-time').classList.toggle('out', !opts.test && left()<=0);
  };
  const ready = () => { state = 'ready'; fresh(); g.draw(c); hud();
    if(left()<=0) return show(`<h2>No game time left</h2><p>Earn more game time, then come back and play.</p><button data-a="quit">Back to games</button>`);
    show(`<h2>${NAMES[opts.game]}</h2><p>${g.hint}</p><button class="gold" data-a="start">Start</button>`); };
  const play = () => { hide(); state = 'play'; last = performance.now(); };
  const pause = () => { if(state!=='play') return; state = 'pause'; opts.flush && opts.flush(); show(`<h2>Paused</h2><p>Your game time is not counting down.</p><button class="gold" data-a="resume">Keep playing</button><button data-a="quit">Back to games</button>`); };
  const over = () => {
    state = 'over'; const prev = opts.test ? 0 : opts.best(), isBest = !opts.test && g.score>prev && g.score>0;
    if(!opts.test){ opts.onScore(g.score); opts.flush(); }
    const again = left()>0;
    show(`<h2>Game over</h2><div class="big">${g.score}</div><p>${isBest ? 'New best score!' : opts.test ? 'Test mode. Scores are not saved.' : 'Your best: '+Math.max(prev,g.score)}</p>
      ${again ? '<button class="gold" data-a="again">Play again</button>' : '<p>Your game time is used up. Earn more to play again.</p>'}<button data-a="quit">Back to games</button>`);
    hud();
  };
  const close = silent => { if(closed) return; closed = true; cancelAnimationFrame(raf); if(!opts.test) opts.flush();
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', fit); document.removeEventListener('visibilitychange', vis);
    root.remove(); current = null; if(!silent && opts.onClose) opts.onClose(); };

  panel.addEventListener('click', e => { const a = e.target.dataset && e.target.dataset.a; if(!a) return;
    if(a==='start' || a==='resume') play(); else if(a==='again'){ ready(); if(left()>0) play(); } else if(a==='quit') close(); });
  q('.g-x').onclick = () => close();
  q('.g-pause').onclick = () => pause();

  /* input */
  const KEYS = {ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', ' ':'fire', a:'left', d:'right', w:'up', s:'down'};
  const kd = e => { const k = KEYS[e.key]; if(!k) return; e.preventDefault(); if(!inp.held[k]) inp.tap.push(k); inp.held[k] = true; };
  const ku = e => { const k = KEYS[e.key]; if(k) inp.held[k] = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  root.querySelectorAll('[data-k]').forEach(b => {
    const k = b.dataset.k, up = () => { inp.held[k] = false; b.classList.remove('dn'); };
    b.addEventListener('pointerdown', e => { e.preventDefault(); inp.held[k] = true; inp.tap.push(k); b.classList.add('dn'); });
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  });
  let sw = null;
  const lx = e => { const r = cv.getBoundingClientRect(); return (e.clientX-r.left)/r.width*W; };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); sw = {x:e.clientX, y:e.clientY, moved:false}; if(g.pad==='lrfire'){ inp.px = lx(e); inp.tap.push('fire'); } });
  cv.addEventListener('pointermove', e => { if(!sw) return; if(g.pad==='lrfire'){ inp.px = lx(e); return; }
    const dx = e.clientX-sw.x, dy = e.clientY-sw.y;
    if(Math.max(Math.abs(dx),Math.abs(dy)) > 22){ inp.tap.push(Math.abs(dx)>Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up')); sw = {x:e.clientX, y:e.clientY, moved:true}; } });
  const pend = () => { if(sw && !sw.moved && g.pad==='dpad' && opts.game==='hopper') inp.tap.push('up'); sw = null; inp.px = null; };
  cv.addEventListener('pointerup', pend); cv.addEventListener('pointercancel', () => { sw = null; inp.px = null; });
  root.addEventListener('contextmenu', e => e.preventDefault());
  const vis = () => { if(document.hidden) pause(); };
  document.addEventListener('visibilitychange', vis); window.addEventListener('resize', fit);

  const frame = t => {
    if(closed) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (t-last)/1000); last = t;
    if(state==='play'){
      if(!opts.test && left()>0) opts.spend(dt);
      acc += dt; let n = 0;
      while(acc >= 1/60 && n++ < 6){ acc -= 1/60; g.update(inp); inp.tap.length = 0; if(g.over) break; }
      if(acc > 0.2) acc = 0;
      g.draw(c); if(g.over) over(); else hud();
    }
  };
  current = {close};
  ready(); last = performance.now(); raf = requestAnimationFrame(frame);
  return current;
}

window.EPGames = {open, NAMES};
})();
