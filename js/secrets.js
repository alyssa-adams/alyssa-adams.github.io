/* ============================================
   secrets.js: hidden things
   1. A click stamps the glider pointer into the Game of Life (the world is in fx.js)
   2. A pixel cat (Sumi) that sometimes walks along the bottom edge; ?cat brings it now
   3. Click the portrait five times quickly
   4. A note for whoever opens the console
   Loaded with `defer` after gsap.min.js and fx.js. Off for reduced motion.
   ============================================ */
(function () {
    'use strict';

    var gsap = window.gsap;
    if (!gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var fx = window.__fx || {};
    var burst = fx.burst || function () {};
    var isJa = (document.documentElement.lang || '').toLowerCase().indexOf('ja') === 0;

    function make(tag, cls, parent) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        n.setAttribute('aria-hidden', 'true');
        (parent || document.body).appendChild(n);
        return n;
    }

    var portraitImg = document.querySelector('.hero-portrait img');
    function insidePortrait(e) {
        if (!portraitImg) return false;
        var r = portraitImg.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }

    /* ---------- 1. Game of Life: a click stamps a glider ---------- */
    // fx.js owns the world and its canvas; this decides which clicks count.
    // Only a clean click: pressed and released within 6 px (not a drag), not the
    // second click of a double-click (that selects a word), no text selected.
    // Never in a form field, and never on the targets of the other secrets.
    // It only reads the click, so a link or button still does what it does.
    (function life() {
        var world = fx.life;
        if (!world) return;
        var SKIP = 'input, textarea, select, [contenteditable], .pixel-cat';
        // Used only when the settings say spawn: 'margins' (empty background only)
        var MARGINS = 'a, button, label, img, picture, svg, video, iframe, p, li, dt, dd, td, th, ' +
            'blockquote, figcaption, h1, h2, h3, h4, h5, h6, span, em, strong, code, time, nav, footer, ' +
            '.ability-card, .scry-card, .scry-mini, .scry-whisper, .scry-registry-row, .stats-panel, .hero-info, .scry-views';
        var down = null;

        document.addEventListener('pointerdown', function (e) {
            down = e.button === 0 ? { x: e.clientX, y: e.clientY, type: e.pointerType } : null;
        }, { capture: true, passive: true });

        document.addEventListener('click', function (e) {
            var d = down;
            down = null;
            // A click from the keyboard (Enter on a link) has no pointerdown before it
            if (e.button !== 0 || !d) return;
            if (Math.abs(e.clientX - d.x) > 6 || Math.abs(e.clientY - d.y) > 6) return;
            if (e.detail > 1) return;
            if (String(window.getSelection && window.getSelection()).length) return;
            var t = e.target;
            if (!t || !t.closest || t.closest(SKIP) || insidePortrait(e)) return;
            if (world.config.gliders.spawn === 'margins' && t.closest(MARGINS)) return;
            world.stamp(e.clientX, e.clientY, d.type);
        });
    })();

    /* ---------- 2. The pixel cat ---------- */
    // Sumi, from the Cat Lab: a black cat with a red collar and a gold bell. One
    // sprite pixel is one Life cell (4 x 4 CSS px) and it only ever moves in whole
    // cells, so it sits on the same grid as the cursor and the gliders. Once per
    // page view, 10 s in (later if the tab is hidden then), it walks along the
    // bottom edge, sits halfway to wink at
    // you, and walks on. Clicked or tapped, it says nya~, squats, strains, leaves a
    // real glider behind it in a random ink, and runs off.
    // Add ?cat to the address to have it walk in after about a second.
    (function cat() {
        var CELL = 4;              // CSS px per sprite pixel: one Life cell
        var STEP_MS = 80;          // a walk frame and one cell forward: 50 px/s
        var W = 30, H = 24;        // sprite size, in cells
        var REAR = [7, 20];       // its rump in the squat (facing right): the glider appears behind it
        var HEAD = [20, 6];        // top centre of its head when it says nya~
        var COLOURS = ['#7fb2ba', '#1c1b22', '#535866', '#e88fb4', '#34333c', '#f2cf3a', '#ffffff', '#0c0b0f', '#f2a2c0', '#d9648c', '#9a96a8', '#d8322e', '#fff1a6', '#e5c21a', '#121117', '#8f720c', '#5b5965', '#8d8a98', '#c2486c', '#9fd8ee'];
        // Frames, run-length coded row by row: a letter (a colour above, a = 0) or
        // '.' (empty), then a count when it repeats. Exported from the Cat Lab's rig.
        var CODE = {
            walk: [
                '.136a.7a.20aba.5aba.18cbdba5bdbc.6a3.8cbdb7dbc.5ab3c.7cb11c.4cb3e.8ab11a.4cb2e.8cb13c.3cb2c.8ab4fb5fb2a.3cb2c.4a4b4ghfb3ghfb2c.2cb2c.3ab8fhfb3fhfbe.3cb2c.2ab10fb2ib2fb2c.3cb2a3b10j2kbkbkj2e.5eb17kbkb3c.5cb21ae.7e2be2b10l2mnl3c.9e.2eo10anpe3.14e2b2o2eab2o2a.19ab2a2b2e2o2a.17cq2r4e.2eq2c.17e6.4e2.7',
                '.106a.7a.20aba.5aba.18cbdba5bdbc.6a2.9cbdb7dbc.5ab2c.8cb11c.4ab2e.9ab11a.3cb3c.8cb13c.2cb2e.9ab4fb5fb2a.2cb2c.5a4b4ghfb3ghfb2c.cb2c.4ab8fhfb3fhfbe.2cb2a.3ab10fb2ib2fb2c.3eb2a.cb10j2kbkbkj2e.4cb3a2b13kbkb3c.5eb21ae.7eb3eb10l2mnl3c.8e3.eo10anpe3.14e2b2o2e2b2o2e.18cb2o2cab2o2a.19eb2ecr2e2o2c.18cr2c.e2.cq2c.19e2.6e2.8',
                '.106a.7a.20aba.5aba.18cbdba5bdbc.7a.9cbdb7dbc.5a2bc.8cb11c.4cb2e.9ab11a.4ab2c.8cb13c.2cb2e.9ab4fb5fb2a.2cb2c.5a4b4ghfb3ghfb2c.cb2c.4ab8fhfb3fhfbe.2cb2a.3ab10fb2ib2fb2c.2cb3c.cb10j2kbkbkj2e.4eb2a3b13kbkb3c.4cb22ae.6e2b14l2mnl3c.8e5o10anpe3.14e2b2o2e2b2o2e.18cb2o2c2b2o2c.18cb2q2c2r2o2c.18cr2e2.2e2q2c.19e2.6e2.9',
                '.136a.7a.20aba.5aba.18cbdba5bdbc.6a2.9cbdb7dbc.5ab2c.8cb11c.4ab2e.9ab11a.3cb3c.8cb13c.2cb2e.9ab4fb5fb2a.2cb2c.5a4b4ghfb3ghfb2c.cb2c.4ab8fhfb3fhfbe.2cb2a.3ab10fb2ib2fb2c.3eb2a.cb10j2kbkbkj2e.4cb3a2b13kbkb3c.5eb21ae.7eb3eb10l2mnl3c.8e3.eo10anpe3.14e2b2o2aeb2o2e.18ab2eq2cer2oc.17cr2e.e2.cq2e.19e2.6e2.10',
                '.136a.7a.20aba.5aba.18cbdba5bdbc.6a3.8cbdb7dbc.5ab3c.7cb11c.4cb3e.8ab11a.4cb2e.8cb13c.3cb2c.8ab4fb5fb2a.3cb2c.4a4b4ghfb3ghfb2c.2cb2c.3ab8fhfb3fhfbe.3cb2c.2ab10fb2ib2fb2c.3cb2a3b10j2kbkbkj2e.5eb17kbkb3c.5cb21ae.7e2be2b10l2mnl3c.9e.2eo10anpe3.14eab2o2aeb2o2e.17ab2e2o2a2b2a.17cr2e.2eq4r2c.17e2.4e6.9',
                '.106a.7a.20aba.5aba.8a2.8cbdba5bdbc.6ab2c.7cbdb7dbc.5ab2e.8cb11c.4cb3c.8ab11a.4cb2e.8cb13c.3cb2c.8ab4fb5fb2a.3cb2c.4a4b4ghfb3ghfb2c.2cb2c.3ab8fhfb3fhfbe.3cb2a.2ab10fb2ib2fb2c.4eb2a2b10j2kbkbkj2e.5cb17kbkb3c.6eb20ae.8e4b10l2mnl3c.12eo10anpe3.14e2b2o2e2b2o2e.18ab2o2acb2o2c.17cr2e2o2ceb2e.19e2.cq2c2r2c.23e2.2e2.10',
                '.106a.7a.20aba.5aba.9a.8cbdba5bdbc.6a2bc.7cbdb7dbc.5cb2e.8cb11c.5ab2c.8ab11a.4cb2e.8cb13c.3cb2c.8ab4fb5fb2a.3cb2c.4a4b4ghfb3ghfb2c.2cb2a.3ab8fhfb3fhfbe.3cb3c.ab10fb2ib2fb2c.4eb2a2b10j2kbkbkj2e.5cb17kbkb3c.6eb20ae.8e4b10l2mnl3c.12eo10anpe3.14e2b2o2e2b2o2e.18cb2o2c2b2o2c.18cr2o2c2b2q2c.19e2q2c2r2e2.22e2.2e2.11',
                '.136a.7a.20aba.5aba.8a2.8cbdba5bdbc.6ab2c.7cbdb7dbc.5ab2e.8cb11c.4cb3c.8ab11a.4cb2e.8cb13c.3cb2c.8ab4fb5fb2a.3cb2c.4a4b4ghfb3ghfb2c.2cb2c.3ab8fhfb3fhfbe.3cb2a.2ab10fb2ib2fb2c.4eb2a2b10j2kbkbkj2e.5cb17kbkb3c.6eb20ae.8e4b10l2mnl3c.12eo10anpe3.14e2b2o2e2b2o2a.19er2ocab2eq2c.18cq2ecr2e.e2.20e2.2e2.12'
            ],
            stand: '.136a.7a.20aba.5aba.18cbdba5bdbc.6a3.8cbdb7dbc.5ab3c.7cb11c.4cb3e.8ab11a.4cb2e.8cb13c.3cb2c.8ab4fb5fb2a.3cb2c.4a4b4ghfb3ghfb2c.2cb2c.3ab8fhfb3fhfbe.3cb2c.2ab10fb2ib2fb2c.3cb2a3b10j2kbkbkj2e.5eb17kbkb3c.5cb21ae.7e2be2b10l2mnl3c.9e.2eo10anpe3.14e2b2o2e2b2o2e.18cb2o2c2b2o2c.18cr2q2c2r2q2c.19e4.2e4.9',
            sit: '.12a.7a.20aba.5aba.18cbdba5bdbc.17cbdb7dbc.17cb11c.17ab11a.16cb13c.15ab3fb5fb3a.14cb3ghfb3ghfb3c.14eb2fhfb3fhfb2e.15cb3fb2ib2fb3c.16ebj2kbkbkj2be.17cb4kbkb4c.17ab9e2.16acb3l2mnl3c.16abcb5npb3c.15cb2cb10c.15cb2cb10c.15cb2ab10c.15cb13c.16eb9ob2c.16cb9ob2c.17eb4r2q2er2c.18e8.e2.10',
            sitB: '.12a.7a.20aba.5aba.18cbdba5bdbc.17cbdb7dbc.17cb11c.17ab11a.16cb13c.15ab3fb5fb3a.14cb3ghfb3ghfb3c.14eb2fhfb3fhfb2e.15cb3fb2ib2fb3c.16ebj2kbkbkj2be.17cb4kbkb4c.14a.2ab9e2.14cbacb3l2mnl3c.15ab2cb5npb3c.14cb2ecb10c.14cb2c2b10c.14cb2a2b10c.14cb14c.15eb10ob2c.15cb10ob2c.16eb5r2q2er2c.17e9.e2.10',
            blink: '.12a.7a.20aba.5aba.18cbdba5bdbc.17cbdb7dbc.17cb11c.17ab11a.16cb13c.15ab13a.14cb15c.14eb2f3b3f3b2e.15cb6ib6c.16ebj2kbkbkj2be.17cb4kbkb4c.17ab9e2.16acb3l2mnl3c.16abcb5npb3c.15cb2cb10c.15cb2cb10c.15cb2ab10c.15cb13c.16eb9ob2c.16cb9ob2c.17eb4r2q2er2c.18e8.e2.10',
            wink: '.12a.7a.20aba.5aba.18cbdba5bdbc.17cbdb7dbc.17cb11c.17ab11a.16cb13c.15ab3fb9a.14cb3ghfb4fb4c.14eb2fhfb3fbfb2e.15cb3fb2ib6c.16ebj2kbkbkj2be.17cb4kbkb4c.17ab9e2.16acb3l2mnl3c.16abcb5npb3c.15cb2cb10c.15cb2cb10c.15cb2ab10c.15cb13c.16eb9ob2c.16cb9ob2c.17eb4r2q2er2c.18e8.e2.10',
            nya: '.136a.7a.20aba.5aba.18cbdba5bdbc.6a3.8cbdb7dbc.5ab3c.7cb11c.4cb3e.8ab11a.4cb2e.8cb13c.3cb2c.8ab13a.3cb2c.4a4b4fb5fb4c.2cb2c.3ab7fbfb3fbfb2e.3cb2c.2ab12ib6c.3cb2a3b9j2b2sb2j2be.5eb23c.5cb21e2.7e2be2b9l2mnl3c.10e.2eo10npe3.15e2b2o2e2b2o2c.18cb2o2c2b2o2c.18cr2q2c2r2q2c.19e4.2e4.9',
            squat: '.166a.7a.20aba.5aba.18cbdba5bdbc.12a.4cbdb7dbc.11abc.3cb11c.10cb2c.3ab11a.10ab2c.2cb13c.8cb2e.3ab3fb5fb3a.8cb2ca3b3ghfb3ghfb3c.7cb2ab6fhfb3fhfb2e.8cb10fb2ib2fb3c.8cb9j2kbkbkj2be.9cb12kbkb4c.9cb17e2.10cb10l2mnl3c.12eb7o2b2npe3.13cb7e2b2o2c.16eb4r2c2r2q2c.17e6.2e4.9',
            strainA: '.166a.7a.20aba.5aba.18cbdba5bdbc.12a.4cbdb7dbc.11abc.3cb11c.10cb2c.3ab11a.10ab2c.2cb13c.8cb2e.3ab2fb7fb2a.8cb2ca3b4f2b3f2b4c.7cb2ab6fb7fb2e.8cb13ib6c.8cb9j2kbkbkj2be.9cb12kbkb4c.9cb17e2.10cb10l2mnl3c.12eb7o2b2npe3.13cb7e2b2o2c.16eb4r2c2r2q2c.17e6.2e4.9',
            strainB: '.196a.7a.13a.6aba.5aba.11cba.4cbdba5bdbc.10ab2c.3cbdb7dbc.9cb2e.4cb11c.9cb2c.4ab11a.t.7cb2c.3ab13ct.7cb2ca3b3fb7fb2a.8cb2ab7f2b3f2b4c.7cb9fb7fb2e.8cb13ib6c.8cb9j2kbkbkj2be.9cb12kbkb4c.9cb17e2.11eb7o2l2mnl3c.12cb7e2b2npe3.14eb4r2c2r2q2c.17e6.2e4.9',
            relief: '.166a.7a.20aba.5aba.12a.5cbdba5bdbc.10cba.4cbdb7dbc.10ab2c.3cb11c.9cb2e.4ab11a.9cb2c.3cb13c.8cb2c.3ab13a.8cb2ca3b4fb5fb4c.7cb2ab6fbfb3fbfb2e.8cb13ib6c.8cb9j2kbkbkj2be.9cb12kbkb4c.9cb17e2.10cb10l2mnl3c.12eb7o2b2npe3.13cb7e2b2o2c.16eb4r2c2r2q2c.17e6.2e4.9',
            run: [
                '.137a.7a.20aba.5aba.18cbdba5bdbc.17cbdb7dbc.17cb11c.4a.12ab11a.3cba2.9cb13c.2cb3c.2a7b4fb5fb2a.3eba.2ab10ghfb3ghfb2c.2cb2a2b11fhfb3fhfbe.4eb15fb2ib2fb2c.5eb13j2kbkbkj2e.7e2b14kbkb3c.8co11b7ae.10eo3b2o6l2mnl3c.11e2b2oe7bnpe3.13ab2oc.6eb2a.14ab2qe.7cb2qc.12cr2e2.9er2c.13e2.12e2.6',
                '.167a.7a.20aba.5aba.18cbdba5bdbc.17cbdb7dbc.17cb11c.4a.12ab11a.3cba2.9cb13c.2cb3c.2a7b4fb5fb2a.3eba.2ab10ghfb3ghfb2c.2cb2a2b11fhfb3fhfbe.4eb15fb2ib2fb2c.5eb13j2kbkbkj2e.7e2b14kbkb3c.8co11b7ae.10eo3b2o6l2mnl3c.11e4b2oe4b2npe3.15cr2oa.2cr2e2.19e2q2c.cq2c.22e2.3e2.9',
                '.167a.7a.20aba.5aba.18cbdba5bdbc.17cbdb7dbc.17cb11c.4a.12ab11a.3cba2.9cb13c.2cb3c.2a7b4fb5fb2a.3eba.2ab10ghfb3ghfb2c.2cb2a2b11fhfb3fhfbe.4eb15fb2ib2fb2c.5eb13j2kbkbkj2e.7e2b14kbkb3c.8co11b7ae.10eo3b2o6l2mnl3c.11e4b2ae3b2onpe3.15cb2oc.ab2oe2.19er2c2r2q2c.21e2.2e4.9',
                '.137a.7a.20aba.5aba.18cbdba5bdbc.17cbdb7dbc.17cb11c.4a.12ab11a.3cba2.9cb13c.2cb3c.2a7b4fb5fb2a.3eba.2ab10ghfb3ghfb2c.2cb2a2b11fhfb3fhfbe.4eb15fb2ib2fb2c.5eb13j2kbkbkj2e.7e2b14kbkb3c.8co11b7ae.10eo3b2o6l2mnl3c.11e3b2oe5b2npe3.14ab2oc.4eb2oa.15cb2q2c.4cr2o2c.14cr2e2.6e2q2c.15e2.10e2.6'
            ]
        };
        // The pause halfway across: [until ms, frame]; it walks on after the last
        var PAUSE = [[200, 'stand'], [700, 'sit'], [820, 'blink'], [1200, 'sitB'], [1900, 'wink'], [2300, 'sit'], [2500, 'stand']];

        function unpack(code) {
            var c = document.createElement('canvas');
            c.width = W;
            c.height = H;
            var ctx = c.getContext('2d');
            var re = /([.a-z])(\d*)/g, m, p = 0;
            while ((m = re.exec(code))) {
                var n = m[2] ? +m[2] : 1;
                if (m[1] !== '.') {
                    ctx.fillStyle = COLOURS[m[1].charCodeAt(0) - 97];
                    for (var q = p; q < p + n; q++) ctx.fillRect(q % W, (q / W) | 0, 1, 1);
                }
                p += n;
            }
            return c;
        }
        function snap(v) { return Math.round(v / CELL) * CELL; }

        function spawn() {
            if (document.hidden) { setTimeout(spawn, 5000); return; }
            var F = {};
            Object.keys(CODE).forEach(function (k) {
                F[k] = Array.isArray(CODE[k]) ? CODE[k].map(unpack) : unpack(CODE[k]);
            });
            // The canvas holds one pixel per cell; CSS scales it by exactly 4 with
            // pixelated rendering, and its position is always a multiple of 4.
            var el = make('canvas', 'pixel-cat');
            el.width = W;
            el.height = H;
            el.style.width = W * CELL + 'px';
            el.style.height = H * CELL + 'px';
            var ctx = el.getContext('2d');
            var cur = null;
            function show(c) {
                if (c === cur) return;
                cur = c;
                ctx.clearRect(0, 0, W, H);
                ctx.drawImage(c, 0, 0);
            }

            var dir = Math.random() < 0.5 ? 1 : -1;
            var w = W * CELL;
            var startX = dir > 0 ? -w - 8 : snap(innerWidth + 8);
            var endX = dir > 0 ? snap(innerWidth + 8) : -w - 8;
            var pauseX = startX + snap((endX - startX) * (0.35 + Math.random() * 0.3));
            var x = startX, state = 'walk', t0 = 0, fi = 0, ri = 0, acc = 0, v = 0, runFrom = 0, dist = 0;
            var pooped = false, raf = 0, last = performance.now();
            // On a cell row, with one cell of floor under its feet
            function top() { return Math.floor((innerHeight - CELL - H * CELL) / CELL) * CELL; }
            function place() {
                el.style.transform = 'translate(' + x + 'px,' + top() + 'px)' + (dir < 0 ? ' scaleX(-1)' : '');
            }
            // Sprite x as seen on screen (the frames face right; walking left mirrors them)
            function sx(u) { return dir > 0 ? u : W - 1 - u; }

            function tick(now) {
                raf = 0;
                var dt = Math.min(100, Math.max(0, now - last));
                last = now;
                if (state === 'walk' || state === 'walk2') {
                    acc += dt;
                    while (acc >= STEP_MS) {
                        acc -= STEP_MS;
                        fi = (fi + 1) % 8;
                        x += dir * CELL;
                        var target = state === 'walk' ? pauseX : endX;
                        if ((dir > 0 && x >= target) || (dir < 0 && x <= target)) {
                            x = target;
                            if (state === 'walk2') { done(); return; }
                            state = 'pause';
                            t0 = now;
                            break;
                        }
                    }
                    if (state !== 'pause') show(F.walk[fi]);
                }
                if (state === 'pause') {
                    var t = now - t0, key = null;
                    for (var i = 0; i < PAUSE.length; i++) if (t < PAUSE[i][0]) { key = PAUSE[i][1]; break; }
                    if (key) show(F[key]);
                    else { state = 'walk2'; acc = 0; show(F.walk[fi]); }
                } else if (state === 'poop') {
                    // nya~, squat, strain (the head bobs one cell), a glider, then off
                    var tp = now - t0;
                    if (tp < 450) show(F.nya);
                    else if (tp < 750) show(F.squat);
                    else if (tp < 1850) show(Math.floor((tp - 750) / 110) % 2 ? F.strainB : F.strainA);
                    else {
                        if (!pooped) { pooped = true; poop(); }
                        if (tp < 2250) show(F.relief);
                        else { state = 'run'; v = 160; dist = 0; acc = 0; runFrom = x; }
                    }
                } else if (state === 'run') {
                    v = Math.min(560, v + 900 * dt / 1000);
                    dist += v * dt / 1000;
                    x = runFrom + dir * snap(dist);
                    acc += dt;
                    if (acc >= 75) { acc %= 75; ri = (ri + 1) % 4; }
                    show(F.run[ri]);
                    if ((dir > 0 && x >= endX) || (dir < 0 && x <= endX)) { done(); return; }
                }
                place();
                raf = requestAnimationFrame(tick);
            }

            // A glider behind its rump, heading back and up into the page, in a random ink
            function poop() {
                var life = fx.life;
                if (!life || !life.glider) return;
                var u = sx(REAR[0] - 3), row = REAR[1] - 2;
                life.glider(x + u * CELL + CELL / 2, top() + row * CELL + CELL / 2, -dir, -1, 1 + ((Math.random() * 3) | 0));
            }

            // nya~ as plain text over its head: it fades in, stays a moment, fades out
            function say() {
                var b = make('div', 'fx-bubble');
                b.textContent = isJa ? 'にゃー' : 'nya~';
                gsap.set(b, { x: x + sx(HEAD[0]) * CELL + CELL / 2, y: top() + HEAD[1] * CELL - 6, xPercent: -50, yPercent: -100, opacity: 0 });
                gsap.timeline({ onComplete: function () { b.remove(); } })
                    .to(b, { opacity: 1, duration: 0.18, ease: 'power1.out' })
                    .to(b, { opacity: 0, duration: 0.35, ease: 'power1.in' }, '+=0.8');
            }

            function done() {
                if (raf) cancelAnimationFrame(raf);
                raf = 0;
                el.remove();
            }

            el.addEventListener('click', function () {
                if (state === 'poop' || state === 'run') return;
                state = 'poop';
                t0 = performance.now();
                say();
            });

            show(F.walk[0]);
            place();
            raf = requestAnimationFrame(tick);
        }

        setTimeout(spawn, /[?&]cat(?:[=&]|$)/.test(location.search) ? 1000 : 10000);
    })();

    /* ---------- 3. The portrait comes apart into C, M and Y ---------- */
    (function portrait() {
        if (!portraitImg) return;
        var frame = portraitImg.closest('.portrait-frame');
        if (!frame) return;
        var clicks = [];
        var busy = false;
        var cache = null;

        document.addEventListener('click', function (e) {
            // The portrait sits behind the page (z-index -1), so clicks are matched by
            // position; skip the things that float above it.
            if (busy || e.target.closest('a, button, .pixel-cat') || !insidePortrait(e)) return;
            var now = performance.now();
            clicks = clicks.filter(function (t) { return now - t < 2500; });
            clicks.push(now);
            if (clicks.length >= 5) { clicks = []; split(); }
        });

        function split() {
            busy = true;
            var ghosts = frame.querySelectorAll('.fx-ghost');
            // Pre-tinted canvases (made once, reused) move smoothly; an <img> with an
            // SVG colour filter is the fallback if the portrait can't be read.
            if (!cache) {
                cache = ['c', 'm', 'y'].map(function (k) {
                    var g = fx.tinted ? fx.tinted(portraitImg, k) : null;
                    if (!g) {
                        if (fx.ensureTints) fx.ensureTints();
                        g = document.createElement('img');
                        g.src = portraitImg.currentSrc || portraitImg.src;
                        g.alt = '';
                        g.style.filter = 'url(#fx-tint-' + k + ')';
                    }
                    g.className = 'fx-split';
                    g.setAttribute('aria-hidden', 'true');
                    return g;
                });
            }
            var layers = cache.map(function (g) { frame.appendChild(g); return g; });
            var out = [[-34, -12, -4], [30, 10, 3], [4, -30, 1.5]];
            var drift = [[-26, -16, -2], [24, 14, 2], [-2, -24, -1]];
            var r = portraitImg.getBoundingClientRect();

            var fadeOut = [portraitImg].concat(Array.prototype.slice.call(ghosts));
            var tl = gsap.timeline({
                onComplete: function () {
                    layers.forEach(function (l) { l.remove(); });
                    busy = false;
                }
            });
            tl.to(fadeOut, { opacity: 0, duration: 0.25 }, 0)
                .fromTo(layers, { x: 0, y: 0, rotation: 0, opacity: 1 }, {
                    x: function (i) { return out[i][0]; },
                    y: function (i) { return out[i][1]; },
                    rotation: function (i) { return out[i][2]; },
                    duration: 0.7, ease: 'power3.out'
                }, 0)
                .to(layers, {
                    x: function (i) { return drift[i][0]; },
                    y: function (i) { return drift[i][1]; },
                    rotation: function (i) { return drift[i][2]; },
                    duration: 0.9, ease: 'sine.inOut'
                })
                .to(layers, { x: 0, y: 0, rotation: 0, duration: 1.2, ease: 'elastic.out(1, 0.45)' })
                .call(function () { burst(r.left + r.width / 2, r.top + r.height * 0.4, 14); }, null, '-=0.9')
                .to(portraitImg, { opacity: 1, duration: 0.4, clearProps: 'opacity' }, '-=0.5')
                .to(layers, { opacity: 0, duration: 0.4 }, '<');
            if (ghosts.length) tl.to(ghosts, { opacity: 0.45, duration: 0.4, clearProps: 'opacity' }, '<');
        }
    })();

    /* ---------- 4. For whoever opens the console ---------- */
    try {
        console.log('%c /\\_/\\\n( o.o )\n > ^ <', 'color:#00e5e5;font-family:monospace;font-size:14px;line-height:1.2');
        console.log('%c' + (isJa
            ? 'こんにちは。このサイトにはいくつか隠しものがあります。あちこち触ってみてください。'
            : 'Hello, curious one. There are a few hidden things on this site. Try poking around.'),
            'color:#e500cc;font-family:monospace');
    } catch (err) { /* no console, no secret */ }
})();
