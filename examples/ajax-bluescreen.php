<?php


require __DIR__ . '/../src/tracy.php';

use Tracy\Debugger;

Debugger::enable(Debugger::DEVELOPMENT, __DIR__ . '/log');

Debugger::$ajaxEnabled = TRUE;
Debugger::$ajaxRoute = basename(__FILE__) . '?action=<action>';
Debugger::$strictMode = TRUE;
Debugger::$scream = TRUE;

if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
	if (isSet($_GET['action'])) {
		Debugger::getAjaxController()->run($_GET['action']);
	}

	Debugger::barDump('bar', 'foo');

	Header('Content-Type: application/json');
	echo json_encode([
		'success' => TRUE,
		'message' => 'Thank you for your purchase',
		'nonexistent' => $foo,
	]);
	exit;
}

?>
<!DOCTYPE html><html><link rel="stylesheet" href="assets/style.css">

<h1>An example of loading an exception dump after a failed AJAX request</h1>

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
				if (xhr.readyState === XMLHttpRequest.DONE) {
					if (xhr.status === 200) {
						var payload = JSON.parse(xhr.responseText);
						btn.parentNode.textContent = payload.message;

						// call this after every AJAX update
						window.Tracy && Tracy.update();
					} else {
						// call this after every AJAX update
						window.Tracy && Tracy.update();
					}
				}
			};
			xhr.send();
		}, false);
	})();
</script>
