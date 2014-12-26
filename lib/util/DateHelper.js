'use strict'


var DateHelper = function(){

}


/**
@param {Number}	seconds
@param {Number}	minute
@param {Number}	hour
@param {Number}	day
@param {Number}	month
@param {Number}	year
*/
DateHelper.prototype.convertDateToTimestamp = function(seconds, minute, hour, day, month, year){
	seconds = (seconds < 10) ? ("0" + seconds ) : seconds;
	minute = (minute < 10) ? ("0" + minute) : minute;
	hour = (hour < 10) ? ("0" + hour) : hour;

	if(seconds > 59 || minute > 59 || hour > 23 || day > 31  || month > 12) return null;

	var dateStr = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + seconds;
	
	return ((new Date(dateStr).getTime()) / 1000); 
}

/**
@param {Boolean} [inMilliseconds]
@returns {Number} timestmap
*/
DateHelper.prototype.currentTimestamp = function(inMilliseconds){
	if( typeof inMilliseconds == 'undefined') inMilliseconds = false;

	var ts = Date.now();
	if( !inMilliseconds ) ts = Math.floor(ts / 1000);
	return ts;
}

module.exports = DateHelper;
