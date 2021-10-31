/*--------------------------------------------------------------
>>> CONTENT SCRIPT:
----------------------------------------------------------------
# Global variable
# Storage
	# Get
	# Set
	# Import
# Observer
# Handlers
	# Child
	# Video
# User interface
# Controls
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLE
--------------------------------------------------------------*/

var extension = {
	hostname: location.hostname,
	storage: {
		data: {}
	},
	handlers: {},
	videos: [],
	rects: [],
	mouse: {
		x: 0,
		y: 0
	},
	interval: false
};


/*--------------------------------------------------------------
# STORAGE
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GET
--------------------------------------------------------------*/

extension.storage.get = function (name) {
	return this.data[name];
};


/*--------------------------------------------------------------
# SET
--------------------------------------------------------------*/

extension.storage.set = function (name, value) {
	this.data[name] = value;

	chrome.storage.local.set(this.data[name]);
};


/*--------------------------------------------------------------
# IMPORT
--------------------------------------------------------------*/

extension.storage.import = function (callback) {
	chrome.storage.local.get(function (items) {
		for (var key in items) {
			extension.storage.data[key] = items[key];
		}

		callback();
	});
};


/*--------------------------------------------------------------
# OBSERVER
--------------------------------------------------------------*/

extension.observer = function () {
	this.observer = new MutationObserver(function (mutationList) {
		for (var i = 0, l = mutationList.length; i < l; i++) {
			var mutation = mutationList[i];

			if (mutation.type === 'childList') {
				for (var j = 0, k = mutation.addedNodes.length; j < k; j++) {
					extension.handlers.child('added', mutation.addedNodes[j]);
				}

				for (var j = 0, k = mutation.removedNodes.length; j < k; j++) {
					extension.handlers.child('removed', mutation.removedNodes[j]);
				}
			}
		}
	})

	this.observer.observe(document, {
		childList: true,
		subtree: true
	});
};


/*--------------------------------------------------------------
# HANDLERS
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# CHILD
--------------------------------------------------------------*/

extension.handlers.child = function (type, element) {
	var children = element.children;

	extension.handlers.video(type, element);

	if (children) {
		for (var i = 0, l = children.length; i < l; i++) {
			var child = children[i];

			extension.handlers.child(type, child);
		}
	}
};


/*--------------------------------------------------------------
# VIDEO
--------------------------------------------------------------*/

extension.handlers.video = function (type, element) {
	if (element.nodeName === 'VIDEO') {
		var index = extension.videos.indexOf(element);

		if (type === 'added') {
			if (index === -1) {
				extension.videos.push(element);
				extension.rects.push(element.getBoundingClientRect());

				element.addEventListener('resize', function () {
					extension.rects[extension.videos.indexOf(this)] = element.getBoundingClientRect();
				});

				//console.log(type, element);
			}
		} else if (type === 'removed') {
			if (index !== -1) {
				extension.videos.splice(index, 1);
				extension.rects.splice(index, 1);

				//console.log(type, element);
			}
		}
	}
};


/*--------------------------------------------------------------
# USER INTERFACE
--------------------------------------------------------------*/

extension.ui = function () {
	var collapse_button = document.createElement('div'),
		drag_and_drop_button = document.createElement('div'),
		start_at_button = document.createElement('div'),
        start_at = document.createElement('input'),
        progress_bar = document.createElement('div'),
        progress_bar_padding = document.createElement('div'),
        play_progress_bar = document.createElement('div'),
        hover_progress_bar = document.createElement('div'),
        end_at_button = document.createElement('div'),
        end_at = document.createElement('input');

	this.ui = document.createElement('div');
	this.panel = document.createElement('div');

	this.ui.className = 'looper';

	collapse_button.className = 'looper__show-hide';
    drag_and_drop_button.className = 'looper__drag-and-drop';

    collapse_button.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>';
    drag_and_drop_button.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>';

    collapse_button.addEventListener('click', function () {
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

        if (typeof storage.position !== 'object') {
            storage.position = {
                x: 0,
                y: 0
            };
        }

        storage.position.x = event.clientX;
        storage.position.y = event.clientY;

        ui.info_panel.style.left = x + 'px';
        ui.info_panel.style.top = y + 'px';

        return false;
    }

    function mouseup(event) {
        window.removeEventListener('mousemove', mousemove);
        window.removeEventListener('mouseup', mouseup);

        chrome.storage.local.set({
            position: storage.position
        }, function () {
            changing = false;
        });
    }

    drag_and_drop_button.addEventListener('mousedown', function (event) {
        event.preventDefault();

        changing = true;

        window.addEventListener('mousemove', mousemove);
        window.addEventListener('mouseup', mouseup);
    });

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

    progress_bar_padding.addEventListener('mouseout', function () {
        ui.hover_progress_bar.style.opacity = '';
    });

    progress_bar_padding.addEventListener('mousemove', function (event) {
        ui.hover_progress_bar.style.opacity = '1';
        ui.hover_progress_bar.style.width = event.layerX / (ui.progress_bar.offsetWidth / 100) + '%';
    });

    progress_bar_padding.addEventListener('click', function (event) {
        active.element.currentTime = event.layerX / (ui.progress_bar.offsetWidth / 100) * (active.element.duration / 100);
        ui.play_progress_bar.style.width = active.element.currentTime / (active.element.duration / 100) + '%';
    });

    start_at_button.addEventListener('mousedown', function () {
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

    end_at_button.addEventListener('mousedown', function () {
        function mousemove(event) {
            var x = progress_bar.offsetWidth - (event.clientX - (this.panel.offsetLeft + this.ui.offsetLeft + 16));

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
    this.panel.appendChild(progress_bar);

    ui.start_at_button = start_at_button;
    ui.end_at_button = end_at_button;
    ui.start_at = start_at;
    ui.end_at = end_at;
    ui.progress_bar = progress_bar;
    ui.play_progress_bar = play_progress_bar;
    ui.hover_progress_bar = hover_progress_bar;

    this.panel.appendChild(collapse_button);
    this.panel.appendChild(drag_and_drop_button);
    this.ui.appendChild(this.panel);

	document.body.appendChild(this.ui);
};


/*--------------------------------------------------------------
# CONTROLS
--------------------------------------------------------------*/

extension.cursor = function () {
	var x = extension.mouse.x,
		y = extension.mouse.y,
		collised = false;

	for (var i = 0, l = extension.rects.length; i < l; i++) {
		var rect = extension.rects[i];

		if (x > rect.left && y > rect.top) {
			if (x < rect.left + rect.width && y < rect.top + rect.height) {
				collised = rect;
			}
		}
	}

	if (extension.ui.nodeName) {
		if (collised) {
			extension.ui.style.display = 'block';
			extension.ui.style.left = collised.left + 'px';
			extension.ui.style.top = collised.top + 'px';
			extension.ui.style.width = collised.width + 'px';
			extension.ui.style.height = collised.height + 'px';
		} else {
			extension.ui.style.display = '';
		}
	}
};

extension.update = function () {
	for (var i = 0, l = extension.rects.length; i < l; i++) {
		extension.rects[i] = extension.videos[i].getBoundingClientRect();
	}
};

window.addEventListener('mousemove', function (event) {
	extension.mouse.x = event.clientX;
	extension.mouse.y = event.clientY;

	extension.cursor();
});

window.addEventListener('scroll', function (event) {
	extension.update();
	extension.cursor();
});


/*--------------------------------------------------------------
# INITIALIZATION
--------------------------------------------------------------*/

extension.observer();

document.addEventListener('DOMContentLoaded', function () {
	extension.ui();

	extension.interval = setInterval(function () {
		extension.update();
	}, 100);
});

chrome.runtime.sendMessage({
	action: 'get-tab-hostname'
}, function (response) {
	extension.hostname = response.hostname;

	extension.storage.import(function () {

	});
});