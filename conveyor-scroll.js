(() => {
    const media = window.matchMedia('(min-width: 900px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let control = null;
    let track = null;
    let wheel = null;
    let frame = 0;
    let dragging = false;
    let startPointerY = 0;
    let startScrollY = 0;

    const scrollMaximum = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    function update() {
        frame = 0;
        if (!control || !track || !wheel) return;

        const maximum = scrollMaximum();
        if (maximum <= 0) {
            control.hidden = true;
            return;
        }

        control.hidden = false;
        const travel = Math.max(0, track.clientHeight - wheel.offsetHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / maximum));
        wheel.style.top = `${progress * travel}px`;
        wheel.style.setProperty('--wheel-rotation', reducedMotion.matches ? '0deg' : `${window.scrollY * 0.22}deg`);
        control.style.setProperty('--belt-progress', `${progress * 100}%`);
    }

    function requestUpdate() {
        if (!frame) frame = requestAnimationFrame(update);
    }

    function onPointerDown(event) {
        if (event.button !== 0) return;
        dragging = true;
        startPointerY = event.clientY;
        startScrollY = window.scrollY;
        wheel.setPointerCapture(event.pointerId);
        wheel.classList.add('is-dragging');
        document.body.classList.add('conveyor-dragging');
        event.preventDefault();
    }

    function onPointerMove(event) {
        if (!dragging) return;
        const maximum = scrollMaximum();
        const travel = Math.max(1, track.clientHeight - wheel.offsetHeight);
        const next = startScrollY + (event.clientY - startPointerY) * (maximum / travel);
        window.scrollTo({ top: Math.min(maximum, Math.max(0, next)), behavior: 'auto' });
    }

    function stopDragging(event) {
        if (!dragging) return;
        dragging = false;
        if (event && wheel.hasPointerCapture(event.pointerId)) {
            wheel.releasePointerCapture(event.pointerId);
        }
        wheel.classList.remove('is-dragging');
        document.body.classList.remove('conveyor-dragging');
    }

    function mount() {
        if (control || !media.matches) return;

        control = document.createElement('div');
        control.className = 'conveyor-scroll';
        control.setAttribute('aria-hidden', 'true');
        control.innerHTML = `
            <div class="conveyor-scroll__track">
                <div class="conveyor-scroll__belt"></div>
                <div class="conveyor-scroll__progress"></div>
                <div class="conveyor-scroll__wheel">
                    <span></span>
                </div>
            </div>
        `;

        document.body.appendChild(control);
        track = control.querySelector('.conveyor-scroll__track');
        wheel = control.querySelector('.conveyor-scroll__wheel');

        wheel.addEventListener('pointerdown', onPointerDown);
        wheel.addEventListener('pointermove', onPointerMove);
        wheel.addEventListener('pointerup', stopDragging);
        wheel.addEventListener('pointercancel', stopDragging);
        requestUpdate();
    }

    function unmount() {
        if (!control || media.matches) return;
        stopDragging();
        control.remove();
        control = null;
        track = null;
        wheel = null;
    }

    function handleMediaChange() {
        if (media.matches) mount();
        else unmount();
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    media.addEventListener('change', handleMediaChange);
    reducedMotion.addEventListener('change', requestUpdate);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
        mount();
    }
})();
