'use strict'

var EventEmitter = require('events').EventEmitter;
var util = require('util');


var MessageQueue = function(iv){
	this.iv = iv || 1000;

	this.inProgress = false;
	this.queue_arr = [];

  	EventEmitter.call( this );

  	return this;
}

util.inherits( MessageQueue, EventEmitter );

/**
@param {String}	message
*/
MessageQueue.prototype.add = function(message){
	var self = this;

	//Convert Arguments Object into Array
	var args = Array.prototype.slice.call(arguments);

	args.forEach(function(arg){
		self.queue_arr.push( arg );
	});
	
	if( !this.inProgress ) this._processQueue();
}


MessageQueue.prototype._processQueue = function(){
	var self = this;

	this.inProgress = true;

	if( this.queue_arr.length ){
		setTimeout(function(){
			var m = self.queue_arr.shift();
			self.emit('message', m);
			self._processQueue();	
		}, self.iv);
	}
	else this.inProgress = false;
}

module.exports = MessageQueue;
