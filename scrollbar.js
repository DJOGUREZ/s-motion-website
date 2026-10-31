(() => {
    const desktopQuery = window.matchMedia('(min-width: 821px) and (pointer: fine)');
    let root;
    let belt;
    let wheel;
    let spinner;
    let mode = null;
    let startX = 0;
    let startScroll = 0;
    let previousAngle = 0;
    let wheelDegrees = 0;

    const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const setActive = () => {
        if (!root) return;
        root.classList.toggle('is-active', desktopQuery.matches && maxScroll() > 80);
    };

    const angleAt = (event, element) => {
        const rect = element.getBoundingClientRect();
        return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
    };

    const normaliseAngle = angle => {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    };

    const stopInteraction = event => {
        if (!mode) return;
        if (event && event.pointerId !== undefined && event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        mode = null;
        root.classList.remove('is-interacting');
    };

    const labels = {
        de: { belt: 'Orange Ware ziehen, um die Seite zu scrollen', wheel: 'Rad drehen, um die Seite zu scrollen' },
        en: { belt: 'Drag the orange load to scroll the page', wheel: 'Turn the wheel to scroll the page' },
        fr: { belt: 'Faites glisser la charge orange pour faire défiler la page', wheel: 'Tournez la roue pour faire défiler la page' }
    };

    const build = () => {
        if (root) return;
        const lang = document.documentElement.lang || 'de';
        const text = labels[lang] || labels.de;
        root = document.createElement('div');
        root.className = 'sm-scrollbar';
        root.innerHTML = `
            <img class="sm-scrollbar__image" src="images/conveyor-scrollbar.png" alt="" draggable="false">
            <div class="sm-scrollbar__belt" role="scrollbar" aria-orientation="horizontal" aria-label="${text.belt}" tabindex="0"></div>
            <div class="sm-scrollbar__wheel" role="slider" aria-label="${text.wheel}" tabindex="0">
                <div class="sm-scrollbar__wheel-spinner"></div>
            </div>`;
        document.body.appendChild(root);
        belt = root.querySelector('.sm-scrollbar__belt');
        wheel = root.querySelector('.sm-scrollbar__wheel');
        spinner = root.querySelector('.sm-scrollbar__wheel-spinner');

        belt.addEventListener('pointerdown', event => {
            mode = 'belt';
            startX = event.clientX;
            startScroll = window.scrollY;
            belt.setPointerCapture(event.pointerId);
            root.classList.add('is-interacting');
            event.preventDefault();
        });
        belt.addEventListener('pointermove', event => {
            if (mode !== 'belt') return;
            const delta = event.clientX - startX;
            window.scrollTo({ top: Math.min(maxScroll(), Math.max(0, startScroll + delta * 5)), behavior: 'auto' });
            root.style.setProperty('--belt-shift', `${delta}px`);
        });
        belt.addEventListener('pointerup', stopInteraction);
        belt.addEventListener('pointercancel', stopInteraction);

        wheel.addEventListener('pointerdown', event => {
            mode = 'wheel';
            previousAngle = angleAt(event, wheel);
            wheel.setPointerCapture(event.pointerId);
            root.classList.add('is-interacting');
            event.preventDefault();
        });
        wheel.addEventListener('pointermove', event => {
            if (mode !== 'wheel') return;
            const currentAngle = angleAt(event, wheel);
            const delta = normaliseAngle(currentAngle - previousAngle);
            previousAngle = currentAngle;
            wheelDegrees += delta * 180 / Math.PI;
            spinner.style.transform = `rotate(${wheelDegrees}deg)`;
            window.scrollBy({ top: delta * 650, behavior: 'auto' });
        });
        wheel.addEventListener('pointerup', stopInteraction);
        wheel.addEventListener('pointercancel', stopInteraction);

        const keyScroll = (event, horizontal) => {
            const forward = horizontal ? event.key === 'ArrowRight' : event.key === 'ArrowDown';
            const backward = horizontal ? event.key === 'ArrowLeft' : event.key === 'ArrowUp';
            if (!forward && !backward && event.key !== 'PageDown' && event.key !== 'PageUp') return;
            event.preventDefault();
            const direction = forward || event.key === 'PageDown' ? 1 : -1;
            window.scrollBy({ top: direction * Math.round(window.innerHeight * .72), behavior: 'smooth' });
            if (!horizontal) {
                wheelDegrees += direction * 90;
                spinner.style.transform = `rotate(${wheelDegrees}deg)`;
            }
        };
        belt.addEventListener('keydown', event => keyScroll(event, true));
        wheel.addEventListener('keydown', event => keyScroll(event, false));

        setActive();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build, { once: true });
    } else {
        build();
    }
    window.addEventListener('resize', setActive);
    window.addEventListener('load', setActive);
    desktopQuery.addEventListener('change', setActive);
})();