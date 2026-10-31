(() => {
    const desktopQuery = window.matchMedia('(min-width: 821px) and (pointer: fine)');
    let scrollbar = null;
    let track = null;
    let thumb = null;
    let dragging = false;
    let dragOffset = 0;

    const metrics = () => {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const travel = track && thumb ? Math.max(0, track.clientHeight - thumb.offsetHeight) : 0;
        return { maxScroll, travel };
    };

    const syncThumb = () => {
        if (!scrollbar || !track || !thumb) return;
        const { maxScroll, travel } = metrics();
        const active = desktopQuery.matches && maxScroll > 80 && travel > 0;
        scrollbar.classList.toggle('is-active', active);
        document.documentElement.classList.toggle('has-sm-scrollbar', active);
        if (!active) return;
        const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        thumb.style.transform = `translate3d(-50%, ${ratio * travel}px, 0)`;
    };

    const scrollFromPointer = (clientY, offset = thumb ? thumb.offsetHeight / 2 : 0) => {
        const rect = track.getBoundingClientRect();
        const { maxScroll, travel } = metrics();
        if (!travel || !maxScroll) return;
        const y = Math.min(travel, Math.max(0, clientY - rect.top - offset));
        window.scrollTo({ top: (y / travel) * maxScroll, behavior: dragging ? 'auto' : 'smooth' });
    };

    const build = () => {
        if (scrollbar) return;
        scrollbar = document.createElement('div');
        scrollbar.className = 'sm-scrollbar';
        scrollbar.setAttribute('aria-hidden', 'true');
        scrollbar.innerHTML = `
            <div class="sm-scrollbar__track">
                <div class="sm-scrollbar__thumb">
                    <img src="images/conveyor-scrollbar.png" alt="" draggable="false">
                </div>
            </div>`;
        document.body.appendChild(scrollbar);
        track = scrollbar.querySelector('.sm-scrollbar__track');
        thumb = scrollbar.querySelector('.sm-scrollbar__thumb');

        thumb.addEventListener('pointerdown', event => {
            dragging = true;
            const rect = thumb.getBoundingClientRect();
            dragOffset = event.clientY - rect.top;
            thumb.setPointerCapture(event.pointerId);
            event.preventDefault();
        });
        thumb.addEventListener('pointermove', event => {
            if (dragging) scrollFromPointer(event.clientY, dragOffset);
        });
        thumb.addEventListener('pointerup', event => {
            dragging = false;
            if (thumb.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId);
        });
        thumb.addEventListener('pointercancel', () => { dragging = false; });
        track.addEventListener('pointerdown', event => {
            if (event.target === track) scrollFromPointer(event.clientY);
        });

        syncThumb();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build, { once: true });
    } else {
        build();
    }
    window.addEventListener('scroll', syncThumb, { passive: true });
    window.addEventListener('resize', syncThumb);
    desktopQuery.addEventListener('change', syncThumb);
    window.addEventListener('load', syncThumb);
})();