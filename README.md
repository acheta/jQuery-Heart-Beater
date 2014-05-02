# jQuery Heart Beater & User Activity Checker
Heart Beater & User Activity Checker are jQuery plugins to help you perform some regularly occuring stuff. Ie. regularly checking server for updates.

## Heart Beater
Triggers "heartBeat" event on given interval. It supports few config options to make your life easier.

### Factory function $.createHeartBeater([options[, userActivityChecker]]);
For quick and easy creation of the Heart Beater object you can use the factory function which will take care of any missing parameters. Factory accepts two optional parameters:
* **options** object to override defaults
* **userActivityChecker** an instance of $.Acheta.UserActivityChecker. See User Activity Checker below for details.

#### Example use
Using smart factory function to instantiate object with minimum effort.
```JavaScript
// Create HeartBeater object.
var hb = $.createHeartBeater();

// Listen for the heartBeat event to perform your stuff.
$(hb).on('heartBeat', function(){
  // Check something with server and update it on page.
  $('body').append('heartBeat triggered ');
});
```

```JavaScript
// Create HeartBeater object with custom options.
var hb = $.createHeartBeater({
             heartBeatInterval: 1000,
             checkUserActivity: true,
             checkUserActivityInterval: 200,
             limit: 153,
             autoStart: false
         });

// Listen for the heartBeat event to perform your stuff.
$(hb).on('heartBeat', function(){ doStuff(); });
```

### Heart Beater Options
You can pass custom options object to the factory.
```JavaScript
// Defaults.
{
  heartBeatInterval: 2000, // Interval of beating in milliseconds.
  checkUserActivity: false,  // Whether to be dependent on user's activity/focus in the document.
  checkUserActivityInterval: 500, // How often to evaluate user's activity.
  limit: 0, // Set number of beats to be performed.
  autoStart: true // Start beating immediately after object was instantiated. 
};
```
#### Option: heartBeatInterval
Interval of beating in milliseconds.
**Default:** 2000 (2 seconds)
**Type:** integer > 0

#### Option: checkUserActivity
Whether to be dependent on user's activity/focus in the document. Set it to true if you want to pause heart beating when user doesn't work with the page. This option is handy when you don't want to waste server resources when user is not present.
**Default:** false
**Type:** boolean

#### Option: checkUserActivityInterval
When checkUserActivity option is true this determines how often to evaluate user's activity. Interval of checking in milliseconds.
**Default:** 500 (0.5 second)
**Type:** integer > 0

#### Option: limit
Define limited number of beats to be performed. Beating is stopped when limit is reached. Set 0 for no limit.
**Default:** 0 (no limit applied)
**Type:** integer >= 0

#### Option: autoStart
By default beating starts immediately when hear beater object is instantiated. In some cases you want to have this under control. Then set autoStart to false and when you want start beating call start() method.
**Default:** true
**Type:** boolean

### Heart Beater Methods
#### Method: start()
Start heart beating. Triggers 'heartBeatStarted' event.

#### Method: pause()
Pause heart beating. Triggers 'heartBeatPaused' event.

#### Method: getStatus()
Returns current status. 
```JavaScript
// Status constants.
$.Acheta.HeartBeater.STATUS_RUNNING       = 'running';
$.Acheta.HeartBeater.STATUS_PAUSED        = 'paused';
$.Acheta.HeartBeater.STATUS_INACTIVE      = 'inactive';
$.Acheta.HeartBeater.STATUS_LIMIT_REACHED = 'limit_reached';
```

#### Method: setLimit(limit)
Set new limit of beats to be performed. Set to 0 to disable limit.

#### Method: getHeartBeatsCount()
Get number of beats performed.

#### Method: getHeartBeatsRemaining()
Get number of beats remaining from the limit. Returns false when limit not applied.

### Heart Beater Events
You can listen for the following events triggered by heart beater object.
```JavaScript
// Event constants.
// When regular beat is performed.
$.Acheta.HeartBeater.EVENT_HEARTBEAT = 'heartBeat';

// When beating started.
$.Acheta.HeartBeater.EVENT_HEARTBEAT_STARTED = 'heartBeatStarted';

// When beating was paused.
$.Acheta.HeartBeater.EVENT_HEARTBEAT_PAUSED = 'heartBeatPaused';

// When limit of beats has been reached.
$.Acheta.HeartBeater.EVENT_HEARTBEAT_LIMIT_REACHED = 'heartBeatLimitReached';
```
Also it is passing events from the User Activity Checker.
```JavaScript
// When user became active.
$.Acheta.UserActivityChecker.EVENT_USER_BECAME_ACTIVE   = 'userBecameActive';

// When user became inactive.
$.Acheta.UserActivityChecker.EVENT_USER_BECAME_INACTIVE = 'userBecameInactive';
```

## User Activity Checker
User Activity Checker is helper used by heart beater to detect user's activity in the document. It can be used independently or it can be replaced by your own implementation. It's main purpose is to regularly check if document has focus and based on that trigger and event when user became active or inactive.

### Factory function $.createUserActivityChecker(checkInterval[, document])
For quick and easy creation of the UserActivityChecker object you can use this factory method with two arguments:
* **checkInterval** in milliseconds, integer greater than zero
* **document** object, if ommited the factory will pass the global document object. You can substitute with your own implementation of document to determine user activity. The document object must have hasFocus() function returning true/false.

#### Example use
Using smart factory function to instantiate object with minimum effort.
```JavaScript
// Create UserActivityChecker object which will be monitoring the activity every 200 milliseconds.
var checker = $.createUserActivityChecker(200);

// Listen for the events.
$(checker).on('userBecameActive', function(){
  alert('User started working with the document.');
});

$(checker).on('userBecameInactive', function(){
  alert('User stopped working with the document.');
});

// Don't forget to start the checker.
checker.startChecking();
```
### User Activity Checker Methods
#### Method: setInterval()
Set/Change interval of checking in milliseconds. Chainable.

#### Method: startChecking()
Start monitoring the user's activity. Chainable.

#### Method: stopChecking()
Start monitoring the user's activity. Chainable.

#### Method: isChecking()
Returns true when checking. False when stopped.

#### Method: isUserActive()
Instant re-check of user's activity. Returns true/false.

### User Activity Checker Events
You can listen for the following events triggered by the checker object.
```JavaScript
// When user became active.
$.Acheta.UserActivityChecker.EVENT_USER_BECAME_ACTIVE   = 'userBecameActive';

// When user became inactive.
$.Acheta.UserActivityChecker.EVENT_USER_BECAME_INACTIVE = 'userBecameInactive';
```