/* ============================================
   fx.js: cursor, hover and click effects
   Loaded with `defer` after js/vendor/gsap.min.js.
   Everything here is decoration. If GSAP is missing or the visitor
   prefers reduced motion, the page keeps its plain behaviour.
   ============================================ */
(function () {
    'use strict';

    /* ---------- Game of Life settings (from the Life Cursor Lab) ----------
       cursor:  the trail behind the pointer. alpha is per ink plate; fade is
                birth to gone in seconds; hz is trail steps per second; splitAt is
                the share of the fade spent grey before the cyan, magenta and
                yellow plates drift sep px apart and brighten up to pop times.
       gliders: what a click stamps. step is ms per glider step; a glider stays
                at full strength for fadeFrom steps and is gone at dieAt steps
                (fade is the same in seconds). spawn: 'anywhere' or 'margins';
                colours: 'rotate' (cyan, magenta, yellow in turn) or 'random'.
       One cell size for everything: the trail, the stamped gliders and the
       glider pointer are all drawn on the same 4 px grid. */
    var LIFE = {
        cursor: { variant: 'fringe-split', layer: 'over', pointer: 'glider', alpha: 0.11, cell: 4, fade: 2.7, splitAt: 0.15, sep: 3.0, pop: 3.0, density: 0.25, hz: 24 },
        gliders: { spawn: 'anywhere', colours: 'rotate', fade: 20.0, dieAt: 211, fadeFrom: 63, alpha: 0.90, cell: 4, step: 95 },
        icon: { phaseEvery: 10, alpha: 0.9, rainbow: 900 },   // pointer glider: px of travel per phase, opacity, ms per colour cycle over links
        passWithin: 1.0,                         // s: a glider and trail born within this long of each other pass through each other
        clearStamp: 3,                           // cells: older trail cleared around a fresh stamp
        maxTrail: 1400,                          // trail seeding pauses above this many trail cells
        maxCells: 5000                           // clicks stop stamping above this many live cells
    };

    var gsap = window.gsap;
    var root = document.documentElement;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gsap || reduced) return;

    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var isJa = (root.lang || '').toLowerCase().indexOf('ja') === 0;
    var CMY = ['#00e5e5', '#e500cc', '#e5d800'];

    function el(tag, cls, parent) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        n.setAttribute('aria-hidden', 'true');
        (parent || document.body).appendChild(n);
        return n;
    }

    /* ---------- Shared pointer state: one listener, batched per frame ---------- */
    // `inside` is false until the mouse first moves over the page, and again after it
    // leaves the window, so nothing reacts to a stale position.
    var pointer = { x: -200, y: -200, inside: false };
    var onFrame = [];
    var onLeave = [];
    var framePending = false;

    function flush() {
        framePending = false;
        for (var i = 0; i < onFrame.length; i++) onFrame[i](pointer);
    }

    function schedule() {
        if (!framePending) {
            framePending = true;
            requestAnimationFrame(flush);
        }
    }

    if (finePointer) {
        window.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'mouse') return;
            pointer.x = e.clientX;
            pointer.y = e.clientY;
            pointer.inside = true;
            schedule();
        }, { passive: true });

        // Scrolling moves the page under a still pointer; let the hover effects catch up.
        window.addEventListener('scroll', function () {
            if (pointer.inside) schedule();
        }, { passive: true });

        var leave = function () {
            pointer.inside = false;
            for (var i = 0; i < onLeave.length; i++) onLeave[i]();
        };
        // No element on the other side means the pointer left the window.
        document.addEventListener('mouseout', function (e) {
            if (!e.relatedTarget) leave();
        });
        // Back/forward restores the page as it was left, cursor and all, but the
        // pointer is somewhere else by now: wait for it to move again.
        window.addEventListener('pageshow', function (e) {
            if (e.persisted) leave();
        });
    }

    var CARD_SEL = '.ability-card, .scry-card';

    /* ---------- Cursor: Game of Life ---------- */
    // One world over the content: two layers of cells on the same 4 px grid,
    // which count each other as Life neighbours.
    //   trail cells, seeded behind the pointer. Born grey (three ink plates in
    //     register), then the plates drift apart along the way the pointer was
    //     moving, brighten, and fade out.
    //   glider cells, stamped by a click (secrets.js calls __fx.life.stamp) in the
    //     current shape of the glider pointer, one ink per click.
    // A glider collides with any trail drawn more than a second before or after it
    // was stamped: sweep the pointer through a glider, or fire one at an older
    // stroke, and it breaks up, deflects or sparks new growth.
    // See stepTrail and stepGlider for the two clocks and the rules.
    // The system cursor is replaced by a pixel glider that faces the way it moves;
    // its white dot is the hotspot. Over links and buttons the glider stays and its
    // cells cycle through the cyan, magenta and yellow of the nav's underline (in
    // place of the hand). Over text fields it hides and the text cursor shows.

    // A glider travelling down and right, one 3 x 3 box per phase
    var GLIDER_PHASES = [
        [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
        [[0, 0], [2, 0], [1, 1], [2, 1], [1, 2]],
        [[2, 0], [0, 1], [2, 1], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 1], [0, 2], [1, 2]]
    ];
    var LINK_SEL = 'a, button, label, select, summary, [role="button"], .pixel-cat';
    var FIELD_SEL = 'input, textarea, [contenteditable]';
    // The signature colours as a loop: cyan, magenta, yellow, back to cyan
    var RAINBOW = [[0, 229, 229], [229, 0, 204], [229, 216, 0]];
    function rainbowAt(u) {
        u = ((u % 1) + 1) % 1 * 3;
        var i = Math.floor(u), f = u - i, a = RAINBOW[i], b = RAINBOW[(i + 1) % 3];
        return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * f) + ',' + Math.round(a[1] + (b[1] - a[1]) * f) + ',' + Math.round(a[2] + (b[2] - a[2]) * f) + ')';
    }

    function initLife() {
        var C = LIFE.cursor;
        var G = LIFE.gliders;
        var CS = C.cell;
        var T_STEP = 1000 / C.hz;
        var T_LIFE = C.fade * 1000;
        var G_STEP = G.step;
        var G_HOLD = G.fadeFrom * G.step;
        var G_LIFE = G.dieAt * G.step;
        var INK = [null, [0, 229, 229], [229, 0, 204], [229, 216, 0]];
        var dpr = Math.min(2, window.devicePixelRatio || 1);

        // How the world is drawn. The browser recomposites a canvas in full whenever
        // it changes, and on pages with blurred (backdrop-filter) elements a
        // window-sized canvas redrawn every frame cost up to a third of the frame
        // rate. So the trail is one window-sized canvas shown through a box that
        // follows its live cells (it stays near the pointer), and the stamped
        // gliders, which spread out, are drawn in 128 px tiles made only where they
        // are. Each is redrawn only when it steps.
        var TR = { wrap: el('div', 'fx-world fx-world-trail'), key: '', dirty: null };
        TR.cv = el('canvas', null, TR.wrap);
        TR.ctx = TR.cv.getContext('2d');
        var TS = 128, TC = TS / CS, tcols = 0;
        var GL = { tiles: [], live: [], pool: [] };
        if (C.layer === 'under') TR.wrap.style.zIndex = '-2';
        function tileFor(t) {
            var T = GL.tiles[t];
            if (T) return T;
            T = GL.pool.pop();
            if (!T) {
                var cv = el('canvas', 'fx-world fx-world-gliders');
                cv.width = TS;
                cv.height = TS;
                cv.style.width = TS + 'px';
                cv.style.height = TS + 'px';
                if (C.layer === 'under') cv.style.zIndex = '-1';
                T = { cv: cv, ctx: cv.getContext('2d'), t: -1, gen: 0 };
            }
            T.t = t;
            T.cv.style.transform = 'translate(' + (t % tcols) * TS + 'px,' + ((t / tcols) | 0) * TS + 'px)';
            T.cv.style.display = '';
            GL.tiles[t] = T;
            return T;
        }
        // Glider tiles that held cells last time but not now are cleared and put away
        function retire(live, gen) {
            for (var q2 = 0; q2 < GL.live.length; q2++) {
                var T = GL.live[q2];
                if (T.gen === gen) continue;
                T.ctx.clearRect(0, 0, TS, TS);
                T.cv.style.display = 'none';
                GL.tiles[T.t] = null;
                GL.pool.push(T);
            }
            GL.live = live;
        }
        // Show only the part of the trail canvas that holds live cells (r: [x0, y0, x1, y1] in px)
        function clipTo(r) {
            var x0 = 0, y0 = 0, x1 = 0, y1 = 0;
            if (r) {
                x0 = Math.max(0, r[0]); y0 = Math.max(0, r[1]);
                x1 = Math.min(TR.cv.width, r[2]); y1 = Math.min(TR.cv.height, r[3]);
                if (x1 <= x0 || y1 <= y0) x0 = y0 = x1 = y1 = 0;
            }
            var key = x0 + ',' + y0 + ',' + x1 + ',' + y1;
            if (key === TR.key) return;
            TR.key = key;
            TR.wrap.style.width = (x1 - x0) + 'px';
            TR.wrap.style.height = (y1 - y0) + 'px';
            TR.wrap.style.transform = 'translate(' + x0 + 'px,' + y0 + 'px)';
            TR.cv.style.transform = 'translate(' + (-x0) + 'px,' + (-y0) + 'px)';
        }

        // Fill styles, 16 alpha levels each: the three trail plates (up to pop x
        // alpha, so a plate can brighten as it separates) and the three glider inks.
        function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }
        var POP = Math.max(1, C.pop);
        var plates = [], inks = [];
        for (var q = 0; q < 3; q++) {
            plates.push([]); inks.push([]);
            for (var l = 0; l < 16; l++) {
                plates[q].push(rgba(INK[q + 1], C.alpha * POP * (l + 1) / 16));
                inks[q].push(rgba(INK[q + 1], G.alpha * (l + 1) / 16));
            }
        }
        // Plate offsets for 16 headings: cyan along the heading, magenta and yellow at 120 degrees
        var PX = [[], [], []], PY = [[], [], []];
        for (q = 0; q < 3; q++) {
            for (var d = 0; d < 16; d++) {
                var ang = d / 16 * Math.PI * 2 + q * Math.PI * 2 / 3;
                PX[q][d] = Math.cos(ang);
                PY[q][d] = Math.sin(ang);
            }
        }
        function lvl(r) { return r >= 1 ? 15 : r <= 0 ? 0 : (r * 16) | 0; }

        // Two layers, each double-buffered. t*: trail cells, g*: glider cells.
        // A: alive. B: birth time in ms, inherited by newborns so a whole pattern
        // dies on schedule. tD: the heading the trail was drawn in (0-15).
        // tI, gI: ink, 0 for grey trail, 1-3 for cyan, magenta, yellow.
        var cols = 0, rows = 0;
        var tA, tA2, tB, tB2, tD, tD2, tI, tI2, gA, gA2, gB, gB2, gI, gI2;
        var tN = 0, gN = 0;
        var ti0, ti1, tj0, tj1, gi0, gi1, gj0, gj1;
        var GRACE = LIFE.passWithin * 1000;
        var gChanged = false;

        function fit() {
            var w = innerWidth;
            var h = innerHeight;
            TR.cv.width = w;
            TR.cv.height = h;
            TR.cv.style.width = w + 'px';
            TR.cv.style.height = h + 'px';
            TR.dirty = null;
            clipTo(null);
            retire([], -1);
            GL.tiles = [];
            tcols = Math.ceil(w / TS);
            cols = Math.ceil(w / CS);
            rows = Math.ceil(h / CS);
            var n = cols * rows;
            tA = new Uint8Array(n); tA2 = new Uint8Array(n); tB = new Float64Array(n); tB2 = new Float64Array(n);
            tD = new Uint8Array(n); tD2 = new Uint8Array(n); tI = new Uint8Array(n); tI2 = new Uint8Array(n);
            gA = new Uint8Array(n); gA2 = new Uint8Array(n); gB = new Float64Array(n); gB2 = new Float64Array(n);
            gI = new Uint8Array(n); gI2 = new Uint8Array(n);
            tN = 0; gN = 0;
            ti0 = gi0 = tj0 = gj0 = 1e9;
            ti1 = gi1 = tj1 = gj1 = -1;
        }
        fit();

        function putTrail(i, j, born, dir) {
            if (i < 0 || j < 0 || i >= cols || j >= rows) return;
            var k = j * cols + i;
            if (tA[k]) return;
            tA[k] = 1; tB[k] = born; tD[k] = dir; tI[k] = 0;
            tN++;
            if (i < ti0) ti0 = i; if (i > ti1) ti1 = i;
            if (j < tj0) tj0 = j; if (j > tj1) tj1 = j;
        }
        function putGlider(i, j, born, ink) {
            if (i < 0 || j < 0 || i >= cols || j >= rows) return;
            var k = j * cols + i;
            if (!gA[k]) gN++;
            gA[k] = 1; gB[k] = born; gI[k] = ink;
            if (i < gi0) gi0 = i; if (i > gi1) gi1 = i;
            if (j < gj0) gj0 = j; if (j > gj1) gj1 = j;
        }

        // The eight neighbours of cell k at (i, j), as indices; -1 off the grid
        var NB = new Int32Array(8);
        function neighbours(k, i, j) {
            var lt = i > 0, rt = i < cols - 1, up = j > 0, dn = j < rows - 1;
            NB[0] = up && lt ? k - cols - 1 : -1; NB[1] = up ? k - cols : -1; NB[2] = up && rt ? k - cols + 1 : -1;
            NB[3] = lt ? k - 1 : -1; NB[4] = rt ? k + 1 : -1;
            NB[5] = dn && lt ? k + cols - 1 : -1; NB[6] = dn ? k + cols : -1; NB[7] = dn && rt ? k + cols + 1 : -1;
        }
        function sum(X, k, i, j) {
            var lt = i > 0, rt = i < cols - 1, c = 0;
            if (j > 0) { var u = k - cols; if (lt) c += X[u - 1]; c += X[u]; if (rt) c += X[u + 1]; }
            if (lt) c += X[k - 1];
            if (rt) c += X[k + 1];
            if (j < rows - 1) { var d = k + cols; if (lt) c += X[d - 1]; c += X[d]; if (rt) c += X[d + 1]; }
            return c;
        }
        // Whether a glider cell and a trail cell born at these times see each other
        function see(a, b) { return a - b >= GRACE || b - a >= GRACE; }
        function major(h1, h2, h3) { return h1 + h2 + h3 === 0 ? 0 : h1 >= h2 && h1 >= h3 ? 1 : h2 >= h3 ? 2 : 3; }

        // Trail step, C.hz times a second. Neighbours are trail cells plus the glider
        // cells this trail can see: a glider and a trail cell see each other only if
        // they were born more than passWithin apart. So the trail a glider was stamped
        // into, and the trail left while moving away from it, pass through it; an
        // older stroke it flies into, or a later sweep across it, collides.
        // A birth needs at least one trail parent. With two or more glider parents it
        // becomes a glider cell (their ink and age); otherwise a trail cell with the
        // trail's short life, in a glider parent's ink if it has one: a spark.
        var pend = [];
        function stepTrail(now) {
            if (!tN) return;
            var a0 = Math.max(0, ti0 - 1), a1 = Math.min(cols - 1, ti1 + 1);
            var b0 = Math.max(0, tj0 - 1), b1 = Math.min(rows - 1, tj1 + 1);
            var n = 0, ni0 = 1e9, ni1 = -1, nj0 = 1e9, nj1 = -1, q, x;
            pend.length = 0;
            for (var j = b0; j <= b1; j++) {
                for (var i = a0; i <= a1; i++) {
                    var k = j * cols + i, alive = tA[k], tc = sum(tA, k, i, j);
                    var keep = false, nb = 0, nd = 0, ni = 0;
                    if (alive || tc) {
                        var gc = gN ? sum(gA, k, i, j) : 0;
                        if (alive) {
                            var cnt = tc;
                            if (gc) {
                                neighbours(k, i, j);
                                for (q = 0; q < 8; q++) { x = NB[q]; if (x >= 0 && gA[x] && see(gB[x], tB[k])) cnt++; }
                            }
                            if ((cnt === 2 || cnt === 3) && now - tB[k] < T_LIFE) { keep = true; nb = tB[k]; nd = tD[k]; ni = tI[k]; }
                        } else if (tc <= 3) {
                            neighbours(k, i, j);
                            var tb = Infinity, td = 0, t1 = 0, t2 = 0, t3 = 0, vg = 0, gb = -Infinity, g1 = 0, g2 = 0, g3 = 0;
                            for (q = 0; q < 8; q++) {
                                x = NB[q];
                                if (x < 0 || !tA[x]) continue;
                                if (tB[x] < tb) { tb = tB[x]; td = tD[x]; }
                                if (tI[x] === 1) t1++; else if (tI[x] === 2) t2++; else if (tI[x] === 3) t3++;
                            }
                            if (gc) {
                                for (q = 0; q < 8; q++) {
                                    x = NB[q];
                                    if (x < 0 || !gA[x] || !see(gB[x], tb)) continue;
                                    vg++;
                                    if (gB[x] > gb) gb = gB[x];
                                    if (gI[x] === 1) g1++; else if (gI[x] === 2) g2++; else g3++;
                                }
                            }
                            if (tc + vg === 3) {
                                if (vg >= 2) {
                                    if (now - gb < G_LIFE) pend.push(k, gb, major(g1, g2, g3));
                                } else if (now - tb < T_LIFE) {
                                    keep = true; nb = tb; nd = td; ni = vg ? major(g1, g2, g3) : major(t1, t2, t3);
                                }
                            }
                        }
                    }
                    if (keep) {
                        tA2[k] = 1; tB2[k] = nb; tD2[k] = nd; tI2[k] = ni;
                        n++;
                        if (i < ni0) ni0 = i; if (i > ni1) ni1 = i;
                        if (j < nj0) nj0 = j; if (j > nj1) nj1 = j;
                    } else {
                        tA2[k] = 0;
                    }
                }
            }
            for (j = b0; j <= b1; j++) tA.fill(0, j * cols + a0, j * cols + a1 + 1);
            var s;
            s = tA; tA = tA2; tA2 = s;
            s = tB; tB = tB2; tB2 = s;
            s = tD; tD = tD2; tD2 = s;
            s = tI; tI = tI2; tI2 = s;
            tN = n; ti0 = ni0; ti1 = ni1; tj0 = nj0; tj1 = nj1;
            // Glider cells born from mixed parents, added after the step so they
            // did not change this step's counts
            for (q = 0; q < pend.length; q += 3) {
                x = pend[q];
                if (!gA[x]) { putGlider(x % cols, (x / cols) | 0, pend[q + 1], pend[q + 2]); gChanged = true; }
            }
        }

        // Glider step, every G.step ms. Neighbours are glider cells plus the trail
        // cells this glider can see (same rule as above). Births here come only from
        // three glider parents, so a glider on its own is exactly a Life glider; mixed
        // births happen on trail steps.
        function stepGlider(now) {
            if (!gN) return;
            var a0 = Math.max(0, gi0 - 1), a1 = Math.min(cols - 1, gi1 + 1);
            var b0 = Math.max(0, gj0 - 1), b1 = Math.min(rows - 1, gj1 + 1);
            var n = 0, ni0 = 1e9, ni1 = -1, nj0 = 1e9, nj1 = -1, q, x;
            for (var j = b0; j <= b1; j++) {
                for (var i = a0; i <= a1; i++) {
                    var k = j * cols + i, alive = gA[k], gc = sum(gA, k, i, j);
                    var keep = false, nb = 0, ni = 0;
                    if (alive || gc === 3) {
                        var tc = tN ? sum(tA, k, i, j) : 0;
                        if (alive) {
                            var cnt = gc;
                            if (tc) {
                                neighbours(k, i, j);
                                for (q = 0; q < 8; q++) { x = NB[q]; if (x >= 0 && tA[x] && see(tB[x], gB[k])) cnt++; }
                            }
                            if ((cnt === 2 || cnt === 3) && now - gB[k] < G_LIFE) { keep = true; nb = gB[k]; ni = gI[k]; }
                        } else {
                            neighbours(k, i, j);
                            var gb = -Infinity, g1 = 0, g2 = 0, g3 = 0, vt = 0;
                            for (q = 0; q < 8; q++) {
                                x = NB[q];
                                if (x < 0 || !gA[x]) continue;
                                if (gB[x] > gb) gb = gB[x];
                                if (gI[x] === 1) g1++; else if (gI[x] === 2) g2++; else g3++;
                            }
                            if (tc) for (q = 0; q < 8; q++) { x = NB[q]; if (x >= 0 && tA[x] && see(tB[x], gb)) vt++; }
                            if (!vt && now - gb < G_LIFE) { keep = true; nb = gb; ni = major(g1, g2, g3); }
                        }
                    }
                    if (keep) {
                        gA2[k] = 1; gB2[k] = nb; gI2[k] = ni;
                        n++;
                        if (i < ni0) ni0 = i; if (i > ni1) ni1 = i;
                        if (j < nj0) nj0 = j; if (j > nj1) nj1 = j;
                    } else {
                        gA2[k] = 0;
                    }
                }
            }
            for (j = b0; j <= b1; j++) gA.fill(0, j * cols + a0, j * cols + a1 + 1);
            var s;
            s = gA; gA = gA2; gA2 = s;
            s = gB; gB = gB2; gB2 = s;
            s = gI; gI = gI2; gI2 = s;
            gN = n; gi0 = ni0; gi1 = ni1; gj0 = nj0; gj1 = nj1;
            gChanged = true;
        }

        // Draw. Trail: grey cells as three plates added together ('lighter', inside
        // the canvas only, no CSS blend), then sparks in ink. Gliders: cells in ink,
        // tile by tile. Cells are bucketed by fill style.
        var FB = [], FN = new Int32Array(16), IB = [], IN = new Int32Array(48);
        for (q = 0; q < 16; q++) FB.push(new Int16Array(1024));
        for (q = 0; q < 48; q++) IB.push(new Int16Array(256));
        var drawGen = 0;
        function grow(arr, need) {
            if (need <= arr.length) return arr;
            var b = new Int16Array(Math.max(need, arr.length * 2));
            b.set(arr);
            return b;
        }
        function pushInk(b, x, y) {
            var m = IN[b], arr = IB[b] = grow(IB[b], m + 2);
            arr[m] = x; arr[m + 1] = y;
            IN[b] = m + 2;
        }
        function flushInks(c2) {
            for (var b = 0; b < 48; b++) {
                var m = IN[b];
                if (!m) continue;
                c2.fillStyle = inks[(b / 16) | 0][b % 16];
                var arr = IB[b];
                for (var t = 0; t < m; t += 2) c2.fillRect(arr[t], arr[t + 1], CS - 1, CS - 1);
            }
        }
        function drawTrail(now) {
            var d = TR.dirty, c2 = TR.ctx;
            if (d) c2.clearRect(d[0], d[1], d[2] - d[0], d[3] - d[1]);
            TR.dirty = null;
            if (tN) {
                var sa = C.splitAt, sep = C.sep, pop = C.pop, sz = CS - 1, i, j, k, b, m, arr, t, o;
                FN.fill(0); IN.fill(0);
                for (j = tj0; j <= tj1; j++) {
                    for (i = ti0; i <= ti1; i++) {
                        k = j * cols + i;
                        if (!tA[k]) continue;
                        var f = (now - tB[k]) / T_LIFE;
                        if (f >= 1) continue;
                        if (tI[k]) { pushInk((tI[k] - 1) * 16 + lvl(1 - f), i * CS, j * CS); continue; }
                        var s = f <= sa ? 0 : (f - sa) / (1 - sa), u = 1 - s, e = 1 - u * u * u;
                        var lv = lvl((1 + (pop - 1) * e) * (1 - s * s * s) / POP), mg = sep * e, dd = tD[k];
                        m = FN[lv]; arr = FB[lv] = grow(FB[lv], m + 8);
                        arr[m] = i * CS; arr[m + 1] = j * CS;
                        arr[m + 2] = Math.round(PX[0][dd] * mg); arr[m + 3] = Math.round(PY[0][dd] * mg);
                        arr[m + 4] = Math.round(PX[1][dd] * mg); arr[m + 5] = Math.round(PY[1][dd] * mg);
                        arr[m + 6] = Math.round(PX[2][dd] * mg); arr[m + 7] = Math.round(PY[2][dd] * mg);
                        FN[lv] = m + 8;
                    }
                }
                c2.globalCompositeOperation = 'lighter';
                for (q = 0; q < 3; q++) {
                    o = 2 + q * 2;
                    for (b = 0; b < 16; b++) {
                        m = FN[b];
                        if (!m) continue;
                        c2.fillStyle = plates[q][b];
                        arr = FB[b];
                        for (t = 0; t < m; t += 8) c2.fillRect(arr[t] + arr[t + o], arr[t + 1] + arr[t + o + 1], sz, sz);
                    }
                }
                c2.globalCompositeOperation = 'source-over';
                flushInks(c2);
                var pad = Math.ceil(sep) + 1;
                TR.dirty = [ti0 * CS - pad, tj0 * CS - pad, (ti1 + 1) * CS + pad, (tj1 + 1) * CS + pad];
            }
            clipTo(TR.dirty);
        }
        function drawGliders(now) {
            var gen = ++drawGen, live = [];
            if (gN) {
                for (var ty = (gj0 / TC) | 0; ty <= ((gj1 / TC) | 0); ty++) {
                    for (var tx = (gi0 / TC) | 0; tx <= ((gi1 / TC) | 0); tx++) {
                        var ox = tx * TS, oy = ty * TS, any = 0;
                        IN.fill(0);
                        for (var j = Math.max(gj0, ty * TC); j <= Math.min(gj1, ty * TC + TC - 1); j++) {
                            for (var i = Math.max(gi0, tx * TC); i <= Math.min(gi1, tx * TC + TC - 1); i++) {
                                var k = j * cols + i;
                                if (!gA[k]) continue;
                                var age = now - gB[k];
                                if (age >= G_LIFE) continue;
                                any++;
                                pushInk(((gI[k] || 1) - 1) * 16 + lvl(age < G_HOLD ? 1 : 1 - (age - G_HOLD) / (G_LIFE - G_HOLD)), i * CS - ox, j * CS - oy);
                            }
                        }
                        if (!any) continue;
                        var T = tileFor(ty * tcols + tx);
                        T.ctx.clearRect(0, 0, TS, TS);
                        flushInks(T.ctx);
                        T.gen = gen;
                        live.push(T);
                    }
                }
            }
            retire(live, gen);
        }

        // The cells of a glider in a given phase and heading. Beside a hotspot cell
        // it sits just behind the hotspot (it travels toward it); `centre` puts it on the cell.
        function gliderCells(ci, cj, phase, sx, sy, centre) {
            var x0 = centre ? ci - 1 : (sx < 0 ? ci + 1 : ci - 3);
            var y0 = centre ? cj - 1 : (sy < 0 ? cj + 1 : cj - 3);
            return GLIDER_PHASES[phase].map(function (c) {
                return [x0 + (sx > 0 ? c[0] : 2 - c[0]), y0 + (sy > 0 ? c[1] : 2 - c[1])];
            });
        }

        // Pointer state for the trail and the pointer glider
        var ptr = { x: -999, y: -999, vx: 0, vy: 0, ts: 0, lastMove: -1e9, inside: false, entered: false };
        var head = { ux: -Math.SQRT1_2, uy: -Math.SQRT1_2, sx: -1, sy: -1, phase: 0, dist: 0, lx: null, ly: null };
        var overLink = false, overField = false;
        var lastCell = -1, li = 0, lj = 0;

        // The pointer glider: a small canvas laid on the world's grid, so a stamp
        // lands exactly under it. The dot is the hotspot, on the exact pointer pixel.
        var icon = null, ictx = null, ICON = 11 * CS, iconKey = '';
        if (finePointer) {
            icon = el('canvas', 'fx-glider-icon');
            icon.width = ICON * dpr;
            icon.height = ICON * dpr;
            icon.style.width = ICON + 'px';
            icon.style.height = ICON + 'px';
            icon.style.display = 'none';
            ictx = icon.getContext('2d');
        }
        function drawIcon(now) {
            var show = ptr.inside && !overField;
            icon.style.display = show ? '' : 'none';
            if (!show) return;
            var x = Math.floor(ptr.x), y = Math.floor(ptr.y), ci = Math.floor(x / CS), cj = Math.floor(y / CS);
            // Over a link the colours move, so the icon is redrawn about 30 times a second
            var tick = overLink ? Math.floor(now / 33) : -1;
            var key = x + ',' + y + ',' + head.phase + ',' + head.sx + ',' + head.sy + ',' + tick;
            if (key === iconKey) return;
            iconKey = key;
            var ox = (ci - 5) * CS, oy = (cj - 5) * CS;
            icon.style.transform = 'translate3d(' + ox + 'px,' + oy + 'px,0)';
            ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ictx.clearRect(0, 0, ICON, ICON);
            var cells = gliderCells(ci, cj, head.phase, head.sx, head.sy, false);
            ictx.fillStyle = 'rgba(0,0,0,0.55)';
            cells.forEach(function (c) { ictx.fillRect((c[0] - ci + 5) * CS - 1, (c[1] - cj + 5) * CS - 1, CS + 1, CS + 1); });
            ictx.globalAlpha = LIFE.icon.alpha;
            ictx.fillStyle = 'rgb(232,232,232)';
            cells.forEach(function (c, k) {
                // Over a link each cell takes its own point on the loop, so the colours sweep through the glider
                if (overLink) ictx.fillStyle = rainbowAt(now / LIFE.icon.rainbow + k / cells.length);
                ictx.fillRect((c[0] - ci + 5) * CS, (c[1] - cj + 5) * CS, CS - 1, CS - 1);
            });
            ictx.globalAlpha = 1;
            var hx = x - ox, hy = y - oy;
            ictx.fillStyle = 'rgba(0,0,0,0.6)';
            ictx.fillRect(hx - 2, hy - 2, 5, 5);
            ictx.fillStyle = '#f5f5f5';
            ictx.fillRect(hx - 1, hy - 1, 3, 3);
        }

        // Trail seeding: a sparse disc of grey cells at each grid cell the pointer enters
        function seedDisc(ci, cj, p, now, dir) {
            for (var dj = -2; dj <= 2; dj++) {
                for (var di = -2; di <= 2; di++) {
                    if (di * di + dj * dj > 5 || Math.random() >= p) continue;
                    putTrail(ci + di, cj + dj, now, dir);
                }
            }
        }
        function trail(now, dir) {
            var ci = Math.floor(ptr.x / CS), cj = Math.floor(ptr.y / CS), cell = cj * cols + ci;
            if (cell === lastCell) return;
            if (lastCell >= 0 && !ptr.entered) {
                var st = Math.min(12, Math.max(Math.abs(ci - li), Math.abs(cj - lj)));
                for (var s = 1; s <= st; s++) {
                    seedDisc(Math.round(li + (ci - li) * s / st), Math.round(lj + (cj - lj) * s / st), C.density, now, dir);
                }
            } else {
                seedDisc(ci, cj, C.density * 1.4, now, dir);
            }
            lastCell = cell; li = ci; lj = cj;
        }

        // nap: a timer, set when only the world is moving (see the end of frame)
        var raf = 0, nap = 0, last = 0, tAcc = 0, gAcc = 0;
        function wake() {
            nap = 0;
            raf = requestAnimationFrame(frame);
        }
        function kick() {
            if (raf || document.hidden) return;
            var t = performance.now();
            if (nap) {
                // Woken mid-nap (the pointer moved, a click stamped): the time napped
                // still counts toward the next steps, and the frame starts afresh.
                clearTimeout(nap);
                nap = 0;
                var napped = Math.min(100, Math.max(0, t - last));
                tAcc += napped;
                gAcc += napped;
            }
            last = t;
            raf = requestAnimationFrame(frame);
        }
        function frame(now) {
            raf = 0;
            var dt = Math.min(100, Math.max(0, now - last));
            last = now;
            if (finePointer) {
                if (now - ptr.lastMove > 40) {
                    var decay = Math.pow(0.8, dt / 16.667);
                    ptr.vx *= decay; ptr.vy *= decay;
                }
                var speed = Math.sqrt(ptr.vx * ptr.vx + ptr.vy * ptr.vy);
                if (speed > 40) {
                    var kx = 1 - Math.pow(0.7, dt / 16.667);
                    head.ux += (ptr.vx / speed - head.ux) * kx;
                    head.uy += (ptr.vy / speed - head.uy) * kx;
                    var hl = Math.sqrt(head.ux * head.ux + head.uy * head.uy) || 1;
                    head.ux /= hl; head.uy /= hl;
                }
                // The pointer glider flips an axis only when that axis carries a real
                // share of the motion, so it doesn't flicker on near-straight moves.
                if (speed > 80) {
                    if (Math.abs(ptr.vx) > 0.3 * speed) head.sx = ptr.vx > 0 ? 1 : -1;
                    if (Math.abs(ptr.vy) > 0.3 * speed) head.sy = ptr.vy > 0 ? 1 : -1;
                }
                if (ptr.inside) {
                    if (head.lx !== null && !ptr.entered) {
                        head.dist += Math.abs(ptr.x - head.lx) + Math.abs(ptr.y - head.ly);
                        while (head.dist >= LIFE.icon.phaseEvery) { head.dist -= LIFE.icon.phaseEvery; head.phase = (head.phase + 1) & 3; }
                    }
                    head.lx = ptr.x; head.ly = ptr.y;
                    if (now - ptr.lastMove < 70 && tN < LIFE.maxTrail) {
                        var dir = ((Math.round(Math.atan2(head.uy, head.ux) / (Math.PI * 2) * 16) % 16) + 16) % 16;
                        trail(now, dir);
                    }
                } else {
                    lastCell = -1;
                }
                ptr.entered = false;
                drawIcon(now);
            }
            tAcc += dt; gAcc += dt;
            if (!tN) tAcc = Math.min(tAcc, T_STEP);
            if (!gN) gAcc = Math.min(gAcc, G_STEP);
            var n = 0;
            while (tAcc >= T_STEP && n < 4) { stepTrail(now); tAcc -= T_STEP; n++; }
            if (n >= 4) tAcc = 0;
            var trailStepped = n > 0;
            n = 0;
            while (gAcc >= G_STEP && n < 3) { stepGlider(now); gAcc -= G_STEP; n++; }
            if (n >= 3) gAcc = 0;
            // A layer is redrawn only when it has stepped (or a click stamped). A cell's
            // fade (16 levels over 2.7 s) and plate drift (whole pixels) change far more
            // slowly than the frame rate, so this looks the same and spares the
            // browser from recompositing the trail's box on every frame.
            if (trailStepped) drawTrail(now);
            if (gChanged) { gChanged = false; drawGliders(now); }
            // Keep running while anything lives, the pointer moves, or the pointer rests on a link (its colours cycle)
            if (ptr.inside && (overLink || now - ptr.lastMove < 150)) {
                raf = requestAnimationFrame(frame);
            } else if (tN || gN) {
                // Only the world is moving, and nothing on screen changes between its
                // steps (24 a second for the trail, about 10 for gliders): sleep until
                // the next step is due rather than waking on every display frame. The
                // step still lands on the first frame after it is due, as before, and a
                // nap is kept short enough that the frame after it stays under the
                // 100 ms cap on dt above.
                var due = Math.min(tN ? T_STEP - tAcc : Infinity, gN ? G_STEP - gAcc : Infinity);
                if (due > 24) nap = setTimeout(wake, Math.min(due - 8, 70));
                else raf = requestAnimationFrame(frame);
            }
        }

        if (finePointer) {
            window.addEventListener('pointermove', function (e) {
                if (e.pointerType !== 'mouse') return;
                var x = e.clientX, y = e.clientY;
                if (!ptr.inside) {
                    ptr.inside = true; ptr.entered = true; ptr.vx = 0; ptr.vy = 0;
                    // Only now, with the glider about to be drawn, hide the system cursor
                    root.classList.add('fx-glider-cursor');
                } else {
                    var dtE = Math.max(4, e.timeStamp - ptr.ts);
                    ptr.vx += ((x - ptr.x) / dtE * 1000 - ptr.vx) * 0.5;
                    ptr.vy += ((y - ptr.y) / dtE * 1000 - ptr.vy) * 0.5;
                }
                ptr.x = x; ptr.y = y; ptr.ts = e.timeStamp; ptr.lastMove = performance.now();
                kick();
            }, { passive: true });
            document.addEventListener('pointerover', function (e) {
                if (e.pointerType !== 'mouse') return;
                var t = e.target.closest ? e.target : null;
                overField = !!(t && t.closest(FIELD_SEL));
                overLink = !overField && !!(t && t.closest(LINK_SEL));
                kick();
            });
            onLeave.push(function () {
                ptr.inside = false;
                root.classList.remove('fx-glider-cursor');
                if (icon) icon.style.display = 'none';
                iconKey = '';
            });
        }
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                if (raf) cancelAnimationFrame(raf);
                if (nap) clearTimeout(nap);
                raf = nap = 0;
            } else if (tN || gN) {
                kick();
            }
        });
        var resizing = false;
        window.addEventListener('resize', function () {
            if (resizing) return;
            resizing = true;
            requestAnimationFrame(function () { resizing = false; fit(); iconKey = ''; kick(); });
        });

        var inkNext = (Math.random() * 3) | 0;
        function nextInk() {
            if (G.colours === 'random') return 1 + ((Math.random() * 3) | 0);
            inkNext = inkNext % 3 + 1;
            return inkNext;
        }

        // A click stamps the pointer glider's current cells into the world, in the
        // next ink; they live on as a real glider heading the way the pointer faced.
        // A touch tap stamps one with a random heading, centred on the tap.
        function stamp(x, y, type) {
            if (tN + gN > LIFE.maxCells) return false;
            var ci = Math.floor(x / CS), cj = Math.floor(y / CS);
            var cells = type === 'mouse' && finePointer
                ? gliderCells(ci, cj, head.phase, head.sx, head.sy, false)
                : gliderCells(ci, cj, 0, Math.random() < 0.5 ? 1 : -1, Math.random() < 0.5 ? 1 : -1, true);
            return place(cells, nextInk());
        }

        // Put a glider's cells into the world in one ink (1-3: cyan, magenta, yellow)
        function place(cells, ink) {
            if (tN + gN > LIFE.maxCells) return false;
            var now = performance.now();
            // Trail near the stamp that is old enough to collide (drawn over a second
            // before the click, say while the pointer circled the spot) is cleared
            // for clearStamp cells around it, so a glider starts whole; older strokes
            // further away it can still fly into.
            var R = LIFE.clearStamp;
            var x0 = Math.min.apply(null, cells.map(function (c) { return c[0]; })) - R;
            var y0 = Math.min.apply(null, cells.map(function (c) { return c[1]; })) - R;
            for (var j = Math.max(0, y0); j <= Math.min(rows - 1, y0 + 2 + 2 * R); j++) {
                for (var i = Math.max(0, x0); i <= Math.min(cols - 1, x0 + 2 + 2 * R); i++) {
                    var k = j * cols + i;
                    if (tA[k] && now - tB[k] >= GRACE) { tA[k] = 0; tN--; }
                }
            }
            cells.forEach(function (c) { putGlider(c[0], c[1], now, ink); });
            gChanged = true;
            kick();
            return true;
        }

        return {
            config: LIFE,
            stamp: stamp,
            // One glider centred on viewport point (x, y), heading sx, sy (each +1 or -1),
            // in ink 1-3 (or the next ink). Same rules as a click's: cap, clearing, fade, collisions.
            glider: function (x, y, sx, sy, ink) {
                return place(gliderCells(Math.floor(x / CS), Math.floor(y / CS), 0, sx, sy, true), ink || nextInk());
            },
            // For tests: counts by layer, and whether the loop is running
            stats: function () {
                var t = 0, sp = 0, g = 0, k;
                for (k = 0; k < tA.length; k++) { if (tA[k]) { t++; if (tI[k]) sp++; } if (gA[k]) g++; }
                return { trail: t, sparks: sp, glider: g, running: !!(raf || nap), cell: CS, cols: cols, rows: rows };
            },
            // Live cells in a viewport rectangle: [i, j, layer (1 trail, 2 glider), ink]
            cellsAt: function (x0, y0, x1, y1) {
                var out = [];
                for (var j = Math.max(0, Math.floor(y0 / CS)); j <= Math.min(rows - 1, Math.floor(y1 / CS)); j++) {
                    for (var i = Math.max(0, Math.floor(x0 / CS)); i <= Math.min(cols - 1, Math.floor(x1 / CS)); i++) {
                        var k = j * cols + i;
                        if (tA[k]) out.push([i, j, 1, tI[k]]);
                        if (gA[k]) out.push([i, j, 2, gI[k]]);
                    }
                }
                return out;
            },
            iconCells: function () {
                var x = Math.floor(ptr.x), y = Math.floor(ptr.y);
                return { hotspot: [x, y], cells: gliderCells(Math.floor(x / CS), Math.floor(y / CS), head.phase, head.sx, head.sy, false), shown: !!icon && icon.style.display !== 'none' };
            }
        };
    }

    /* ---------- Hover (a): letter scramble on section titles ---------- */
    var LATIN = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var KANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン';

    function randomFor(ch) {
        if (/\s/.test(ch)) return ch;
        var pool = ch.charCodeAt(0) > 0x2000 ? KANA : LATIN;
        return pool.charAt((Math.random() * pool.length) | 0);
    }

    function scramble(target) {
        if (target._fxScrambling) return;
        var nodes = [];
        for (var i = 0; i < target.childNodes.length; i++) {
            var n = target.childNodes[i];
            if (n.nodeType === 3 && n.textContent.trim()) nodes.push(n);
        }
        if (!nodes.length) return;
        var originals = nodes.map(function (n) { return n.textContent; });
        if (!target.hasAttribute('aria-label')) {
            // Read the heading as written: leave out ruby reading guides (<rt>) on the Japanese pages
            var copy = target.cloneNode(true);
            copy.querySelectorAll('rt, rp').forEach(function (r) { r.remove(); });
            target.setAttribute('aria-label', copy.textContent.trim().replace(/\s+/g, ' '));
        }
        target._fxScrambling = true;

        var start = performance.now();
        var duration = 420;
        function step(now) {
            var t = Math.min(1, (now - start) / duration);
            nodes.forEach(function (n, k) {
                var o = originals[k];
                var revealed = Math.floor(t * o.length);
                var out = '';
                for (var j = 0; j < o.length; j++) out += j < revealed ? o.charAt(j) : randomFor(o.charAt(j));
                n.textContent = out;
            });
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                nodes.forEach(function (n, k) { n.textContent = originals[k]; });
                target._fxScrambling = false;
            }
        }
        requestAnimationFrame(step);
    }

    function initScramble() {
        if (!finePointer) return;
        // Section titles and the name on the Character Sheet; the nav stays still.
        // Delegated, so titles built later (the Scrying Pool's By Date years) scramble too.
        document.addEventListener('pointerover', function (e) {
            if (e.pointerType !== 'mouse') return;
            var t = e.target.closest('.section-title, .spells-section-title, .hero-name');
            // Only on entering the title, not when moving between its own children
            if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
            scramble(t);
        });
    }

    /* ---------- Hover (b): portrait colour drift ---------- */
    // A cyan, magenta or yellow copy of a grey image, drawn once into a canvas.
    // Same colour matrix as the SVG filters below, but an SVG `filter: url(#...)` is
    // re-rendered on every frame its image moves, which made the page drop frames
    // whenever the mouse moved. Returns null if the image can't be read (cross-origin).
    // Shared with the portrait secret in secrets.js.
    var TINT = { c: [0, 1, 1], m: [1, 0, 1], y: [1, 1, 0] };
    function tinted(img, k) {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        if (!w || !h) return null;
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d', { willReadFrequently: true });
        try {
            ctx.drawImage(img, 0, 0);
            var data = ctx.getImageData(0, 0, w, h);
            var px = data.data;
            var t = TINT[k];
            for (var i = 0; i < px.length; i += 4) {
                var lum = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
                px[i] = lum * t[0];
                px[i + 1] = lum * t[1];
                px[i + 2] = lum * t[2];
            }
            ctx.putImageData(data, 0, 0);
        } catch (err) {
            return null;
        }
        return c;
    }

    // SVG colour filters, the fallback when `tinted` can't read the image.
    function ensureTints() {
        if (document.getElementById('fx-tints')) return;
        var lum = '.3 .59 .11 0 0';
        var off = '0 0 0 0 0';
        var alpha = '0 0 0 1 0';
        var tints = {
            c: [off, lum, lum, alpha],
            m: [lum, off, lum, alpha],
            y: [lum, lum, off, alpha]
        };
        var html = '';
        Object.keys(tints).forEach(function (k) {
            html += '<filter id="fx-tint-' + k + '" color-interpolation-filters="sRGB">' +
                '<feColorMatrix type="matrix" values="' + tints[k].join('  ') + '"/></filter>';
        });
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'fx-tints';
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        svg.innerHTML = html;
        document.body.appendChild(svg);
    }

    function initPortraitDrift() {
        if (!finePointer) return;
        var img = document.querySelector('.hero-portrait img');
        var frame = img && img.closest('.portrait-frame');
        if (!frame) return;
        frame.classList.add('fx-drift');
        function addGhosts() {
            ['c', 'm'].forEach(function (k) {
                var g = tinted(img, k);
                if (!g) {
                    ensureTints();
                    g = document.createElement('img');
                    g.src = img.currentSrc || img.src;
                    g.alt = '';
                    g.style.filter = 'url(#fx-tint-' + k + ')';
                }
                g.className = 'fx-ghost fx-ghost-' + k;
                g.setAttribute('aria-hidden', 'true');
                frame.appendChild(g);
            });
        }
        // Off the critical path: the tint is a one-off pass over the image's pixels
        var later = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };
        function whenIdle() { later(addGhosts, { timeout: 1500 }); }
        if (img.complete && img.naturalWidth) whenIdle(); else img.addEventListener('load', whenIdle, { once: true });
        var d = { x: 0, y: 0 };
        function apply() {
            frame.style.setProperty('--dx', d.x.toFixed(2));
            frame.style.setProperty('--dy', d.y.toFixed(2));
        }
        var toX = gsap.quickTo(d, 'x', { duration: 0.8, ease: 'power3.out', onUpdate: apply });
        var toY = gsap.quickTo(d, 'y', { duration: 0.8, ease: 'power3.out', onUpdate: apply });
        onFrame.push(function (p) {
            var r = img.getBoundingClientRect();
            if (r.bottom < 0 || r.top > innerHeight) return;
            var nx = (p.x - (r.left + r.width / 2)) / innerWidth;
            var ny = (p.y - (r.top + r.height / 2)) / innerHeight;
            toX(Math.max(-1, Math.min(1, nx)) * -5);
            toY(Math.max(-1, Math.min(1, ny)) * -3);
        });
    }

    /* ---------- CMYK pixel spark burst ---------- */
    // Not on ordinary clicks any more (a click stamps a Game of Life glider); only
    // the easter eggs in secrets.js call it, through window.__fx.burst.
    // Uses the browser's own animations rather than GSAP: GSAP reads the computed
    // style of every new element it touches, which forced a full style recalculation
    // per spark and made fast bursts janky.
    var burstLayer = null;
    var EASE_OUT = 'cubic-bezier(0.215, 0.61, 0.355, 1)'; // same curve as GSAP's power3.out
    function burst(x, y, count) {
        if (!burstLayer) burstLayer = el('div', 'fx-burst-layer');
        count = count || 9;
        for (var i = 0; i < count; i++) {
            var s = el('span', 'fx-spark', burstLayer);
            var size = 3 + ((Math.random() * 3) | 0);
            var angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
            var dist = 22 + Math.random() * 30;
            var tx = x + Math.cos(angle) * dist;
            var ty = y + Math.sin(angle) * dist;
            var turn = (Math.random() - 0.5) * 180;
            s.style.width = s.style.height = size + 'px';
            s.style.background = CMY[i % 3];
            s.animate([
                { transform: 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)', opacity: 1 },
                { transform: 'translate(' + tx + 'px,' + ty + 'px) translate(-50%,-50%) rotate(' + turn + 'deg) scale(0.4)', opacity: 0 }
            ], { duration: 550 + Math.random() * 250, easing: EASE_OUT, fill: 'forwards' }).onfinish = s.remove.bind(s);
        }
    }

    /* ---------- Click (a): squash-and-spring press feedback ---------- */
    function initPress() {
        var sel = '.link-badge, .scry-view-btn, .nav-link, .lang-toggle a, ' + CARD_SEL;
        var pressed = null;
        function squash(target, value, vars) {
            var s = target._fxPress || (target._fxPress = { v: 1 });
            target.classList.add('fx-press');
            vars.v = value;
            vars.overwrite = true;
            vars.onUpdate = function () { target.style.setProperty('--press', s.v.toFixed(3)); };
            gsap.to(s, vars);
        }
        document.addEventListener('pointerdown', function (e) {
            if (e.button !== 0) return;
            pressed = e.target.closest(sel);
            if (!pressed) return;
            squash(pressed, pressed.matches(CARD_SEL) ? 0.98 : 0.92, { duration: 0.12, ease: 'power2.out' });
        });
        function letGo() {
            if (!pressed) return;
            squash(pressed, 1, { duration: 0.7, ease: 'elastic.out(1, 0.35)' });
            pressed = null;
        }
        document.addEventListener('pointerup', letGo);
        document.addEventListener('pointercancel', letGo);
    }

    /* ---------- Click (b): Scrying Pool view switch, cards stagger in ---------- */
    function initViewStagger() {
        var bar = document.querySelector('.scry-views');
        var byDate = document.getElementById('scry-by-date');
        var byType = document.getElementById('scry-by-type');
        if (!bar || !byDate || !byType) return;
        var wasDate = null;
        // The capture phase runs before main.js swaps the views, so we can tell
        // afterwards whether the click changed anything.
        bar.addEventListener('click', function () { wasDate = !byDate.hidden; }, true);
        bar.addEventListener('click', function (e) {
            if (!e.target.closest('.scry-view-btn')) return;
            // main.js swaps the views in its own click handler; animate on the next frame.
            requestAnimationFrame(function () {
                var isDate = !byDate.hidden;
                if (isDate === wasDate) return;
                var view = isDate ? byDate : byType;
                var items = Array.prototype.filter.call(
                    view.querySelectorAll('.scry-card, .scry-whisper, .scry-mini, .spells-section-title'),
                    function (n) { var r = n.getBoundingClientRect(); return r.top < innerHeight * 1.5 && r.bottom > -50; }
                ).slice(0, 30);
                // fromTo with fixed end values, so a fast toggle back and forth can never
                // leave cards stuck at the half-faded values of an interrupted run.
                // The cards' own CSS transitions are paused meanwhile so they don't smear it.
                gsap.fromTo(items, { y: 18, opacity: 0, transition: 'none' }, {
                    y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.025,
                    overwrite: true, clearProps: 'transform,opacity,transition'
                });
            });
        });
    }

    var life = initLife();
    initScramble();
    initPortraitDrift();
    initPress();
    initViewStagger();

    // Shared with secrets.js
    window.__fx = { burst: burst, pointer: pointer, onFrame: onFrame, finePointer: finePointer, isJa: isJa, ensureTints: ensureTints, tinted: tinted, life: life };
})();
