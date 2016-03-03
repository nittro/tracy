<?php


require __DIR__ . '/../src/tracy.php';

use Tracy\Debugger;

Debugger::enable(Debugger::DEVELOPMENT, __DIR__ . '/log');

Debugger::$ajax = true;
Debugger::$ajaxRoute = basename(__FILE__) . '?action=<action>';

if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
	if (isSet($_GET['action'])) {
		Debugger::handleAjaxRequest($_GET['action']);
	}

	Debugger::barDump('bar', 'foo');

	Header('Content-Type: application/json');
	echo json_encode([
		'success' => true,
		'message' => 'Thank you for your purchase',
	]);
	exit;
}

?>
<!DOCTYPE html><html><link rel="stylesheet" href="assets/style.css">

<h1>An example of how refreshing the Tracy bar using AJAX works</h1>

<p><button id="ajax-test">Click me!</button></p>

<script type="text/javascript">
	(function () {
		var btn = document.getElementById('ajax-test');

		btn.addEventListener('click', function (e) {
			e.preventDefault();

			var xhr = new XMLHttpRequest();
			xhr.open('GET', '', true);
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			xhr.onreadystatechange = function () {
				if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
					var payload = JSON.parse(xhr.responseText);
					btn.parentNode.textContent = payload.message;

					// call this after every AJAX update
					window.Tracy && Tracy.Debug && typeof Tracy.Debug.refreshBar === 'function' && Tracy.Debug.refreshBar();
				}
			};
			xhr.send();
		}, false);
	})();
</script>
