(function ( $ ) {
	// Create public Namespace for classes
	$.Acheta = {};
	
	/**
	 * HeartBeater class.
	 * 
	 * @param object                       customOptions to override defaults
	 * @param $.Acheta.UserActivityChecker userCheckerInject
	 */
	$.Acheta.HeartBeater = function(customOptions, userCheckerInject) {
		if (!(this instanceof $.Acheta.HeartBeater)) {
			 return new HeartBeater(customOptions, userCheckerInject);
		}
    
    var defaults = {
                    heartBeatInterval: 2000,
                    checkUserActivity: false,
                    checkUserActivityInterval: 500,
                    limit: 0,
                    autoStart: true
                  };
                  
    var self          = this;              
		var options       = $.extend({}, defaults, customOptions);
		var status        = $.Acheta.HeartBeater.STATUS_PAUSED;
		var hbCountDown   = -1;
		var beatCounter   = 0;
		var beatScheduled = false;
		
		if (options.checkUserActivity == true && !(userCheckerInject instanceof $.Acheta.UserActivityChecker)) {
			throw 'Instance of UserActivityChecker is required as the second argument when user activity checking is required.';
		}
    
		
		
		// Constants.
		$.Acheta.HeartBeater.STATUS_RUNNING       = 'running';
		$.Acheta.HeartBeater.STATUS_PAUSED        = 'paused';
		$.Acheta.HeartBeater.STATUS_INACTIVE      = 'inactive';
		$.Acheta.HeartBeater.STATUS_LIMIT_REACHED = 'limit_reached';
		
		$.Acheta.HeartBeater.EVENT_HEARTBEAT               = 'heartBeat';
		$.Acheta.HeartBeater.EVENT_HEARTBEAT_STARTED       = 'heartBeatStarted';
		$.Acheta.HeartBeater.EVENT_HEARTBEAT_PAUSED        = 'heartBeatPaused';
		$.Acheta.HeartBeater.EVENT_HEARTBEAT_LIMIT_REACHED = 'heartBeatLimitReached';

		
		
		
		// Setup user checker.
		var userChecker = userCheckerInject;
		userChecker.setInterval(options.checkUserActivityInterval);
		$(userChecker).on($.Acheta.UserActivityChecker.EVENT_USER_BECAME_ACTIVE,   function(e){onUserBecomeActive(e);});
		$(userChecker).on($.Acheta.UserActivityChecker.EVENT_USER_BECAME_INACTIVE, function(e){onUserBecomeInactive(e);});
		
    
    _setLimit(options.limit)
		
		
		options.heartBeatInterval = parseInt(options.heartBeatInterval);
		if(isNaN(options.heartBeatInterval) || options.heartBeatInterval <= 0) {
			throw 'HeartBeatInterval must be a number greater than zero. '+options.heartBeatInterval+' given.';
		}
		
		/**
		 * Regularly scheduled beat. Triggers heartBeat event.
		 */
		function beat() {
			beatScheduled = false;
			if (status == $.Acheta.HeartBeater.STATUS_RUNNING && ((options.checkUserActivity == true && userChecker.isUserActive()) || options.checkUserActivity == false)) {
				beatCounter++;
				doCountDown();
				$(self).triggerHandler($.Acheta.HeartBeater.EVENT_HEARTBEAT);
				beatScheduled = true;
				setTimeout(function(){beat();}, options.heartBeatInterval);
				
			}
		}
		
		/**
		 * Watches limit of beats. Triggers heartBeatLimitReached event.
		 */
		function doCountDown() {
			if(hbCountDown > 1) {
				hbCountDown--;
			}
			if (hbCountDown == 1) {
				status = $.Acheta.HeartBeater.STATUS_LIMIT_REACHED;
				userChecker.stopChecking();
				$(self).triggerHandler($.Acheta.HeartBeater.EVENT_HEARTBEAT_LIMIT_REACHED);
			}
		}
    
    /**
     * Validate and set limit.
     */
    function _setLimit(limit) {
      limit = parseInt(limit);
      if(isNaN(limit) || options.limit < 0) {
        throw 'Limit must be a number greater or equal to zero. '+limit+' given.';
      }
      if (limit > 0) {
        hbCountDown = limit + 1;
      } else {
        hbCountDown = -1;
      }
      options.limit = limit;
    }
		
		/**
		 * Listener function for userBecomeActive event. Triggers userBecomeActive event.
		 * 
		 * @param event userBecomeActive
		 * 
		 */
		function onUserBecomeActive(event) {
			status = $.Acheta.HeartBeater.STATUS_RUNNING;
      // Propagate event.
			$(self).triggerHandler(event);
			
      if(!beatScheduled) {
				beat();
			}
		}
		
		/**
		 * Listener function for userBecomeInactive event. Triggers userBecomeInactive event.
		 * 
		 * @param event userBecomeInactive
		 * 
		 */
		function onUserBecomeInactive(event) {
			status = $.Acheta.HeartBeater.STATUS_INACTIVE;
			// Propagate event.
			$(self).triggerHandler(event);
		}
		
		// Public methods
		/**
		 * Pause heart beating. Triggers heartBeatPaused event.
		 * 
		 * @returns void 
		 */
		this.pause = function() {
      if (status == $.Acheta.HeartBeater.STATUS_PAUSED) {
        return;
      }
			userChecker.stopChecking();
			status = $.Acheta.HeartBeater.STATUS_PAUSED;
			$(self).triggerHandler($.Acheta.HeartBeater.EVENT_HEARTBEAT_PAUSED);
		};
		
		/**
		 * Start heart beating. Triggers heartBeatStarted event.
		 * 
		 * @returns void
		 */
		this.start = function() {
      if (status == $.Acheta.HeartBeater.STATUS_RUNNING) {
        return;
      }
      if(hbCountDown == 1) {
        status = $.Acheta.HeartBeater.STATUS_LIMIT_REACHED;
        return;
      }
			if (options.checkUserActivity) {
				userChecker.startChecking();
			}
			status = $.Acheta.HeartBeater.STATUS_RUNNING;
			$(self).triggerHandler($.Acheta.HeartBeater.EVENT_HEARTBEAT_STARTED);
			if(!beatScheduled) {
				beat();
			}
		};
		
		/**
		 * Get current status of heart beater.
		 * 
		 * @returns String
		 */
		this.getStatus = function(){
			return status;
		};
		
		/**
		 * Get number of beats performed.
		 * 
		 * @returns Number
		 */
		this.getHeartBeatsCount = function() {
			return beatCounter;
		};
		
		/**
		 * Get number of beats remaining from the limit. Returns false when limit not applied.
		 * 
		 * $returns int/false
		 */
		this.getHeartBeatsRemaining = function() {
			if(options.limit == 0) {
				return false;
			}
			return hbCountDown-1;
		};
    
    /**
     * Re/Set limit of beats. Set to 0 to disable limit.
     * 
     * @param integer limit
     *
     */
    this.setLimit = function(limit){
      _setLimit(limit);
    }
		
		if(options.autoStart == true) {
			this.start();
		}
		
	};
	
	/**
	 * UserActivityChecker class.
	 * 
	 * @param int    interval of check in miliseconds
	 * @param object Document object to determine user's activity. Must have hasFocus() method.
	 */
	$.Acheta.UserActivityChecker = function(intervalOfCheck, documentInject) {
		if (!(this instanceof $.Acheta.UserActivityChecker)) {
			 return new UserActivityChecker(intervalOfCheck, documentInject);
		}
		
		var self = this;
		
		$.Acheta.UserActivityChecker.EVENT_USER_BECAME_ACTIVE   = 'userBecameActive';
		$.Acheta.UserActivityChecker.EVENT_USER_BECAME_INACTIVE = 'userBecameInactive';
		
		if (!(documentInject instanceof Object && typeof documentInject.hasFocus == 'function')) {
			throw 'Document must be an object and must have hasFocus() function.';
		}
		
		var myDocument = documentInject;
		var interval   = 0;
		var checking   = false;
		var userStatus = 'uknown';
		
		_setInterval(intervalOfCheck);
		
		/**
		 * Regularly check the document object for user's activity.
		 * Triggers userBecameActive and userBecameInactive events.
		 * 
		 * @returns void
		 */
		function checkUserActive() {
			if (checking) {
				newStatus = self.isUserActive();
				if (userStatus != newStatus && newStatus == true) {
					$(self).triggerHandler($.Acheta.UserActivityChecker.EVENT_USER_BECAME_ACTIVE);
				} else if(userStatus != newStatus && newStatus == false) {
					$(self).triggerHandler($.Acheta.UserActivityChecker.EVENT_USER_BECAME_INACTIVE);
				}
				userStatus = newStatus;
				setTimeout(function(){checkUserActive();}, interval);
			}
		};
		
		/**
		 * Instantly check whether the document has focus.
		 * 
		 * @returns boolean
		 */
		this.isUserActive = function() {
			return myDocument.hasFocus();
		};
		
		/**
		 * Stop monitoring.
		 * 
		 * @returns $.Acheta.UserActivityChecker
		 */
		this.stopChecking = function() {
			checking = false;
			return self;
		};
		
		/**
		 * Start/Continue monitoring.
		 * 
		 * @returns $.Acheta.UserActivityChecker
		 */
		this.startChecking = function() {
			checking = true;
			checkUserActive();
			return self;
		};
		
		/**
		 * Returns status whether currently checking.
		 * 
		 * @returns boolean
		 */
		this.isChecking = function() {
			return checking;
		};
		
		/**
		 * Set/change monitoring interval in miliseconds.
		 * 
		 * @returns $.Acheta.UserActivityChecker
		 */
		this.setInterval = function(newIterval) {
			_setInterval(newIterval);
			return self;
		};
		
		function _setInterval(newInterval) {
			newInterval = parseInt(newInterval);
			if (isNaN(newInterval) || newInterval <= 0) {
				throw 'User activity check interval must be greater than zero. '+newInterval+' given.';
			}
			interval = newInterval;
		}
	};
	
	/**
	 * User activity checker factory.
	 * 
	 * @returns $.Acheta.UserActivityChecker
	 */
	$.createUserActivityChecker = function(checkInterval, documentInject){
		// Use global document variable if not injected.
		if (!(documentInject instanceof Object)) {
			documentInject = document;
		}
		
		var checker = new $.Acheta.UserActivityChecker(checkInterval, documentInject);
		return checker;
	};
	
	/**
	 * Heart beater factory.
	 * 
	 * @returns $.Acheta.HeartBeater
	 */
	$.createHeartBeater = function(options, userActivityChecker) {
		options = $.extend({}, options);
		if (!(userActivityChecker instanceof $.Acheta.UserActivityChecker)) {
			var uacInterval = parseInt(options.checkUserActivityInterval) || 200;
			userActivityChecker = $.createUserActivityChecker(uacInterval);
		}
		
		var hb = new $.Acheta.HeartBeater(options, userActivityChecker);
		return hb;
	};
})(jQuery);
