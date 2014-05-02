module('Basic tests');

test('Test factory creates HeartBeater instance', 1, function(){
	var hb = $.createHeartBeater();
	ok(hb instanceof $.Acheta.HeartBeater, 'Object is instance of HeartBeater');
});

test('Test start and pause', 10, function(){
	var hb = $.createHeartBeater();
	stop(3)
	$(hb).on('heartBeatStarted', function(){
		ok(true, 'Event triggered');
		equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_RUNNING, 'HB is running.');
		start();
	});
	
	$(hb).on('heartBeatPaused', function(){
		ok(true, 'Event triggered');
		equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_PAUSED, 'HB is paused.');
		start();
	});	
	equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_RUNNING, 'HB is running.');
	hb.pause();
	equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_PAUSED, 'HB is paused.');
	hb.start();
	equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_RUNNING, 'HB is running.');
	hb.pause();
	equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_PAUSED, 'HB is paused.');
});

test('Test heartBeats remaining returning false when no limit used', 2, function(){
	var hb = $.createHeartBeater({
		heartBeatInterval: 20,
	});
	equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_RUNNING, 'Check the status is running');
	equal(hb.getHeartBeatsRemaining(), false, 'Check remaining counter returns false');
});

test('Test disabled autostart', function(){
	var hb = $.createHeartBeater({autoStart:false});	
	equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_PAUSED, 'Check status is paused after creation.');
	hb.start();
	equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_RUNNING, 'Check status is running after start.');
});

test('Test parameter validation', function(){
	throws(function(){new $.Acheta.HeartBeater({checkUserActivity: true}, 'fakeUserChecker');}, 
			/Instance of UserActivityChecker is required/ ,
			'Validate user checker object'
			);
	throws(function(){new $.Acheta.HeartBeater({heartBeatInterval: 0}, $.createUserActivityChecker(100));}, 
			/HeartBeatInterval must be a number greater than zero/ ,
			'Validate heart beat interval.'
			);
	throws(function(){new $.Acheta.HeartBeater({limit: 'None'}, $.createUserActivityChecker(100));}, 
			/Limit must be a number greater or equal to zero/ ,
			'Validate limit.'
			);
	throws(function(){new $.Acheta.HeartBeater({checkUserActivity: true, checkUserActivityInterval: 0}, $.createUserActivityChecker(100));}, 
			/User activity check interval must be greater than zero/ ,
			'Validate user activity check interval.'
			);
	throws(function(){new $.Acheta.UserActivityChecker(100, 'fakeDoc');}, 
			/Document must be an object/ ,
			'Validate document is an object.'
	);
	throws(function(){new $.Acheta.UserActivityChecker(100, {});}, 
			/Document must be an object/ ,
			'Validate document is an object with hasFocus function.'
	);
});

module('Events tests');
asyncTest('Test user became active', 2, function(){
	var mockDocument = {
			focus: false,
			hasFocus: function(){return this.focus}
		};
	
	var checker = $.createUserActivityChecker(100, mockDocument);
	
	var hb = $.createHeartBeater({
		heartBeatInterval: 2000,
		checkUserActivity: true,
		checkUserActivityInterval: 100,
	}, checker);
	
	
	
	$(hb).on($.Acheta.UserActivityChecker.EVENT_USER_BECAME_ACTIVE, function(){
		ok(true, 'Event triggered');
		equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_RUNNING, 'HB is running.');
		start();
	});
	
	mockDocument.focus = true;
});

asyncTest('Test user became inactive', 2, function(){
	var mockDocument = {
			focus: true,
			hasFocus: function(){return this.focus}
		};
	
	var checker = $.createUserActivityChecker(100, mockDocument);
	
	var hb = $.createHeartBeater({
		heartBeatInterval: 2000,
		checkUserActivity: true,
		checkUserActivityInterval: 100,
	}, checker);
	
	$(hb).on($.Acheta.UserActivityChecker.EVENT_USER_BECAME_INACTIVE, function(){
		ok(true, 'Event triggered');
		equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_INACTIVE, 'HB is inactive.');
		start();
	});
	
	mockDocument.focus = false;
});

asyncTest('Test basic heart beat', 1, function(){
	var hb = $.createHeartBeater({
		heartBeatInterval: 100,
		checkUserActivity: false
	});
	
	$(hb).on($.Acheta.HeartBeater.EVENT_HEARTBEAT , function(){
		ok(true, 'Event triggered');
		hb.pause();
		start();
	});
});

test('Test limited heart beats', function(){
	var limit = 10;
	
	// Increase number of assertions.
	stop(limit+1);
	
	var hb = $.createHeartBeater({
		heartBeatInterval: 10,
		checkUserActivity: false,
		limit: limit,
		autoStart: false
	});
	
	
	$(hb).on($.Acheta.HeartBeater.EVENT_HEARTBEAT, function(){
		ok(true, 'Beat '+hb.getHeartBeatsCount()+' triggered');
		equal(limit - hb.getHeartBeatsCount(), hb.getHeartBeatsRemaining(), 'Check math limit '+limit+' - beatsCount '+hb.getHeartBeatsCount()+ ' = remaining '+ hb.getHeartBeatsRemaining());
		start();
	});
	
	$(hb).on($.Acheta.HeartBeater.EVENT_HEARTBEAT_LIMIT_REACHED, function(){
		ok(true, 'HeartBeatLimitReached Event triggered');
		equal(hb.getHeartBeatsCount() + hb.getHeartBeatsRemaining(), limit, 'Check count + remaining = limit');
		equal(hb.getHeartBeatsRemaining(), 0, 'Zero beats remaining');
		start();
	});
	
	hb.start();
	
});

asyncTest('Test limited heart beats with user activity', function(){
	var limit = 10;
	
	var mockDocument = {
			focus: true,
			hasFocus: function(){return this.focus}
		};
	
	var checker = $.createUserActivityChecker(10, mockDocument);
	// Increase number of assertions. User will become inactive after 5 beats.
	stop(5);
	
	var hb = $.createHeartBeater({
		heartBeatInterval: 20,
		checkUserActivity: true,
		checkUserActivityInterval: 10,
		limit: limit,
		autoStart: false
	}, checker);
	
	$(hb).on($.Acheta.HeartBeater.EVENT_HEARTBEAT, function(e){
		ok(true, 'Beat '+hb.getHeartBeatsCount()+' triggered');
		start();
		if(hb.getHeartBeatsCount() == 5) {
			mockDocument.focus = false;
		}
	});
	
	hb.start();
	
	setTimeout(function(){
		equal(hb.getHeartBeatsCount(), 5);
		equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_INACTIVE);
		hb.pause();
		equal(hb.getStatus(), $.Acheta.HeartBeater.STATUS_PAUSED);
		start();
	}, 200);
	
});

