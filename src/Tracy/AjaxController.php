<?php

/**
 * This file is part of the Tracy (https://tracy.nette.org)
 * Copyright (c) 2004 David Grudl (https://davidgrudl.com)
 */

namespace Tracy;


class AjaxController
{
	/** @var array */
	private $actions = [];


	public function __construct()
	{
		$this->actions['update'] = [$this, 'getStoredRequestData'];
	}


	/**
	 * @param string $action
	 * @param callable $handler
	 * @return $this
	 */
	public function addActionHandler($action, callable $handler)
	{
		$this->actions[$action] = $handler;
		return $this;
	}


	/**
	 * @param string $action
	 */
	public function run($action)
	{
		Debugger::$showBar = FALSE;

		if (isset($this->actions[$action])) {
			$payload = call_user_func($this->actions[$action]);
		} else {
			$payload = ['error' => TRUE, 'message' => 'Unknown action: ' . $action];
		}

		header('Content-Type: application/json');
		echo json_encode($payload);
		exit;
	}


	/**
	 * @param string $key
	 * @param mixed $data
	 */
	public function storeRequestData($key, $data)
	{
		@session_start(); // @ session may be already started or it is not possible to start session
		$_SESSION['__NF']['ajax'][$key] = $data;

	}

	/**
	 * @param bool $clear
	 * @return array
	 */
	public function getStoredRequestData($clear = TRUE)
	{
		@session_start(); // @ session may be already started or it is not possible to start session
		$data = $_SESSION['__NF']['ajax'];

		if ($clear) {
			$_SESSION['__NF']['ajax'] = NULL;
		}

		return $data;
	}

}
