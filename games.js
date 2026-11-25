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
/* Background music: a small step sequencer scheduled a moment ahead on the audio clock, so it stays
   steady even when frames stutter. A game opts in with g.music (a SONGS key) and g.musicStep() (seconds per eighth note). */
const hz = m => 440*Math.pow(2, (m-69)/12);
function note(f, t, d, type, vol){
  try{
    const o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t+.008);
    g.gain.setValueAtTime(vol, t+d*.75); g.gain.linearRampToValueAtTime(0, t+d);
    o.connect(g); g.connect(AU.out); o.start(t); o.stop(t+d+.02);
  }catch(e){}
}
/* "Korobeiniki", the 1800s Russian folk song the Game Boy puzzle classic made famous (public domain).
   Lead: [midi note, length in eighths]; bass: one root per bar, bounced between octaves in eighths. */
const SONGS = {
  blocks: (() => {
    const A = [[76,2],[71,1],[72,1],[74,2],[72,1],[71,1], [69,2],[69,1],[72,1],[76,2],[74,1],[72,1], [71,3],[72,1],[74,2],[76,2], [72,2],[69,2],[69,2],[0,2],
               [74,3],[77,1],[81,2],[79,1],[77,1], [76,3],[72,1],[76,2],[74,1],[72,1], [71,2],[71,1],[72,1],[74,2],[76,2], [72,2],[69,2],[69,2],[0,2]];
    const roots = [40,45,40,45,38,36,40,45];
    const lead = [], bass = [];
    for(const [m,l] of A.concat(A)){ lead.push([m,l]); for(let k=1;k<l;k++) lead.push(null); }
    for(let r=0;r<2;r++) roots.forEach(n => { for(let k=0;k<8;k++) bass.push(n + (k%2 ? 24 : 12)); });
    return {lead, bass};
  })()
};
const MUS = {song:null, k:0, t:null};
function musicTick(name, step){
  if(AU.muted || !AU.ctx || AU.ctx.state!=='running' || !SONGS[name]){ MUS.t = null; return; }
  const S = SONGS[name], now = AU.ctx.currentTime;
  if(MUS.song!==name){ MUS.song = name; MUS.k = 0; MUS.t = null; }
  if(MUS.t===null || MUS.t < now-.25) MUS.t = now+.06;
  while(MUS.t < now+.2){
    const L = S.lead[MUS.k];
    if(L && L[0]) note(hz(L[0]), MUS.t, L[1]*step*.92, 'square', .028);
    note(hz(S.bass[MUS.k]), MUS.t, step*.8, 'triangle', .09);
    MUS.t += step; MUS.k = (MUS.k+1) % S.lead.length;
  }
}
function musicStop(reset){ MUS.t = null; if(reset) MUS.k = 0; }
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
    draw(c){ c.globalCompositeOperation = 'lighter'; for(const p of a){ c.fillStyle = p.col; const z = p.l>8 ? 2 : 1.2; c.fillRect(p.x-z/2, p.y-z/2, z, z); } c.globalCompositeOperation = 'source-over'; }
  };
}

/* ---------------- neon look ----------------
   Glowing shapes are drawn once into high-resolution sprites (GR x the game grid) and stamped each frame,
   so the glow costs nothing while playing. Backgrounds are drawn once per screen size. */
const GR = 5;
function rpath(x, X, Y, w, h, r){ r = Math.max(0, Math.min(r, w/2, h/2)); x.beginPath(); x.moveTo(X+r, Y); x.arcTo(X+w, Y, X+w, Y+h, r); x.arcTo(X+w, Y+h, X, Y+h, r); x.arcTo(X, Y+h, X, Y, r); x.arcTo(X, Y, X+w, Y, r); x.closePath(); }
function glow(w, h, draw, pad){
  pad = pad==null ? 5 : pad;
  const cv = document.createElement('canvas'); cv.width = Math.ceil((w+pad*2)*GR); cv.height = Math.ceil((h+pad*2)*GR);
  const x = cv.getContext('2d'); x.scale(GR, GR); x.translate(pad, pad); x.lineJoin = x.lineCap = 'round';
  draw(x);
  return {cv, pad, w, h};
}
function halo(x, col, b){ x.shadowColor = col; x.shadowBlur = b*GR; }
function noHalo(x){ x.shadowBlur = 0; x.shadowColor = 'transparent'; }
function stamp(c, s, X, Y){ c.imageSmoothingEnabled = true; c.drawImage(s.cv, X - s.pad, Y - s.pad, s.cv.width/GR, s.cv.height/GR); }
function stampC(c, s, cx, cy){ stamp(c, s, cx - s.w/2, cy - s.h/2); }
function stampS(c, s, X, Y, f){ c.imageSmoothingEnabled = true; c.drawImage(s.cv, X - s.pad*f, Y - s.pad*f, s.cv.width/GR*f, s.cv.height/GR*f); }
/* a small pixel-art sprite turned into glowing neon pixels; very dark pixels (eyes, outlines) become see-through */
function neonPix(src, col, b){
  const d = src.getContext('2d').getImageData(0, 0, src.width, src.height).data, byCol = new Map();
  for(let j=0;j<src.height;j++) for(let i=0;i<src.width;i++){
    const o = (j*src.width+i)*4; if(d[o+3] < 128 || d[o]+d[o+1]+d[o+2] < 150) continue;
    const k = `rgb(${d[o]},${d[o+1]},${d[o+2]})`; if(!byCol.has(k)) byCol.set(k, []); byCol.get(k).push([i,j]);
  }
  return glow(src.width, src.height, x => {
    for(let pass=0;pass<2;pass++){
      pass ? noHalo(x) : halo(x, col, b==null ? 2.5 : b);
      for(const [k, px] of byCol){ x.fillStyle = k; x.beginPath(); for(const [i,j] of px) x.rect(i+.1, j+.1, .8, .8); x.fill(); }
    }
  }, 4);
}
function neonBox(w, h, col, r, fill){
  return glow(w, h, x => { halo(x, col, 3); rpath(x, .6, .6, w-1.2, h-1.2, r); x.fillStyle = fill || col+'38'; x.fill(); x.strokeStyle = col; x.lineWidth = 1.1; x.stroke(); }, 4);
}
function capSpr(col, glyph){
  return glow(16, 8, x => { halo(x, col, 3); rpath(x, .5, .5, 15, 7, 3.5); x.fillStyle = col+'59'; x.fill(); x.strokeStyle = col; x.lineWidth = 1; x.stroke(); noHalo(x); x.imageSmoothingEnabled = false; x.drawImage(glyph, 5.5, 1.5); }, 4);
}
/* full-screen background drawn once at the screen's pixel density, redrawn only if the size or fonts change */
function bgCache(c, store, key, draw){
  const k = c.getTransform().a, fs = document.fonts ? document.fonts.status : '';
  let L = store[key];
  if(!L || L.k!==k || L.fs!==fs){
    const cv = document.createElement('canvas'); cv.width = Math.round(W*k); cv.height = Math.round(H*k);
    const x = cv.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0); x.lineJoin = x.lineCap = 'round'; draw(x);
    L = store[key] = {cv, k, fs};
  }
  c.imageSmoothingEnabled = true; c.drawImage(L.cv, 0, 0, W, H);
}
function neonGrid(x, col, step, y0, y1){ x.strokeStyle = col; x.lineWidth = .5; x.beginPath(); for(let X=0;X<=W;X+=step){ x.moveTo(X+.25, y0); x.lineTo(X+.25, y1); } for(let Y=y0;Y<=y1;Y+=step){ x.moveTo(0, Y+.25); x.lineTo(W, Y+.25); } x.stroke(); }
function synthFloor(x, y0, col){
  const gr = x.createLinearGradient(0, y0-50, 0, y0); gr.addColorStop(0, 'rgba(255,60,200,0)'); gr.addColorStop(1, 'rgba(255,60,200,.2)'); x.fillStyle = gr; x.fillRect(0, y0-50, W, 50);
  x.strokeStyle = col; x.lineWidth = .5; x.beginPath();
  for(let i=-14;i<=14;i++){ x.moveTo(W/2+i*9, y0); x.lineTo(W/2+i*44, H); }
  for(let j=0;j<=8;j++){ const y = y0 + (H-y0)*(j/8)**2; x.moveTo(0, y); x.lineTo(W, y); }
  x.stroke();
}
function glowText(c, s, X, Y, col, size){ const k = c.getTransform().a; c.font = `700 ${size}px Fredoka, sans-serif`; c.textAlign = 'center'; c.shadowColor = col; c.shadowBlur = 6*k; c.fillStyle = col; c.fillText(s, X, Y); c.shadowBlur = 0; c.textAlign = 'start'; }

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
  g.oneSwipe = true;   /* one swipe = one turn: a thumb that curls sideways at the end of a swipe doesn't add a second turn */
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
  const BG = {}, APPLE_G = neonPix(APPLE, '#ff4d6d'), BUG_G = neonPix(BUG, '#b36bff'), WALL = neonBox(N-2, N-2, '#ff3cc8', 2);
  g.draw = c => {
    bgCache(c, BG, 'b', x => {
      x.fillStyle = '#04030c'; x.fillRect(0,0,W,H);
      neonGrid(x, 'rgba(77,255,136,.08)', N, OY, H-OY);
      x.fillStyle = '#10052a'; x.fillRect(0,0,W,OY); x.fillRect(0,H-OY,W,OY);
      halo(x, '#ff3cc8', 5); x.strokeStyle = '#ff3cc8'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, OY-.6); x.lineTo(W, OY-.6); x.moveTo(0, H-OY+.6); x.lineTo(W, H-OY+.6); x.stroke(); noHalo(x);
    });
    for(const k of walls){ const [x,y] = k.split(',').map(Number); stamp(c, WALL, x*N+1, y*N+OY+1); }
    stamp(c, APPLE_G, food.x*N+1, food.y*N+OY+1 + (tick%40<20?0:-1));
    if(bonus && (bonus.t>120 || tick%10<6)){ stamp(c, BUG_G, bonus.x*N+1, bonus.y*N+OY+1); c.fillStyle = '#ffd84d'; c.fillRect(bonus.x*N, bonus.y*N+OY-3, Math.ceil(N*bonus.t/bonus.max), 2); }
    const flash = dead && tick%8<4, col = flash ? '#ffffff' : '#4dff88', k = c.getTransform().a, mid = p => [p.x*N+N/2, p.y*N+OY+N/2];
    c.save(); c.lineJoin = c.lineCap = 'round'; c.beginPath();
    s.forEach((p,i) => { const [X,Y] = mid(p); i ? c.lineTo(X,Y) : c.moveTo(X,Y); });
    c.shadowColor = col; c.shadowBlur = 7*k; c.strokeStyle = flash ? '#fff' : 'rgba(77,255,136,.55)'; c.lineWidth = 9; c.stroke();
    c.shadowBlur = 0; c.strokeStyle = flash ? '#fff' : '#c4ffd6'; c.lineWidth = 2.5; c.stroke();
    const [hx,hy] = mid(s[0]);
    c.shadowColor = col; c.shadowBlur = 8*k; c.fillStyle = flash ? '#fff' : '#9dffbb'; c.beginPath(); c.arc(hx, hy, 5.5, 0, 7); c.fill(); c.shadowBlur = 0;
    if(!flash){
      const ex = d.x*1.5, ey = d.y*1.5, qx = -d.y*2.6, qy = d.x*2.6;
      c.fillStyle = '#04030c'; c.beginPath(); c.arc(hx+ex+qx, hy+ey+qy, 1.4, 0, 7); c.fill(); c.beginPath(); c.arc(hx+ex-qx, hy+ey-qy, 1.4, 0, 7); c.fill();
      if(tick%30<8){ c.strokeStyle = '#ff4d6d'; c.lineWidth = 1; c.beginPath(); c.moveTo(hx+d.x*5.5, hy+d.y*5.5); c.lineTo(hx+d.x*9, hy+d.y*9); c.stroke(); }
    }
    c.restore();
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
  const G = rows => spr(rows, {w:'#fff'});
  const GLYPH = {
    W: G(['w...w','w...w','w.w.w','ww.ww','w...w']), M: G(['w...w','ww.ww','w.w.w','w...w','w...w']), S: G(['.www.','w....','.ww..','...w.','www..']),
    H: G(['.w.w.','wwwww','wwwww','.www.','..w..']), L: G(['w....','w....','w....','w....','wwww.']), C: G(['.www.','w....','w....','w....','.www.']),
    F: G(['wwww.','w....','www..','w....','w....']), B: G(['www..','w..w.','www..','w..w.','www..']), X: G(['w...w','.w.w.','..w..','.w.w.','w...w'])
  };
  const CAPCOL = {W:'#4cc9f0', M:'#ff7eb6', S:'#59c36a', H:'#8e96b3', L:'#ff9f43', C:'#2ec4b6', F:'#e63946', B:'#b388ff', X:'#e0a100'};
  const CAPNAME = {W:'Wide paddle', M:'Multi-ball', S:'Slow ball', H:'Extra life', L:'Laser! Tap to fire', C:'Catch! Tap to release', F:'Fireball', B:'Warp door open \u2192', X:'Double points'};
  const DROPS = ['W','W','W','M','M','S','S','H','L','L','C','C','F','F','B','X','X'];
  const TIMED = {W:60*15, S:60*10, L:60*12, C:60*15, F:60*8, X:60*15};
  let px = W/2, balls = [], list = [], caps = [], beams = [], stage = 1, kind = 'static', stuck = true, hits = 0, shrunk = false, scroll = 0, drop = 0, dropT = 0, bonusT = 0, tick = 0, cool = 0, door = false;
  let pw_ = {};   /* active timed power-ups: letter -> frames left */
  const on = k => (pw_[k] || 0) > 0;
  const g = {score:0, lives:3, over:false, pad:'lrfire', fireLabel:'Launch', info:'Stage 1', hint:'Drag your finger anywhere on the screen to move the paddle. Tap to launch the ball. Catch falling capsules for power-ups: wide paddle, multi-ball, slow ball, laser, catch, fireball, warp door, double points and extra life.'};
  const P = Parts();
  const pw = () => (shrunk ? 26 : 40) + (on('W') ? 18 : 0);
  const bx = b => { let x = b.c*BW + (kind==='scroll' ? scroll*(b.r%2 ? 1 : -1) : 0); x = ((x % FW) + FW) % FW; return X0 + x; };
  const by = b => Y0 + b.r*BH + drop;
  const speed = () => (2.2 + Math.min(stage,10)*0.1) * (hits>=12 ? 1.3 : hits>=4 ? 1.15 : 1) * (on('S') ? .7 : 1) * (kind==='bonus' ? 1.2 : 1);
  function serve(){ stuck = true; balls = [{x:px, y:PY-4, ux:0, uy:-1, tr:[]}]; }
  function load(){
    kind = ['static','scroll','advance','bonus'][(stage-1)%4];
    const L = kind==='bonus' ? LAYOUTS[Math.floor(stage/4)%2 ? 3 : 7] : LAYOUTS[[0,1,2,4,5,6][(stage - Math.floor(stage/4) - 1) % 6]];
    list = []; L.forEach((row,r) => { for(let c=0;c<row.length;c++){ const ch = row[c]; if(ch!=='.') list.push({c, r, t:ch, hp:ch==='h'?2:1, alive:true}); } });
    scroll = 0; drop = 0; dropT = 0; caps = []; beams = []; shrunk = false; pw_ = {}; door = false; hits = 0; bonusT = kind==='bonus' ? 60*25 : 0;
    g.info = kind==='bonus' ? 'Bonus stage' : 'Stage '+stage; serve();
  }
  load();
  g.ctrlX = () => px;
  g._st = () => ({balls, pw:pw_, door, stuck, beams:beams.length, alive:list.filter(b => b.alive).length});
  g._dbg = n => { if(n==='win') list.forEach(b => b.alive = false); else if(typeof n==='string' && n.length===1) caps.push({x:px, y:PY-30, k:n}); else { stage = n; load(); } };
  function next(msg){ stage++; SFX.level(); fx.msg(msg); load(); }
  function hitBrick(b, ball){
    if(b.t==='x'){ SFX.clank(); return; }
    if(--b.hp>0){ SFX.clank(); return; }
    b.alive = false; hits++; g.score += (10 + Math.max(0, 9-b.r)*2) * (on('X') ? 2 : 1); SFX.brick(b.r);
    P.burst(bx(b)+8, by(b)+4, COL[b.t], 7, 1.5);
    if(kind!=='bonus' && caps.length<2 && Math.random()<.09){ let k = pick(DROPS); if(k==='B' && door) k = 'W'; caps.push({x:bx(b)+8, y:by(b)+4, k}); }
  }
  g.update = inp => {
    tick++; P.step();
    const w = pw();
    if(inp.px != null) px += clamp(inp.px-px, -9, 9); else px += (inp.held.right?4:0) - (inp.held.left?4:0);
    px = clamp(px, X0+w/2-2, W-X0-w/2+2);
    for(const k in pw_) if(pw_[k] > 0) pw_[k]--;
    if(cool) cool--;
    if(kind==='scroll') scroll += .35 + Math.min(stage,12)*.02;
    if(kind==='advance' && !stuck && ++dropT >= 540){ dropT = 0; drop += BH; SFX.tick(); for(const b of list) if(b.alive && by(b) > PY-52) b.alive = false; }
    if(kind==='bonus' && !stuck){ if(--bonusT<=0) return next('Time! Stage '+(stage+1)); if(bonusT<300 && bonusT%60===0) SFX.tick(); }
    for(let i=caps.length-1;i>=0;i--){
      const cp = caps[i]; cp.y += 1.1;
      if(cp.y>=PY-4 && cp.y<=PY+8 && Math.abs(cp.x-px) <= w/2+6){
        caps.splice(i,1); fx.msg(CAPNAME[cp.k]);
        if(cp.k==='H'){ if(g.lives<5) g.lives++; SFX.life(); } else SFX.power();
        if(TIMED[cp.k]) pw_[cp.k] = TIMED[cp.k];
        if(cp.k==='L') pw_.C = 0; if(cp.k==='C') pw_.L = 0;   /* laser and catch replace each other */
        if(cp.k==='B') door = true;
        if(cp.k==='C' || cp.k==='L') balls.forEach(b => { if(b.held!=null && cp.k==='L') b.held = null; });
        if(cp.k==='M' && !stuck){ const add = []; for(const b of balls){ if(balls.length+add.length>=3) break; const a = Math.atan2(b.uy,b.ux); for(const o of [-.5,.5]){ if(balls.length+add.length>=3) break; add.push({x:b.x, y:b.y, ux:Math.cos(a+o), uy:Math.sin(a+o), tr:[]}); } } balls = balls.concat(add); }
      } else if(cp.y > H+8) caps.splice(i,1);
    }
    /* warp door: slide the paddle into the right wall to skip to the next stage */
    if(door && px >= W-X0-w/2+1 && kind!=='bonus'){ g.score += 100*(on('X')?2:1); SFX.home(); return next('Warp! Stage '+(stage+1)); }
    /* laser beams */
    const firing = inp.tap.includes('fire') || inp.held.fire;
    if(on('L') && !stuck && firing && !cool && beams.length < 6){ const L = px-w/2; beams.push({x:L+3, y:PY-2}, {x:L+w-4, y:PY-2}); cool = 16; SFX.shoot(); }
    for(const bm of beams){
      bm.y -= 5;
      for(const b of list){
        if(!b.alive) continue; const y = by(b); if(bm.y < y || bm.y > y+BH) continue;
        const x = bx(b), xs = x+BW > X0+FW ? [x, x-FW] : [x];
        if(xs.some(X => bm.x >= Math.max(X,X0) && bm.x <= Math.min(X+BW, X0+FW))){ hitBrick(b); bm.y = -99; break; }
      }
    }
    beams = beams.filter(bm => bm.y > 20);
    /* caught balls ride the paddle; tap (or wait) to let go */
    const held = balls.filter(b => b.held!=null);
    for(const b of held){ b.x = clamp(px + b.held, X0+3, W-X0-3); b.y = PY-4; if(--b.holdT<=0 || inp.tap.includes('fire') || inp.tap.includes('up')){ const a = -Math.PI/2 + clamp(b.held/(w/2), -1, 1)*1.05; b.ux = Math.cos(a); b.uy = Math.sin(a); b.held = null; SFX.paddle(); } }
    g.fireLabel = stuck || held.length ? 'Launch' : on('L') ? 'Fire' : 'Launch';
    if(stuck){
      balls[0].x = px; balls[0].y = PY-4;
      if(inp.tap.includes('fire') || inp.tap.includes('up')){ const a = -Math.PI/2 + (Math.random()-.5)*.7; balls[0].ux = Math.cos(a); balls[0].uy = Math.sin(a); stuck = false; SFX.paddle(); }
      return;
    }
    const sp = speed();
    for(let bi=balls.length-1;bi>=0;bi--){
      const ball = balls[bi]; if(ball.held!=null) continue; ball.tr.push({x:ball.x, y:ball.y}); if(ball.tr.length>5) ball.tr.shift();
      let lost = false;
      for(let i=0;i<3 && !lost;i++){
        const ox = ball.x; ball.x += ball.ux*sp/3; ball.y += ball.uy*sp/3;
        if(ball.x<X0+3){ ball.x = X0+3; ball.ux = Math.abs(ball.ux); SFX.wall(); } if(ball.x>W-X0-3){ ball.x = W-X0-3; ball.ux = -Math.abs(ball.ux); SFX.wall(); }
        if(ball.y<23){ ball.y = 23; ball.uy = Math.abs(ball.uy); SFX.wall(); if(!shrunk && kind!=='bonus'){ shrunk = true; SFX.shrink(); fx.msg('Paddle shrinks!'); } }
        if(ball.uy>0 && ball.y>=PY-3 && ball.y<=PY+5 && Math.abs(ball.x-px) <= w/2+3){
          const a = -Math.PI/2 + clamp((ball.x-px)/(w/2), -1, 1)*1.05; ball.ux = Math.cos(a); ball.uy = Math.sin(a); ball.y = PY-3; SFX.paddle();
          if(on('C')){ ball.held = ball.x - px; ball.holdT = 180; ball.tr = []; break; }
        }
        if(ball.y > H+8){ lost = true; break; }
        for(const b of list){
          if(!b.alive) continue;
          const y = by(b); if(ball.y < y-3 || ball.y > y+BH+3) continue;
          const x = bx(b), xs = x+BW > X0+FW ? [x, x-FW] : [x];
          let hit = false;
          const through = on('F') && b.t!=='x';
          for(const X of xs){
            const lo = Math.max(X, X0), hi = Math.min(X+BW, X0+FW);
            if(ball.x >= lo-3 && ball.x <= hi+3){ hit = true; if(kind!=='bonus' && !through){ if(ox < lo-3 || ox > hi+3) ball.ux = -ball.ux; else ball.uy = -ball.uy; } break; }
          }
          if(hit && through){ b.hp = 1; hitBrick(b, ball); P.burst(ball.x, ball.y, '#ff9f43', 4, 1); continue; }
          if(hit){ hitBrick(b, ball); break; }
        }
      }
      if(lost) balls.splice(bi,1);
    }
    if(!balls.length){
      if(kind==='bonus'){ serve(); return; }
      SFX.squash(); fx.shake(5); pw_ = {}; shrunk = false; hits = 0; caps = []; beams = [];
      if(--g.lives<=0){ g.over = true; return; } serve(); return;
    }
    if(!list.some(b => b.alive && b.t!=='x')){
      if(kind==='bonus'){ g.score += 1500; return next('Perfect! +1500'); }
      g.score += 100; next('Stage '+(stage+1));
    }
  };
  const BG = {}, NB = {}, bkey = b => b.t==='h' ? (b.hp<2 ? 'h1' : 'h') : b.t;
  const brickSpr = key => NB[key] || (NB[key] = glow(BW-1, BH-1, x => {
    const col = key==='h1' ? '#8e96b3' : key==='h' ? '#eef1ff' : key==='x' ? '#9aa2c4' : COL[key];
    halo(x, col, 2.5); rpath(x, .6, .6, BW-2.2, BH-2.2, 1.5); x.fillStyle = key==='x' ? 'rgba(154,162,196,.22)' : col+(key==='h' ? '66' : '38'); x.fill(); x.strokeStyle = col; x.lineWidth = 1; x.stroke(); noHalo(x);
    if(key==='x'){ x.fillStyle = col; [[2.5,2],[BW-4.5,2],[2.5,BH-4],[BW-4.5,BH-4]].forEach(([a,b]) => x.fillRect(a,b,1,1)); }
    if(key==='h'){ x.fillStyle = '#fff'; x.fillRect(3,2,4,1); }
  }, 3));
  const PADS = {}, padSpr = (w, col) => PADS[w+col] || (PADS[w+col] = glow(w, 7, x => { halo(x, col, 4); rpath(x, .6, .6, w-1.2, 5.8, 2.9); x.fillStyle = col+'40'; x.fill(); x.strokeStyle = col; x.lineWidth = 1.4; x.stroke(); noHalo(x); x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(4, 2.6, w-8, 1); }, 5));
  const BALLS = {}, ballSpr = col => BALLS[col] || (BALLS[col] = glow(6, 6, x => { halo(x, col, 5); x.fillStyle = col; x.beginPath(); x.arc(3,3,2.8,0,7); x.fill(); noHalo(x); x.fillStyle = '#fff'; x.beginPath(); x.arc(2.4,2.4,1.1,0,7); x.fill(); }, 6));
  const CAPS = {}; for(const k in CAPCOL) CAPS[k] = capSpr(CAPCOL[k], GLYPH[k]);
  g.draw = c => {
    bgCache(c, BG, 'b', x => {
      x.fillStyle = '#04030c'; x.fillRect(0,0,W,H);
      neonGrid(x, 'rgba(255,60,200,.06)', 16, 20, H);
      x.fillStyle = '#10052a'; x.fillRect(0,14,X0-2,H); x.fillRect(W-X0+2,14,X0-2,H); x.fillRect(0,14,W,6);
      halo(x, '#3fe0ff', 5); x.strokeStyle = '#3fe0ff'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(X0-2.6, H); x.lineTo(X0-2.6, 19.4); x.lineTo(W-X0+2.6, 19.4); x.lineTo(W-X0+2.6, H); x.stroke(); noHalo(x);
    });
    if(kind==='bonus'){ c.fillStyle = '#2a2f55'; c.fillRect(X0,24,FW,3); c.fillStyle = bonusT<300 ? '#ff4d6d' : '#ffd84d'; c.fillRect(X0,24,FW*bonusT/(60*25),3); }
    c.save(); c.beginPath(); c.rect(X0,20,FW,H); c.clip();
    for(const b of list){
      if(!b.alive) continue;
      const y = by(b), x = bx(b), xs = x+BW > X0+FW ? [x, x-FW] : [x], sp = brickSpr(bkey(b));
      for(const X of xs) stamp(c, sp, X, y);
    }
    c.restore();
    const k = c.getTransform().a;
    if(door){ const t = tick%20<10; c.shadowColor = '#b36bff'; c.shadowBlur = 8*k; c.fillStyle = t ? '#fff' : '#d9c2ff'; c.fillRect(W-X0+3, PY-11, X0-4, 18); c.shadowBlur = 0; c.fillStyle = '#b36bff'; c.fillRect(W-X0-10+(tick>>2)%6, PY-20, 3, 3); }
    c.globalCompositeOperation = 'lighter';
    for(const bm of beams){ c.fillStyle = 'rgba(255,216,77,.35)'; c.fillRect(bm.x-2.5, bm.y-1, 5, 8); c.fillStyle = '#ffe9a8'; c.fillRect(bm.x-1, bm.y, 2, 6); }
    c.globalCompositeOperation = 'source-over';
    for(const cp of caps) stamp(c, CAPS[cp.k], cp.x-8, cp.y-3);
    const w = pw(), L = px-w/2, col = on('L') ? '#ff9a3d' : on('C') ? '#2ef0d8' : on('W') ? '#3fe0ff' : '#ff3cc8';
    stamp(c, padSpr(w, col), L, PY);
    c.fillStyle = col; if(on('L')){ c.fillRect(L+2, PY-4, 2, 4); c.fillRect(L+w-4, PY-4, 2, 4); }
    if(on('C')) c.fillRect(L+4, PY-1.5, w-8, 1);
    for(const ball of balls){
      const fire = on('F'), bc = fire ? '#ff9a3d' : on('S') ? '#7dff9a' : '#ffffff';
      c.globalCompositeOperation = 'lighter';
      ball.tr.forEach((p,i) => { c.fillStyle = fire ? `rgba(255,120,40,${.06+i*.05})` : `rgba(120,220,255,${.05+i*.04})`; c.beginPath(); c.arc(p.x, p.y, 1.6+i*.25, 0, 7); c.fill(); });
      c.globalCompositeOperation = 'source-over';
      stampC(c, ballSpr(bc), ball.x, ball.y);
    }
    /* active power-ups with time left, along the bottom */
    c.imageSmoothingEnabled = false;
    let ix = X0+2;
    for(const k2 of ['W','S','L','C','F','X']){
      const t = pw_[k2] || 0; if(!t) continue; if(t < 120 && tick%12 < 6){ ix += 30; continue; }
      c.fillStyle = CAPCOL[k2]; c.fillRect(ix, 307, 9, 9); c.drawImage(GLYPH[k2], ix+2, 309);
      c.fillStyle = '#2a2f55'; c.fillRect(ix+11, 310, 16, 3); c.fillStyle = CAPCOL[k2]; c.fillRect(ix+11, 310, Math.ceil(16*t/TIMED[k2]), 3);
      ix += 30;
    }
    if(door){ c.fillStyle = '#b388ff'; c.fillRect(ix, 307, 9, 9); c.drawImage(GLYPH.B, ix+2, 309); }
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
  const G5 = rows => spr(rows, {w:'#fff'});
  const GLYPH = {
    R: G5(['www..','w..w.','www..','w.w..','w..w.']), D: G5(['w.w.w','w.w.w','.www.','..w..','..w..']), P: G5(['..w..','.www.','w.w.w','..w..','..w..']),
    S: G5(['.www.','w...w','w...w','w...w','.www.']), T: G5(['wwwww','.www.','..w..','.www.','wwwww']), N: G5(['w.w.w','.www.','wwwww','.www.','w.w.w']),
    F: G5(['.....','..w..','.www.','wwwww','ww.ww']), H: G5(['.w.w.','wwwww','wwwww','.www.','..w..'])
  };
  const CAPCOL = {R:'#e0a100', D:'#4cc9f0', P:'#ff7eb6', S:'#2ec4b6', T:'#b388ff', N:'#ff5a5f', F:'#59c36a', H:'#8e96b3'};
  const CAPNAME = {R:'Rapid fire', D:'Triple shot', P:'Piercing laser', S:'Force field', T:'Freeze!', N:'Smart bomb!', F:'Shields rebuilt', H:'Extra ship'};
  const TIMED = {R:60*12, D:60*12, P:60*10, S:60*25, T:60*6};
  const DROPS = ['R','R','D','D','P','P','S','S','T','N','F','H'];
  let al, ox, oy, dir, stepT = 0, note = 0, frame = 0, wave = 1, px = W/2, shots = [], bombs = [], bunk = [], booms = [], ufo = null, ufoT = 0, hurt = 0, caps = [], cool = 0, bombT = 0, extra = false, tick = 0, pw_ = {};
  const on = k => (pw_[k] || 0) > 0;
  const g = {score:0, lives:3, over:false, pad:'lrfire', fireLabel:'Fire', info:'Wave 1', hint:'Drag your finger anywhere on the screen to move. Your ship fires on its own while you drag. You can also use the arrows and hold Fire. Hide behind the shields. The red saucer, and sometimes an alien, drops capsules: rapid fire, triple shot, piercing laser, force field, freeze, smart bomb, shield repair and extra ship.'};
  const P = Parts(), PY = 288;
  function spawn(){
    al = []; for(let r=0;r<5;r++) for(let c=0;c<11;c++) al.push({c, r, alive:true});
    ox = 32; oy = 34 + Math.min(wave-1, 5)*8; dir = 1; stepT = 0; shots = []; bombs = []; ufo = null; ufoT = 60*(14+rnd(8)); caps = [];
    bunk = freshBunkers();
    g.info = 'Wave '+wave;
  }
  spawn();
  g.ctrlX = () => px; g.autoFire = true;
  g._dbg = k => { if(k==='ufo') ufoT = 1; if(k==='clear') al.forEach((a,i) => { if(i) a.alive = false; }); if(k==='all') al.forEach(a => a.alive = false); if(k==='cap') caps.push({x:px, y:200, k:'R'}); if(typeof k==='string' && CAPCOL[k]) caps.push({x:px, y:240, k}); };
  g._st = () => ({pw:pw_, shots:shots.length, live:al.filter(a => a.alive).length, bunk:bunk.reduce((t,b) => t+b.cells.flat().filter(Boolean).length, 0), lives:g.lives});
  const ax = a => ox + a.c*16, ay = a => oy + a.r*14;
  function freshBunkers(){ return [36,92,148,204].map(cx => ({x:cx-11, y:250, cells:BUNK.map(r => [...r].map(ch => ch==='#'))})); }
  function drop(x, y, k){ if(caps.length < 2) caps.push({x, y, k: k || pick(DROPS)}); }
  function kill(a){ const X = ax(a), Y = ay(a); a.alive = false; g.score += PTS[a.r]; SFX.pop(); booms.push({x:X, y:Y, t:10}); P.burst(X+6, Y+4, ['#ff3cc8','#3fe0ff','#4dff88'][TYPE[a.r]], 8, 1.4); if(Math.random() < .03) drop(X+6, Y+8); }
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
    if(cool) cool--; for(const k in pw_) if(pw_[k] > 0) pw_[k]--;
    const maxShots = (on('R') ? 3 : 1) * (on('D') ? 3 : 1);
    if((inp.held.fire || inp.tap.includes('fire')) && !cool && shots.length + (on('D') ? 3 : 1) <= maxShots){
      if(on('D')) shots.push({x:px, y:PY-2, vx:0}, {x:px-3, y:PY-1, vx:-.55}, {x:px+3, y:PY-1, vx:.55}); else shots.push({x:px, y:PY-2, vx:0});
      cool = on('R') ? 9 : 16; SFX.shoot();
    }
    const live = al.filter(a => a.alive), n = live.length;
    if(!n){ wave++; g.score += 100; SFX.level(); fx.msg('Wave '+wave); spawn(); return; }
    /* march (stops while frozen) */
    if(!on('T') && ++stepT >= clamp(Math.round(n*.5) - (wave-1), 2, 30)){
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
        s.y -= 2; s.x += (s.vx||0)*2/3;
        if(s.x < 0 || s.x > W){ s.y = -99; break; }
        if(erode(s.x|0, s.y|0, 1)){ s.y = -99; break; }
        if(ufo && s.y<32 && s.y>22 && s.x>ufo.x && s.x<ufo.x+16){
          const pts = pick([50,100,100,150,300]); g.score += pts; fx.msg('+'+pts); SFX.boom(); P.burst(ufo.x+8, 27, '#ff5a5f', 18, 2);
          drop(ufo.x+8, 30); ufo = null; s.y = -99; break;
        }
        for(const a of live){
          const X = ax(a), Y = ay(a);
          if(a.alive && s.x>=X-1 && s.x<=X+12 && s.y>=Y && s.y<=Y+8){ kill(a); if(!on('P')) s.y = -99; break; }
        }
      }
    }
    shots = shots.filter(s => s.y > -6);
    /* bombs */
    if(!on('T') && ++bombT >= Math.max(24, 66-wave*6) && bombs.length<3){
      bombT = 0; const cur = live.filter(a => a.alive);
      if(cur.length){ const col = pick(cur).c, low = cur.filter(a => a.c===col).sort((a,b) => b.r-a.r)[0]; bombs.push({x:ax(low)+6, y:ay(low)+8, z:rnd(2)}); }
    }
    const bs = Math.min(3, 1.4 + wave*.12);
    for(const b of bombs){
      if(!on('T')) b.y += bs;
      if(erode(b.x|0, (b.y+4)|0, 1)){ b.y = 999; continue; }
      if(on('S') && Math.hypot(b.x-px, b.y+3-(PY+4)) < 14){ b.y = 999; pw_.S = 0; SFX.clank(); P.burst(px, PY, '#2ec4b6', 16, 2); fx.msg('Force field gone'); continue; }
      if(Math.abs(b.x-px)<7 && b.y+5>PY && b.y<PY+8){ bombs = []; shots = []; hurt = 70; g.lives--; pw_ = {}; SFX.boom(); fx.shake(8); P.burst(px, PY+4, '#e8ecff', 24, 2.4); break; }
    }
    bombs = bombs.filter(b => b.y < 304);
    for(let i=caps.length-1;i>=0;i--){
      const cp = caps[i]; cp.y += 1.3;
      if(cp.y>PY-2 && cp.y<PY+10 && Math.abs(cp.x-px)<12){
        caps.splice(i,1); fx.msg(CAPNAME[cp.k]); cp.k==='H' ? SFX.life() : SFX.power();
        if(TIMED[cp.k]) pw_[cp.k] = TIMED[cp.k];
        if(cp.k==='H') g.lives = Math.min(6, g.lives+1);
        if(cp.k==='F') bunk = freshBunkers();
        if(cp.k==='N'){ const live2 = al.filter(a => a.alive); const low = Math.max(...live2.map(a => a.r)); for(const a of live2) if(a.r===low) kill(a); bombs = []; fx.shake(6); SFX.boom(); }
      } else if(cp.y>306) caps.splice(i,1);
    }
    if(!extra && g.score>=1500){ extra = true; g.lives++; SFX.life(); fx.msg('Extra ship'); }
  };
  const BG = {}, NEON = ['#ff3cc8','#3fe0ff','#4dff88'];
  const ALG = [[A1,A2],[B1,B2],[C1,C2]].map((fr,i) => fr.map(rows => neonPix(spr(rows, {'#':NEON[i]}), NEON[i])));
  const SHIP_G = neonPix(SHIP, '#3fe0ff', 3), UFO_G = neonPix(UFO, '#ff4d6d', 3);
  const SHOT = glow(1, 6, x => { halo(x, '#fff', 3); x.fillStyle = '#fff'; x.fillRect(0,0,1,6); }, 4), SHOTP = glow(2, 6, x => { halo(x, '#ff3cc8', 3); x.fillStyle = '#ffb3ec'; x.fillRect(0,0,2,6); }, 4);
  const BOMB = [0,1].map(f => glow(3, 6, x => { halo(x, '#ffd84d', 3); x.strokeStyle = '#ffd84d'; x.lineWidth = 1; x.beginPath(); const a = f ? .5 : 2.5, b = f ? 2.5 : .5; x.moveTo(a,0); x.lineTo(b,2); x.lineTo(a,4); x.lineTo(b,6); x.stroke(); }, 4));
  const CAPS = {}; for(const k in CAPCOL) CAPS[k] = capSpr(CAPCOL[k], GLYPH[k]);
  const bunkSpr = b => {
    const n = b.cells.reduce((t,r) => t + r.filter(Boolean).length, 0);
    if(b._n !== n){ b._n = n; b._g = glow(22, 16, x => { for(let pass=0;pass<2;pass++){ pass ? noHalo(x) : halo(x, '#4dff88', 3); x.fillStyle = pass ? '#8dffb0' : '#4dff88'; x.beginPath(); for(let j=0;j<8;j++) for(let i=0;i<11;i++) if(b.cells[j][i]) x.rect(i*2+.2, j*2+.2, 1.6, 1.6); x.fill(); } }, 4); }
    return b._g;
  };
  g.draw = c => {
    bgCache(c, BG, 'b', x => {
      x.fillStyle = '#04030c'; x.fillRect(0,0,W,H);
      synthFloor(x, 246, 'rgba(180,60,255,.22)');
      halo(x, '#4dff88', 4); x.strokeStyle = '#4dff88'; x.lineWidth = 1; x.beginPath(); x.moveTo(0,304.5); x.lineTo(W,304.5); x.stroke(); noHalo(x);
    });
    for(const s of stars){ c.fillStyle = (tick+s.p)%90<8 ? '#dbe4ff' : 'rgba(140,150,230,.45)'; c.fillRect(s.x, s.y, .8, .8); }
    for(const b of bunk) stamp(c, bunkSpr(b), b.x, b.y);
    for(const a of al) if(a.alive) stamp(c, ALG[TYPE[a.r]][frame], ax(a), ay(a));
    c.globalCompositeOperation = 'lighter'; c.fillStyle = '#fff';
    for(const b of booms){ const X = b.x+6, Y = b.y+4, r = 10-b.t; c.fillRect(X-r,Y,2,1); c.fillRect(X+r,Y,2,1); c.fillRect(X,Y-r*.7,1,2); c.fillRect(X,Y+r*.7,1,2); c.fillRect(X-r*.7,Y-r*.5,1,1); c.fillRect(X+r*.7,Y+r*.5,1,1); c.fillRect(X+r*.7,Y-r*.5,1,1); c.fillRect(X-r*.7,Y+r*.5,1,1); }
    c.globalCompositeOperation = 'source-over';
    if(ufo) stamp(c, UFO_G, ufo.x, 24);
    for(const cp of caps) stamp(c, CAPS[cp.k], cp.x-8, cp.y-3);
    if(!hurt){
      stamp(c, SHIP_G, px-6.5, PY);
      if(on('S') && (pw_.S > 120 || tick%10<6)){ const k = c.getTransform().a; c.shadowColor = '#2ef0d8'; c.shadowBlur = 6*k; c.strokeStyle = 'rgba(46,240,216,.9)'; c.lineWidth = 1; c.beginPath(); c.arc(px, PY+4, 12 + (tick%30<15 ? 0 : 1), Math.PI, 0); c.stroke(); c.shadowBlur = 0; }
    }
    for(const s of shots) stamp(c, on('P') ? SHOTP : SHOT, on('P') ? s.x-.5 : s.x, s.y);
    if(on('T')){ c.fillStyle = 'rgba(179,107,255,.10)'; c.fillRect(0, 20, W, 284); }
    for(const b of bombs) stamp(c, BOMB[((tick>>2)+b.z)%2], b.x-1.5, b.y);
    /* active power-ups with time left, along the bottom */
    c.imageSmoothingEnabled = false;
    let ix = 4;
    for(const k of ['R','D','P','S','T']){
      const t = pw_[k] || 0; if(!t) continue; if(t < 120 && tick%12 < 6){ ix += 30; continue; }
      c.fillStyle = CAPCOL[k]; c.fillRect(ix, 308, 9, 9); c.drawImage(GLYPH[k], ix+2, 310);
      c.fillStyle = '#2a2f55'; c.fillRect(ix+11, 311, 16, 3); c.fillStyle = CAPCOL[k]; c.fillRect(ix+11, 311, Math.ceil(16*t/TIMED[k]), 3);
      ix += 30;
    }
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
  g.oneSwipe = true;   /* one swipe = one hop, however long the swipe */
  g._pos = () => ({x:p.x, row:p.y/T});
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
      for(let i=0;i<L.n;i++){ const x = itemX(L,i); if(mid>x-3 && mid<x+L.w+3 && !under(L,i)){ on = true; break; } }   /* small grace so a landing that looks on the edge counts */
      if(!on) return die('water');
      p.x += L.v; if(p.x < -8 || p.x > W-T+8) return die('water');
    }
  };
  const BG = {}, CHG = {}, ITEMS = {}; for(const k in CH) CHG[k] = neonPix(CH[k], '#ffd84d'); const FLYG = neonPix(FLY, '#bfefff');
  const TURT = [false, true].map(sink => glow(14, 14, x => {
    const col = sink ? '#2a9a6a' : '#4dff88'; halo(x, col, 3); x.strokeStyle = col; x.lineWidth = 1.1; x.fillStyle = col+(sink ? '22' : '33');
    x.beginPath(); x.ellipse(7, 7, 6, 5.2, 0, 0, 7); x.fill(); x.stroke();
    x.fillStyle = col; [[1.5,.5],[10.5,.5],[1.5,11.5],[10.5,11.5]].forEach(([a,b]) => x.fillRect(a, b, 2, 2));
    if(!sink){ noHalo(x); x.lineWidth = .6; x.strokeStyle = 'rgba(200,255,220,.75)'; x.beginPath(); x.moveTo(4,7); x.lineTo(10,7); x.moveTo(7,3.5); x.lineTo(7,10.5); x.stroke(); }
  }, 4));
  function itemSpr(L){ const key = L.kind+L.w+(L.col||'')+L.dir; return ITEMS[key] || (ITEMS[key] = makeItem(L)); }
  function makeItem(L){
    const w = L.w, d = L.dir, col = L.col;
    if(L.kind==='log') return glow(w, 14, x => {
      halo(x, '#ff9a3d', 3); rpath(x, .6, .6, w-1.2, 12.8, 5); x.fillStyle = 'rgba(255,154,61,.16)'; x.fill(); x.strokeStyle = '#ff9a3d'; x.lineWidth = 1.2; x.stroke(); noHalo(x);
      x.strokeStyle = 'rgba(255,190,120,.6)'; x.lineWidth = .6; x.beginPath(); for(let k=10;k<w-8;k+=17){ x.moveTo(k,5); x.lineTo(k+6,5); x.moveTo(k+8,8.5); x.lineTo(k+12,8.5); } x.stroke();
      x.strokeStyle = '#ffd0a0'; x.beginPath(); x.ellipse(3.4, 7, 1.6, 3.6, 0, 0, 7); x.moveTo(w-1.8, 7); x.ellipse(w-3.4, 7, 1.6, 3.6, 0, 0, 7); x.stroke();
    }, 4);
    return glow(w, 20, x => {
      const fr = d>0 ? w-2.5 : 2.5, bk = d>0 ? 1.5 : w-1.5;
      const body = (X, Y, bw, bh, r, c2) => { halo(x, c2, 3); rpath(x, X, Y, bw, bh, r); x.fillStyle = c2+'38'; x.fill(); x.strokeStyle = c2; x.lineWidth = 1.1; x.stroke(); };
      if(L.kind==='truck'){ const cab = d>0 ? w-11 : 0, tr = d>0 ? 0 : 12; body(tr+.5, 4.5, w-13, 11, 1.5, '#e8ecff'); body(cab+.5, 5.5, 10, 9, 2.5, col); noHalo(x); x.strokeStyle = 'rgba(232,236,255,.5)'; x.lineWidth = .6; x.beginPath(); x.moveTo(tr+9, 6); x.lineTo(tr+9, 14); x.moveTo(tr+18, 6); x.lineTo(tr+18, 14); x.stroke(); }
      else if(L.kind==='dozer'){ body(2.5, 2.5, w-5, 3, 1, '#9aa2c4'); body(2.5, 14.5, w-5, 3, 1, '#9aa2c4'); body(3.5, 6, w-7, 8, 2, col); halo(x, '#e8ecff', 3); x.strokeStyle = '#e8ecff'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(d>0 ? w-1 : 1, 3); x.lineTo(d>0 ? w-1 : 1, 17); x.stroke(); }
      else if(L.kind==='racer'){ body(1, 5, w-2, 10, 4, col); noHalo(x); x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(3, 9.5, w-6, 1); halo(x, col, 3); x.strokeStyle = col; x.lineWidth = 1.2; x.beginPath(); x.moveTo(d>0 ? .6 : w-.6, 3.5); x.lineTo(d>0 ? .6 : w-.6, 16.5); x.stroke(); }
      else { body(.8, 4, w-1.6, 12, 4, col); noHalo(x); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = .7; rpath(x, d>0 ? w-9 : 4, 6.5, 5, 7, 1.5); x.stroke(); }
      halo(x, '#fff7c2', 3); x.fillStyle = '#fff7c2'; x.beginPath(); x.arc(fr, 6.5, 1.1, 0, 7); x.fill(); x.beginPath(); x.arc(fr, 13.5, 1.1, 0, 7); x.fill();
      halo(x, '#ff4d6d', 2); x.fillStyle = '#ff4d6d'; x.fillRect(bk-.5, 5.5, 1, 2); x.fillRect(bk-.5, 12.5, 1, 2);
    }, 4);
  }
  const SEGS = []; { let a = 0; for(const b of BAYS){ SEGS.push([a, b-13]); a = b+13; } SEGS.push([a, W]); }
  g.draw = c => {
    bgCache(c, BG, 'b', x => {
      x.fillStyle = '#04030c'; x.fillRect(0,0,W,H);
      x.fillStyle = '#020b22'; x.fillRect(0, T, W, 6*T);
      /* hedge with five nest openings */
      x.beginPath(); x.moveTo(0, -2); x.lineTo(0, 2*T);
      SEGS.forEach(([a,b], i) => { if(i){ x.lineTo(a, T); x.lineTo(a, 2*T); } x.lineTo(b, 2*T); if(i < SEGS.length-1) x.lineTo(b, T); });
      x.lineTo(W, -2); x.closePath(); x.fillStyle = '#062a14'; x.fill(); halo(x, '#4dff88', 4); x.strokeStyle = '#4dff88'; x.lineWidth = 1.2; x.stroke(); noHalo(x);
      x.strokeStyle = 'rgba(77,255,136,.18)'; x.lineWidth = .5; x.beginPath(); for(let X=6;X<W;X+=12){ x.moveTo(X, 3); x.lineTo(X+4, 7); x.moveTo(X+6, 11); x.lineTo(X+10, 15); } x.stroke();
      /* median and start: purple paving with glowing edges */
      for(const r of [7, START]){ x.fillStyle = '#12062a'; x.fillRect(0, r*T, W, T); x.strokeStyle = 'rgba(255,60,200,.14)'; x.lineWidth = .5; x.beginPath(); for(let X=0;X<W;X+=10){ x.moveTo(X+.25, r*T); x.lineTo(X+.25, r*T+T); } x.moveTo(0, r*T+T/2); x.lineTo(W, r*T+T/2); x.stroke();
        halo(x, '#ff3cc8', 4); x.strokeStyle = '#ff3cc8'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, r*T+.5); x.lineTo(W, r*T+.5); x.moveTo(0, r*T+T-.5); x.lineTo(W, r*T+T-.5); x.stroke(); noHalo(x); }
      /* road */
      x.fillStyle = '#07060f'; x.fillRect(0, 8*T, W, 5*T);
      halo(x, '#b36bff', 3); x.fillStyle = 'rgba(200,150,255,.7)'; for(let r=9;r<=12;r++) for(let X=4;X<W;X+=24) x.fillRect(X, r*T-.5, 12, 1); noHalo(x);
      x.fillStyle = '#1a1840'; x.fillRect(20, 14*T+15, 200, 8);
    });
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(63,224,255,.28)';
    for(let r=2;r<7;r++) for(let x=((tick>>3)+r*13)%32-32;x<W;x+=32){ c.fillRect(x, r*T+6, 8, .8); c.fillRect(x+16, r*T+14, 6, .8); }
    c.globalCompositeOperation = 'source-over';
    BAYS.forEach((b,i) => {
      if(filled[i]) stamp(c, CHG.down, b-7, T+3);
      else if(snap && snap.i===i){ const open = snap.t<180; c.fillStyle = '#2f8f3a'; c.fillRect(b-9, T+6, 18, 10); c.fillStyle = '#145a22'; c.fillRect(b-9, T+(open?9:11), 18, open?4:1); if(open){ c.fillStyle = '#fff'; for(let x=-8;x<8;x+=4) c.fillRect(b+x, T+9, 2, 2); } c.fillStyle = '#ffd84d'; c.fillRect(b-6, T+6, 2, 2); c.fillRect(b+4, T+6, 2, 2); }
      else if(fly && fly.i===i && (fly.t>60 || tick%8<5)) stamp(c, FLYG, b-4, T+7+(tick%20<10?0:1));
    });
    const k = c.getTransform().a;
    c.shadowColor = time<300 ? '#ff4d6d' : time<900 ? '#ffd84d' : '#4dff88'; c.shadowBlur = 6*k; c.fillStyle = c.shadowColor; c.fillRect(20, 14*T+15, 200*time/TMAX, 8); c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(20, 14*T+15, 200*time/TMAX, 2);
    for(const r in lanes){
      const L = lanes[r], y = r*T;
      for(let i=0;i<L.n;i++){
        const x = itemX(L,i);
        if(L.kind==='turtle'){
          const d = diving(L,i), sink = d>=120 && d<160 || d>=230, gone = d>=160 && d<230;
          for(let kk=0;kk<L.k;kk++){
            const X = x+kk*18+2, Y = y+3;
            if(gone){ c.fillStyle = 'rgba(63,224,255,.6)'; c.fillRect(X+3, Y+6, 8, .8); c.fillRect(X+5, Y+9, 4, .8); continue; }
            stamp(c, TURT[sink ? 1 : 0], X, Y); c.fillStyle = sink ? '#2a9a6a' : '#4dff88'; c.fillRect(X + (L.dir<0 ? -2 : 13), Y+5, 3, 4);
          }
        } else stamp(c, itemSpr(L), x, L.kind==='log' ? y+3 : y);
      }
    }
    if(dead){
      const X = p.x+10, Y = p.y+10, r = (50-dead)/3;
      if(deadKind==='water'){ c.fillStyle = '#9fe8ff'; c.fillRect(X-r, Y, 3, 1); c.fillRect(X+r-2, Y, 3, 1); c.fillRect(X-1, Y-r*.6, 2, 1); c.fillRect(X-1, Y+r*.6, 2, 1); }
      else if(dead>10){ c.fillStyle = '#ffd84d'; c.fillRect(X-8, Y-2, 16, 5); c.fillStyle = '#ff8c2e'; c.fillRect(X-2, Y-1, 4, 2); c.fillStyle = '#04030c'; c.fillRect(X-5, Y-1, 2, 2); c.fillRect(X+3, Y-1, 2, 2); }
    } else {
      let X = p.x, Y = p.y; if(anim && from){ const kk = anim/5; X = p.x + (from.x-p.x)*kk; Y = p.y + (from.y-p.y)*kk - Math.sin(kk*Math.PI)*3; }
      stamp(c, CHG[face], X+3, Y+3);
    }
    P.draw(c);
  };
  return g;
}

/* ================= Cheese Chase ================= */
function chase(fx){
  const T = 12, MX = 6, MY = 34, COLS = 19, ROWS = 21;
  const MAP = [
    '###################','#........#........#','#o##.###.#.###.##o#','#.................#','#.##.#.#####.#.##.#','#....#...#...#....#',
    '####.### # ###.####','   #.#       #.#   ','####.# ##-## #.####','T   .  #   #  .   T','####.# ##### #.####','   #.#       #.#   ',
    '####.# ##### #.####','#........#........#','#.##.###.#.###.##.#','#o.#.....P.....#.o#','##.#.#.#####.#.#.##','#....#...#...#....#',
    '#.######.#.######.#','#.................#','###################'];
  const DIRS = {up:{x:0,y:-1}, left:{x:-1,y:0}, down:{x:0,y:1}, right:{x:1,y:0}}, DLIST = [DIRS.up, DIRS.left, DIRS.down, DIRS.right];
  const cell = (c,r) => r<0 || r>=ROWS ? '#' : MAP[r][(c+COLS)%COLS];
  const open = (c,r,door) => { const ch = cell(c,r); return ch!=='#' && (ch!=='-' || door); };
  const cx = c => MX + c*T + 6, cy = r => MY + r*T + 6;
  const flip = src => { const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; const x = cv.getContext('2d'); x.translate(src.width,0); x.scale(-1,1); x.drawImage(src,0,0); return cv; };
  const MOUSE = ['...........','..ee.......','.eppe......','.eppggggg..','..ggggggkg.','tggggggggn.','tggggggggn.','..gggggggg.','...gggggg..','..gg...gg..','...........'];
  const mpal = {g:'#c9cfdf', e:'#9aa2ba', p:'#ff9fc0', k:'#1a1c2c', n:'#ff7eb6', t:'#ff9fc0'};
  const M1 = spr(MOUSE, mpal), M2 = spr(MOUSE.map((r,i) => i===6 ? 'tgggggg....' : i===7 ? '..ggggggw..' : r), Object.assign({w:'#fff'}, mpal));
  const MS = [M1, M2].map(m => ({right:m, left:flip(m), up:rot(m,3), down:rot(m,1)}));
  const CAT = ['.c.......c.','.cc.....cc.','.ccccccccc.','.cwkcccwkc.','.cwkcccwkc.','.ccccccccc.','.cccpnpccc.','.ccccccccc.','.ccccccccc.','.cc.ccc.cc.','...........'];
  const catSpr = col => spr(CAT, {c:col, w:'#fff', k:'#1a1c2c', p:col, n:'#ffb3c7'});
  const SCARED = ['.c.......c.','.cc.....cc.','.ccccccccc.','.ccwcccwcc.','.ccwcccwcc.','.ccccccccc.','.cwcwcwcwc.','.ccwcwcwcc.','.ccccccccc.','.cc.ccc.cc.','...........'];
  const SC1 = spr(SCARED, {c:'#3d5bd9', w:'#ffe1ec'}), SC2 = spr(SCARED, {c:'#e8ecff', w:'#ff5a5f'});
  const EYES = spr(['...........','...........','...........','.ww....ww..','.wk....wk..','...........'], {w:'#fff', k:'#4cc9f0'});
  const CHEESE = spr(['....yy....','...yyyy...','..yyoyyy..','.yyyyyyoy.','yyoyyyyyyy','yyyyyoyyyy','oooooooooo'], {y:'#ffd166', o:'#f0a92e'});
  const BERRY = spr(['....gg...','...g.....','.rr.g.rr.','rrrrrrrrr','rwrrrrrrr','rrrrrrrrr','.rrrrrrr.','..rrrrr..','...rrr...'], {r:'#ff4d5a', w:'#ffb3b8', g:'#6fd36b'});
  const COLORS = ['#ff9f43','#ff7eb6','#4cc9f0','#7bd389'], CSPR = COLORS.map(catSpr), CORNER = [{c:17,r:1},{c:1,r:1},{c:17,r:19},{c:1,r:19}];
  let dots, left, pl, cats, level = 1, fright = 0, chain = 0, mode = 'scatter', modeT = 0, dead = 0, wait = 0, bonus = null, eaten = 0, tick = 0, want = null, extra = false, munch = 0;
  const g = {score:0, lives:3, over:false, pad:'dpad', info:'Level 1', hint:'Swipe anywhere on the screen to steer (one swipe, one turn), or keep your thumb on the arrow pad and slide it. You can turn early: the mouse turns at the next corner. Eat every crumb, and grab a big cheese to chase the cats.'};
  const P = Parts();
  function fill(){ dots = MAP.map(r => [...r].map(ch => ch==='.' || ch==='o' ? ch : '')); left = 150; eaten = 0; bonus = null; }
  function place(){
    pl = {x:cx(9), y:cy(15), dx:0, dy:0, acc:0, face:'left'}; want = null; fright = 0; chain = 0; mode = 'scatter'; modeT = 0; wait = 70;
    cats = [{c:9,r:7,st:'run',t:0},{c:9,r:9,st:'pen',t:120},{c:8,r:9,st:'pen',t:360},{c:10,r:9,st:'pen',t:600}].map((s,i) => ({i, x:cx(s.c), y:cy(s.r), dx:i?0:-1, dy:0, acc:0, st:s.st, t:s.t, scared:false}));
  }
  fill(); place();
  g.oneSwipe = true;   /* one swipe = one direction, so a thumb curling at the end doesn't change course */
  g._dbg = k => { if(k==='win'){ dots.forEach(r => r.fill('')); left = 0; } if(k==='fright'){ fright = 400; cats.forEach(a => { if(a.st==='run') a.scared = true; }); } };
  const atC = a => (a.x-MX-6) % T === 0 && (a.y-MY-6) % T === 0;
  const tc = a => Math.round((a.x-MX-6)/T), tr = a => Math.round((a.y-MY-6)/T);
  const wrap = a => { if(a.x < MX-6) a.x += COLS*T; else if(a.x > MX+COLS*T+6) a.x -= COLS*T; };
  function move(a, speed, decide){ a.acc += speed; while(a.acc >= 1){ a.acc -= 1; if(atC(a)) decide(a); a.x += a.dx; a.y += a.dy; wrap(a); } }
  function plDecide(a){
    const c = tc(a), r = tr(a), d = dots[r] && dots[r][(c+COLS)%COLS];
    if(d){
      dots[r][(c+COLS)%COLS] = ''; left--; eaten++;
      if(d==='o'){ g.score += 50; fright = Math.max(150, 400-level*40); chain = 0; SFX.power(); for(const k of cats) if(k.st==='run'){ k.scared = true; k.dx = -k.dx; k.dy = -k.dy; } }
      else { g.score += 10; tone(munch++%2 ? 520 : 440, .05, 'square', .035); }
      if(eaten===45 || eaten===105) bonus = {t:540};
    }
    if(bonus && c===9 && r===11){ const pts = 100*Math.min(level,5); g.score += pts; fx.msg('+'+pts); SFX.bonus(); bonus = null; }
    if(want && open(c+want.x, r+want.y)){ a.dx = want.x; a.dy = want.y; }
    if(!open(c+a.dx, r+a.dy)){ a.dx = 0; a.dy = 0; }
  }
  function target(a){
    if(a.st==='leave') return {c:9, r:7}; if(a.st==='eyes') return {c:9, r:9};
    if(mode==='scatter') return CORNER[a.i];
    const pc = tc(pl), pr = tr(pl);
    if(a.i===1) return {c:pc+pl.dx*3, r:pr+pl.dy*3};
    if(a.i===2){ const b = cats[0]; return {c:2*(pc+pl.dx*2)-tc(b), r:2*(pr+pl.dy*2)-tr(b)}; }
    if(a.i===3) return (pc-tc(a))**2 + (pr-tr(a))**2 > 36 ? {c:pc, r:pr} : CORNER[3];
    return {c:pc, r:pr};
  }
  function catDecide(a){
    const c = tc(a), r = tr(a);
    if(a.st==='pen'){ a.dx = 0; a.dy = 0; return; }
    if(a.st==='leave' && c===9 && r===7){ a.st = 'run'; }
    if(a.st==='eyes' && c===9 && r===9){ a.st = 'leave'; a.scared = false; }
    const door = a.st==='leave' || a.st==='eyes', tg = target(a);
    let opts = DLIST.filter(d => open(c+d.x, r+d.y, door) && !(d.x===-a.dx && d.y===-a.dy && (a.dx || a.dy)));
    if(!opts.length) opts = DLIST.filter(d => open(c+d.x, r+d.y, door));
    if(!opts.length){ a.dx = 0; a.dy = 0; return; }
    let best = opts[0];
    if(a.scared && a.st==='run') best = pick(opts);
    else { let bd = 1e9; for(const d of opts){ const dist = (c+d.x-tg.c)**2 + (r+d.y-tg.r)**2; if(dist < bd){ bd = dist; best = d; } } }
    a.dx = best.x; a.dy = best.y;
  }
  g.update = inp => {
    tick++; P.step();
    for(const k of inp.tap) if(DIRS[k]) want = DIRS[k];
    if(dead){ if(--dead===0){ if(g.lives<=0) g.over = true; else place(); } return; }
    if(wait){ wait--; return; }
    if(!left){ level++; g.score += 200; g.info = 'Level '+level; SFX.level(); fx.msg('Level '+level); fill(); place(); return; }
    if(bonus && --bonus.t<=0) bonus = null;
    if(fright){ if(--fright===0){ for(const k of cats) k.scared = false; } }
    else if(++modeT >= (mode==='scatter' ? 60*6 : 60*20)){ modeT = 0; mode = mode==='scatter' ? 'chase' : 'scatter'; for(const k of cats) if(k.st==='run'){ k.dx = -k.dx; k.dy = -k.dy; } }
    /* player */
    if(want && (pl.dx || pl.dy) && want.x===-pl.dx && want.y===-pl.dy){ pl.dx = want.x; pl.dy = want.y; }
    move(pl, Math.min(1.35, 1.08 + level*.04), plDecide);
    if(pl.dx || pl.dy) pl.face = pl.dx>0 ? 'right' : pl.dx<0 ? 'left' : pl.dy<0 ? 'up' : 'down';
    /* cats */
    const cs = Math.min(1.3, .92 + level*.06);
    for(const a of cats){
      if(a.st==='pen'){ if(--a.t<=0) a.st = 'leave'; continue; }
      move(a, a.st==='eyes' ? 2.2 : a.scared ? .6 : cs, catDecide);
      if(Math.abs(a.x-pl.x) + Math.abs(a.y-pl.y) < 9){
        if(a.st==='eyes') continue;
        if(a.scared){ const pts = 200 * 2**Math.min(3, chain++); g.score += pts; fx.msg('+'+pts); SFX.bonus(); P.burst(a.x, a.y, COLORS[a.i], 12, 1.8); a.st = 'eyes'; a.scared = false; a.x = cx(tc(a)); a.y = cy(tr(a)); a.acc = 0; }
        else { g.lives--; dead = 80; SFX.squash(); tone(196, .3, 'triangle', .08, -90, .2); fx.shake(6); P.burst(pl.x, pl.y, '#c9cfdf', 18, 2); return; }
      }
    }
    if(!extra && g.score >= 3000){ extra = true; g.lives++; SFX.life(); fx.msg('Extra life'); }
  };
  const BG = {}, CHEESE_G = neonPix(CHEESE, '#ffd84d'), BERRY_G = neonPix(BERRY, '#ff4d6d'), EYES_G = neonPix(EYES, '#3fe0ff'), SC1G = neonPix(SC1, '#4d7cff'), SC2G = neonPix(SC2, '#e8ecff');
  const CATG = CSPR.map((s,i) => neonPix(s, COLORS[i])), MSG = MS.map(m => { const o = {}; for(const k in m) o[k] = neonPix(m[k], '#d8deff'); return o; });
  const DOT = glow(2, 2, x => { halo(x, '#ffd98a', 2); x.fillStyle = '#ffe7b0'; x.fillRect(0,0,2,2); }, 3);
  g.draw = c => {
    bgCache(c, BG, 'm', x => {
      x.fillStyle = '#04030c'; x.fillRect(0,0,W,H);
      const wall = (r, cc) => r<0 || r>=ROWS || cc<0 || cc>=COLS ? false : MAP[r][cc]==='#', i = 2.5;
      x.fillStyle = '#070b2c';
      for(let r=0;r<ROWS;r++) for(let cc=0;cc<COLS;cc++) if(MAP[r][cc]==='#') x.fillRect(MX+cc*T, MY+r*T, T, T);
      x.beginPath();
      for(let r=0;r<ROWS;r++) for(let cc=0;cc<COLS;cc++){
        if(MAP[r][cc]!=='#') continue;
        const X = MX+cc*T, Y = MY+r*T, up = wall(r-1,cc), dn = wall(r+1,cc), lf = wall(r,cc-1), rt = wall(r,cc+1);
        if(!up){ x.moveTo(lf ? X : X+i, Y+i); x.lineTo(rt ? X+T : X+T-i, Y+i); }
        if(!dn){ x.moveTo(lf ? X : X+i, Y+T-i); x.lineTo(rt ? X+T : X+T-i, Y+T-i); }
        if(!lf){ x.moveTo(X+i, up ? Y : Y+i); x.lineTo(X+i, dn ? Y+T : Y+T-i); }
        if(!rt){ x.moveTo(X+T-i, up ? Y : Y+i); x.lineTo(X+T-i, dn ? Y+T : Y+T-i); }
        /* inside corners: wall continues both ways but the diagonal cell is open */
        if(up && lf && !wall(r-1,cc-1)){ x.moveTo(X+i, Y); x.lineTo(X+i, Y+i); x.lineTo(X, Y+i); }
        if(up && rt && !wall(r-1,cc+1)){ x.moveTo(X+T-i, Y); x.lineTo(X+T-i, Y+i); x.lineTo(X+T, Y+i); }
        if(dn && lf && !wall(r+1,cc-1)){ x.moveTo(X+i, Y+T); x.lineTo(X+i, Y+T-i); x.lineTo(X, Y+T-i); }
        if(dn && rt && !wall(r+1,cc+1)){ x.moveTo(X+T-i, Y+T); x.lineTo(X+T-i, Y+T-i); x.lineTo(X+T, Y+T-i); }
      }
      halo(x, '#4d7cff', 4); x.strokeStyle = '#6f95ff'; x.lineWidth = 1.2; x.stroke(); noHalo(x); x.strokeStyle = 'rgba(200,215,255,.55)'; x.lineWidth = .4; x.stroke();
      for(let r=0;r<ROWS;r++) for(let cc=0;cc<COLS;cc++) if(MAP[r][cc]==='-'){ halo(x, '#ff3cc8', 3); x.fillStyle = '#ff9be6'; x.fillRect(MX+cc*T, MY+r*T+5, T, 1.5); noHalo(x); }
    });
    for(let r=0;r<ROWS;r++) for(let k=0;k<COLS;k++){
      const d = dots[r][k]; if(!d) continue;
      if(d==='.') stamp(c, DOT, cx(k)-1, cy(r)-1);
      else if(tick%30 < 22) stampC(c, CHEESE_G, cx(k), cy(r));
    }
    if(bonus && (bonus.t>120 || tick%10<6)) stamp(c, BERRY_G, cx(9)-4, cy(11)-5);
    for(const a of cats){
      const X = a.x-5, Y = a.y-5 + (a.st==='pen' && tick%40<20 ? 1 : 0);
      if(a.st==='eyes') stamp(c, EYES_G, X, Y+1);
      else if(a.scared) stamp(c, fright<120 && tick%16<8 ? SC2G : SC1G, X, Y);
      else stamp(c, CATG[a.i], X, Y);
    }
    if(dead){ if(dead>20){ const kk = (80-dead)/60, s = Math.max(0, 11*(1-kk)); if(s>.5){ c.save(); c.translate(pl.x, pl.y); c.rotate(kk*9); c.scale(s/11, s/11); stamp(c, MSG[0].right, -5.5, -5.5); c.restore(); } } }
    else stamp(c, MSG[(pl.dx || pl.dy) && tick%14<7 ? 1 : 0][pl.face], pl.x-5, pl.y-5);
    P.draw(c);
  };
  return g;
}

/* ================= Block Drop ================= */
function blocks(fx){
  const COLS = 10, ROWS = 22, HID = 2, S = 14, BX = 8, BY = 30;   /* two hidden rows above the visible 20 */
  const SHAPES = {
    I:[[0,1],[1,1],[2,1],[3,1]], O:[[1,0],[2,0],[1,1],[2,1]], T:[[1,0],[0,1],[1,1],[2,1]], S:[[1,0],[2,0],[0,1],[1,1]],
    Z:[[0,0],[1,0],[1,1],[2,1]], J:[[0,0],[0,1],[1,1],[2,1]], L:[[2,0],[0,1],[1,1],[2,1]]
  };
  const COL = {I:'#4cc9f0', O:'#ffd166', T:'#b388ff', S:'#59c36a', Z:'#ff5a5f', J:'#4d7cff', L:'#ff9f43'};
  const GRAV = [48,42,37,32,27,22,18,14,10,8,7,6,5,5,4,4,3,3,3,2];
  const size = t => t==='I' ? 4 : t==='O' ? 4 : 3;
  function cells(t, r){   /* rotate the shape r quarter-turns inside its box */
    const n = size(t); let c = SHAPES[t].map(([x,y]) => [x,y]);
    if(t==='O') return c;
    for(let k=0;k<(r%4+4)%4;k++) c = c.map(([x,y]) => [n-1-y, x]);
    return c;
  }
  let grid, bag = [], next = [], cur, hold = null, held = false, lines = 0, level = 1, gT = 0, lockT = 0, resets = 0, das = 0, clearing = null, tick = 0, sdT = 0;
  const g = {score:0, lives:null, over:false, pad:'dpadfire', fireLabel:'Drop', info:'Level 1', music:'blocks', hint:'Tap the screen (or ▲) to turn a block. Drag or use ◀ ▶ to slide it, drag down or hold ▼ to speed it up, and flick down or tap Drop to slam it in. Swipe up to put a block on hold for later. Fill a whole row to clear it.'};
  const P = Parts();
  const refill = () => { const b = Object.keys(SHAPES); for(let i=b.length-1;i>0;i--){ const j = rnd(i+1); [b[i],b[j]] = [b[j],b[i]]; } bag.push(...b); };
  const take = () => { while(next.length < 4){ if(!bag.length) refill(); next.push(bag.shift()); } const t = next.shift(); while(next.length < 3){ if(!bag.length) refill(); next.push(bag.shift()); } return t; };
  const fits = (t, r, x, y) => cells(t, r).every(([cx,cy]) => { const X = x+cx, Y = y+cy; return X>=0 && X<COLS && Y<ROWS && (Y<0 || !grid[Y][X]); });
  function spawn(t){
    cur = {t, r:0, x:3, y:t==='I' ? 0 : 1}; gT = 0; lockT = 0; resets = 0;
    if(!fits(cur.t, cur.r, cur.x, cur.y)){ cur.y--; if(!fits(cur.t, cur.r, cur.x, cur.y)){ g.over = true; } }
  }
  grid = Array.from({length:ROWS}, () => Array(COLS).fill(''));
  spawn(take());
  g._dbg = k => { if(k==='rows'){ grid.forEach(r => r.fill('')); for(let y=ROWS-4;y<ROWS;y++) for(let x=0;x<COLS;x++) grid[y][x] = x===4 ? '' : 'J'; } if(typeof k==='number'){ lines = (k-1)*10; level = k; g.info = 'Level '+k; } };
  g.musicStep = () => Math.max(.1, .19 - (level-1)*.008);   /* tune quickens with each level */
  g._st = () => ({t:cur.t, x:cur.x, y:cur.y, r:cur.r, lines, level, hold, next:next.slice(), filled:grid.flat().filter(Boolean).length});
  const ground = () => !fits(cur.t, cur.r, cur.x, cur.y+1);
  const touched = () => { if(ground() && resets < 15){ lockT = 0; resets++; } };
  function shift(dx){ if(fits(cur.t, cur.r, cur.x+dx, cur.y)){ cur.x += dx; tone(300, .025, 'square', .02); touched(); return true; } return false; }
  function turn(){
    const r = cur.r+1;
    for(const [kx,ky] of [[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0],[-1,-1],[1,-1]]){
      if(fits(cur.t, r, cur.x+kx, cur.y+ky)){ cur.x += kx; cur.y += ky; cur.r = r; tone(520, .04, 'square', .03); touched(); return; }
    }
  }
  function lock(){
    let top = ROWS;
    for(const [cx,cy] of cells(cur.t, cur.r)){ const X = cur.x+cx, Y = cur.y+cy; if(Y<0){ g.over = true; return; } grid[Y][X] = cur.t; top = Math.min(top, Y); }
    tone(160, .06, 'triangle', .08);
    const full = []; for(let y=0;y<ROWS;y++) if(grid[y].every(Boolean)) full.push(y);
    if(top < HID && !full.length){ g.over = true; return; }
    held = false;
    if(full.length){
      clearing = {rows:full, t:20};
      const pts = [0,100,300,500,800][full.length] * level; g.score += pts;
      if(full.length===4){ SFX.level(); fx.msg('Four lines! +'+pts); fx.shake(5); } else if(full.length>1){ SFX.bonus(); fx.msg(full.length+' lines! +'+pts); } else SFX.eat();
      for(const y of full) for(let x=0;x<COLS;x++) P.burst(BX+x*S+7, BY+(y-HID)*S+7, COL[grid[y][x]] || '#fff', 2, 1.4);
      cur = null; return;
    }
    spawn(take());
  }
  function hardDrop(){ let n = 0; while(fits(cur.t, cur.r, cur.x, cur.y+1)){ cur.y++; n++; } g.score += n*2; SFX.paddle(); if(n) fx.shake(2); lock(); }
  function swapHold(){
    if(held) return; held = true; SFX.clank();
    const t = cur.t; if(hold){ const h = hold; hold = t; spawn(h); } else { hold = t; spawn(take()); }
    held = true;
  }
  g.update = inp => {
    tick++; P.step();
    if(clearing){
      if(--clearing.t > 0) return;
      const rows = clearing.rows; clearing = null;
      grid = grid.filter((r,y) => !rows.includes(y)); while(grid.length < ROWS) grid.unshift(Array(COLS).fill(''));
      const before = level; lines += rows.length; level = 1 + Math.floor(lines/10);
      if(level > before){ SFX.level(); fx.msg('Level '+level); }
      g.info = 'Level '+level;
      spawn(take()); return;
    }
    if(!cur) return;
    for(const k of inp.tap){
      if(!cur) break;
      if(k==='left' || k==='right'){ shift(k==='left' ? -1 : 1); das = 10; }
      else if(k==='up' || k==='rot') turn();
      else if(k==='fire' || k==='drop'){ hardDrop(); return; }
      else if(k==='hold'){ swapHold(); return; }
    }
    const dir = inp.held.left && !inp.held.right ? -1 : inp.held.right && !inp.held.left ? 1 : 0;
    if(dir){ if(das > 0) das--; else { shift(dir); das = 3; } }
    const soft = inp.held.down;
    if(ground()){
      if(++lockT >= 30) lock();
    } else {
      lockT = 0;
      if(soft){ if(++sdT >= 2){ sdT = 0; cur.y++; g.score += 1; gT = 0; } }
      else if(++gT >= GRAV[Math.min(level, GRAV.length)-1]){ gT = 0; cur.y++; }
    }
  };
  const CG = {}, cellSpr = col => CG[col] || (CG[col] = glow(S, S, x => {
    halo(x, col, 3); rpath(x, 1.4, 1.4, S-2.8, S-2.8, 2); x.fillStyle = col+'40'; x.fill(); x.strokeStyle = col; x.lineWidth = 1.2; x.stroke(); noHalo(x);
    x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = .5; rpath(x, 2.8, 2.8, S-5.6, S-5.6, 1.2); x.stroke(); x.fillStyle = col; x.fillRect(S/2-1, S/2-1, 2, 2);
  }, 4));
  function cell(c, x, y, col, ghost){
    const X = BX + x*S, Y = BY + (y-HID)*S;
    if(ghost){ c.save(); c.globalAlpha = .55; c.strokeStyle = col; c.lineWidth = .8; c.setLineDash([2,2]); c.strokeRect(X+2, Y+2, S-4, S-4); c.restore(); return; }
    stamp(c, cellSpr(col), X, Y);
  }
  function mini(c, t, x, y, s){
    if(!t) return; const cs = cells(t, 0), minx = Math.min(...cs.map(a => a[0])), maxx = Math.max(...cs.map(a => a[0])), miny = Math.min(...cs.map(a => a[1])), maxy = Math.max(...cs.map(a => a[1]));
    const ox = x - (maxx-minx+1)*s/2, oy = y - (maxy-miny+1)*s/2;
    for(const [cx,cy] of cs) stampS(c, cellSpr(COL[t]), ox+(cx-minx)*s, oy+(cy-miny)*s, s/S);
  }

  const BG = {};
  g.draw = c => {
    const PX = BX + COLS*S + 10, PW = W - PX - 6, BH2 = (ROWS-HID)*S;
    const boxes = [['NEXT', BY-2, 118], ['HOLD', BY+124, 54], ['LINES', BY+186, 40], ['LEVEL', BY+232, 40]];
    bgCache(c, BG, 'b', x => {
      x.fillStyle = '#04030c'; x.fillRect(0,0,W,H);
      synthFloor(x, 214, 'rgba(180,60,255,.2)');
      x.fillStyle = 'rgba(4,3,12,.9)'; x.fillRect(BX-2, BY-2, COLS*S+4, BH2+4);
      x.strokeStyle = 'rgba(63,224,255,.08)'; x.lineWidth = .5; x.beginPath();
      for(let i=1;i<COLS;i++){ x.moveTo(BX+i*S, BY); x.lineTo(BX+i*S, BY+BH2); } for(let j=1;j<ROWS-HID;j++){ x.moveTo(BX, BY+j*S); x.lineTo(BX+COLS*S, BY+j*S); } x.stroke();
      halo(x, '#3fe0ff', 5); x.strokeStyle = '#3fe0ff'; x.lineWidth = 1.2; x.strokeRect(BX-2.5, BY-2.5, COLS*S+5, BH2+5); noHalo(x);
      x.font = '700 9px Fredoka, sans-serif'; x.textAlign = 'center';
      for(const [label, y, h] of boxes){
        x.fillStyle = 'rgba(4,3,12,.9)'; x.fillRect(PX, y, PW, h);
        halo(x, '#ff3cc8', 4); x.strokeStyle = '#ff3cc8'; x.lineWidth = 1; x.strokeRect(PX+.5, y+.5, PW-1, h-1);
        halo(x, '#ff3cc8', 2); x.fillStyle = '#ffb3ec'; x.fillText(label, PX+PW/2, y+12); noHalo(x);
      }
    });
    for(let y=HID;y<ROWS;y++) for(let x=0;x<COLS;x++){
      const t = grid[y][x]; if(!t) continue;
      if(clearing && clearing.rows.includes(y)){ if(clearing.t%6 < 3) cell(c, x, y, '#ffffff'); continue; }
      cell(c, x, y, COL[t]);
    }
    if(cur){
      let gy = cur.y; while(fits(cur.t, cur.r, cur.x, gy+1)) gy++;
      for(const [cx,cy] of cells(cur.t, cur.r)) if(gy+cy >= HID) cell(c, cur.x+cx, gy+cy, COL[cur.t], true);
      for(const [cx,cy] of cells(cur.t, cur.r)) if(cur.y+cy >= HID) cell(c, cur.x+cx, cur.y+cy, COL[cur.t]);
    }
    next.slice(0,3).forEach((t,i) => mini(c, t, PX+PW/2, BY+30+i*32, i ? 7 : 9));
    mini(c, hold, PX+PW/2, BY+156, 8); if(held && hold){ c.fillStyle = 'rgba(4,3,12,.6)'; c.fillRect(PX+1, BY+137, PW-2, 40); }
    glowText(c, String(lines), PX+PW/2, BY+218, '#ffffff', 15);
    glowText(c, String(level), PX+PW/2, BY+264, '#ffd84d', 15);
    P.draw(c);
  };
  return g;
}

const MAKE = {snake, bricks, blasters, hopper, chase, blocks};
const NAMES = {snake:'Snake', bricks:'Brick Breaker', blasters:'Space Blasters', hopper:'Road Hopper', chase:'Cheese Chase', blocks:'Block Drop'};

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
.g-stage canvas{border-radius:8px;box-shadow:0 0 0 1px #3a1f5c,0 0 22px rgba(255,60,200,.16);background:#04030c}
.g-info{position:absolute;left:8px;top:6px;font-size:13px;line-height:1.2;font-weight:600;color:#fff;background:rgba(11,13,28,.6);border-radius:6px;padding:2px 7px;pointer-events:none}
.g-msg{position:absolute;left:0;right:0;top:38%;text-align:center;font-size:26px;line-height:1.2;font-weight:700;color:#ffc93c;text-shadow:0 2px 0 #231c4f,0 0 12px rgba(0,0,0,.8);pointer-events:none;opacity:0;transition:opacity .25s}
.g-msg.on{opacity:1}
.g-panel{position:absolute;inset:0;z-index:3;display:none;align-items:safe center;justify-content:center;background:rgba(11,13,28,.82);padding:calc(env(safe-area-inset-top) + 66px) 16px calc(env(safe-area-inset-bottom) + 16px);overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.g-bar{position:relative;z-index:4}
.g-panel.on{display:flex}
.g-card{background:#fff;color:#231c4f;border-radius:22px;padding:22px 20px;max-width:340px;width:100%;text-align:center;line-height:1.3;margin:auto 0}
#ep-game .g-card h2{margin:0 0 6px;font-size:26px;font-weight:700;color:#231c4f}
.g-card p{margin:0 0 14px;color:#6a6391;font-size:16px}
.g-card .big{font-size:54px;font-weight:700;line-height:1;margin:4px 0 6px}
#ep-game .g-card button{display:block;width:100%;min-height:48px;border-radius:999px;font-weight:600;font-size:17px;margin-top:8px;background:#231c4f;color:#fff}
#ep-game .g-card button.gold{background:#ffc93c;color:#231c4f}
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
#ep-game .g-card h2{font-size:clamp(24px,3.8vmin,36px)}
.g-card p{font-size:clamp(15px,2.3vmin,20px)}
.g-card .big{font-size:clamp(50px,8vmin,80px)}
#ep-game .g-card button{min-height:clamp(48px,6.4vmin,62px);font-size:clamp(16px,2.4vmin,21px)}

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
    <div class="g-stage"><div class="g-wrap"><canvas width="${W}" height="${H}"></canvas><div class="g-info"></div><div class="g-msg"></div></div></div><div class="g-panel"></div>
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
  muteBtn.onclick = () => { AU.muted = !AU.muted; try{ localStorage.setItem('ep_mute', AU.muted ? '1' : '0'); }catch(e){} if(AU.muted){ auRest(); musicStop(); } else { auInit(); tone(660, .08, 'square', .05); } paintMute(); };

  const fit = () => { const r = stage.getBoundingClientRect(); let sc = Math.max(0.5, Math.min((r.width-12)/W, (r.height-8)/H)); const whole = Math.floor(sc); if(whole >= 2 && sc - whole < sc*.08) sc = whole; /* crisp whole-pixel scale when it costs little size */ cv.style.width = Math.round(W*sc)+'px'; cv.style.height = Math.round(H*sc)+'px';
    /* Draw at the screen's real pixel density (whole-number multiple of the game grid) instead of letting the browser
       stretch a small 240x320 picture, which iPhones and iPads blur. Pixel art stays sharp with smoothing off. */
    const k = Math.max(1, Math.min(6, Math.ceil(sc*(window.devicePixelRatio||1) - .05)));
    if(cv.width !== W*k){ cv.width = W*k; cv.height = H*k; }
    c.setTransform(k, 0, 0, k, 0, 0); c.imageSmoothingEnabled = false;
    if(g && state!=='play') g.draw(c); };
  const fresh = () => { g = MAKE[opts.game](fx); inp.tap.length = 0; inp.held = {}; inp.px = null; acc = 0; lastHud = ''; drag = null; padId = null; fireId = null; root.querySelectorAll('.dn').forEach(x => x.classList.remove('dn'));
    q('.g-dpad').className = 'g-dpad' + (g.pad==='lrfire' ? ' lr' : ''); q('.g-dpad .u').hidden = q('.g-dpad .d').hidden = g.pad==='lrfire';
    q('.g-fire').style.display = g.pad==='lrfire' || g.pad==='dpadfire' ? '' : 'none'; q('.g-fire').textContent = g.fireLabel || 'Fire'; fit(); };
  let shownAt = 0;
  const show = html => { panel.innerHTML = `<div class="g-card">${html}</div>`; panel.classList.add('on'); panel.scrollTop = 0; shownAt = performance.now(); };
  const hide = () => { panel.classList.remove('on'); panel.innerHTML = ''; };
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
  const hud = () => {
    const t = opts.test ? 'Test' : (left()>0 ? fmt(left()) : (state==='play' ? 'Last game' : '0:00'));
    const key = g.score+'|'+g.lives+'|'+t+'|'+g.info+'|'+g.fireLabel; if(key===lastHud) return; lastHud = key;
    q('.g-score').textContent = g.score; q('.g-lives').textContent = g.lives==null ? '' : '♥'.repeat(Math.max(0,g.lives));
    q('.g-time').textContent = t; q('.g-time').classList.toggle('out', !opts.test && left()<=0);
    q('.g-info').textContent = g.info || ''; q('.g-info').style.display = g.info ? '' : 'none';
    if(g.fireLabel && q('.g-fire').textContent !== g.fireLabel) q('.g-fire').textContent = g.fireLabel;
  };
  const ready = () => { state = 'ready'; musicStop(true); fresh(); g.draw(c); hud();
    if(left()<=0) return show(`<h2>No game time left</h2><p>Earn more game time, then come back and play.</p><button data-a="quit">Back to games</button>`);
    show(`<h2>${NAMES[opts.game]}</h2><p>${g.hint}</p><button class="gold" data-a="start">Start</button>`); };
  const play = () => { auInit(); hide(); state = 'play'; last = performance.now(); };
  const pause = () => { if(state!=='play') return; state = 'pause'; musicStop(); auRest(); opts.flush && opts.flush(); show(`<h2>Paused</h2><p>${opts.test ? 'Test mode.' : 'Your game time is not counting down.'}</p><button class="gold" data-a="resume">Keep playing</button><button data-a="quit">Back to games</button>`); };
  const over = () => {
    state = 'over'; musicStop(true); SFX.over(); setTimeout(auRest, 1200); const prev = opts.test ? 0 : opts.best(), isBest = !opts.test && g.score>prev && g.score>0;
    if(!opts.test){ opts.onScore(g.score); opts.flush(); }
    const again = left()>0;
    show(`<h2>Game over</h2><div class="big">${g.score}</div><p>${isBest ? 'New best score!' : opts.test ? 'Test mode. Scores are not saved.' : 'Your best: '+Math.max(prev,g.score)}</p>
      ${again ? '<button class="gold" data-a="again">Play again</button>' : '<p>Your game time is used up. Earn more to play again.</p>'}<button data-a="quit">Back to games</button>`);
    hud();
  };
  const close = silent => { if(closed) return; closed = true; musicStop(true); auRest(); cancelAnimationFrame(raf); clearTimeout(msgT); if(!opts.test) opts.flush();
    if(!opts.test && opts.onQuit && g && (state==='play' || state==='pause') && g.score>0) opts.onQuit(g.score);
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', fit); document.removeEventListener('visibilitychange', vis); if(ro) ro.disconnect();
    root.remove(); current = null; if(!silent && opts.onClose) opts.onClose(); };

  const doAct = a => { if(closed) return;
    if(a==='start' || a==='resume') play(); else if(a==='again'){ ready(); if(left()>0) play(); } else if(a==='quit') close(); };
  /* Tap = finger down and up on the same button. A finger already on the screen when a card pops up
     (still steering when the game ends) doesn't count, so a stray tap can't hit Play again by accident. */
  let down = null, lastTap = 0;
  root.addEventListener('pointerdown', e => { const b = e.target.closest('[data-a],.g-x,.g-pause'); down = b ? {b, t:performance.now()} : null; }, true);
  root.addEventListener('pointerup', e => {
    const b = e.target.closest('[data-a],.g-x,.g-pause'), d = down; down = null;
    if(!b || !d || d.b!==b) return;
    if(b.dataset.a && d.t < shownAt) return;
    lastTap = performance.now(); e.preventDefault();
    if(b.classList.contains('g-x')) close(); else if(b.classList.contains('g-pause')) pause(); else doAct(b.dataset.a);
  });
  root.addEventListener('click', e => {   /* keyboard / assistive-tech fallback; ignored right after a tap */
    const b = e.target.closest('[data-a],.g-x,.g-pause'); if(!b || performance.now()-lastTap < 700) return;
    if(b.classList.contains('g-x')) close(); else if(b.classList.contains('g-pause')) pause(); else doAct(b.dataset.a);
  });

  /* input */
  const KEYS = {ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', ' ':'fire', a:'left', d:'right', w:'up', s:'down', c:'hold', Shift:'hold'};
  const kd = e => { const k = KEYS[e.key]; if(!k) return; e.preventDefault(); if(!inp.held[k]) inp.tap.push(k); inp.held[k] = true; };
  const ku = e => { const k = KEYS[e.key]; if(k) inp.held[k] = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  /* Arrow pad works like a thumb pad: press anywhere on it and slide to change direction without lifting.
     Each pad tracks its own finger, so moving and firing at the same time works. */
  const dpad = q('.g-dpad'), fireB = q('.g-fire');
  const setDir = d => { for(const k of ['up','down','left','right']){ const on = k===d; if(on && !inp.held[k]) inp.tap.push(k); inp.held[k] = on; const bt = dpad.querySelector(`[data-k=${k}]`); if(bt) bt.classList.toggle('dn', on); } };
  const padDir = e => { const r = dpad.getBoundingClientRect(), x = e.clientX-(r.left+r.width/2), y = e.clientY-(r.top+r.height/2);
    if(g.pad==='lrfire') return Math.abs(x) < 6 ? null : x<0 ? 'left' : 'right';
    if(Math.hypot(x,y) < 10) return null;
    return Math.abs(x) > Math.abs(y) ? (x<0 ? 'left' : 'right') : (y<0 ? 'up' : 'down'); };
  let padId = null;
  dpad.addEventListener('pointerdown', e => { e.preventDefault(); padId = e.pointerId; try{ dpad.setPointerCapture(e.pointerId); }catch(err){} const d = padDir(e); if(d) setDir(d); });
  dpad.addEventListener('pointermove', e => { if(e.pointerId!==padId) return; const d = padDir(e); if(d && !inp.held[d]) setDir(d); });
  const padUp = e => { if(e.pointerId!==padId) return; padId = null; setDir(null); };
  dpad.addEventListener('pointerup', padUp); dpad.addEventListener('pointercancel', padUp);
  let fireId = null;
  fireB.addEventListener('pointerdown', e => { e.preventDefault(); fireId = e.pointerId; try{ fireB.setPointerCapture(e.pointerId); }catch(err){} inp.held.fire = true; inp.tap.push('fire'); fireB.classList.add('dn'); });
  const fireUp = e => { if(e.pointerId!==fireId) return; fireId = null; fireB.classList.remove('dn'); inp.held.fire = !!(drag && g.autoFire); };
  fireB.addEventListener('pointerup', fireUp); fireB.addEventListener('pointercancel', fireUp);

  /* Touching anywhere else on the game screen (game, side space, below it):
     - Brick Breaker, Space Blasters: drag left/right to move. The ship moves with your finger from where it is,
       so your finger never has to cover it. In Space Blasters the ship keeps firing while you drag.
     - Maze and hopping games: swipe in any direction to turn or hop. */
  let drag = null;
  /* Swipe games follow every finger on its own, so a thumb resting on the screen never blocks a swipe from the other hand.
     One swipe = one turn; to turn again without lifting, drag clearly a new way (about half an inch), so a small curl
     at the end of a swipe never counts. */
  const swipes = new Map(), AGAIN = 40;
  root.addEventListener('pointerdown', e => {
    if(e.target.closest('.g-bar,.g-dpad,.g-fire,.g-panel')) return;
    if(g.pad==='dpad'){ e.preventDefault(); swipes.set(e.pointerId, {x:e.clientX, y:e.clientY, last:null, onCanvas:!!e.target.closest('canvas')}); return; }
    if(drag) return;
    e.preventDefault();
    drag = {id:e.pointerId, x:e.clientX, y:e.clientY, moved:false, onCanvas:!!e.target.closest('canvas')};
    if(g.pad==='lrfire'){ drag.sx = g.ctrlX ? g.ctrlX() : W/2; inp.px = drag.sx; inp.tap.push('fire'); if(g.autoFire) inp.held.fire = true; }
    if(g.pad==='dpadfire'){ drag.t0 = performance.now(); drag.ox = e.clientX; drag.oy = e.clientY; drag.axis = null; drag.hist = [[drag.t0, e.clientY]]; }
  });
  root.addEventListener('pointermove', e => {
    const sw = swipes.get(e.pointerId);
    if(sw){
      const dx = e.clientX-sw.x, dy = e.clientY-sw.y, dist = Math.max(Math.abs(dx), Math.abs(dy));
      const dir = Math.abs(dx)>Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
      if(sw.last && dir===sw.last){ sw.x = e.clientX; sw.y = e.clientY; return; }   /* still going the same way: keep the start point with the finger */
      if(dist > (sw.last ? AGAIN : 14)){ inp.tap.push(dir); sw.last = dir; sw.x = e.clientX; sw.y = e.clientY; }
      return;
    }
    if(!drag || e.pointerId!==drag.id) return;
    const dx = e.clientX-drag.x, dy = e.clientY-drag.y;
    if(g.pad==='lrfire'){ const r = cv.getBoundingClientRect(); inp.px = clamp(drag.sx + dx*(W/r.width)*1.25, 0, W); if(Math.abs(dx) > 4) drag.moved = true; return; }
    if(g.pad==='dpadfire'){
      const step = Math.max(22, cv.getBoundingClientRect().width/W*14*1.5);   /* about 1.5 block widths per column */
      if(!drag.axis && Math.max(Math.abs(e.clientX-drag.ox), Math.abs(e.clientY-drag.oy)) > 16) drag.axis = Math.abs(e.clientX-drag.ox) >= Math.abs(e.clientY-drag.oy) ? 'x' : 'y';
      if(drag.axis==='x'){ while(Math.abs(e.clientX-drag.x) >= step){ const s1 = Math.sign(e.clientX-drag.x); inp.tap.push(s1>0 ? 'right' : 'left'); drag.x += s1*step; drag.moved = true; } }
      const now = performance.now(); drag.hist.push([now, e.clientY]); while(drag.hist.length > 2 && now-drag.hist[0][0] > 150) drag.hist.shift();
      if(drag.axis==='y'){ const dyAll = e.clientY-drag.oy; drag.maxDy = Math.max(drag.maxDy||0, dyAll); inp.held.down = dyAll > 45; if(Math.abs(dyAll) > 16) drag.moved = true; }
      return;
    }
  });
  const dragEnd = (e, cancel) => {
    const sw = swipes.get(e.pointerId);
    if(sw){ swipes.delete(e.pointerId); if(!cancel && !sw.last && sw.onCanvas && opts.game==='hopper') inp.tap.push('up'); return; }
    if(!drag || e.pointerId!==drag.id) return;
    if(!cancel && !drag.moved && drag.onCanvas && opts.game==='hopper') inp.tap.push('up');
    if(g.pad==='dpadfire'){
      if(padId===null) inp.held.down = false;
      const dy = e.clientY-drag.oy, h0 = drag.hist[0], v = (e.clientY-h0[1])/Math.max(performance.now()-h0[0],1);   /* speed over the last moment */
      if(!cancel){
        if(!drag.moved) inp.tap.push('rot');
        else if(drag.axis==='y' && dy > 60 && v > 0.7) inp.tap.push('drop');
        else if(drag.axis==='y' && dy < -60 && !(drag.maxDy > 20))   /* only a swipe that starts upward holds, not easing back up after speeding down */ inp.tap.push('hold');
      }
    }
    if(g.pad==='lrfire'){ inp.px = null; if(g.autoFire) inp.held.fire = fireId!==null; }
    drag = null;
  };
  root.addEventListener('pointerup', e => dragEnd(e, false)); root.addEventListener('pointercancel', e => dragEnd(e, true));
  root.addEventListener('contextmenu', e => e.preventDefault());
  root.addEventListener('touchstart', e => { if(e.touches.length > 1) e.preventDefault(); }, {passive:false});
  root.addEventListener('dblclick', e => e.preventDefault());
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
      if(g.music && !g.over) musicTick(g.music, g.musicStep ? g.musicStep() : .19);
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
