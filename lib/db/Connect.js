'use strict'

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var mysql = require('mysql');

var instance = null;

function MySQLConnect(){ 
	this.connection = null;

  	EventEmitter.call( this );

  	return this;
};

util.inherits(MySQLConnect, EventEmitter);

/**
@param {Object}	options
@param {String} [options.host]
@param {String} options.database
@param {String} [options.user]
@param {String} [options.password]
*/
MySQLConnect.prototype.connect = function(opts){

	if( this.connection ) return self.emit('success');

	var self  = this;

	this.host 		= opts.host || 'localhost';
	this.database 	= opts.database;
	this.user		= opts.user || 'root';
	this.password 	= opts.password || '';

	if( !this.database ) return self.emit('error', 'invalid configuration');

	if( this.connection == null ){
		this.connection = mysql.createConnection({	host: this.host, 
													database: this.database, 
													user: this.user, 
													password: this.password});
		this.connection.connect(function(err){
			if(err){
				console.log('error connecting database ' + err.stack);
				self.connection = null;
				self.emit('error', err );
				return;	
			} 
			console.log('success connecting database');
			self.emit('success');
		});
	}
	else{
		self.emit('already connected');
	}
}

MySQLConnect.prototype.disconnect = function(){
	if( this.connection ){
		this.connection.end();
	}
};

MySQLConnect.prototype.getConnection = function(){
	return this.connection;
};

module.exports.getInstance = function(){
	if( instance ) return instance;
	instance =  new MySQLConnect();
	return instance;
}


