/* ============================================
   RPG Character Sheet — Main JS
   ============================================ */

(function () {
    'use strict';

    // --- Radar Chart ---
    const stats = [
        { label: 'PER', value: 18 },
        { label: 'INT', value: 18 },
        { label: 'STR', value: 17 },
        { label: 'CON', value: 17 },
        { label: 'WIS', value: 17 },
        { label: 'CHA', value: 16 },
        { label: 'DEX', value: 15 },
        { label: 'PAT', value: 15 },
        { label: 'IDL', value: 5, weak: true },
        { label: 'TRD', value: 6, weak: true },
        { label: 'SCP', value: 6, weak: true },
        { label: 'FOC', value: 7, weak: true },
        { label: 'PRU', value: 8, weak: true },
    ];

    function buildRadarChart() {
        const svg = document.getElementById('radar-chart');
        if (!svg) return;

        const cx = 200, cy = 200, maxR = 150;
        const n = stats.length;
        const maxStat = 20;

        // Draw concentric rings
        const rings = [0.25, 0.5, 0.75, 1.0];
        rings.forEach(function (scale) {
            const points = [];
            for (let i = 0; i < n; i++) {
                const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                const r = maxR * scale;
                points.push((cx + r * Math.cos(angle)).toFixed(1) + ',' + (cy + r * Math.sin(angle)).toFixed(1));
            }
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', points.join(' '));
            polygon.setAttribute('fill', 'none');
            polygon.setAttribute('stroke', 'rgba(0, 229, 229, 0.1)');
            polygon.setAttribute('stroke-width', '1');
            svg.appendChild(polygon);
        });

        // Draw axis lines
        for (let i = 0; i < n; i++) {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const x2 = cx + maxR * Math.cos(angle);
            const y2 = cy + maxR * Math.sin(angle);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', cx);
            line.setAttribute('y1', cy);
            line.setAttribute('x2', x2.toFixed(1));
            line.setAttribute('y2', y2.toFixed(1));
            line.setAttribute('stroke', 'rgba(0, 229, 229, 0.06)');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);
        }

        // Draw stat polygon
        const statPoints = [];
        for (let i = 0; i < n; i++) {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const r = maxR * (stats[i].value / maxStat);
            statPoints.push((cx + r * Math.cos(angle)).toFixed(1) + ',' + (cy + r * Math.sin(angle)).toFixed(1));
        }

        // Glow background
        const glowPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        glowPoly.setAttribute('points', statPoints.join(' '));
        glowPoly.setAttribute('fill', 'rgba(0, 229, 229, 0.08)');
        glowPoly.setAttribute('stroke', 'none');
        svg.appendChild(glowPoly);

        // Main polygon
        const mainPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        mainPoly.setAttribute('points', statPoints.join(' '));
        mainPoly.setAttribute('fill', 'rgba(0, 229, 229, 0.12)');
        mainPoly.setAttribute('stroke', '#00e5e5');
        mainPoly.setAttribute('stroke-width', '2');
        mainPoly.style.filter = 'drop-shadow(0 0 6px rgba(0, 229, 229, 0.4))';
        svg.appendChild(mainPoly);

        // Draw dots and labels
        for (let i = 0; i < n; i++) {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const r = maxR * (stats[i].value / maxStat);
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            // Dot
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x.toFixed(1));
            circle.setAttribute('cy', y.toFixed(1));
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', stats[i].weak ? '#e500cc' : '#00e5e5');
            circle.setAttribute('stroke', '#000000');
            circle.setAttribute('stroke-width', '2');
            circle.style.filter = 'drop-shadow(0 0 4px rgba(0, 229, 229, 0.5))';
            svg.appendChild(circle);

            // Label
            const labelR = maxR + 25;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', lx.toFixed(1));
            text.setAttribute('y', (ly + 4).toFixed(1));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', stats[i].weak ? '#e500cc' : '#00e5e5');
            text.setAttribute('font-family', "'Inconsolata', monospace");
            text.setAttribute('font-size', '13');
            text.setAttribute('font-weight', '400');
            text.setAttribute('letter-spacing', '0.1em');
            text.textContent = stats[i].label;
            svg.appendChild(text);

            // Value below label
            const valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            valText.setAttribute('x', lx.toFixed(1));
            valText.setAttribute('y', (ly + 19).toFixed(1));
            valText.setAttribute('text-anchor', 'middle');
            valText.setAttribute('fill', '#c8c8c8');
            valText.setAttribute('font-family', "'Inconsolata', monospace");
            valText.setAttribute('font-size', '14');
            valText.setAttribute('font-weight', '300');
            valText.textContent = stats[i].value;
            svg.appendChild(valText);
        }
    }

    // --- Particle System ---
    function initParticles() {
        const canvas = document.getElementById('particles');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let w, h;
        const particles = [];
        const count = 40;

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -Math.random() * 0.4 - 0.1,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.4 + 0.1,
                color: ['0,229,229', '229,0,204', '229,216,0'][Math.floor(Math.random() * 3)],
            });
        }

        function animate() {
            ctx.clearRect(0, 0, w, h);
            particles.forEach(function (p) {
                p.x += p.vx;
                p.y += p.vy;

                if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + p.color + ',' + p.alpha + ')';
                ctx.fill();
            });
            requestAnimationFrame(animate);
        }

        animate();
    }

    // --- Init ---
    document.addEventListener('DOMContentLoaded', function () {
        buildRadarChart();
        initParticles();
    });

})();
