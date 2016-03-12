(function () {

	window.Tracy || (window.Tracy = {});

	Tracy.Util = {
		setHtml: function (elem, html) {
			elem.innerHTML = html;

			for (var i = 0, scripts = [].slice.call(elem.getElementsByTagName('script')); i < scripts.length; i++) {
				if (!scripts[i].type || scripts[i].type.toLowerCase() === 'text/javascript') {
					var load = scripts[i].hasAttribute('src'),
						src = load ? scripts[i].src : (scripts[i].text || scripts[i].textContent || scripts[i].innerHTML || ''),
						script = document.createElement('script');

					script.type = 'text/javascript';

					if (load) {
						script.src = src;
					} else {
						try {
							script.appendChild(document.createTextNode(src));
						} catch (e) {
							script.text = src;
						}
					}

					scripts[i].parentNode.insertBefore(script, scripts[i]);
					scripts[i].parentNode.removeChild(scripts[i]);

				}
			}
		},
		closest: function (el, selector, func) {
			var matches = el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector;
			while (el && selector && !(el.nodeType === 1 && matches.call(el, selector))) {
				el = func ? (typeof func === 'function' ? func.call(el) : el[func]) : el.parentNode;
			}
			return el;
		},
		until: function (elem) {
			return function () {
				return this.parentNode !== elem ? this.parentNode : null;
			};
		},
		xhr: function (url, method, callback) {
			if (!callback && typeof method !== 'string') {
				callback = method;
				method = 'GET';

			}

			var xhr = new XMLHttpRequest();

			xhr.open(method.toUpperCase(), url, true);
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xhr.onreadystatechange = function () {
				if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
					var payload = xhr.responseText;

					if (xhr.getAllResponseHeaders().match(/^Content-Type:\s+application\/json(;|$)/im)) {
						payload = JSON.parse(payload);
					}

					callback(payload);

				}
			};
			xhr.send();
		}
	};

})();
