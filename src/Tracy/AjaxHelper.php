<?php

/**
 * This file is part of the Tracy (https://tracy.nette.org)
 * Copyright (c) 2004 David Grudl (https://davidgrudl.com)
 */

namespace Tracy;


/**
 * Class AjaxHelper
 * @package Tracy
 */
class AjaxHelper
{
	/** @var array */
	private $actions = [];


	/**
	 * AjaxHelper constructor.
	 */
	public function __construct()
	{
		$this->actions['bar'] = [$this, 'getStoredBar'];
		$this->actions['bluescreen'] = [$this, 'getStoredBluescreen'];
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
	public function handleRequest($action)
	{
		Debugger::$showBar = false;

		if (array_key_exists($action, $this->actions)) {
			$payload = call_user_func($this->actions[$action]);
		} else {
			$payload = ['error' => true, 'message' => 'Unknown action: ' . $action];
		}

		Header('Content-Type: application/json');
		echo json_encode($payload);
		exit;
	}


	/**
	 * @param $info
	 * @return $this
	 */
	public function storeBar($info)
	{
		$session = & $this->getSession();
		$session['debuggerbar'] = $info;
		return $this;
	}

	/**
	 * @return array
	 */
	public function getStoredBar()
	{
		$session = & $this->getSession();
		$info = $session['debuggerbar'];
		$session['debuggerbar'] = null;
		return $info;
	}

	/**
	 * @param string $bluescreen
	 * @return $this
	 */
	public function storeBluescreen($bluescreen)
	{
		$session = & $this->getSession();
		$session['bluescreen'] = $bluescreen;
		return $this;
	}

	/**
	 * @return string
	 */
	public function getStoredBluescreen()
	{
		$session = & $this->getSession();
		$bluescreen = $session['bluescreen'];
		$session['bluescreen'] = null;
		return ['bluescreen' => $bluescreen];
	}


	protected function & getSession()
	{
		@session_start(); // @ session may be already started or it is not possible to start session
		return $_SESSION['__NF']['ajax'];
	}
}
