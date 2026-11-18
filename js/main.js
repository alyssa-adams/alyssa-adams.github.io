/* ============================================
   RPG Character Sheet — Main JS
   ============================================ */

(function () {
    'use strict';

    // --- Scrying Pool: By Type / By Date views ---
    // The type view is the static HTML. The date view is built once from clones of the
    // same cards and Whispers rows (each carries data-date), grouped into one section per
    // year, newest first: that year's cards in a grid, then its rows in a list below.
    function initScryViews() {
        const byType = document.getElementById('scry-by-type');
        const byDate = document.getElementById('scry-by-date');
        const bar = document.querySelector('.scry-views');
        if (!byType || !byDate || !bar) return;

        const buttons = bar.querySelectorAll('.scry-view-btn');
        let built = false;

        function buildDateView() {
            const items = Array.prototype.slice.call(
                byType.querySelectorAll('article[data-date]:not([data-type-only]), .scry-whisper[data-date]')
            ).map(function (item) {
                const clone = item.cloneNode(true);
                clone.hidden = false;
                clone.removeAttribute('data-date-only');
                return clone;
            });
            items.sort(function (a, b) {
                return b.dataset.date.localeCompare(a.dataset.date);
            });

            let section = null, grid = null, list = null, year = null;
            items.forEach(function (item) {
                const y = item.dataset.date.slice(0, 4);
                if (y !== year) {
                    year = y;
                    grid = list = null;
                    section = document.createElement('section');
                    section.className = 'spells-section scry-section';
                    section.id = 'year-' + y;
                    const h2 = document.createElement('h2');
                    h2.className = 'spells-section-title';
                    h2.textContent = y;
                    section.appendChild(h2);
                    byDate.appendChild(section);
                }
                const isRow = item.classList.contains('scry-whisper');
                if (isRow && !list) {
                    list = document.createElement('div');
                    list.className = 'scry-whispers';
                    section.appendChild(list);
                } else if (!isRow && !grid) {
                    grid = document.createElement('div');
                    grid.className = 'scry-grid';
                    // cards sit above the year's rows
                    section.insertBefore(grid, list);
                }
                (isRow ? list : grid).appendChild(item);
            });
            built = true;
        }

        function setView(view, updateUrl) {
            if (view === 'date' && !built) buildDateView();
            byDate.hidden = view !== 'date';
            byType.hidden = view === 'date';
            buttons.forEach(function (btn) {
                btn.setAttribute('aria-pressed', btn.dataset.view === view ? 'true' : 'false');
            });
            if (updateUrl) {
                history.replaceState(null, '', view === 'type' ? '#by-type' : location.pathname + location.search);
            }
        }

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () { setView(btn.dataset.view, true); });
        });

        // By Date is the default (since 2026-11-18). The type view is chosen by #by-type,
        // or by a link to one of its sections (e.g. #on-my-mind), which also scrolls there.
        // Old #by-date links still land on the date view.
        function typeTarget() {
            if (location.hash === '#by-type') return byType;
            if (!location.hash || location.hash === '#by-date') return null;
            const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            return target && byType.contains(target) ? target : null;
        }

        window.addEventListener('hashchange', function () {
            const target = typeTarget();
            if (!target) { setView('date', false); return; }
            setView('type', false);
            if (target !== byType) target.scrollIntoView();
        });

        bar.hidden = false;
        setView(typeTarget() ? 'type' : 'date', false);
    }

    // --- Language toggle: keep the section anchor (e.g. #by-date) when switching EN <-> JP ---
    function initLangToggle() {
        document.querySelectorAll('.lang-toggle a[hreflang]').forEach(function (a) {
            a.addEventListener('click', function () {
                if (location.hash) a.href = a.getAttribute('href').split('#')[0] + location.hash;
            });
        });
    }

    // --- Init ---
    document.addEventListener('DOMContentLoaded', function () {
        initScryViews();
        initLangToggle();
    });

})();
