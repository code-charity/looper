/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# Global variable
# User interface
# Keyboard
# Mouse
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLES
--------------------------------------------------------------*/

var ui = {},
    media = [],
    mouse = {
        x: 0,
        y: 0
    },
    position = {
        x: 0,
        y: 0
    },
    changing = false,
    sleeping_mode = false;


/*--------------------------------------------------------------
# USER INTERFACE
--------------------------------------------------------------*/

function createUserInterface() {
    var container = document.createElement('div'),
        info_panel = document.createElement('div'),
        show_hide_button = document.createElement('div'),
        drag_and_drop_button = document.createElement('div');

    container.className = 'looper';
    info_panel.className = 'looper__info-panel';
    show_hide_button.className = 'looper__show-hide';
    drag_and_drop_button.className = 'looper__drag-and-drop';

    show_hide_button.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>';
    drag_and_drop_button.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>';

    show_hide_button.addEventListener('click', function() {
        this.parentNode.classList.toggle('looper__info-panel--collapsed');

        chrome.storage.local.set({
            hidden: this.parentNode.classList.contains('looper__info-panel--collapsed')
        });
    });

    function mousemove(event) {
        var x = event.clientX - ui.info_panel.offsetWidth - ui.container.offsetLeft,
            y = event.clientY - ui.container.offsetTop;

        event.preventDefault();

        if (x < -1) {
            x = -1;
        } else if (x + ui.info_panel.offsetWidth > ui.container.offsetWidth - 1) {
            x = ui.container.offsetWidth - ui.info_panel.offsetWidth - 1;
        }

        if (y < -1) {
            y = -1;
        } else if (y + ui.info_panel.offsetHeight > ui.container.offsetHeight - 1) {
            y = ui.container.offsetHeight - ui.info_panel.offsetHeight - 1;
        }

        position.x = event.clientX;
        position.y = event.clientY;

        ui.info_panel.style.left = x + 'px';
        ui.info_panel.style.top = y + 'px';

        return false;
    }

    function mouseup(event) {
        window.removeEventListener('mousemove', mousemove);
        window.removeEventListener('mouseup', mouseup);

        chrome.storage.local.set({
            position: position
        }, function() {
            changing = false;
        });
    }

    drag_and_drop_button.addEventListener('mousedown', function(event) {
        event.preventDefault();

        changing = true;

        window.addEventListener('mousemove', mousemove);
        window.addEventListener('mouseup', mouseup);
    });

    ui.container = container;
    ui.info_panel = info_panel;

    var start_at_button = document.createElement('div'),
        start_at = document.createElement('input'),
        progress_bar = document.createElement('div'),
        progress_bar_padding = document.createElement('div'),
        play_progress_bar = document.createElement('div'),
        hover_progress_bar = document.createElement('div'),
        end_at_button = document.createElement('div'),
        end_at = document.createElement('input');

    start_at.type = 'text';
    end_at.type = 'text';

    start_at_button.className = 'looper__button looper__button-start-at';
    start_at.className = 'looper__start-at';
    progress_bar.className = 'looper__progress-bar';
    progress_bar_padding.className = 'looper__progress-bar-padding';
    play_progress_bar.className = 'looper-progress-bar__play';
    hover_progress_bar.className = 'looper-progress-bar__hover';
    end_at_button.className = 'looper__button looper__button-end-at';
    end_at.className = 'looper__end-at';

    progress_bar_padding.addEventListener('mouseout', function() {
        ui.hover_progress_bar.style.opacity = '';
    });

    progress_bar_padding.addEventListener('mousemove', function(event) {
        ui.hover_progress_bar.style.opacity = '1';
        ui.hover_progress_bar.style.width = event.layerX / (ui.progress_bar.offsetWidth / 100) + '%';
    });

    progress_bar_padding.addEventListener('click', function(event) {
        active.element.currentTime = event.layerX / (ui.progress_bar.offsetWidth / 100) * (active.element.duration / 100);
        ui.play_progress_bar.style.width = active.element.currentTime / (active.element.duration / 100) + '%';
    });

    start_at_button.addEventListener('mousedown', function() {
        function mousemove(event) {
            var x = event.clientX - (ui.info_panel.offsetLeft + ui.container.offsetLeft + 16);

            if (x < 0) {
                x = 0;
            } else if (x > progress_bar.offsetWidth) {
                x = progress_bar.offsetWidth;
            } else if (x > progress_bar.offsetWidth - end_at_button.offsetWidth) {
                x = progress_bar.offsetWidth - end_at_button.offsetWidth;
            }

            active.element.start_at = Math.floor(x / (progress_bar.offsetWidth / 100) * (active.element.duration / 100));

            ui.start_at.value = active.element.start_at;

            ui.start_at_button.style.width = x + 'px';

            event.preventDefault();
            event.stopPropagation();

            return false;
        }

        function mouseup() {
            window.removeEventListener('mousemove', mousemove);
            window.removeEventListener('mouseup', mouseup);
        }

        window.addEventListener('mousemove', mousemove);
        window.addEventListener('mouseup', mouseup);
    });

    end_at_button.addEventListener('mousedown', function() {
        function mousemove(event) {
            var x = progress_bar.offsetWidth - (event.clientX - (ui.info_panel.offsetLeft + ui.container.offsetLeft + 16));

            if (x < 0) {
                x = 0;
            } else if (x > progress_bar.offsetWidth) {
                x = progress_bar.offsetWidth;
            } else if (x > progress_bar.offsetWidth - start_at_button.offsetWidth) {
                x = progress_bar.offsetWidth - start_at_button.offsetWidth;
            }

            active.element.end_at = Math.floor((100 - x / (progress_bar.offsetWidth / 100)) * (active.element.duration / 100));

            ui.end_at.value = active.element.end_at;

            ui.end_at_button.style.width = x + 'px';

            event.preventDefault();
            event.stopPropagation();

            return false;
        }

        function mouseup() {
            window.removeEventListener('mousemove', mousemove);
            window.removeEventListener('mouseup', mouseup);
        }

        window.addEventListener('mousemove', mousemove);
        window.addEventListener('mouseup', mouseup);
    });

    start_at_button.appendChild(start_at);
    end_at_button.appendChild(end_at);
    progress_bar.appendChild(hover_progress_bar);
    progress_bar.appendChild(play_progress_bar);
    progress_bar.appendChild(progress_bar_padding);
    progress_bar.appendChild(start_at_button);
    progress_bar.appendChild(end_at_button);
    info_panel.appendChild(progress_bar);

    ui.start_at_button = start_at_button;
    ui.end_at_button = end_at_button;
    ui.start_at = start_at;
    ui.end_at = end_at;
    ui.progress_bar = progress_bar;
    ui.play_progress_bar = play_progress_bar;
    ui.hover_progress_bar = hover_progress_bar;

    info_panel.appendChild(show_hide_button);
    info_panel.appendChild(drag_and_drop_button);
    container.appendChild(info_panel);
    document.body.appendChild(container);
}

function moveUserInterface() {
    var x = position.x - ui.info_panel.offsetWidth - ui.container.offsetLeft,
        y = position.y - ui.container.offsetTop;

    if (x < -1) {
        x = -1;
    } else if (x + ui.info_panel.offsetWidth > ui.container.offsetWidth - 1) {
        x = ui.container.offsetWidth - ui.info_panel.offsetWidth - 1;
    }

    if (y < -1) {
        y = -1;
    } else if (y + ui.info_panel.offsetHeight > ui.container.offsetHeight - 1) {
        y = ui.container.offsetHeight - ui.info_panel.offsetHeight - 1;
    }

    ui.info_panel.style.left = x + 'px';
    ui.info_panel.style.top = y + 'px';
}

function resizeUserInterface() {
    var container = ui.container;

    if (container.offsetLeft !== active.left) {
        container.style.left = active.left + 'px';
    }

    if (container.offsetTop !== active.top) {
        container.style.top = active.top + 'px';
    }

    if (container.offsetWidth !== active.width) {
        container.style.width = active.width + 'px';
    }

    if (container.offsetHeight !== active.height) {
        container.style.height = active.height + 'px';
    }
}

function updateUserInterface() {
    if (active) {
        if (active.src !== active.element.src) {
            active.src = active.element.src;

            active.element.start_at = 0;
            active.element.end_at = active.element.duration;

            ui.start_at_button.style.width = '';
            ui.end_at_button.style.width = '';
        }

        if (
            active.element.currentTime < active.element.start_at ||
            active.element.currentTime > active.element.end_at
        ) {
            active.element.currentTime = active.element.start_at;
        }

        ui.play_progress_bar.style.width = active.element.currentTime / (active.element.duration / 100) + '%';
    }
}

function updateSleepingMode() {
    if (sleeping_mode) {
        ui.container.classList.remove('looper--sleeping-mode');

        clearTimeout(sleeping_mode);
    }

    if (ui.container) {
        sleeping_mode = setTimeout(function() {
            ui.container.classList.add('looper--sleeping-mode');

            sleeping_mode = false;
        }, 3000);
    }
}


/*--------------------------------------------------------------
# SEARCH VIDEOS
--------------------------------------------------------------*/

function searchVideos() {
    var elements = document.querySelectorAll('video');

    for (var i = 0, l = elements.length; i < l; i++) {
        var founded = false;

        for (var j = 0, k = media.length; j < k; j++) {
            if (elements[i] === media[i].element) {
                founded = true;
            }
        }

        if (founded === false) {
            var data = elements[i].getBoundingClientRect();

            elements[i].addEventListener('timeupdate', updateUserInterface);

            media.push({
                src: elements[i].src,
                element: elements[i],
                left: data.left,
                top: data.top,
                width: data.width,
                height: data.height,
                start_at: 0,
                end_at: elements[i].duration
            });
        }
    }
}


/*--------------------------------------------------------------
# CALC POSITIONS
--------------------------------------------------------------*/

function calcPositions() {
    for (var i = 0, l = media.length; i < l; i++) {
        var object = media[i];

        if (object.element.style.display != 'none') {
            var data = object.element.getBoundingClientRect();

            object.left = data.left;
            object.top = data.top;
            object.width = data.width;
            object.height = data.height;
        }
    }
}


/*--------------------------------------------------------------
# MOUSE
--------------------------------------------------------------*/

function checkMouse() {
    active = false;

    for (var i = 0, l = media.length; i < l; i++) {
        var rect = media[i];

        if (
            mouse.x > rect.left &&
            mouse.y > rect.top &&
            mouse.x < rect.left + rect.width &&
            mouse.y < rect.top + rect.height
        ) {
            active = rect;
        }
    }

    if (ui.container && changing === false) {
        if (active) {
            resizeUserInterface();

            moveUserInterface();

            setTimeout(function() {
                ui.container.classList.add('looper--visible');
            });
        } else {
            ui.container.classList.remove('looper--visible');
        }
    }
}

window.addEventListener('mousemove', function(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    updateSleepingMode();

    checkMouse();
});

window.addEventListener('scroll', function() {
    calcPositions();
    updateSleepingMode();
    checkMouse();
});


/*------------------------------------------------------------------------------
# KEYBOARD
------------------------------------------------------------------------------*/

window.addEventListener('keydown', function(event) {
    if (active) {
        if (event.keyCode === 73) {
            ui.info_panel.classList.toggle('looper__info-panel--collapsed');

            chrome.storage.local.set({
                hidden: ui.info_panel.classList.contains('looper__info-panel--collapsed')
            });
        }

        updateSleepingMode();
    }
}, true);


/*------------------------------------------------------------------------------
# PREVENT KEYBOARD EVENTS
------------------------------------------------------------------------------*/

function preventKeyboardListeners(event) {
    if (active) {
        if (event.keyCode === 73) {
            event.preventDefault();
            event.stopPropagation();

            return false;
        }
    }
}

window.addEventListener('keydown', preventKeyboardListeners, true);
window.addEventListener('keyup', preventKeyboardListeners, true);
window.addEventListener('keypress', preventKeyboardListeners, true);


/*--------------------------------------------------------------
# INITIALIZATION
--------------------------------------------------------------*/

window.addEventListener('resize', function() {
    setTimeout(function() {
        calcPositions();
        checkMouse();
    }, 250);
});

window.addEventListener('DOMContentLoaded', function() {
    createUserInterface();

    chrome.storage.local.get(function(items) {
        if (items.hidden === true) {
            ui.info_panel.classList.add('looper__info-panel--collapsed')
        }

        if (typeof items.position === 'object') {
            position = items.position;

            moveUserInterface();
        }

        setInterval(searchVideos, 2500);
        setInterval(calcPositions, 1000);
        setInterval(checkMouse, 100);
    });
});

chrome.storage.onChanged.addListener(function(changes) {
    for (var key in changes) {
        var value = changes[key].newValue;

        if (key === 'hidden') {
            if (value === true) {
                ui.info_panel.classList.add('looper__info-panel--collapsed')
            } else {
                ui.info_panel.classList.remove('looper__info-panel--collapsed')
            }
        } else if (key === 'position') {
            position = value;

            moveUserInterface();
        }
    }
});