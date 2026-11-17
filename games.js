/* Eisenberg Points arcade: four small original games on one canvas.
   Loaded on demand by index.html. Exposes window.EPGames.open(opts).
   opts: { game, test, left():sec, spend(sec), flush(), best():n, onScore(n), onClose() }
   All art and sound are original and generated in code (pixel maps + Web Audio). */
(function(){
'use strict';
const W = 240, H = 320;
const rnd = n => Math.floor(Math.random()*n);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const pick = a => a[rnd(a.length)];

/* ---------------- sound ---------------- */
const AU = {ctx:null, muted:false};
try{ AU.muted = localStorage.getItem('ep_mute')==='1'; }catch(e){}
const SILENCE = 'data:audio/wav;base64,UklGRvQHAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdAHAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
/* Must run inside a tap. On iPhone and iPad, web sound is silenced by the ring/silent switch unless the page
   asks for the "playback" audio category, so ask for it; on older iOS a looping silent <audio> does the same job. */
function auInit(){
  try{
    if(navigator.audioSession){ try{ navigator.audioSession.type = 'playback'; }catch(e){} }
    if(!AU.ctx){ const A = window.AudioContext || window.webkitAudioContext; if(!A) return; AU.ctx = new A(); AU.out = AU.ctx.createGain(); AU.out.gain.value = 2.4; AU.out.connect(AU.ctx.destination); }
    if(AU.ctx.state !== 'running') AU.ctx.resume();
    if(!AU.unlocked){ const b = AU.ctx.createBuffer(1, 1, 22050), src = AU.ctx.createBufferSource(); src.buffer = b; src.connect(AU.ctx.destination); src.start(0); AU.unlocked = true; }
    if(!navigator.audioSession && !AU.muted){
      if(!AU.el){ AU.el = new Audio(SILENCE); AU.el.loop = true; AU.el.setAttribute('playsinline',''); }
      const pr = AU.el.play(); if(pr && pr.catch) pr.catch(() => {});
    }
  }catch(e){}
}
function auRest(){ try{ if(AU.el) AU.el.pause(); }catch(e){} }
function tone(f, d, type, vol, slide, delay){
  if(AU.muted || !AU.ctx) return;
  try{
    const t = AU.ctx.currentTime + (delay||0), o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f+slide), t+d);
    g.gain.setValueAtTime(vol || .05, t); g.gain.exponentialRampToValueAtTime(.0001, t+d);
    o.connect(g); g.connect(AU.out); o.start(t); o.stop(t+d+.03);
  }catch(e){}
}
let noiseBuf = null;
function noise(d, vol, delay){
  if(AU.muted || !AU.ctx) return;
  try{
    if(!noiseBuf){ noiseBuf = AU.ctx.createBuffer(1, AU.ctx.sampleRate, AU.ctx.sampleRate); const ch = noiseBuf.getChannelData(0); for(let i=0;i<ch.length;i++) ch[i] = Math.random()*2-1; }
    const t = AU.ctx.currentTime + (delay||0), s = AU.ctx.createBufferSource(), g = AU.ctx.createGain();
    s.buffer = noiseBuf; g.gain.setValueAtTime(vol || .1, t); g.gain.exponentialRampToValueAtTime(.0001, t+d);
    s.connect(g); g.connect(AU.out); s.start(t); s.stop(t+d+.03);
  }catch(e){}
}
const seq = (notes, d, type, vol, gap) => notes.forEach((f,i) => tone(f, d, type, vol, 0, i*gap));
const SFX = {
  shoot: () => tone(1150, .13, 'square', .04, -850),
  pop: () => { noise(.08, .07); tone(420, .1, 'square', .05, -250); },
  boom: () => { noise(.4, .14); tone(110, .35, 'sawtooth', .07, -70); },
  march: i => tone([98,87,78,73][i%4], .09, 'square', .09),
  ufo: () => tone(640, .09, 'sine', .04, 320),
  brick: r => tone(330 + (9-Math.min(9,r))*45, .07, 'square', .05),
  wall: () => tone(190, .04, 'triangle', .08),
  paddle: () => tone(250, .06, 'triangle', .1),
  clank: () => tone(900, .05, 'square', .03),
  shrink: () => tone(520, .28, 'sawtooth', .05, -380),
  power: () => seq([523,659,784,1047], .09, 'square', .05, .07),
  life: () => seq([784,988,1175,1568], .1, 'triangle', .08, .08),
  eat: () => tone(660, .07, 'square', .05, 320),
  bonus: () => seq([880,1109,1319], .08, 'square', .05, .06),
  hop: () => tone(430, .07, 'square', .04, 260),
  splash: () => { noise(.35, .09); tone(300, .3, 'sine', .05, -220); },
  squash: () => { noise(.16, .12); tone(170, .22, 'sawtooth', .06, -110); },
  home: () => seq([523,659,784], .1, 'triangle', .09, .09),
  level: () => seq([523,659,784,1047,1319], .11, 'square', .05, .09),
  over: () => seq([392,330,262,196], .22, 'triangle', .1, .18),
  tick: () => tone(1400, .03, 'square', .03)
};

/* ---------------- drawing helpers ---------------- */
function spr(rows, pal){
  const cv = document.createElement('canvas'); cv.width = rows[0].length; cv.height = rows.length;
  const x = cv.getContext('2d');
  rows.forEach((r,j) => { for(let i=0;i<r.length;i++){ const col = pal[r[i]]; if(col){ x.fillStyle = col; x.fillRect(i,j,1,1); } } });
  return cv;
}
function rot(src, q){   // rotate a square sprite by quarter turns
  const cv = document.createElement('canvas'); cv.width = cv.height = src.width;
  const x = cv.getContext('2d'); x.translate(src.width/2, src.width/2); x.rotate(q*Math.PI/2); x.drawImage(src, -src.width/2, -src.width/2);
  return cv;
}
function Parts(){
  const a = [];
  return {
    burst(x, y, col, n, sp){ n = n||8; sp = sp||1.6; for(let i=0;i<n;i++) a.push({x, y, vx:(Math.random()-.5)*2*sp, vy:(Math.random()-.5)*2*sp-.3, l:12+rnd(14), col}); },
    step(){ for(let i=a.length-1;i>=0;i--){ const p = a[i]; p.x += p.vx; p.y += p.vy; p.vy += .06; if(--p.l<=0) a.splice(i,1); } },
    draw(c){ for(const p of a){ c.fillStyle = p.col; const z = p.l>8 ? 2 : 1; c.fillRect(p.x|0, p.y|0, z, z); } }
  };
}

/* ================= Snake ================= */
function snake(fx){
  const N = 12, C = 20, R = 25, OY = 10, DIR = {left:{x:-1,y:0}, right:{x:1,y:0}, up:{x:0,y:-1}, down:{x:0,y:1}};
  const APPLE = spr(['....gg....','...g......','..rrrrrr..','.rrwrrrrr.','.rwrrrrrr.','.rrrrrrrr.','.rrrrrrrr.','.drrrrrrd.','..drrrrd..','...dddd...'], {r:'#ff4d5a', d:'#c32e45', w:'#ffb3b8', g:'#6fd36b'});
  const BUG = spr(['..k....k..','...k..k...','..pppppp..','.pwkppwkp.','.pppppppp.','kppyppyppk','.pppppppp.','kppyppyppk','..pppppp..','.k......k.'], {p:'#b388ff', y:'#ffd166', k:'#2a1f4f', w:'#fff'});
  let s, d, q, food, bonus = null, t = 0, step, level = 1, eaten = 0, walls = new Set(), dead = 0, tick = 0;
  const g = {score:0, lives:null, over:false, pad:'dpad', info:'Level 1', hint:'Swipe or use the arrows to turn. Eat apples to grow, and grab the bonus bug before it leaves. Every 6 apples is a new level with a new maze.'};
  const P = Parts(), key = (x,y) => x+','+y;
  function maze(n){
    const m = new Set(), add = (x,y) => m.add(key(x,y)), k = (n-1)%5;
    if(k===1) for(let i=0;i<4;i++){ add(3+i,5); add(3,5+i); add(16-i,5); add(16,5+i); add(3+i,20); add(3,20-i); add(16-i,20); add(16,20-i); }
    if(k===2) for(let x=5;x<15;x++){ add(x,9); add(x,16); }
    if(k===3){ for(let y=7;y<19;y++) add(10,y); for(let x=4;x<16;x++) add(x,12); }
    if(k===4){ for(let x=4;x<16;x++) if(x<8 || x>11){ add(x,7); add(x,18); } for(let y=7;y<=18;y++) if(y<10 || y>15){ add(4,y); add(15,y); } }
    return m;
  }
  const free = () => { let p; do p = {x:rnd(C), y:rnd(R)}; while(walls.has(key(p.x,p.y)) || s.some(o => o.x===p.x && o.y===p.y) || (food && food.x===p.x && food.y===p.y)); return p; };
  function begin(){ s = [{x:5,y:2},{x:4,y:2},{x:3,y:2}]; d = DIR.right; q = []; walls = maze(level); step = Math.max(4, 10-level); food = null; food = free(); bonus = null; g.info = 'Level '+level; t = 0; }
  begin();
  g._dbg = n => { level = n; begin(); };
  g.update = inp => {
    tick++; P.step();
    if(dead){ if(--dead===0) g.over = true; return; }
    for(const k of inp.tap) if(DIR[k] && q.length<2) q.push(DIR[k]);
    if(bonus && --bonus.t<=0) bonus = null;
    if(++t < step) return; t = 0;
    while(q.length){ const n = q.shift(); if(n.x !== -d.x || n.y !== -d.y){ d = n; break; } }
    const h = {x:s[0].x+d.x, y:s[0].y+d.y};
    if(h.x<0 || h.y<0 || h.x>=C || h.y>=R || walls.has(key(h.x,h.y)) || s.slice(0,-1).some(p => p.x===h.x && p.y===h.y)){
      SFX.squash(); fx.shake(6); P.burst(s[0].x*N+6, s[0].y*N+OY+6, '#b6f09c', 16, 2); dead = 50; return;
    }
    s.unshift(h);
    if(h.x===food.x && h.y===food.y){
      g.score += 10; eaten++; SFX.eat(); P.burst(h.x*N+6, h.y*N+OY+6, '#ff4d5a', 8);
      if(eaten%6===0){ level++; g.score += 50; SFX.level(); fx.msg('Level '+level); begin(); return; }
      food = free();
      if(eaten%6===3){ const p = free(); bonus = {x:p.x, y:p.y, t:420, max:420}; }
    } else {
      if(bonus && h.x===bonus.x && h.y===bonus.y){ const pts = 20 + Math.ceil(bonus.t/bonus.max*8)*10; g.score += pts; SFX.bonus(); fx.msg('+'+pts); P.burst(h.x*N+6, h.y*N+OY+6, '#b388ff', 14, 2); bonus = null; }
      s.pop();
    }
  };
  g.draw = c => {
    c.fillStyle = '#0d2417'; c.fillRect(0,0,W,H);
    for(let y=0;y<R;y++) for(let x=0;x<C;x++){ c.fillStyle = (x+y)%2 ? '#12301f' : '#153824'; c.fillRect(x*N, y*N+OY, N, N); }
    c.fillStyle = '#6b4a2b'; c.fillRect(0,0,W,OY); c.fillRect(0,H-OY,W,OY);
    c.fillStyle = '#8a6238'; for(let x=0;x<W;x+=16){ c.fillRect(x+1,1,14,3); c.fillRect(x+9,5,14,3); c.fillRect(x+1,H-OY+1,14,3); c.fillRect(x+9,H-OY+5,14,3); }
    for(const k of walls){ const [x,y] = k.split(',').map(Number), X = x*N, Y = y*N+OY; c.fillStyle = '#7d8597'; c.fillRect(X,Y,N,N); c.fillStyle = '#a9b1c4'; c.fillRect(X,Y,N,2); c.fillRect(X,Y,2,N); c.fillStyle = '#4f566b'; c.fillRect(X,Y+N-2,N,2); c.fillRect(X+N-2,Y,2,N); }
    c.drawImage(APPLE, food.x*N+1, food.y*N+OY+1 + (tick%40<20?0:-1));
    if(bonus && (bonus.t>120 || tick%10<6)){ c.drawImage(BUG, bonus.x*N+1, bonus.y*N+OY+1); c.fillStyle = '#ffd166'; c.fillRect(bonus.x*N, bonus.y*N+OY-3, Math.ceil(N*bonus.t/bonus.max), 2); }
    const flash = dead && tick%8<4;
    for(let i=s.length-1;i>=0;i--){
      const p = s[i], X = p.x*N, Y = p.y*N+OY, nx = s[i-1];
      c.fillStyle = flash ? '#fff' : i===0 ? '#9be87f' : i%2 ? '#4fc16a' : '#3fae5c';
      c.fillRect(X+1, Y+1, N-2, N-2);
      if(nx){ c.fillRect(X+1+(nx.x-p.x)*5, Y+1+(nx.y-p.y)*5, N-2, N-2); }
      if(i && !flash){ c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(X+3, Y+3, 3, 3); }
    }
    if(!flash){
      const hx = s[0].x*N, hy = s[0].y*N+OY, ex = d.x ? (d.x>0?7:2) : 2, ey = d.y ? (d.y>0?7:2) : 2;
      c.fillStyle = '#fff'; c.fillRect(hx+ex, hy+ey, 3, 3); c.fillRect(hx+(d.x?ex:7), hy+(d.y?ey:7), 3, 3);
      c.fillStyle = '#10241b'; c.fillRect(hx+ex+(d.x>0?1:0), hy+ey+(d.y>0?1:0), 2, 2); c.fillRect(hx+(d.x?ex:7)+(d.x>0?1:0), hy+(d.y?ey:7)+(d.y>0?1:0), 2, 2);
      if(tick%30<8){ c.fillStyle = '#ff4d5a'; c.fillRect(hx+5+d.x*8, hy+5+d.y*8, d.x?3:2, d.y?3:2); }
    }
    P.draw(c);
  };
  return g;
}

/* ================= Brick Breaker ================= */
function bricks(fx){
  const BW = 16, BH = 8, COLS = 14, X0 = 8, FW = COLS*BW, Y0 = 34, PY = 296;
  const COL = {1:'#ff5a5f', 2:'#ff9f43', 3:'#ffd166', 4:'#59c36a', 5:'#4cc9f0', 6:'#b388ff', h:'#c9d1e8', x:'#5a6182'};
  const LAYOUTS = [
    ['11111111111111','22222222222222','33333333333333','44444444444444','55555555555555','66666666666666'],
    ['1.1.1.1.1.1.1.','.2.2.2.2.2.2.2','3.3.3.3.3.3.3.','.4.4.4.4.4.4.4','5.5.5.5.5.5.5.','.6.6.6.6.6.6.6','1.1.1.1.1.1.1.'],
    ['hhhhhhhhhhhhhh','11111111111111','22222222222222','33333333333333','44444444444444','55555555555555'],
    ['......66......','.....6666.....','....665566....','...66555566...','..6655445566..','...66555566...','....665566....','.....6666.....','......66......'],
    ['11111111111111','1............1','1.3333333333.1','1.3........3.1','1.3.555555.3.1','1.3........3.1','1.3333333333.1','1............1','11111111111111'],
    ['2222..22..2222','3333..33..3333','xx..........xx','4444..44..4444','5555..55..5555','hhhhhhhhhhhhhh'],
    ['x.hhhhhhhhhh.x','..1111111111..','..2222222222..','x.3333333333.x','..4444444444..','..5555555555..','x.6666666666.x'],
    ['..11......11..','.1111....1111.','11111111111111','11111111111111','.111111111111.','..1111111111..','...11111111...','....111111....','.....1111.....','......11......']
  ];
  const GLYPH = {
    W: spr(['w...w','w...w','w.w.w','ww.ww','w...w'], {w:'#fff'}), M: spr(['w...w','ww.ww','w.w.w','w...w','w...w'], {w:'#fff'}),
    S: spr(['.www.','w....','.ww..','...w.','www..'], {w:'#fff'}), L: spr(['..w..','..w..','wwwww','..w..','..w..'], {w:'#fff'})
  };
  const CAPCOL = {W:'#4cc9f0', M:'#ff7eb6', S:'#59c36a', L:'#ff5a5f'}, CAPNAME = {W:'Wide paddle', M:'Multi-ball', S:'Slow ball', L:'Extra life'};
  let px = W/2, balls = [], list = [], caps = [], stage = 1, kind = 'static', stuck = true, hits = 0, wide = 0, slow = 0, shrunk = false, scroll = 0, drop = 0, dropT = 0, bonusT = 0, tick = 0;
  const g = {score:0, lives:3, over:false, pad:'lrfire', fireLabel:'Launch', info:'Stage 1', hint:'Slide your finger or use the arrows to move the paddle. Tap Launch to start the ball. Catch the falling capsules for power-ups.'};
  const P = Parts();
  const pw = () => (shrunk ? 26 : 40) + (wide ? 18 : 0);
  const bx = b => { let x = b.c*BW + (kind==='scroll' ? scroll*(b.r%2 ? 1 : -1) : 0); x = ((x % FW) + FW) % FW; return X0 + x; };
  const by = b => Y0 + b.r*BH + drop;
  const speed = () => (2.2 + Math.min(stage,10)*0.1) * (hits>=12 ? 1.3 : hits>=4 ? 1.15 : 1) * (slow ? .7 : 1) * (kind==='bonus' ? 1.2 : 1);
  function serve(){ stuck = true; balls = [{x:px, y:PY-4, ux:0, uy:-1, tr:[]}]; }
  function load(){
    kind = ['static','scroll','advance','bonus'][(stage-1)%4];
    const L = kind==='bonus' ? LAYOUTS[Math.floor(stage/4)%2 ? 3 : 7] : LAYOUTS[[0,1,2,4,5,6][(stage - Math.floor(stage/4) - 1) % 6]];
    list = []; L.forEach((row,r) => { for(let c=0;c<row.length;c++){ const ch = row[c]; if(ch!=='.') list.push({c, r, t:ch, hp:ch==='h'?2:1, alive:true}); } });
    scroll = 0; drop = 0; dropT = 0; caps = []; shrunk = false; wide = 0; slow = 0; hits = 0; bonusT = kind==='bonus' ? 60*25 : 0;
    g.info = kind==='bonus' ? 'Bonus stage' : 'Stage '+stage; serve();
  }
  load();
  g._dbg = n => { if(n==='win') list.forEach(b => b.alive = false); else { stage = n; load(); } };
  function next(msg){ stage++; SFX.level(); fx.msg(msg); load(); }
  function hitBrick(b, ball){
    if(b.t==='x'){ SFX.clank(); return; }
    if(--b.hp>0){ SFX.clank(); return; }
    b.alive = false; hits++; g.score += 10 + Math.max(0, 9-b.r)*2; SFX.brick(b.r);
    P.burst(bx(b)+8, by(b)+4, COL[b.t], 7, 1.5);
    if(kind!=='bonus' && caps.length<2 && Math.random()<.14) caps.push({x:bx(b)+8, y:by(b)+4, k:pick(['W','W','W','M','M','S','S','L'])});
  }
  g.update = inp => {
    tick++; P.step();
    const w = pw();
    if(inp.px != null) px += clamp(inp.px-px, -9, 9); else px += (inp.held.right?4:0) - (inp.held.left?4:0);
    px = clamp(px, X0+w/2-2, W-X0-w/2+2);
    if(wide) wide--; if(slow) slow--;
    if(kind==='scroll') scroll += .35 + Math.min(stage,12)*.02;
    if(kind==='advance' && !stuck && ++dropT >= 540){ dropT = 0; drop += BH; SFX.tick(); for(const b of list) if(b.alive && by(b) > PY-52) b.alive = false; }
    if(kind==='bonus' && !stuck){ if(--bonusT<=0) return next('Time! Stage '+(stage+1)); if(bonusT<300 && bonusT%60===0) SFX.tick(); }
    for(let i=caps.length-1;i>=0;i--){
      const cp = caps[i]; cp.y += 1.1;
      if(cp.y>=PY-4 && cp.y<=PY+8 && Math.abs(cp.x-px) <= w/2+6){
        caps.splice(i,1); fx.msg(CAPNAME[cp.k]);
        if(cp.k==='L'){ if(g.lives<5) g.lives++; SFX.life(); } else SFX.power();
        if(cp.k==='W') wide = 60*15; if(cp.k==='S') slow = 60*10;
        if(cp.k==='M' && !stuck){ const add = []; for(const b of balls){ if(balls.length+add.length>=3) break; const a = Math.atan2(b.uy,b.ux); for(const o of [-.5,.5]){ if(balls.length+add.length>=3) break; add.push({x:b.x, y:b.y, ux:Math.cos(a+o), uy:Math.sin(a+o), tr:[]}); } } balls = balls.concat(add); }
      } else if(cp.y > H+8) caps.splice(i,1);
    }
    if(stuck){
      balls[0].x = px; balls[0].y = PY-4;
      if(inp.tap.includes('fire') || inp.tap.includes('up')){ const a = -Math.PI/2 + (Math.random()-.5)*.7; balls[0].ux = Math.cos(a); balls[0].uy = Math.sin(a); stuck = false; SFX.paddle(); }
      return;
    }
    const sp = speed();
    for(let bi=balls.length-1;bi>=0;bi--){
      const ball = balls[bi]; ball.tr.push({x:ball.x, y:ball.y}); if(ball.tr.length>5) ball.tr.shift();
      let lost = false;
      for(let i=0;i<3 && !lost;i++){
        const ox = ball.x; ball.x += ball.ux*sp/3; ball.y += ball.uy*sp/3;
        if(ball.x<X0+3){ ball.x = X0+3; ball.ux = Math.abs(ball.ux); SFX.wall(); } if(ball.x>W-X0-3){ ball.x = W-X0-3; ball.ux = -Math.abs(ball.ux); SFX.wall(); }
        if(ball.y<23){ ball.y = 23; ball.uy = Math.abs(ball.uy); SFX.wall(); if(!shrunk && kind!=='bonus'){ shrunk = true; SFX.shrink(); fx.msg('Paddle shrinks!'); } }
        if(ball.uy>0 && ball.y>=PY-3 && ball.y<=PY+5 && Math.abs(ball.x-px) <= w/2+3){
          const a = -Math.PI/2 + clamp((ball.x-px)/(w/2), -1, 1)*1.05; ball.ux = Math.cos(a); ball.uy = Math.sin(a); ball.y = PY-3; SFX.paddle();
        }
        if(ball.y > H+8){ lost = true; break; }
        for(const b of list){
          if(!b.alive) continue;
          const y = by(b); if(ball.y < y-3 || ball.y > y+BH+3) continue;
          const x = bx(b), xs = x+BW > X0+FW ? [x, x-FW] : [x];
          let hit = false;
          for(const X of xs){
            const lo = Math.max(X, X0), hi = Math.min(X+BW, X0+FW);
            if(ball.x >= lo-3 && ball.x <= hi+3){ hit = true; if(kind!=='bonus'){ if(ox < lo-3 || ox > hi+3) ball.ux = -ball.ux; else ball.uy = -ball.uy; } break; }
          }
          if(hit){ hitBrick(b, ball); break; }
        }
      }
      if(lost) balls.splice(bi,1);
    }
    if(!balls.length){
      if(kind==='bonus'){ serve(); return; }
      SFX.squash(); fx.shake(5); wide = 0; slow = 0; shrunk = false; hits = 0; caps = [];
      if(--g.lives<=0){ g.over = true; return; } serve(); return;
    }
    if(!list.some(b => b.alive && b.t!=='x')){
      if(kind==='bonus'){ g.score += 1500; return next('Perfect! +1500'); }
      g.score += 100; next('Stage '+(stage+1));
    }
  };
  g.draw = c => {
    c.fillStyle = '#12142b'; c.fillRect(0,0,W,H);
    c.fillStyle = '#171a36'; for(let y=20;y<H;y+=16) for(let x=X0+((y/16)%2?8:0);x<W-X0;x+=16) c.fillRect(x,y,8,8);
    c.fillStyle = '#3d4470'; c.fillRect(0,14,X0-2,H); c.fillRect(W-X0+2,14,X0-2,H); c.fillRect(0,14,W,6);
    c.fillStyle = '#6a73a8'; c.fillRect(1,14,2,H); c.fillRect(W-X0+3,14,2,H); c.fillRect(0,14,W,2);
    if(kind==='bonus'){ c.fillStyle = '#2a2f55'; c.fillRect(X0,24,FW,3); c.fillStyle = bonusT<300 ? '#ff5a5f' : '#ffd166'; c.fillRect(X0,24,FW*bonusT/(60*25),3); }
    c.save(); c.beginPath(); c.rect(X0,20,FW,H); c.clip();
    for(const b of list){
      if(!b.alive) continue;
      const y = by(b), x = bx(b), xs = x+BW > X0+FW ? [x, x-FW] : [x];
      for(const X of xs){
        c.fillStyle = b.t==='h' && b.hp<2 ? '#8e96b3' : COL[b.t]; c.fillRect(X, y, BW-1, BH-1);
        c.fillStyle = 'rgba(255,255,255,.38)'; c.fillRect(X, y, BW-1, 1); c.fillRect(X, y, 1, BH-1);
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X, y+BH-2, BW-1, 1); c.fillRect(X+BW-2, y, 1, BH-1);
        if(b.t==='x'){ c.fillStyle = '#9aa2c4'; c.fillRect(X+2,y+2,1,1); c.fillRect(X+BW-5,y+2,1,1); c.fillRect(X+2,y+BH-4,1,1); c.fillRect(X+BW-5,y+BH-4,1,1); }
        if(b.t==='h' && b.hp===2){ c.fillStyle = '#fff'; c.fillRect(X+3,y+2,4,1); }
      }
    }
    c.restore();
    for(const cp of caps){ c.fillStyle = CAPCOL[cp.k]; c.fillRect(cp.x-7, cp.y-3, 14, 8); c.fillRect(cp.x-8, cp.y-2, 16, 6); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(cp.x-6, cp.y-3, 12, 1); c.drawImage(GLYPH[cp.k], (cp.x-2)|0, (cp.y-1)|0); }
    const w = pw(), L = (px-w/2)|0;
    c.fillStyle = '#d8def5'; c.fillRect(L+3, PY, w-6, 7); c.fillStyle = '#fff'; c.fillRect(L+3, PY, w-6, 2); c.fillStyle = '#8f97bd'; c.fillRect(L+3, PY+5, w-6, 2);
    c.fillStyle = wide ? '#4cc9f0' : '#ff5a5f'; c.fillRect(L, PY+1, 4, 5); c.fillRect(L+w-4, PY+1, 4, 5); c.fillRect(L+1, PY, 3, 7); c.fillRect(L+w-4, PY, 3, 7);
    for(const ball of balls){
      ball.tr.forEach((p,i) => { c.fillStyle = `rgba(255,255,255,${.08+i*.05})`; c.fillRect((p.x-2)|0, (p.y-2)|0, 4, 4); });
      c.fillStyle = slow ? '#9be87f' : '#fff'; c.fillRect((ball.x-3)|0, (ball.y-2)|0, 6, 4); c.fillRect((ball.x-2)|0, (ball.y-3)|0, 4, 6);
    }
    P.draw(c);
  };
  return g;
}

/* ================= Space Blasters ================= */
function blasters(fx){
  const A1 = ['...######...','.##########.','####....####','###..ww..###','####....####','.##########.','..#.#..#.#..','.#..#..#..#.'], A2 = A1.slice(0,6).concat(['.#.#....#.#.','..#..##..#..']);
  const B1 = ['#..........#','##..####..##','###.#ww#.###','############','.##########.','...######...','....#..#....','...#....#...'], B2 = ['............','....####....','.##.#ww#.##.','############','############','#..######..#','....#..#....','.....##.....'];
  const C1 = ['.....##.....','..########..','..#ww##ww#..','..########..','.##########.','.#.######.#.','..##....##..','.###....###.'], C2 = C1.slice(0,6).concat(['...##..##...','..###..###..']);
  const mk = (rows, col) => spr(rows, {'#':col, w:'#0a0c1e'});
  const AL = [[mk(A1,'#ff7eb6'), mk(A2,'#ff7eb6')], [mk(B1,'#ffd166'), mk(B2,'#ffd166')], [mk(C1,'#7bd389'), mk(C2,'#7bd389')]];
  const TYPE = [0,1,1,2,2], PTS = [30,20,20,10,10];
  const SHIP = spr(['......c......','.....www.....','.....www.....','..w.wwwww.w..','..wwwwwwwww..','.wwwwwwwwwww.','wwww.bbb.wwww','ww...b.b...ww'], {w:'#e8ecff', c:'#4cc9f0', b:'#4cc9f0'});
  const UFO = spr(['....rrrrrrrr....','..rrrrrrrrrrrr..','.rr.rr.rr.rr.rr.','rrrrrrrrrrrrrrrr','..rrr..rr..rrr..','...r........r...'], {r:'#ff5a5f'});
  const BUNK = ['..#######..','.#########.','###########','###########','###########','###.....###','##.......##','##.......##'];
  const stars = Array.from({length:46}, () => ({x:rnd(W), y:rnd(H-20), p:rnd(90)}));
  let al, ox, oy, dir, stepT = 0, note = 0, frame = 0, wave = 1, px = W/2, shots = [], bombs = [], bunk = [], booms = [], ufo = null, ufoT = 0, hurt = 0, rapid = 0, cap = null, cool = 0, bombT = 0, extra = false, tick = 0;
  const g = {score:0, lives:3, over:false, pad:'lrfire', fireLabel:'Fire', info:'Wave 1', hint:'Move with the arrows or slide your finger, and tap Fire to shoot. Hide behind the shields. Hit the red saucer for bonus points and a power-up.'};
  const P = Parts(), PY = 288;
  function spawn(){
    al = []; for(let r=0;r<5;r++) for(let c=0;c<11;c++) al.push({c, r, alive:true});
    ox = 32; oy = 34 + Math.min(wave-1, 5)*8; dir = 1; stepT = 0; shots = []; bombs = []; ufo = null; ufoT = 60*(14+rnd(8)); cap = null;
    bunk = [36,92,148,204].map(cx => ({x:cx-11, y:250, cells:BUNK.map(r => [...r].map(ch => ch==='#'))}));
    g.info = 'Wave '+wave;
  }
  spawn();
  g._dbg = k => { if(k==='ufo') ufoT = 1; if(k==='clear') al.forEach((a,i) => { if(i) a.alive = false; }); if(k==='all') al.forEach(a => a.alive = false); if(k==='cap') cap = {x:px, y:200}; };
  const ax = a => ox + a.c*16, ay = a => oy + a.r*14;
  function erode(x, y, rad){
    for(const b of bunk){
      if(x<b.x || x>=b.x+22 || y<b.y || y>=b.y+16) continue;
      const cx = (x-b.x)>>1, cy = (y-b.y)>>1; if(!b.cells[cy][cx]) return false;
      for(let j=-rad;j<=rad;j++) for(let i=-rad;i<=rad;i++){ const X = cx+i, Y = cy+j; if(X>=0 && X<11 && Y>=0 && Y<8 && (!i && !j || Math.random()<.7)) b.cells[Y][X] = false; }
      return true;
    }
    return false;
  }
  g.update = inp => {
    tick++; P.step(); booms = booms.filter(b => --b.t>0);
    if(hurt){ if(--hurt===0 && g.lives<=0) g.over = true; return; }
    if(inp.px != null) px += clamp(inp.px-px, -3.5, 3.5); else px += (inp.held.right?2.2:0) - (inp.held.left?2.2:0);
    px = clamp(px, 12, W-12);
    if(cool) cool--; if(rapid) rapid--;
    if((inp.held.fire || inp.tap.includes('fire')) && !cool && shots.length < (rapid ? 3 : 1)){ shots.push({x:px, y:PY-2}); cool = rapid ? 9 : 16; SFX.shoot(); }
    const live = al.filter(a => a.alive), n = live.length;
    if(!n){ wave++; g.score += 100; SFX.level(); fx.msg('Wave '+wave); spawn(); return; }
    /* march */
    if(++stepT >= clamp(Math.round(n*.5) - (wave-1), 2, 30)){
      stepT = 0; frame ^= 1; SFX.march(note++);
      let lo = 99, hi = -1; for(const a of live){ if(a.c<lo) lo = a.c; if(a.c>hi) hi = a.c; }
      if((dir>0 && ox+hi*16+12+2 > W-4) || (dir<0 && ox+lo*16-2 < 4)){ dir = -dir; oy += 8; } else ox += 2*dir;
      for(const a of live){ const X = ax(a), Y = ay(a); if(Y+8 >= 250) for(const b of bunk) for(let j=0;j<8;j++) for(let i=0;i<11;i++){ const cx = b.x+i*2, cy = b.y+j*2; if(cx+2>X && cx<X+12 && cy+2>Y && cy<Y+8) b.cells[j][i] = false; } }
      if(live.some(a => ay(a)+8 >= PY)){ SFX.boom(); g.lives = 0; hurt = 60; P.burst(px, PY+4, '#e8ecff', 24, 2.4); return; }
    }
    /* saucer */
    if(ufo){ ufo.x += ufo.dx; if(tick%10===0) SFX.ufo(); if(ufo.x < -20 || ufo.x > W+4) ufo = null; }
    else if(--ufoT<=0){ ufoT = 60*(16+rnd(10)); if(n>7){ const d = Math.random()<.5 ? 1 : -1; ufo = {x:d>0?-16:W, dx:d*.8}; } }
    /* shots */
    for(const s of shots){
      for(let k=0;k<3 && s.y>-10;k++){
        s.y -= 2;
        if(erode(s.x|0, s.y|0, 1)){ s.y = -99; break; }
        if(ufo && s.y<32 && s.y>22 && s.x>ufo.x && s.x<ufo.x+16){
          const pts = pick([50,100,100,150,300]); g.score += pts; fx.msg('+'+pts); SFX.boom(); P.burst(ufo.x+8, 27, '#ff5a5f', 18, 2);
          if(!cap) cap = {x:ufo.x+8, y:30}; ufo = null; s.y = -99; break;
        }
        for(const a of live){
          const X = ax(a), Y = ay(a);
          if(a.alive && s.x>=X-1 && s.x<=X+12 && s.y>=Y && s.y<=Y+8){ a.alive = false; s.y = -99; g.score += PTS[a.r]; SFX.pop(); booms.push({x:X, y:Y, t:10}); P.burst(X+6, Y+4, ['#ff7eb6','#ffd166','#7bd389'][TYPE[a.r]], 8, 1.4); break; }
        }
      }
    }
    shots = shots.filter(s => s.y > -6);
    /* bombs */
    if(++bombT >= Math.max(24, 66-wave*6) && bombs.length<3){
      bombT = 0; const cur = live.filter(a => a.alive);
      if(cur.length){ const col = pick(cur).c, low = cur.filter(a => a.c===col).sort((a,b) => b.r-a.r)[0]; bombs.push({x:ax(low)+6, y:ay(low)+8, z:rnd(2)}); }
    }
    const bs = Math.min(3, 1.4 + wave*.12);
    for(const b of bombs){
      b.y += bs;
      if(erode(b.x|0, (b.y+4)|0, 1)){ b.y = 999; continue; }
      if(Math.abs(b.x-px)<7 && b.y+5>PY && b.y<PY+8){ bombs = []; shots = []; hurt = 70; g.lives--; rapid = 0; SFX.boom(); fx.shake(8); P.burst(px, PY+4, '#e8ecff', 24, 2.4); break; }
    }
    bombs = bombs.filter(b => b.y < 304);
    if(cap){ cap.y += 1.3; if(cap.y>PY-2 && cap.y<PY+10 && Math.abs(cap.x-px)<12){ cap = null; rapid = 60*12; SFX.power(); fx.msg('Rapid fire'); } else if(cap.y>306) cap = null; }
    if(!extra && g.score>=1500){ extra = true; g.lives++; SFX.life(); fx.msg('Extra ship'); }
  };
  g.draw = c => {
    c.fillStyle = '#070919'; c.fillRect(0,0,W,H);
    for(const s of stars){ c.fillStyle = (tick+s.p)%90<8 ? '#aab3ff' : '#353c6e'; c.fillRect(s.x, s.y, 1, 1); }
    c.fillStyle = '#59c36a'; c.fillRect(0,304,W,1);
    c.fillStyle = '#59c36a'; for(const b of bunk) for(let j=0;j<8;j++) for(let i=0;i<11;i++) if(b.cells[j][i]) c.fillRect(b.x+i*2, b.y+j*2, 2, 2);
    for(const a of al) if(a.alive) c.drawImage(AL[TYPE[a.r]][frame], ax(a), ay(a));
    c.fillStyle = '#fff'; for(const b of booms){ const X = b.x+6, Y = b.y+4, r = 10-b.t; c.fillRect(X-r,Y,2,1); c.fillRect(X+r,Y,2,1); c.fillRect(X,Y-r*.7,1,2); c.fillRect(X,Y+r*.7,1,2); c.fillRect(X-r*.7,Y-r*.5,1,1); c.fillRect(X+r*.7,Y+r*.5,1,1); c.fillRect(X+r*.7,Y-r*.5,1,1); c.fillRect(X-r*.7,Y+r*.5,1,1); }
    if(ufo) c.drawImage(UFO, ufo.x|0, 24);
    if(cap){ c.fillStyle = '#ffd166'; c.fillRect(cap.x-5, cap.y-3, 10, 7); c.fillRect(cap.x-6, cap.y-2, 12, 5); c.fillStyle = '#231c4f'; c.fillRect(cap.x-3, cap.y-1, 1, 3); c.fillRect(cap.x-1, cap.y-1, 1, 3); c.fillRect(cap.x+1, cap.y-1, 1, 3); c.fillRect(cap.x+3, cap.y, 1, 1); }
    if(!hurt){ c.drawImage(SHIP, (px-6)|0, PY); if(rapid && (rapid>120 || tick%10<6)){ c.fillStyle = '#ffd166'; c.fillRect((px-8)|0, PY+9, 16*Math.min(1,rapid/720), 1); } }
    c.fillStyle = '#fff'; for(const s of shots) c.fillRect(s.x|0, s.y, 1, 6);
    for(const b of bombs){ c.fillStyle = '#ffd166'; const k = ((tick>>2)+b.z)%2; c.fillRect(b.x-1+(k?0:1), b.y, 1, 2); c.fillRect(b.x-1+(k?1:0), b.y+2, 1, 2); c.fillRect(b.x-1+(k?0:1), b.y+4, 1, 2); }
    P.draw(c);
  };
  return g;
}

/* ================= Road Hopper ================= */
function hopper(fx){
  const T = 20, START = 13, HOME = 1, BAYS = [24,72,120,168,216];
  const CHK = spr(['......oo......','.....oooo.....','....yyyyyy....','...yyyyyyyy...','..yykyyyykyy..','..yyyyyyyyyy..','.wyyyyyyyyyyw.','.wyyyyyyyyyyw.','.wwyyyyyyyyww.','..yyyyyyyyyy..','..yyyyyyyyyy..','...yyyyyyyy...','...oo....oo...','..oo......oo..'], {y:'#ffd84d', w:'#f0b12e', o:'#ff8c2e', k:'#2a2d3a'});
  const CH = {up:CHK, right:rot(CHK,1), down:rot(CHK,2), left:rot(CHK,3)};
  const FLY = spr(['.w....w.','ww.kk.ww','.wkkkkw.','..kkkk..','...kk...'], {w:'#dff3ff', k:'#2a2d3a'});
  const ROAD = [
    {row:12, dir:-1, sp:.5, w:18, n:3, kind:'car', col:'#ffd166'},
    {row:11, dir:1, sp:.42, w:20, n:3, kind:'dozer', col:'#ff9f43'},
    {row:10, dir:-1, sp:.72, w:18, n:3, kind:'car', col:'#b388ff'},
    {row:9, dir:1, sp:1.55, w:20, n:1, kind:'racer', col:'#ff5a5f'},
    {row:8, dir:-1, sp:.6, w:38, n:2, kind:'truck', col:'#4cc9f0'}
  ];
  const RIVER = [
    {row:6, dir:-1, sp:.6, w:54, n:3, kind:'turtle', k:3},
    {row:5, dir:1, sp:.4, w:50, n:3, kind:'log'},
    {row:4, dir:1, sp:.9, w:104, n:2, kind:'log'},
    {row:3, dir:-1, sp:.7, w:36, n:4, kind:'turtle', k:2},
    {row:2, dir:1, sp:.55, w:70, n:3, kind:'log'}
  ];
  let lanes = {}, p, level = 1, far, dead = 0, deadKind = '', time = 0, filled = [0,0,0,0,0], fly = null, snap = null, tick = 0, anim = 0, from = null, face = 'up';
  const g = {score:0, lives:3, over:false, pad:'dpad', info:'Level 1', hint:'Tap the arrows or swipe to hop. Dodge the traffic, ride the logs and turtles, and fill all five nests at the top before the timer runs out. Watch for turtles that dive.'};
  const P = Parts(), TMAX = 60*30;
  function build(){
    lanes = {}; const k = 1 + (level-1)*.14;
    for(const L of ROAD.concat(RIVER)){
      const n = L.n + (L.kind==='racer' && level>2 ? 1 : 0), len = Math.max(n*(L.w+ (L.kind==='log'||L.kind==='turtle' ? 34 : 56)), W+L.w+12);
      lanes[L.row] = Object.assign({}, L, {n, len, off:rnd(len), v:L.sp*k*L.dir, gap:len/n});
    }
  }
  const itemX = (L, i) => ((((L.off + i*L.gap) % L.len) + L.len) % L.len) - L.w;
  const diving = (L, i) => L.kind==='turtle' && i===0 ? ((tick + L.row*40) % 280) : 0;   // 0..120 up, 120..160 sinking, 160..230 under, 230..280 rising
  const under = (L, i) => { const d = diving(L,i); return d>=160 && d<230; };
  function home(){ p = {x:110, y:START*T}; far = START; time = TMAX; face = 'up'; anim = 0; from = null; }
  build(); home();
  g._dbg = k => { if(k==='fill') filled = [1,1,1,1,0]; if(k==='pos'){ p.x = BAYS[4]-10; p.y = 2*T; } if(k==='snap') snap = {i:0, t:230}; if(k==='fly') fly = {i:4, t:260}; if(typeof k==='number'){ level = k; g.info = 'Level '+k; build(); } };
  function die(kind){ g.lives--; dead = 50; deadKind = kind; kind==='water' ? SFX.splash() : SFX.squash(); if(kind!=='water') fx.shake(5); P.burst(p.x+10, p.y+10, kind==='water' ? '#9fd3ff' : '#ffd84d', 16, 2); }
  g.update = inp => {
    tick++; P.step();
    for(const r in lanes){ const L = lanes[r]; L.off += L.v; }
    if(fly && --fly.t<=0) fly = null; if(snap && --snap.t<=0) snap = null;
    if(dead){ if(--dead===0){ if(g.lives<=0) g.over = true; else home(); } return; }
    if(anim) anim--;
    const empty = filled.map((f,i) => f ? -1 : i).filter(i => i>=0);
    if(!fly && tick%420===0 && empty.length){ const i = pick(empty); if(!snap || snap.i!==i) fly = {i, t:260}; }
    if(level>=2 && !snap && tick%560===280 && empty.length){ const i = pick(empty); if(!fly || fly.i!==i) snap = {i, t:230}; }
    if(--time<=0) return die('time');
    if(time<300 && time%60===0) SFX.tick();
    const k = inp.tap.find(t => t==='up'||t==='down'||t==='left'||t==='right');
    if(k){
      from = {x:p.x, y:p.y}; anim = 5; face = k; SFX.hop();
      if(k==='up') p.y -= T; if(k==='down') p.y = Math.min(START*T, p.y+T);
      if(k==='left') p.x -= T; if(k==='right') p.x += T;
      const row = p.y/T;
      if(row>=7) p.x = Math.round((p.x-10)/T)*T+10;
      p.x = clamp(p.x, row>=7 ? 10 : -4, row>=7 ? W-T-10 : W-T+4);
      if(row < far){ g.score += 10; far = row; }
      if(row===HOME){
        const cx = p.x+10, i = BAYS.findIndex(b => Math.abs(b-cx)<=11);
        if(i<0 || filled[i] || (snap && snap.i===i && snap.t<180)){ p.y += T; return die('road'); }
        filled[i] = 1; let pts = 50 + Math.floor(time/30)*10; if(fly && fly.i===i){ pts += 200; fly = null; }
        g.score += pts; fx.msg('+'+pts); SFX.home(); P.burst(BAYS[i], 30, '#ffd84d', 14, 1.8);
        if(filled.every(Boolean)){ g.score += 1000; level++; filled = [0,0,0,0,0]; fly = null; snap = null; SFX.level(); fx.msg('Level '+level); g.info = 'Level '+level; build(); }
        home(); return;
      }
    }
    const row = p.y/T, L = lanes[row];
    if(L && row>=8){ for(let i=0;i<L.n;i++){ const x = itemX(L,i); if(p.x+4 < x+L.w && p.x+T-4 > x) return die('road'); } }
    else if(L){
      const mid = p.x+T/2; let on = false;
      for(let i=0;i<L.n;i++){ const x = itemX(L,i); if(mid>x+1 && mid<x+L.w-1 && !under(L,i)){ on = true; break; } }
      if(!on) return die('water');
      p.x += L.v; if(p.x < -8 || p.x > W-T+8) return die('water');
    }
  };
  function vehicle(c, L, x, y){
    const d = L.dir, w = L.w, f = d>0 ? x+w-3 : x;
    c.fillStyle = '#15161f'; c.fillRect(x+3, y+3, 4, 2); c.fillRect(x+w-7, y+3, 4, 2); c.fillRect(x+3, y+15, 4, 2); c.fillRect(x+w-7, y+15, 4, 2);
    if(L.kind==='truck'){
      const cab = d>0 ? x+w-11 : x, tr = d>0 ? x : x+12;
      c.fillStyle = '#e8ecff'; c.fillRect(tr, y+4, w-12, 12); c.fillStyle = '#b8c0dd'; c.fillRect(tr, y+13, w-12, 3); c.fillRect(tr+8, y+4, 1, 12); c.fillRect(tr+17, y+4, 1, 12);
      c.fillStyle = L.col; c.fillRect(cab, y+5, 11, 10); c.fillStyle = '#12233a'; c.fillRect(d>0 ? cab+6 : cab+2, y+6, 3, 8);
    } else if(L.kind==='dozer'){
      c.fillStyle = '#3a3d4d'; c.fillRect(x+2, y+3, w-4, 3); c.fillRect(x+2, y+14, w-4, 3);
      c.fillStyle = L.col; c.fillRect(x+3, y+6, w-6, 8); c.fillStyle = '#c9781f'; c.fillRect(d>0 ? x+4 : x+w-10, y+7, 6, 6);
      c.fillStyle = '#d7dcef'; c.fillRect(d>0 ? x+w-3 : x, y+3, 3, 14);
    } else if(L.kind==='racer'){
      c.fillStyle = L.col; c.fillRect(x+1, y+7, w-2, 6); c.fillRect(x+5, y+5, w-10, 10);
      c.fillStyle = '#fff'; c.fillRect(x+2, y+9, w-4, 2); c.fillStyle = '#12233a'; c.fillRect(d>0 ? x+w-9 : x+5, y+7, 4, 6);
      c.fillStyle = '#7d1f2b'; c.fillRect(d>0 ? x : x+w-2, y+4, 2, 12);
    } else {
      c.fillStyle = L.col; c.fillRect(x, y+5, w, 10); c.fillRect(x+1, y+4, w-2, 12);
      c.fillStyle = '#12233a'; c.fillRect(x+5, y+6, w-10, 8); c.fillStyle = L.col; c.fillRect(x+8, y+6, w-15, 8);
      c.fillStyle = '#fff7c2'; c.fillRect(f, y+5, 3, 2); c.fillRect(f, y+13, 3, 2);
    }
  }
  g.draw = c => {
    c.fillStyle = '#16321f'; c.fillRect(0,0,W,H);
    /* river */
    c.fillStyle = '#17437f'; c.fillRect(0, T, W, 6*T);
    c.fillStyle = '#2459a3'; for(let r=1;r<7;r++) for(let x=((tick>>3)+r*13)%32-32;x<W;x+=32){ c.fillRect(x, r*T+6, 8, 1); c.fillRect(x+16, r*T+14, 6, 1); }
    /* hedge and nests */
    c.fillStyle = '#2d6a3e'; c.fillRect(0,0,W,T); c.fillStyle = '#3c8a52'; for(let x=2;x<W;x+=12) c.fillRect(x, 3+(x%24?0:4), 8, 8);
    for(let x=0;x<W;x++){ if(!BAYS.some(b => Math.abs(b-x)<13)){ c.fillStyle = '#2d6a3e'; c.fillRect(x, T, 1, T); } }
    c.fillStyle = '#3c8a52'; for(let x=0;x<W;x+=6) if(!BAYS.some(b => Math.abs(b-x-2)<15)) c.fillRect(x, T+4+(x%12?0:6), 4, 4);
    BAYS.forEach((b,i) => {
      if(filled[i]) c.drawImage(CH.down, b-7, T+3);
      else if(snap && snap.i===i){ const open = snap.t<180; c.fillStyle = '#3f7d3a'; c.fillRect(b-9, T+6, 18, 10); c.fillStyle = '#2c5c29'; c.fillRect(b-9, T+(open?9:11), 18, open?4:1); if(open){ c.fillStyle = '#fff'; for(let x=-8;x<8;x+=4) c.fillRect(b+x, T+9, 2, 2); } c.fillStyle = '#ffd166'; c.fillRect(b-6, T+6, 2, 2); c.fillRect(b+4, T+6, 2, 2); }
      else if(fly && fly.i===i && (fly.t>60 || tick%8<5)) c.drawImage(FLY, b-4, T+7+(tick%20<10?0:1));
    });
    /* median, start, status strip */
    c.fillStyle = '#5b4a7a'; c.fillRect(0, 7*T, W, T); c.fillRect(0, START*T, W, T);
    c.fillStyle = '#6f5c93'; for(let x=0;x<W;x+=20){ c.fillRect(x+1, 7*T+1, 18, 8); c.fillRect(x+11, 7*T+11, 18, 8); c.fillRect(x+1, START*T+1, 18, 8); c.fillRect(x+11, START*T+11, 18, 8); }
    c.fillStyle = '#23252f'; c.fillRect(0, 8*T, W, 5*T);
    c.fillStyle = '#4a4e63'; for(let r=9;r<=12;r++) for(let x=4;x<W;x+=24) c.fillRect(x, r*T-1, 12, 2);
    c.fillStyle = '#10121c'; c.fillRect(0, 14*T, W, 2*T);
    c.fillStyle = '#2a2f55'; c.fillRect(20, 14*T+15, 200, 8); c.fillStyle = time<300 ? '#ff5a5f' : time<900 ? '#ffd166' : '#59c36a'; c.fillRect(20, 14*T+15, 200*time/TMAX, 8);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(20, 14*T+15, 200*time/TMAX, 2);
    /* lanes */
    for(const r in lanes){
      const L = lanes[r], y = r*T;
      for(let i=0;i<L.n;i++){
        const x = Math.round(itemX(L,i));
        if(L.kind==='log'){
          c.fillStyle = '#7a4a22'; c.fillRect(x, y+3, L.w, 14); c.fillStyle = '#9a6634'; c.fillRect(x, y+3, L.w, 3); c.fillStyle = '#5c3615'; c.fillRect(x, y+14, L.w, 3);
          c.fillStyle = '#5c3615'; for(let k=10;k<L.w-8;k+=17){ c.fillRect(x+k, y+8, 6, 1); c.fillRect(x+k+8, y+11, 4, 1); }
          c.fillStyle = '#c99a5b'; c.fillRect(x, y+5, 3, 10); c.fillRect(x+L.w-3, y+5, 3, 10); c.fillStyle = '#7a4a22'; c.fillRect(x+1, y+8, 1, 4); c.fillRect(x+L.w-2, y+8, 1, 4);
        } else if(L.kind==='turtle'){
          const d = diving(L,i), sink = d>=120 && d<160 || d>=230, gone = d>=160 && d<230;
          for(let k=0;k<L.k;k++){
            const X = x+k*18+2, Y = y+3;
            if(gone){ c.fillStyle = '#2f6bb8'; c.fillRect(X+3, Y+6, 8, 1); c.fillRect(X+5, Y+9, 4, 1); continue; }
            c.fillStyle = sink ? '#2f7a5b' : '#59c36a'; c.fillRect(X + (L.dir<0 ? -2 : 13), Y+5, 3, 4); c.fillRect(X+1, Y, 3, 2); c.fillRect(X+10, Y, 3, 2); c.fillRect(X+1, Y+12, 3, 2); c.fillRect(X+10, Y+12, 3, 2);
            c.fillStyle = sink ? '#1f5a45' : '#2e8b57'; c.fillRect(X+1, Y+2, 12, 10); c.fillRect(X, Y+4, 14, 6); c.fillRect(X+3, Y+1, 8, 12);
            if(!sink){ c.fillStyle = '#7bd389'; c.fillRect(X+3, Y+4, 3, 2); c.fillRect(X+8, Y+4, 3, 2); c.fillRect(X+5, Y+7, 4, 2); c.fillRect(X+3, Y+10, 3, 1); c.fillRect(X+8, Y+10, 3, 1); }
          }
        } else vehicle(c, L, x, y);
      }
    }
    /* player */
    if(dead){
      const X = p.x+10, Y = p.y+10, r = (50-dead)/3;
      if(deadKind==='water'){ c.fillStyle = '#cfe9ff'; c.fillRect(X-r, Y, 3, 1); c.fillRect(X+r-2, Y, 3, 1); c.fillRect(X-1, Y-r*.6, 2, 1); c.fillRect(X-1, Y+r*.6, 2, 1); }
      else if(dead>10){ c.fillStyle = '#ffd84d'; c.fillRect(X-8, Y-2, 16, 5); c.fillStyle = '#ff8c2e'; c.fillRect(X-2, Y-1, 4, 2); c.fillStyle = '#2a2d3a'; c.fillRect(X-5, Y-1, 2, 2); c.fillRect(X+3, Y-1, 2, 2); }
    } else {
      let X = p.x, Y = p.y; if(anim && from){ const k = anim/5; X = p.x + (from.x-p.x)*k; Y = p.y + (from.y-p.y)*k - Math.sin(k*Math.PI)*3; }
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect((p.x+5)|0, p.y+15, 10, 3);
      c.drawImage(CH[face], (X+3)|0, (Y+3)|0);
    }
    P.draw(c);
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
.g-bar{display:flex;align-items:center;gap:8px;padding:8px 10px}
.g-bar .g-x,.g-bar .g-pause,.g-bar .g-mute{background:#22264a;border-radius:10px;min-height:40px;min-width:42px;padding:0 9px;font-weight:600;flex:none}
.g-bar .g-mute.off{color:#8088b8}
.g-name{font-weight:600;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.g-stat{margin-left:auto;display:flex;gap:8px;flex:none;align-items:center;font-variant-numeric:tabular-nums;white-space:nowrap}
.g-score{font-weight:700;font-size:20px}
.g-lives{color:#ff7eb6;letter-spacing:1px}
.g-time{background:#ffc93c;color:#231c4f;border-radius:999px;padding:2px 10px;font-weight:700}
.g-time.out{background:#ff5a5f;color:#fff}
.g-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;position:relative}
.g-wrap{position:relative;line-height:0}
.g-stage canvas{image-rendering:pixelated;image-rendering:crisp-edges;border-radius:8px;box-shadow:0 0 0 2px #22264a;background:#000}
.g-info{position:absolute;left:8px;top:6px;font-size:13px;line-height:1.2;font-weight:600;color:#fff;background:rgba(11,13,28,.6);border-radius:6px;padding:2px 7px;pointer-events:none}
.g-msg{position:absolute;left:0;right:0;top:38%;text-align:center;font-size:26px;line-height:1.2;font-weight:700;color:#ffc93c;text-shadow:0 2px 0 #231c4f,0 0 12px rgba(0,0,0,.8);pointer-events:none;opacity:0;transition:opacity .25s}
.g-msg.on{opacity:1}
.g-panel{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(11,13,28,.78);padding:20px}
.g-panel.on{display:flex}
.g-card{background:#fff;color:#231c4f;border-radius:22px;padding:22px 20px;max-width:340px;width:100%;text-align:center;line-height:1.3}
.g-card h2{margin:0 0 6px;font-size:26px;font-weight:700}
.g-card p{margin:0 0 14px;color:#6a6391;font-size:16px}
.g-card .big{font-size:54px;font-weight:700;line-height:1;margin:4px 0 6px}
.g-card button{display:block;width:100%;min-height:48px;border-radius:999px;font-weight:600;font-size:17px;margin-top:8px;background:#231c4f;color:#fff}
.g-card button.gold{background:#ffc93c;color:#231c4f}
.g-pad{display:flex;justify-content:space-between;align-items:center;padding:10px 18px 14px;gap:16px}
.g-dpad{display:grid;grid-template-columns:repeat(3,58px);grid-template-rows:repeat(2,54px);gap:6px}
.g-dpad button,.g-fire{background:#22264a;border-radius:14px;font-size:24px;font-weight:700}
.g-dpad button.dn{background:#3a4080}
.g-dpad .u{grid-column:2;grid-row:1}.g-dpad .l{grid-column:1;grid-row:2}.g-dpad .d{grid-column:2;grid-row:2}.g-dpad .r{grid-column:3;grid-row:2}
.g-dpad.lr{grid-template-rows:64px;grid-template-columns:repeat(2,76px)}
.g-dpad.lr .l{grid-column:1;grid-row:1}.g-dpad.lr .r{grid-column:2;grid-row:1}
.g-fire{min-width:120px;height:64px;font-size:19px;background:#ffc93c!important;color:#231c4f!important}
.g-fire.dn{filter:brightness(.88)}
@media (prefers-reduced-motion:reduce){.g-msg{transition:none}}

/* ---- sizing for every screen: controls and text grow with the device ---- */
#ep-game{--b:clamp(54px,8.2vmin,88px);--gap:clamp(6px,1vmin,10px);display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:"bar" "stage" "pad"}
.g-bar{grid-area:bar}
.g-stage{grid-area:stage;min-width:0;overflow:hidden}
.g-bar{min-width:0}
.g-pad{grid-area:pad;padding:clamp(8px,1.6vmin,18px) clamp(14px,3vmin,32px) clamp(12px,2vmin,24px)}
.g-dpad{grid-template-columns:repeat(3,var(--b));grid-template-rows:repeat(2,calc(var(--b)*.93));gap:var(--gap)}
.g-dpad button,.g-fire{font-size:calc(var(--b)*.4);border-radius:calc(var(--b)*.24)}
.g-dpad.lr{grid-template-rows:calc(var(--b)*1.1);grid-template-columns:repeat(2,calc(var(--b)*1.3))}
.g-fire{min-width:calc(var(--b)*2.1);height:calc(var(--b)*1.1);font-size:calc(var(--b)*.33)}
.g-bar .g-x,.g-bar .g-pause,.g-bar .g-mute{min-height:clamp(40px,5.4vmin,52px);min-width:clamp(42px,5.6vmin,56px);font-size:clamp(15px,2.2vmin,20px)}
.g-name{font-size:clamp(16px,2.5vmin,23px)}
.g-score{font-size:clamp(19px,2.9vmin,28px)}
.g-time,.g-lives{font-size:clamp(15px,2.2vmin,20px)}
.g-info{font-size:clamp(12px,1.8vmin,17px)}
.g-msg{font-size:clamp(24px,4.4vmin,44px)}
.g-card{max-width:min(440px,92%);padding:clamp(20px,3.4vmin,34px) clamp(18px,3vmin,30px)}
.g-card h2{font-size:clamp(24px,3.8vmin,36px)}
.g-card p{font-size:clamp(15px,2.3vmin,20px)}
.g-card .big{font-size:clamp(50px,8vmin,80px)}
.g-card button{min-height:clamp(48px,6.4vmin,62px);font-size:clamp(16px,2.4vmin,21px)}

/* ---- sideways screens: d-pad on the left, Fire on the right, game in the middle ---- */
@media (orientation:landscape) and (min-aspect-ratio:6/5){
  #ep-game{--b:clamp(46px,9vmin,80px);--side:calc(var(--b)*3 + var(--gap)*2 + 20px);grid-template-columns:var(--side) minmax(0,1fr) var(--side);grid-template-rows:auto minmax(0,1fr);grid-template-areas:"bar bar bar" "left stage right"}
  .g-pad{display:contents}
  .g-dpad{grid-area:left;align-self:end;justify-self:center;margin-bottom:clamp(12px,4vmin,40px)}
  .g-fire{grid-area:right;align-self:end;justify-self:center;margin-bottom:clamp(12px,4vmin,40px)}
  .g-stage{padding:0 4px 8px}
}
@media (orientation:landscape) and (max-height:500px){
  .g-bar{padding:4px 10px}
  .g-bar .g-x,.g-bar .g-pause,.g-bar .g-mute{min-height:34px;min-width:38px}
}
`;
let styled = false, current = null;

function open(opts){
  if(current) current.close(true);
  if(!styled){ const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  const root = document.createElement('div'); root.id = 'ep-game';
  root.innerHTML = `<div class="g-bar"><button class="g-x" type="button" aria-label="Close game">✕</button><div class="g-name"></div>
      <div class="g-stat"><span class="g-lives"></span><span class="g-score">0</span><span class="g-time"></span></div>
      <button class="g-mute" type="button"></button><button class="g-pause" type="button" aria-label="Pause">❚❚</button></div>
    <div class="g-stage"><div class="g-wrap"><canvas width="${W}" height="${H}"></canvas><div class="g-info"></div><div class="g-msg"></div></div><div class="g-panel"></div></div>
    <div class="g-pad"><div class="g-dpad"><button class="u" data-k="up" type="button" aria-label="Up">▲</button><button class="l" data-k="left" type="button" aria-label="Left">◀</button><button class="d" data-k="down" type="button" aria-label="Down">▼</button><button class="r" data-k="right" type="button" aria-label="Right">▶</button></div>
      <button class="g-fire" data-k="fire" type="button">Fire</button></div>`;
  document.body.appendChild(root);
  const q = s => root.querySelector(s), cv = q('canvas'), c = cv.getContext('2d'), panel = q('.g-panel'), stage = q('.g-stage'), msgEl = q('.g-msg');
  c.imageSmoothingEnabled = false;
  const inp = {held:{}, tap:[], px:null};
  let g = null, state = 'ready', raf = 0, last = 0, acc = 0, closed = false, lastHud = '', msgT = 0, shake = 0;
  const left = () => opts.test ? Infinity : opts.left();
  const fx = { msg(text){ msgEl.textContent = text; msgEl.classList.add('on'); clearTimeout(msgT); msgT = setTimeout(() => msgEl.classList.remove('on'), 1300); }, shake(n){ shake = n; } };
  q('.g-name').textContent = NAMES[opts.game];
  const muteBtn = q('.g-mute');
  const paintMute = () => { muteBtn.textContent = AU.muted ? '\u{1F507}' : '\u{1F50A}'; muteBtn.classList.toggle('off', AU.muted); muteBtn.setAttribute('aria-label', AU.muted ? 'Turn sound on' : 'Turn sound off'); };
  paintMute();
  muteBtn.onclick = () => { AU.muted = !AU.muted; try{ localStorage.setItem('ep_mute', AU.muted ? '1' : '0'); }catch(e){} if(AU.muted) auRest(); else { auInit(); tone(660, .08, 'square', .05); } paintMute(); };

  const fit = () => { const r = stage.getBoundingClientRect(); let sc = Math.max(0.5, Math.min((r.width-12)/W, (r.height-8)/H)); const whole = Math.floor(sc); if(whole >= 2 && sc - whole < sc*.08) sc = whole; /* crisp whole-pixel scale when it costs little size */ cv.style.width = Math.round(W*sc)+'px'; cv.style.height = Math.round(H*sc)+'px'; };
  const fresh = () => { g = MAKE[opts.game](fx); inp.tap.length = 0; inp.held = {}; inp.px = null; acc = 0; lastHud = '';
    q('.g-dpad').className = 'g-dpad' + (g.pad==='lrfire' ? ' lr' : ''); q('.g-dpad .u').hidden = q('.g-dpad .d').hidden = g.pad==='lrfire';
    q('.g-fire').style.display = g.pad==='lrfire' ? '' : 'none'; q('.g-fire').textContent = g.fireLabel || 'Fire'; fit(); };
  const show = html => { panel.innerHTML = `<div class="g-card">${html}</div>`; panel.classList.add('on'); };
  const hide = () => { panel.classList.remove('on'); panel.innerHTML = ''; };
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
  const hud = () => {
    const t = opts.test ? 'Test' : (left()>0 ? fmt(left()) : (state==='play' ? 'Last game' : '0:00'));
    const key = g.score+'|'+g.lives+'|'+t+'|'+g.info; if(key===lastHud) return; lastHud = key;
    q('.g-score').textContent = g.score; q('.g-lives').textContent = g.lives==null ? '' : '♥'.repeat(Math.max(0,g.lives));
    q('.g-time').textContent = t; q('.g-time').classList.toggle('out', !opts.test && left()<=0);
    q('.g-info').textContent = g.info || ''; q('.g-info').style.display = g.info ? '' : 'none';
  };
  const ready = () => { state = 'ready'; fresh(); g.draw(c); hud();
    if(left()<=0) return show(`<h2>No game time left</h2><p>Earn more game time, then come back and play.</p><button data-a="quit">Back to games</button>`);
    show(`<h2>${NAMES[opts.game]}</h2><p>${g.hint}</p><button class="gold" data-a="start">Start</button>`); };
  const play = () => { auInit(); hide(); state = 'play'; last = performance.now(); };
  const pause = () => { if(state!=='play') return; state = 'pause'; auRest(); opts.flush && opts.flush(); show(`<h2>Paused</h2><p>${opts.test ? 'Test mode.' : 'Your game time is not counting down.'}</p><button class="gold" data-a="resume">Keep playing</button><button data-a="quit">Back to games</button>`); };
  const over = () => {
    state = 'over'; SFX.over(); setTimeout(auRest, 1200); const prev = opts.test ? 0 : opts.best(), isBest = !opts.test && g.score>prev && g.score>0;
    if(!opts.test){ opts.onScore(g.score); opts.flush(); }
    const again = left()>0;
    show(`<h2>Game over</h2><div class="big">${g.score}</div><p>${isBest ? 'New best score!' : opts.test ? 'Test mode. Scores are not saved.' : 'Your best: '+Math.max(prev,g.score)}</p>
      ${again ? '<button class="gold" data-a="again">Play again</button>' : '<p>Your game time is used up. Earn more to play again.</p>'}<button data-a="quit">Back to games</button>`);
    hud();
  };
  const close = silent => { if(closed) return; closed = true; auRest(); cancelAnimationFrame(raf); clearTimeout(msgT); if(!opts.test) opts.flush();
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', fit); document.removeEventListener('visibilitychange', vis); if(ro) ro.disconnect();
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
  const pend = () => { if(sw && !sw.moved && opts.game==='hopper') inp.tap.push('up'); sw = null; inp.px = null; };
  cv.addEventListener('pointerup', pend); cv.addEventListener('pointercancel', () => { sw = null; inp.px = null; });
  root.addEventListener('contextmenu', e => e.preventDefault());
  root.addEventListener('pointerdown', () => { if(state==='play' || state==='ready') auInit(); }, true);
  const vis = () => { if(document.hidden) pause(); };
  document.addEventListener('visibilitychange', vis); window.addEventListener('resize', fit);
  const ro = window.ResizeObserver ? new ResizeObserver(fit) : null; if(ro) ro.observe(stage);

  const frame = t => {
    if(closed) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (t-last)/1000); last = t;
    if(state==='play'){
      if(!opts.test && left()>0) opts.spend(dt);
      acc += dt; let n = 0;
      while(acc >= 1/60 && n++ < 6){ acc -= 1/60; g.update(inp); inp.tap.length = 0; if(g.over) break; }
      if(acc > 0.2) acc = 0;
      g.draw(c);
      if(shake>0){ shake--; cv.style.transform = `translate(${rnd(5)-2}px,${rnd(5)-2}px)`; } else if(cv.style.transform) cv.style.transform = '';
      if(g.over){ cv.style.transform = ''; over(); } else hud();
    }
  };
  current = {close, game:() => g};
  ready(); last = performance.now(); raf = requestAnimationFrame(frame);
  return current;
}

window.EPGames = {open, NAMES, _cur:() => current};
})();
