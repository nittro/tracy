/**
 * This file is part of the Tracy (https://tracy.nette.org)
 */

(function(){
	window.Tracy || (window.Tracy = {});

	var Panel = Tracy.DebugPanel = function(debug, id, html) {
		this.id = id;
		this.elem = document.createElement('div');
		this.elem.id = this.id;
		this.elem.classList.add('tracy-panel');
		this.elem.Tracy = this.elem.Tracy || {};

		debug.getElement().appendChild(this.elem);
		Tracy.Util.setHtml(this.elem, html + '<div class="tracy-icons"><a href="#" title="open in window">&curren;</a><a href="#" rel="close" title="close window">&times;</a></div>');
		this.init();

	};

	Panel.PEEK = 'tracy-mode-peek';
	Panel.FLOAT = 'tracy-mode-float';
	Panel.WINDOW = 'tracy-mode-window';
	Panel.FOCUSED = 'tracy-focused';
	Panel.zIndex = 20000;

	Panel.prototype.init = function() {
		var _this = this, elem = this.elem;

		elem.Tracy.onMove = function(coords) {
			_this.moveConstrains(this, coords);
		};

		draggable(elem, {
			rightEdge: true,
			bottomEdge: true,
			handle: elem.querySelector('h1'),
			stop: function() {
				_this.toFloat();
			}
		});

		elem.addEventListener('mouseover', function(evt) {
			if (isTargetChanged(evt.relatedTarget, this)) {
				_this.focus();
			}
		}, false);

		elem.addEventListener('mouseout', function(evt) {
			if (isTargetChanged(evt.relatedTarget, this)) {
				_this.blur();
			}
		}, false);

		elem.addEventListener('click', function() {
			_this.oldPosition = getPosition(elem);
		}, false);

		this.applyOldPosition = function() {
			if (_this.oldPosition) {
				var pos = getPosition(elem);
				setPosition(elem, {
					right: pos.right - pos.width + _this.oldPosition.width,
					bottom: pos.bottom - pos.height + _this.oldPosition.height
				});
			}
			_this.oldPosition = null;
		};

		document.documentElement.addEventListener('click', this.applyOldPosition, false);

		[].forEach.call(elem.querySelectorAll('.tracy-icons a'), function(a) {
			a.addEventListener('click', function(evt) {
				if (this.rel === 'close') {
					_this.toPeek();
				} else {
					_this.toWindow();
				}
				evt.preventDefault();
			}, false);
		});

		Tracy.Toggle.persist(elem);
		this.restorePosition();
	};

	Panel.prototype.is = function(mode) {
		return this.elem.classList.contains(mode);
	};

	Panel.prototype.focus = function(callback) {
		var elem = this.elem;
		if (this.is(Panel.WINDOW)) {
			elem.Tracy.window.focus();
		} else {
			clearTimeout(elem.Tracy.displayTimeout);
			elem.Tracy.displayTimeout = setTimeout(function() {
				elem.classList.add(Panel.FOCUSED);
				elem.style.display = 'block';
				elem.style.zIndex = Panel.zIndex++;
				if (callback) {
					callback();
				}
			}, 50);
		}
	};

	Panel.prototype.blur = function() {
		var elem = this.elem;
		elem.classList.remove(Panel.FOCUSED);
		if (this.is(Panel.PEEK)) {
			clearTimeout(elem.Tracy.displayTimeout);
			elem.Tracy.displayTimeout = setTimeout(function() {
				elem.style.display = 'none';
			}, 50);
		}
	};

	Panel.prototype.toFloat = function() {
		this.elem.classList.remove(Panel.WINDOW);
		this.elem.classList.remove(Panel.PEEK);
		this.elem.classList.add(Panel.FLOAT);
		this.elem.style.display = 'block';
		this.reposition();
	};

	Panel.prototype.toPeek = function() {
		this.elem.classList.remove(Panel.WINDOW);
		this.elem.classList.remove(Panel.FLOAT);
		this.elem.classList.add(Panel.PEEK);
		this.elem.style.display = 'none';
	};

	Panel.prototype.toWindow = function() {
		var offset = getOffset(this.elem);
		offset.left += typeof window.screenLeft === 'number' ? window.screenLeft : (window.screenX + 10);
		offset.top += typeof window.screenTop === 'number' ? window.screenTop : (window.screenY + 50);

		var win = window.open('', this.id.replace(/-/g, '_'), 'left=' + offset.left + ',top=' + offset.top
			+ ',width=' + this.elem.offsetWidth + ',height=' + (this.elem.offsetHeight + 15) + ',resizable=yes,scrollbars=yes');
		if (!win) {
			return;
		}

		var doc = win.document;
		doc.write('<!DOCTYPE html><meta charset="utf-8"><style type="text/css">'
			+ document.getElementById('tracy-debug-style').innerHTML
			+ '<\/style><script type="text/javascript">'
			+ document.getElementById('tracy-debug-script').innerHTML
			+ '<\/script><body id="tracy-debug">'
		);
		win.Tracy.Debug.getInstance().addPanel(this.id, this.elem.innerHTML);
		doc.getElementById(this.id).classList.remove(Panel.PEEK);
		doc.getElementById(this.id).classList.add(Panel.WINDOW);

		win.Tracy.Dumper.init();

		if (this.elem.querySelector('h1')) {
			doc.title = this.elem.querySelector('h1').innerHTML;
		}

		var _this = this;
		win.addEventListener('beforeunload', function() {
			_this.toPeek();
			win.close(); // forces closing, can be invoked by F5
		}, false);

		doc.addEventListener('keyup', function(e) {
			if (e.keyCode === 27 && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
				win.close();
			}
		}, false);

		this.elem.style.display = 'none';
		this.elem.classList.remove(Panel.FLOAT);
		this.elem.classList.remove(Panel.PEEK);
		this.elem.classList.add(Panel.WINDOW);
		this.elem.Tracy.window = win;
	};

	Panel.prototype.reposition = function() {
		var pos = getPosition(this.elem);
		if (pos.width) { // is visible?
			setPosition(this.elem, {right: pos.right, bottom: pos.bottom});
		}
	};

	Panel.prototype.moveConstrains = function(el, coords) { // forces constrained inside window
		var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
			height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		coords.right = Math.min(Math.max(coords.right, -0.2 * el.offsetWidth), width - 0.8 * el.offsetWidth);
		coords.bottom = Math.min(Math.max(coords.bottom, -0.2 * el.offsetHeight), height - el.offsetHeight);
	};

	Panel.prototype.savePosition = function() {
		var pos = getPosition(this.elem);
		if (this.is(Panel.WINDOW)) {
			localStorage.setItem(this.id, JSON.stringify({window: true}));
		} else if (pos.width) {
			localStorage.setItem(this.id, JSON.stringify({right: pos.right, bottom: pos.bottom}));
		} else {
			localStorage.removeItem(this.id);
		}
	};

	Panel.prototype.restorePosition = function() {
		var pos = JSON.parse(localStorage.getItem(this.id));
		if (!pos) {
			this.elem.classList.add(Panel.PEEK);
		} else if (pos.window) {
			this.toWindow();
		} else if (this.elem.querySelector('*')) {
			setPosition(this.elem, pos);
			this.toFloat();
		}
	};

	Panel.prototype.destroy = function () {
		this.savePosition();
		document.documentElement.removeEventListener('click', this.applyOldPosition, false);

		if (this.is(Panel.WINDOW)) {
			this.elem.Tracy.window.close();
		}

		if (this.elem.parentNode) {
			this.elem.parentNode.removeChild(this.elem);
		}
	};


	var Tab = Tracy.DebugBarTab = function (section, html, options) {
		this.elem = document.createElement('li');

		if (typeof options === 'string') {
			options = {rel: options};
		} else if (!options) {
			options = {};
		}

		this.persistent = !!options.persistent;

		var elem;

		if (options.rel) {
			elem = document.createElement('a');
			elem.href = '#';
			elem.rel = options.rel;
			this.elem.appendChild(elem);

		} else if (!options.raw) {
			elem = document.createElement('span');
			this.elem.appendChild(elem);

		} else {
			elem = this.elem;

		}

		if (options.id) {
			this.elem.id = options.id;
		}

		if (options.title) {
			elem.title = options.title;
		}

		section.getElement().appendChild(this.elem);
		Tracy.Util.setHtml(elem, html);

	};

	Tab.prototype.isPersistent = function () {
		return this.persistent;
	};

	Tab.prototype.destroy = function () {
		if (this.elem.parentNode) {
			this.elem.parentNode.removeChild(this.elem);
		}
	};


	var Section = Tracy.DebugBarSection = function (bar) {
		this.elem = document.createElement('ul');
		bar.getElement().appendChild(this.elem);
		this.tabs = [];

	};

	Section.prototype.getElement = function () {
		return this.elem;
	};

	Section.prototype.addTab = function (html, options) {
		this.tabs.push(new Tab(this, html, options));

	};

	Section.prototype.destroy = function (force) {
		this.tabs = this.tabs.filter(function (tab) {
			if (force || !tab.isPersistent()) {
				tab.destroy();
				return false;
			} else {
				return true;
			}
		});

		if (force && this.elem.parentNode) {
			this.elem.parentNode.removeChild(this.elem);

		}
	};

	var Bar = Tracy.DebugBar = function(debug) {
		this.debug = debug;
		this.elem = document.createElement('div');
		this.elem.id = this.id;
		this.debug.getElement().appendChild(this.elem);
		this.sections = [new Section(this)];
		this.getSection(0).addTab(Bar.LOGO, {persistent: true, raw: true, id: 'tracy-debug-logo', title: 'Tracy Debug'});
		this.init();

	};

	Bar.prototype.id = 'tracy-debug-bar';

	Bar.LOGO = '<svg viewBox="0 -10 1561 333"><path fill="#585755" d="m176 327h-57v-269h-119v-57h291v57h-115v269zm208-191h114c50 0 47-78 0-78h-114v78zm106-135c17 0 33 2 46 7 75 30 75 144 1 175-13 6-29 8-47 8h-27l132 74v68l-211-128v122h-57v-326h163zm300 57c-5 0-9 3-11 9l-56 156h135l-55-155c-2-7-6-10-13-10zm-86 222l-17 47h-61l102-285c20-56 107-56 126 0l102 285h-61l-17-47h-174zm410 47c-98 0-148-55-148-163v-2c0-107 50-161 149-161h118v57h-133c-26 0-45 8-58 25-12 17-19 44-19 81 0 71 26 106 77 106h133v57h-119zm270-145l-121-181h68l81 130 81-130h68l-121 178v148h-56v-145z"/></svg>';

	Bar.prototype.getElement = function () {
		return this.elem;
	};

	Bar.prototype.getSection = function (i) {
		if (!this.sections[i]) {
			this.sections[i] = new Section(this);
			this.sections[i].getElement().classList.add('tracy-previous');
			this.sections[i].addTab('previous', {title: 'Previous request before redirect'});

		}

		return this.sections[i];

	};

	Bar.prototype.init = function() {
		var elem = this.elem, _this = this;

		elem.Tracy = {};
		elem.Tracy.onMove = function(coords) {
			_this.moveConstrains(this, coords);
		};

		draggable(elem, {
			handle: elem.querySelector('#tracy-debug-logo'),
			rightEdge: true,
			bottomEdge: true,
			draggedClass: 'tracy-dragged'
		});

		elem.addEventListener('click', function (evt) {
			evt.preventDefault();

			var a = Tracy.Util.closest(evt.target, 'a', Tracy.Util.until(elem)),
				panel = a && a.rel ? _this.debug.getPanel(a.rel) : null;

			if (!a) {
				return;

			} else if (!panel) {
				if (a.rel === 'close') {
					_this.close();

				}

				return;
			}

			if (evt.shiftKey) {
				panel.toFloat();
				panel.toWindow();

			} else if (panel.is(Panel.FLOAT)) {
				panel.toPeek();

			} else {
				panel.toFloat();
				setPosition(panel.elem, {
					right: getPosition(panel.elem).right + Math.round(Math.random() * 100) + 20,
					bottom: getPosition(panel.elem).bottom + Math.round(Math.random() * 100) + 20
				});
			}
		}, false);

		elem.addEventListener('mouseover', function (evt) {
			var a = Tracy.Util.closest(evt.target, 'a', Tracy.Util.until(elem)),
				panel = a && a.rel ? _this.debug.getPanel(a.rel) : null;

			if (!a || !panel || !isTargetChanged(evt.relatedTarget, a) || elem.classList.contains('tracy-dragged')) {
				return;
			}

			panel.focus(function() {
				if (panel.is(Panel.PEEK)) {
					var pos = getPosition(panel.elem);
					setPosition(panel.elem, {
						right: pos.right - getOffset(a).left + pos.width - getPosition(a).width - 4 + getOffset(panel.elem).left,
						bottom: pos.bottom - getOffset(elem).top + pos.height + 4 + getOffset(panel.elem).top
					});
				}
			});
		}, false);

		elem.addEventListener('mouseout', function (evt) {
			var a = Tracy.Util.closest(evt.target, 'a', Tracy.Util.until(elem)),
				panel = a && a.rel ? _this.debug.getPanel(a.rel) : null;

			if (a && panel && isTargetChanged(evt.relatedTarget, a) && !elem.classList.contains('tracy-dragged')) {
				_this.debug.getPanel(a.rel).blur();
			}
		}, false);

		window.addEventListener('unload', function() {
			_this.destroy();
		}, false);

		this.restorePosition();
	};

	Bar.prototype.build = function (sections) {
		var _this = this;

		sections.forEach(function (panels, i) {
			var section = _this.getSection(i);

			panels.forEach(function (panel) {
				section.addTab(panel.tab, panel.panel ? 'tracy-debug-panel-' + panel.id : null, false);
			});
		});

		this.getSection(this.sections.length - 1).addTab('&times;', 'close', false);

	};

	Bar.prototype.close = function() {
		document.getElementById('tracy-debug').style.display = 'none';
	};

	Bar.prototype.moveConstrains = function(el, coords) { // forces constrained inside window
		var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
			height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		coords.right = Math.min(Math.max(coords.right, 0), width - el.offsetWidth);
		coords.bottom = Math.min(Math.max(coords.bottom, 0), height - el.offsetHeight);
	};

	Bar.prototype.savePosition = function() {
		var pos = getPosition(document.getElementById(this.id));
		localStorage.setItem(this.id, JSON.stringify({right: pos.right, bottom: pos.bottom}));
	};

	Bar.prototype.restorePosition = function() {
		var pos = JSON.parse(localStorage.getItem(this.id));
		if (pos) {
			setPosition(document.getElementById(this.id), pos);
		}
	};

	Bar.prototype.cleanup = function () {
		if (!this.sections.length) {
			return;
		}

		this.sections[0].destroy(false);

		this.sections.splice(1, this.sections.length).forEach(function (section) {
			section.destroy(true);
		});
	};

	Bar.prototype.destroy = function () {
		this.savePosition();

		this.sections.forEach(function (section) {
			section.destroy(true);
		});
	};



	var Debug = Tracy.Debug = function () {
		this.elem = document.getElementById('tracy-debug');
		this.bar = new Bar(this);
		this.panels = {};
		this.ajaxRoute = null;
		this.initResize();

	};

	Debug.instance = null;

	Debug.getInstance = function () {
		if (!Debug.instance) {
			Debug.instance = new Debug();
		}

		return Debug.instance;

	};

	Debug.prototype.getElement = function () {
		return this.elem;
	};

	Debug.prototype.getPanel = function(id) {
		return this.panels[id];
	};

	Debug.prototype.addPanel = function (id, html) {
		this.panels[id] = new Panel(this, id, html);
	};

	Debug.prototype.setAjaxRoute = function (route) {
		this.ajaxRoute = route;
	};

	Debug.prototype.initResize = function() {
		var panels = this.panels,
			bar = this.bar.getElement();

		window.addEventListener('resize', function() {
			setPosition(bar, {right: getPosition(bar).right, bottom: getPosition(bar).bottom});

			for (var id in panels) {
				panels[id].reposition();
			}
		});
	};

	Debug.prototype.build = function (sections) {
		var _this = this;
		this.bar.build(sections);

		sections.forEach(function (panels) {
			panels.forEach(function (panel) {
				if (panel.panel) {
					_this.addPanel('tracy-debug-panel-' + panel.id, panel.panel);
				}
			});
		});
	};

	Debug.prototype.cleanup = function () {
		this.bar.cleanup();

		for (var id in this.panels) {
			this.panels[id].destroy();
		}
	};

	Tracy.update = function () {
		var debug = Debug.getInstance();

		if (!debug.ajaxRoute) {
			return;
		}

		debug.cleanup();

		Tracy.Util.xhr(debug.ajaxRoute.replace(/<action>/, 'update'), function (payload) {
			if (payload.bar) {
				debug.build(payload.bar.sections);
				Tracy.Dumper.init(payload.bar.liveData);
			}

			if (payload.bluescreen) {
				var elem = document.createElement('div');
				document.body.appendChild(elem);
				Tracy.Util.setHtml(elem, payload.bluescreen);
			}
		});
	};



	// emulate mouseenter & mouseleave
	function isTargetChanged(target, dest) {
		while (target) {
			if (target === dest) {
				return;
			}
			target = target.parentNode;
		}
		return true;
	}


	var dragging;

	function draggable(elem, options) {
		var dE = document.documentElement, started, pos, deltaX, deltaY;
		options = options || {};

		var onmousemove = function(e) {
			if (e.buttons === 0) {
				return onmouseup(e);
			}
			if (!started) {
				if (options.draggedClass) {
					elem.classList.add(options.draggedClass);
				}
				if (options.start) {
					options.start(e, elem);
				}
				started = true;
			}

			var pos = {};
			pos[options.rightEdge ? 'right' : 'left'] = options.rightEdge ? deltaX - e.clientX : e.clientX + deltaX;
			pos[options.bottomEdge ? 'bottom' : 'top'] = options.bottomEdge ? deltaY - e.clientY : e.clientY + deltaY;
			setPosition(elem, pos);
			return false;
		};

		var onmouseup = function(e) {
			if (started) {
				if (options.draggedClass) {
					elem.classList.remove(options.draggedClass);
				}
				if (options.stop) {
					options.stop(e, elem);
				}
			}
			dragging = null;
			dE.removeEventListener('mousemove', onmousemove);
			dE.removeEventListener('mouseup', onmouseup);
			return false;
		};

		(options.handle || elem).addEventListener('mousedown', function(e) {
			e.preventDefault();
			e.stopPropagation();

			if (dragging) { // missed mouseup out of window?
				return onmouseup(e);
			}

			pos = getPosition(elem);
			deltaX = options.rightEdge ? pos.right + e.clientX : pos.left - e.clientX;
			deltaY = options.bottomEdge ? pos.bottom + e.clientY : pos.top - e.clientY;
			dragging = true;
			started = false;
			dE.addEventListener('mousemove', onmousemove);
			dE.addEventListener('mouseup', onmouseup);
		});

		(options.handle || elem).addEventListener('click', function(e) {
			if (started) {
				e.stopImmediatePropagation();
			}
		});
	}

	// returns total offset for element
	function getOffset(elem) {
		var res = {left: elem.offsetLeft, top: elem.offsetTop};
		while (elem = elem.offsetParent) {
			res.left += elem.offsetLeft; res.top += elem.offsetTop;
		}
		return res;
	}

	// move to new position
	function setPosition(elem, coords) {
		if (elem.Tracy && elem.Tracy.onMove) {
			elem.Tracy.onMove.call(elem, coords);
		}
		for (var item in coords) {
			elem.style[item] = coords[item] + 'px';
		}
	}

	// returns current position
	function getPosition(elem) {
		return {
			left: elem.offsetLeft,
			top: elem.offsetTop,
			right: elem.style.right ? parseInt(elem.style.right, 10) : 0,
			bottom: elem.style.bottom ? parseInt(elem.style.bottom, 10) : 0,
			width: elem.offsetWidth,
			height: elem.offsetHeight
		};
	}

})();
