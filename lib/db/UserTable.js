'use strict'

var AbstractBaseTable = require('./AbstractBaseTable');
var util = require('util');
var crypto = require('crypto');
var config = require('config');
var DateHelper = require('../util/DateHelper'); 

var instance = null;
var tablename = 'cc_user';
var defaultMinUNLength = 4;
var defaultMaxUNLength = 12;
var defaultMinPWLength = 4;
var defaultMaxPWLength = 10;

var Table = function( conn ){

	if( typeof conn == 'undefined' ){
		console.log('Error Init User Table');
	}

	AbstractBaseTable.apply( this, [tablename, conn] );
	this.connection = conn;

	this.dateHelper = new DateHelper();
}

util.inherits(Table, AbstractBaseTable);

/**
*@param {Function} cb(err,rows)
*/
Table.prototype.fetchAllData = function( cb ){
	if( !this._checkCallback(cb) ) return;

	this.connection.query('SELECT * FROM ' + tablename + ' WHERE active=? AND hidden=?', [1,0], function(err, rows){
		if( err ) return cb(err, null);
		cb( null, rows );
	});
}

/**
@param {Function} 	cb
@param {Object}		cb.err
@param {Array}		cb.result
*/
Table.prototype.fetchDataByID = function(id, cb){
	if( typeof id != 'number' ) return cb(new Error('Invalid Data'), null);
	if( !this._checkCallback(cb) ) return;

	this.connection.query('SELECT * FROM ' + tablename + ' WHERE id=? AND active=? AND hidden=?', [id, 1, 0 ], function(err, rows){
		if( err ) return cb(err, null);
		cb(null, rows);
	});
};

/**
@param {String} 	username
@param {Function} 	cb
@param {Object}		cb.err
@param {Array}		cb.result
*/
Table.prototype.fetchDataByUsername = function(username, cb){
	if( typeof username != 'string' ) return cb(new Error('Invalid Data'), null);
	if( username.length < 3 ) return cb(new Error('Invalid Data'), null);

	var sql = this.connection.query("SELECT * FROM " + tablename + " WHERE username LIKE '%" +  username + "%'", function(err, result){
		if( err ) return cb(err, null);
		cb( null, result );
	});

}

/**
@param {String}		username
@param {String} 	password
@param {Function}	cb
@param {Object}		cb.err
@param {Object|Null}cb.row
*/
Table.prototype.hasUserWithUsernameAndPassword = function(username, password, cb){
	var self = this;

	self._validateAuth( username, password, function(err){

		self._hash( password, function(err, hash){
			if( err ) return cb(err);

			self.connection.query('SELECT * FROM ' + tablename + ' WHERE username=? AND password=?', [username, hash], function(err, result){
				if( err ) return cb(err, null);
				
				if( result && result.length == 1 ) cb(null, result[0]);
				else cb(null, null);
			});
		});

	});

};

/**
@param {String} 	username
@patam {String} 	password
@param {Function} 	cb
@param {Object}		cb.err
@param {Object|Null}cb.result
*/
Table.prototype.insertData = function(username, password, cb){
	var self = this;

	//Check if username already in use...
	self.fetchDataByUsername(username, function(err, result){
		if( err ) return cb( err );

		if(result && result.length > 0) return cb(null, null);

		self._validateAuth( username, password, function(err){
			if( err ) return cb(err);

			self._hash( password, function(err, hash){
				if( err ) return cb(err);

				var data = {username: username, password: hash, timestamp: self.dateHelper.currentTimestamp() };

				self.connection.query('INSERT INTO ' + tablename + ' SET ?', data, function(err, result){
					if( err ) return cb(err);
					cb(null, result);
				});
			});

		});

	});
};

/**
@param {String} 	phrase
@param {Function}	cb
@param {Object}		cb.err
@param {String}		cb.hash
*/
Table.prototype._hash = function( phrase, cb ){
	if( typeof phrase != 'string' ) return cb( new Error('Invalid Param') );

	var shasum = crypto.createHash('sha1');
	var hash = shasum.update( phrase ).digest('hex');
	cb(null, hash);
};

/**
@param {String} 	username
@param {String} 	password
@param {Function}	cb
@param {Object}		cb.err
*/
Table.prototype._validateAuth = function(username, password, cb){

	var minUsernameLength = config.app.auth.minUsernameLength || defaultMinUNLength;
	var maxUsernameLength = config.app.auth.maxUsernameLength || defaultMaxUNLength;
	var minPasswordLength = config.app.auth.minPasswordLength || defaultMinPWLength;
	var maxPasswordLength = config.app.auth.maxPasswordLength || defaultMaxPWLength;

	if( typeof username != 'string' || typeof password != 'string' ) return cb(new Error('Invalid Data'));
	
	if( username.length < minUsernameLength || username.length > maxUsernameLength ||
	    password.length < minPasswordLength || password.length > maxPasswordLength){
	    return cb( new Error('Invalid Data'));
	}

	return cb(null);

};

Table.prototype._checkCallback = function(cb){
	if( typeof cb != 'function' )return false;
	return true;
}


module.exports.create = function( conn  ){
	if( instance ) return instance;
	instance = new Table( conn );
	return instance;
} 