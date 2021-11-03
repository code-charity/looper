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
	var object = {};

	object[name] = value;

	chrome.storage.local.set(object);
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

				element.addEventListener('timeupdate', function () {
			        if (
			            this.currentTime < this.start_at ||
			            this.currentTime > this.end_at
			        ) {
			            this.currentTime = this.start_at;
			        }

			        extension.ui.play_progress_bar.style.width = this.currentTime / (this.duration / 100) + '%';
				});

				element.addEventListener('resize', function () {
					extension.rects[extension.videos.indexOf(this)] = element.getBoundingClientRect();
				});
			}
		} else if (type === 'removed') {
			if (index !== -1) {
				extension.videos.splice(index, 1);
				extension.rects.splice(index, 1);
			}
		}
	}
};


/*--------------------------------------------------------------
# USER INTERFACE
--------------------------------------------------------------*/

extension.ui = function () {
	var container = document.createElement('div'),
		panel = document.createElement('div'),
		collapse_button = document.createElement('div'),
		drag_and_drop_button = document.createElement('div'),
		start_at_button = document.createElement('div'),
        start_at = document.createElement('input'),
        progress_bar = document.createElement('div'),
        progress_bar_padding = document.createElement('div'),
        play_progress_bar = document.createElement('div'),
        hover_progress_bar = document.createElement('div'),
        end_at_button = document.createElement('div'),
        end_at = document.createElement('input');

	this.ui = {
		container,
		panel,
		collapse_button,
		drag_and_drop_button,
		start_at_button,
		start_at,
		progress_bar,
		progress_bar_padding,
		play_progress_bar,
		hover_progress_bar,
		end_at_button,
		end_at
	};

	container.className = 'looper';
	panel.className = 'looper__info-panel';
	collapse_button.className = 'looper__show-hide';
    drag_and_drop_button.className = 'looper__drag-and-drop';

    collapse_button.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>';
    drag_and_drop_button.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/></svg>';

    collapse_button.addEventListener('click', function () {
    	var panel = extension.ui.panel;

        panel.classList.toggle('looper__info-panel--collapsed');

        extension.storage.set('hidden', panel.classList.contains('looper__info-panel--collapsed'));
    });

    function move(x, y) {
    	var ui = extension.ui;

    	if (!x && !y) {
    		x = extension.storage.data.position.x;
    		y = extension.storage.data.position.y;
    	}

    	if (x < 4) {
            x = 4;
        } else if (x + ui.panel.offsetWidth > ui.container.offsetWidth - 4) {
            x = ui.container.offsetWidth - ui.panel.offsetWidth - 4;
        }

        if (y < 4) {
            y = 4;
        } else if (y + ui.panel.offsetHeight > ui.container.offsetHeight - 4) {
            y = ui.container.offsetHeight - ui.panel.offsetHeight - 4;
        }

        if (typeof extension.storage.data.position !== 'object') {
            extension.storage.data.position = {
                x: 0,
                y: 0
            };
        }

        extension.storage.data.position.x = x;
        extension.storage.data.position.y = y;

        ui.panel.style.left = x + 'px';
        ui.panel.style.top = y + 'px';
    }

    function mousemove(event) {
        var x = event.clientX - extension.ui.panel.offsetWidth - extension.ui.container.offsetLeft,
            y = event.clientY - extension.ui.container.offsetTop;

        event.preventDefault();

        move(x, y);

        return false;
    }

    function mouseup(event) {
        window.removeEventListener('mousemove', mousemove);
        window.removeEventListener('mouseup', mouseup);

        extension.ui.container.classList.remove('looper--dragging');

        extension.storage.set('position', extension.storage.data.position);
    }

    this.ui.move = move;

    drag_and_drop_button.addEventListener('mousedown', function (event) {
        if (event.button === 0) {
        	event.preventDefault();

	        extension.ui.container.classList.add('looper--dragging');

	        window.addEventListener('mousemove', mousemove);
	        window.addEventListener('mouseup', mouseup);
        }
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
        extension.ui.hover_progress_bar.style.opacity = '';
    });

    progress_bar_padding.addEventListener('mousemove', function (event) {
        extension.ui.hover_progress_bar.style.opacity = '1';
        extension.ui.hover_progress_bar.style.width = event.layerX / (extension.ui.progress_bar.offsetWidth / 100) + '%';
    });

    progress_bar_padding.addEventListener('click', function (event) {
        extension.video.currentTime = event.layerX / (extension.ui.progress_bar.offsetWidth / 100) * (extension.video.duration / 100);
        extension.ui.play_progress_bar.style.width = extension.video.currentTime / (extension.video.duration / 100) + '%';
    });

    start_at_button.addEventListener('mousedown', function (event) {
        function mousemove(event) {
            var x = event.clientX - (extension.ui.panel.offsetLeft + extension.ui.container.offsetLeft + 16);

            if (x < 0) {
                x = 0;
            } else if (x > progress_bar.offsetWidth) {
                x = progress_bar.offsetWidth;
            } else if (x > progress_bar.offsetWidth - end_at_button.offsetWidth) {
                x = progress_bar.offsetWidth - end_at_button.offsetWidth;
            }

            extension.video.start_at = Math.floor(x / (progress_bar.offsetWidth / 100) * (extension.video.duration / 100));

            extension.ui.start_at.value = extension.video.start_at;

            extension.ui.start_at_button.style.width = x + 'px';

            event.preventDefault();
            event.stopPropagation();

            return false;
        }

        function mouseup() {
            window.removeEventListener('mousemove', mousemove);
            window.removeEventListener('mouseup', mouseup);
        }

        if (event.button === 0) {
        	event.preventDefault();

        	window.addEventListener('mousemove', mousemove);
        	window.addEventListener('mouseup', mouseup);
        }
    });

    end_at_button.addEventListener('mousedown', function () {
        function mousemove(event) {
            var x = progress_bar.offsetWidth - (event.clientX - (extension.ui.panel.offsetLeft + extension.ui.container.offsetLeft + 16));

            if (x < 0) {
                x = 0;
            } else if (x > progress_bar.offsetWidth) {
                x = progress_bar.offsetWidth;
            } else if (x > progress_bar.offsetWidth - start_at_button.offsetWidth) {
                x = progress_bar.offsetWidth - start_at_button.offsetWidth;
            }

            extension.video.end_at = Math.floor((100 - x / (progress_bar.offsetWidth / 100)) * (extension.video.duration / 100));

            extension.ui.end_at.value = extension.video.end_at;

            extension.ui.end_at_button.style.width = x + 'px';

            event.preventDefault();
            event.stopPropagation();

            return false;
        }

        function mouseup() {
            window.removeEventListener('mousemove', mousemove);
            window.removeEventListener('mouseup', mouseup);
        }

		if (event.button === 0) {
        	event.preventDefault();

	        window.addEventListener('mousemove', mousemove);
	        window.addEventListener('mouseup', mouseup);
	    }
    });

    if (extension.storage.data.position) {
    	var x = extension.storage.data.position.x,
    		y = extension.storage.data.position.y;

    	if (x < 0) {
    		x = 0;
    	} else if (x > extension.ui.container.offsetWidth) {
    		x = extension.ui.container.offsetWidth - extension.ui.container.offsetWidth - 4;
    	}

    	extension.ui.panel.style.left = x + 'px';
    	extension.ui.panel.style.top = y + 'px';
    }

    start_at_button.appendChild(start_at);
    end_at_button.appendChild(end_at);
    progress_bar.appendChild(hover_progress_bar);
    progress_bar.appendChild(play_progress_bar);
    progress_bar.appendChild(progress_bar_padding);
    progress_bar.appendChild(start_at_button);
    progress_bar.appendChild(end_at_button);
    panel.appendChild(progress_bar);
    panel.appendChild(collapse_button);
    panel.appendChild(drag_and_drop_button);
    container.appendChild(panel);
	document.body.appendChild(container);

	this.ui.styles = function () {
		var storage = extension.storage.data,
			panel = extension.ui.panel;

	    if (storage.hidden === true) {
	        panel.classList.add('looper__info-panel--collapsed');
	    } else {
	        panel.classList.remove('looper__info-panel--collapsed');
	    }

	    if (storage.hasOwnProperty('opacity')) {
	        panel.style.opacity = storage.opacity;
	    }

	    if (storage.hasOwnProperty('blur')) {
	        panel.style.backdropFilter = 'blur(' + storage.blur + 'px)';
	    }

	    if (storage.hasOwnProperty('background_color')) {
	        panel.style.backgroundColor = 'rgb(' + storage.background_color.join(',') + ')';
	    }

	    if (storage.hasOwnProperty('text_color')) {
	        panel.style.color = 'rgb(' + storage.text_color.join(',') + ')';
	    }
	};

	this.ui.styles();
};


/*--------------------------------------------------------------
# CONTROLS
--------------------------------------------------------------*/

extension.cursor = function () {
	var x = extension.mouse.x,
		y = extension.mouse.y,
		collised = false;

	extension.video = false;

	for (var i = 0, l = extension.rects.length; i < l; i++) {
		var rect = extension.rects[i];

		if (x > rect.left && y > rect.top) {
			if (x < rect.left + rect.width && y < rect.top + rect.height) {
				collised = rect;

				extension.video = extension.videos[i];
			}
		}
	}

	if (extension.ui.container) {
		if (collised) {
			extension.ui.container.style.display = 'block';
			extension.ui.container.style.left = collised.left + 'px';
			extension.ui.container.style.top = collised.top + 'px';
			extension.ui.container.style.width = collised.width + 'px';
			extension.ui.container.style.height = collised.height + 'px';
			extension.ui.move();
		} else {
			extension.ui.container.style.display = '';
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

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'init') {
        if (window === window.top) {
            sendResponse(extension.hostname);
        }
    }
});

chrome.storage.onChanged.addListener(function (changes) {
    for (var key in changes) {
        extension.storage[key] = changes[key].newValue;
    }

    if (extension.ui.styles) {
    	extension.ui.styles();
    }
});

extension.observer();

function init() {
	extension.ui();

	extension.interval = setInterval(function () {
		extension.update();
	}, 100);
}

chrome.runtime.sendMessage({
	action: 'get-tab-hostname'
}, function (response) {
	extension.hostname = response.hostname;

	extension.storage.import(function () {
		if (document.body) {
			init();
		} else {
			document.addEventListener('DOMContentLoaded', init);
		}
	});
});

document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement && extension.storage.hide_in_fullscreen === true) {
        extension.ui.panel.style.display = 'none';
    } else {
        extension.ui.panel.style.display = '';
    }
});