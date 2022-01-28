/*--------------------------------------------------------------
>>> EXTENSION FEATURES
----------------------------------------------------------------
# Global variable
# Storage
    # Import
    # Change
# Events
    # Data
    # Features
# User interface
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLE
--------------------------------------------------------------*/

extension.prefix = 'looper';

extension.points = [];








/*--------------------------------------------------------------
# STORAGE
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# IMPORT
--------------------------------------------------------------*/

document.addEventListener('storage-import', function () {
    var items = extension.storage.items;

    if (items.hasOwnProperty('increase_framerate') === false) {
        items.increase_framerate = {
            keys: {
                38: {
                    key: 'ArrowUp'
                }
            }
        };
    }

    if (items.hasOwnProperty('decrease_framerate') === false) {
        items.decrease_framerate = {
            keys: {
                40: {
                    key: 'ArrowDown'
                }
            }
        };
    }

    if (items.hasOwnProperty('next_shortcut') === false) {
        items.next_shortcut = {
            keys: {
                39: {
                    key: 'ArrowRight'
                }
            }
        };
    }

    if (items.hasOwnProperty('prev_shortcut') === false) {
        items.prev_shortcut = {
            keys: {
                37: {
                    key: 'ArrowLeft'
                }
            }
        };
    }

    if (items.hasOwnProperty('hide_shortcut') === false) {
        items.hide_shortcut = {
            keys: {
                72: {
                    key: 'h'
                }
            }
        };
    }

    if (items.hasOwnProperty('framerate')) {
        extension.framerate = items.framerate;
    }
});


/*--------------------------------------------------------------
# CHANGE
--------------------------------------------------------------*/

document.addEventListener('storage-change', function (event) {
    if (event.detail.key === 'framerate') {
        extension.framerate = event.detail.value;
    }
});








/*--------------------------------------------------------------
# EVENTS
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# DATA
--------------------------------------------------------------*/

extension.events.clickDrag = {
    x: 0,
    y: 0
};

extension.events.clickResize = {
    x: 0,
    y: 0
};


/*--------------------------------------------------------------
# FEATURES
--------------------------------------------------------------*/

extension.events.features.increase_framerate = function () {
    if (extension.videos.active) {
        if (event.shiftKey) {
            extension.framerate += 10;
        } else {
            extension.framerate += 1;
        }

        chrome.storage.local.set({
            framerate: extension.framerate
        });

        extension.ui.update();
        extension.ui.sleep();
    }
};

extension.events.features.decrease_framerate = function () {
    if (extension.videos.active) {
        if (event.shiftKey) {
            extension.framerate -= 10;
        } else {
            extension.framerate -= 1;
        }

        chrome.storage.local.set({
            framerate: extension.framerate
        });

        extension.ui.update();
        extension.ui.sleep();
    }
};

extension.events.features.next_shortcut = function () {
    if (extension.videos.active) {
        var video = extension.videos.active,
            frame = 1 / extension.framerate;

        if (event.shiftKey) {
            frame *= 10;
        }

        if (video.paused === false) {
            video.pause();

            is_autoplay = true;
        }

        video.currentTime = Math.min(video.duration, video.currentTime + frame);

        extension.ui.sleep();
    }
};

extension.events.features.prev_shortcut = function () {
    if (extension.videos.active) {
        var video = extension.videos.active,
            frame = 1 / extension.framerate;

        if (event.shiftKey) {
            frame *= 10;
        }

        if (video.paused === false) {
            video.pause();

            is_autoplay = true;
        }

        video.currentTime = Math.min(video.duration, video.currentTime - frame);

        extension.ui.sleep();
    }
};

extension.events.features.hide_shortcut = function () {
    if (extension.videos.active) {
        extension.ui.actions.toggle();

        extension.ui.sleep();
    }
};

document.addEventListener('video-timeupdate', function (event) {
    var video = extension.videos.active;

    if (video) {
            if (extension.segments.length) {
            var time = video.currentTime,
                duration = video.duration,
                first_segment = extension.segments[0],
                current = {
                    start: first_segment.left * (duration / 100),
                    end: (first_segment.left + first_segment.width) * (duration / 100)
                };

            for (var i = 0, l = extension.segments.length; i < l; i++) {
                var segment = extension.segments[i],
                    start = segment.left * (duration / 100),
                    end = (segment.left + segment.width) * (duration / 100);

                if (time > end) {
                    segment = (extension.segments[i + 1] || first_segment);

                    current.start = segment.left * (duration / 100);
                    current.end = (segment.left + segment.width) * (duration / 100);
                }
            }

            if (time < current.start || time >= current.end) {
                video.currentTime = current.start;
            }
        }

        var seconds = Math.floor(video.currentTime % 60),
            minutes = Math.floor((video.currentTime / 60) % 60),
            hours = Math.floor((video.currentTime / (60 * 60)) % 24);

        seconds = (seconds < 10) ? '0' + seconds : seconds;
        minutes = (minutes < 10) ? '0' + minutes : minutes;
        hours = (hours < 10) ? '0' + hours : hours;

        extension.ui.surface.current_time.textContent = hours + ':' + minutes + ':' + seconds;
    }
});


/*--------------------------------------------------------------
# MOUSE
--------------------------------------------------------------*/

function checkCollision() {
    for (var i = 0, l = extension.segments.length; i < l; i++) {
        var segment = extension.segments[i];

        if (segment && segment !== extension.ui.currentSegment) {
            if (
                extension.ui.currentSegment.left >= segment.left &&
                extension.ui.currentSegment.left <= segment.left + segment.width &&
                extension.ui.currentSegment.left + extension.ui.currentSegment.width >= segment.left &&
                extension.ui.currentSegment.left + extension.ui.currentSegment.width <= segment.left + segment.width
            ) {
                segment.width = extension.ui.currentSegment.width;
                segment.left = extension.ui.currentSegment.left;

                segment.style.left = segment.left + '%';
                segment.style.width = segment.width + '%';

                satus.remove(extension.ui.currentSegment, extension.segments);

                extension.ui.currentSegment.remove();

                break;
            } else if (
                extension.ui.currentSegment.left >= segment.left &&
                extension.ui.currentSegment.left <= segment.left + segment.width ||
                segment.left >= extension.ui.currentSegment.left &&
                segment.left <= extension.ui.currentSegment.left + extension.ui.currentSegment.width
            ) {
                extension.ui.currentSegment.width = Math.max(segment.left + segment.width, extension.ui.currentSegment.left + extension.ui.currentSegment.width) - Math.min(segment.left, extension.ui.currentSegment.left);
                extension.ui.currentSegment.left = Math.min(segment.left, extension.ui.currentSegment.left);

                extension.ui.currentSegment.style.left = extension.ui.currentSegment.left + '%';
                extension.ui.currentSegment.style.width = extension.ui.currentSegment.width + '%';

                satus.remove(segment, extension.segments);

                segment.remove();
            }
        }
    }
}

function extensionMouseUp(event) {
    var button = event.hasOwnProperty('button') ? event.button : event.detail.event.button;

    if (button === 0) {
        extension.videos.changing = false;

        window.removeEventListener('mousemove', extension.ui.surface.thumb.move);
        window.removeEventListener('mouseup', extensionMouseUp);

        if (extension.ui.currentSegment) {
            var x = event.clientX || event.detail.event.clientX;

            x -= extension.ui.surface.track.getBoundingClientRect().left - extension.ui.surface.getBoundingClientRect().left;

            x /= extension.ui.surface.track.offsetWidth / 100;

            window.removeEventListener('mousemove', extension.ui.currentSegment.move);
            window.removeEventListener('mouseup', extensionMouseUp);

            checkCollision();
         
            //extension.ui.currentSegment = false;
        }
    } else if (button === 2) {
        if (extension.ui.currentSegment) {
            window.removeEventListener('mousemove', extension.ui.currentSegment.move);
            window.removeEventListener('mouseup', extensionMouseUp);

            checkCollision();
         
            //extension.ui.currentSegment = false;
        }
    }
}

document.addEventListener('ui-mousedown', function (event) {
    extension.ui.focus();

    if (event.detail.event.button === 0) {
        var video = extension.videos.active;

        for (var i = 0, l = extension.segments.length; i < l; i++) {
            var segment = extension.segments[i];

            for (var j = 0, k = segment.children.length; j < k; j++) {
                var pin = segment.children[j];

                if (extension.ui.hover(pin)) {
                    extension.ui.classList.add(extension.prefix + '--busy');

                    extension.ui.currentSegment = segment;

                    segment.pin = j;

                    extension.ui.focus(pin);

                    segment.move(event.detail.event);

                    window.addEventListener('mousemove', segment.move);
                    window.addEventListener('mouseup', extensionMouseUp);

                    return;
                }
            }
        }

        if (video && extension.ui.hover(extension.ui.surface.track.parentNode)) {
            extension.videos.changing = true;

            extension.ui.classList.add(extension.prefix + '--busy');

            video.pause();

            extension.ui.surface.thumb.move(event.detail);

            window.addEventListener('mousemove', extension.ui.surface.thumb.move);
            window.addEventListener('mouseup', extensionMouseUp);
        }

        if (extension.ui.hover(extension.ui.surface.inputStart)) {
            extension.ui.surface.inputStart.focus();
        }

        if (extension.ui.hover(extension.ui.surface.inputEnd)) {
            extension.ui.surface.inputEnd.focus();
        }

        if (extension.ui.surface.controls) {
            for (var i = 0, l = extension.ui.surface.controls.children.length; i < l; i++) {
                var control = extension.ui.surface.controls.children[i];

                if (extension.ui.hover(control)) {
                    control.onClick();
                }
            }
        }
    } else if (event.detail.event.button === 2 && extension.ui.hover(extension.ui.surface.track.parentNode)) {
        var x = event.detail.x - (extension.ui.surface.track.getBoundingClientRect().left - extension.ui.surface.getBoundingClientRect().left),
            collision = false;

        x /= extension.ui.surface.track.offsetWidth / 100;

        extension.ui.classList.add(extension.prefix + '--busy');

        extension.ui.currentSegment = extension.ui.surface.track.createSegment(x);

        extension.ui.focus(extension.ui.currentSegment.children[extension.ui.currentSegment.pin]);

        extension.ui.currentSegment.move(event.detail.event);

        window.addEventListener('mousemove', extension.ui.currentSegment.move);
        window.addEventListener('mouseup', extensionMouseUp);
    } else if (event.detail.event.button === 1) {
        for (var i = 0, l = extension.segments.length; i < l; i++) {
            var segment = extension.segments[i];

            for (var j = 0, k = segment.children.length; j < k; j++) {
                var pin = segment.children[j];

                if (extension.ui.hover(pin)) {
                    satus.remove(segment, extension.segments);

                    segment.remove();

                    return;
                }
            }
        }
    }
});

document.addEventListener('ui-mouseup', extensionMouseUp);








/*--------------------------------------------------------------
# USER INTERFACE
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# CREATE
--------------------------------------------------------------*/

extension.createSVG = function (d) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    svg.setAttributeNS(null, 'viewBox', '0 0 24 24');
    path.setAttributeNS(null, 'd', d);

    svg.appendChild(path);

    return svg;
};

extension.createControl = function (d, onClick, name) {
    var control = document.createElement('div');

    control.className += extension.prefix + '__control ' + extension.prefix + '__control--' + name;

    control.onClick = onClick;

    if (typeof d === 'string') {
        control.appendChild(extension.createSVG(d));
    } else {
        control.appendChild(extension.createSVG(d[0]));
        control.appendChild(extension.createSVG(d[1]));
    }

    return control;
};

document.addEventListener('ui-create', function (event) {
    var panel = document.createElement('div'),
        block = document.createElement('div'),
        media_type = document.createElement('div'),
        source_type = document.createElement('div'),
        current_time = document.createElement('div'),
        container = document.createElement('div'),
        track = document.createElement('div'),
        thumb = document.createElement('div'),
        controls = document.createElement('div'),
        input1 = document.createElement('input'),
        input2 = document.createElement('input');

    panel.className = extension.prefix + '__panel';
    block.className = extension.prefix + '__block';
    media_type.className = extension.prefix + '__media-type';
    source_type.className = extension.prefix + '__source-type';
    current_time.className = extension.prefix + '__current-time';
    container.className = extension.prefix + '__container';
    track.className = extension.prefix + '__track';
    thumb.className = extension.prefix + '__thumb';
    controls.className = extension.prefix + '__controls';

    input1.type = 'text';
    input2.type = 'text';

    for (var i = 1; i < 20; i++) {
        var segment = document.createElement('div'),
            x = i * 5;

        segment.className = extension.prefix + '__percent';

        if (x === 25 || x === 50 || x === 75) {
            segment.classList.add(extension.prefix + '__big-percent');
        }

        segment.style.left = x + '%';

        track.appendChild(segment);
    }

    track.nubmers = [];

    for (var i = 0; i < 5; i++) {
        var number = document.createElement('div');

        number.className = extension.prefix + '__number ' + extension.prefix + '__number-' + i;
        number.textContent = i * 25;

        number.style.left = i * 25 + '%';

        track.nubmers.push(number);

        track.appendChild(number);
    }

    extension.segments = [];

    function inputF() {
        var video = extension.videos.active,
            segment = extension.ui.currentSegment,
            value = Number(this.value);

        if (video && segment && typeof value === 'number') {
            var x = Math.min(Math.max(value / (video.duration / 100), 0), 100);

            if (x < segment.left) {
                segment.width = segment.left + segment.width - x;
                segment.left = x;
                segment.style.left = segment.left + '%';
                segment.style.width = segment.width + '%';
            } else {
                segment.width = x;
                segment.style.width = segment.width + '%';
            }

            extension.segments.sort(function (a, b) {
                return a.left - b.left;
            });

            extension.ui.surface.inputStart.value = (segment.left * (video.duration / 100)).toFixed(2);
            extension.ui.surface.inputEnd.value = ((segment.left + segment.width) * (video.duration / 100)).toFixed(2);

            checkCollision();
        }
    }

    input1.addEventListener('input', inputF);
    input2.addEventListener('input', inputF);

    track.createSegment = function (left, width) {
        var segment = document.createElement('div'),
            pin1 = document.createElement('div'),
            pin2 = document.createElement('div');

        segment.className = extension.prefix + '__segment';
        pin1.className = extension.prefix + '__pin';
        pin2.className = extension.prefix + '__pin';

        segment.left = left;
        segment.width = width || 0;
        segment.pin = 1;
        
        segment.style.left = segment.left + '%';
        segment.style.width = segment.width + '%';

        segment.move = function (event) {
            var video = extension.videos.active,
                segment = extension.ui.currentSegment,
                cursor = (event.clientX - extension.ui.surface.track.getBoundingClientRect().left) / (extension.ui.surface.track.offsetWidth / 100);

            cursor = Math.min(Math.max(cursor, 0), 100);

            if (cursor < segment.left) {
                segment.pin = 0;
            } else if (cursor > segment.left + segment.width) {
                segment.pin = 1;
            }

            if (segment.pin === 1) {
                segment.width = cursor - segment.left;
            } else {
                segment.width = segment.left + segment.width - cursor;
                segment.left = cursor;
            }

            segment.left = Math.min(Math.max(segment.left, 0), 100);
            segment.width = Math.max(segment.width, 0);

            extension.segments.sort(function (a, b) {
                return a.left - b.left;
            });

            segment.style.left = segment.left + '%';
            segment.style.width = segment.width + '%';

            extension.ui.surface.inputStart.value = (segment.left * (video.duration / 100)).toFixed(2);
            extension.ui.surface.inputEnd.value = ((segment.left + segment.width) * (video.duration / 100)).toFixed(2);
        };

        segment.appendChild(pin1);
        segment.appendChild(pin2);
        this.appendChild(segment);

        extension.segments.push(segment);

        return segment;
    };

    extension.ui.surface.media_type = media_type;
    extension.ui.surface.source_type = source_type;
    extension.ui.surface.current_time = current_time;
    extension.ui.surface.inputStart = input1;
    extension.ui.surface.inputEnd = input2;
    extension.ui.surface.track = track;
    extension.ui.surface.thumb = thumb;
    extension.ui.surface.controls = controls;

    extension.ui.surface.thumb.move = function (event) {
        var video = extension.videos.active;

        if (video) {
            var rect = extension.ui.surface.track.getBoundingClientRect(),
                x = (event.clientX - rect.left) / (rect.width / 100);

            x = Math.min(Math.max(x, 0), 100);

            video.currentTime = (video.duration / 100) * x;

            extension.ui.surface.thumb.style.left = x + '%';
        }
    };


    block.appendChild(media_type);
    block.appendChild(source_type);
    block.appendChild(current_time);
    panel.appendChild(block);
    panel.appendChild(input1);
    panel.appendChild(input2);
    extension.ui.surface.appendChild(panel);

    track.appendChild(thumb);
    container.appendChild(track);

    //extension.ui.surface.appendChild(input);
    extension.ui.surface.appendChild(container);
    extension.ui.surface.appendChild(controls);

    controls.appendChild(extension.createControl('M7 6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1zm3.66 6.82 5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07a1 1 0 0 0 0 1.64z', function () {
        var video = extension.videos.active;

        if (video) {
            video.currentTime = 0;
        }
    }));
    
    controls.appendChild(extension.createControl('M11 16.07V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07c-.56.4-.56 1.24 0 1.63l5.77 4.07c.67.47 1.58 0 1.58-.81zm1.66-3.25 5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07a1 1 0 0 0 0 1.64z', function () {
        var video = extension.videos.active;

        if (video) {
            video.currentTime = Math.max(video.currentTime - 5, 0);
        }
    }));

    controls.appendChild(extension.createControl([
        'M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82z',
        'M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z'
    ], function () {
        var video = extension.videos.active;

        if (video) {
            if (video.paused) {
                video.play();

                extension.ui.classList.add(extension.prefix + '--playing');
            } else {
                video.pause();

                extension.ui.classList.remove(extension.prefix + '--playing');
            }
        }
    }, 'play'));

    controls.appendChild(extension.createControl('m5.58 16.89 5.77-4.07c.56-.4.56-1.24 0-1.63L5.58 7.11C4.91 6.65 4 7.12 4 7.93v8.14c0 .81.91 1.28 1.58.82zM13 7.93v8.14c0 .81.91 1.28 1.58.82l5.77-4.07c.56-.4.56-1.24 0-1.63l-5.77-4.07c-.67-.47-1.58 0-1.58.81z', function () {
        var video = extension.videos.active;

        if (video) {
            video.currentTime = Math.min(video.currentTime + 5, video.duration);
        }
    }));

    controls.appendChild(extension.createControl('m7.58 16.89 5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1z', function () {
        var video = extension.videos.active;

        if (video) {
            video.currentTime = video.duration;
        }
    }));

    controls.appendChild(extension.createControl('M10 9V7.41c0-.89-1.08-1.34-1.71-.71L3.7 11.29a.996.996 0 0 0 0 1.41l4.59 4.59c.63.63 1.71.19 1.71-.7V14.9c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z', function () {
        var output = location.origin + location.pathname;

        if (extension.segments[0]) {
            if (location.search.indexOf('?') !== 0) {
                output += '?';
            }

            output += location.search;

            output += '&looper=';

            for (var i = 0, l = extension.segments.length; i < l; i++) {
                var segment = extension.segments[i];

                output += segment.left.toFixed(2) + ',' + (segment.left + segment.width).toFixed(2);

                if (i !== l - 1) {
                    output += ',';
                }
            }
        } else {
            output += location.search;
        }

        output += location.hash;

        console.log(output);

        location.replace(output);
    }));

    if (location.search.indexOf('looper=') !== 0) {
        var match = location.search.match(/looper=([0-9.,]+)/g);

        if (match) {
            var array = match[0].slice(7).split(',');

            for (var i = 0, l = array.length; i < l; i += 2) {
                var left = Number(array[i]),
                    width = Number(array[i + 1]) - Number(array[i]);

                track.createSegment(left, width);
            }
        }
    }
});

document.addEventListener('ui-resize', function (event) {
    //extension.ui.surface.track.updateSegments();
});

document.addEventListener('ui-update', function (event) {
    if (extension.segments) {
        for (var i = 0, l = extension.segments.length; i < l; i++) {
            var segment = extension.segments[i];

            for (var j = 0, k = segment.children.length; j < k; j++) {
                var pin = segment.children[j];

                if (extension.ui.hover(pin)) {
                    pin.classList.add(extension.prefix + '__pin--hover');
                } else {
                    pin.classList.remove(extension.prefix + '__pin--hover');
                }
            }
        }
    }

    if (extension.ui.surface.controls) {
        for (var i = 0, l = extension.ui.surface.controls.children.length; i < l; i++) {
            var control = extension.ui.surface.controls.children[i];

            if (extension.ui.hover(control)) {
                control.classList.add(extension.prefix + '__control--hover');

                extension.cursor.style.set('pointer');
            } else {
                control.classList.remove(extension.prefix + '__control--hover');
            }
        }
    }
});

document.addEventListener('cursor-check', function () {
    var video = extension.videos.active;

    if (video) {
        if (video.paused) {
            extension.ui.classList.remove(extension.prefix + '--playing');
        } else {
            extension.ui.classList.add(extension.prefix + '--playing');
        }

        extension.ui.surface.media_type.textContent = video.nodeName.toLowerCase();
        extension.ui.surface.source_type.textContent = video.src.indexOf('blob:') === 0 ? 'blob' : 'file';
    }
});


/*--------------------------------------------------------------
# UPDATE
--------------------------------------------------------------*/

document.addEventListener('video-timeupdate', function (event) {
    if (extension.videos.changing !== true) {
        extension.ui.surface.thumb.style.left = event.detail.currentTime / (event.detail.duration / 100) + '%';
    }
});


/*--------------------------------------------------------------
# STYLES
--------------------------------------------------------------*/

document.addEventListener('ui-styles', function () {
    var storage = extension.storage.items;

    if (storage.background_color) {
        if (storage.hasOwnProperty('opacity')) {
            extension.ui.surface.style.setProperty('background-color', 'rgba(' + storage.background_color.join(',') + ',' + storage.opacity + ')', 'important');
        } else {
            extension.ui.surface.style.setProperty('background-color', 'rgba(' + storage.background_color.join(',') + ',0.8)', 'important');
        }

        extension.ui.surface.style.setProperty('--looper-background-color', storage.background_color.join(','), 'important');
    }

    if (storage.text_color) {
        extension.ui.surface.style.setProperty('color', 'rgb(' + storage.text_color.join(',') + ')', 'important');
        extension.ui.surface.style.setProperty('--looper-color', storage.text_color.join(','), 'important');
    }

    if (storage.primary_color) {
        extension.ui.surface.style.setProperty('--looper-primary-color', storage.primary_color.join(','), 'important');
    }

    if (storage.blur) {
        extension.ui.surface.style.setProperty('backdrop-filter', 'blur(' + storage.blur + 'px)', 'important');
    }
});