'use strict'

var net = require('net');

var UserTable = require('./db/UserTable');
var DataTypeHelper = require('./util/DatatypeHelper');
var ContactTable = require('./db/ContactTable')

var SocketRequest = function(){
	this.userTable = UserTable.create();
	this.contactTable = ContactTable.create();
	this.dataTypeHelper = new DataTypeHelper();
};


/**
@param {Object}		Request
@param {Function}	cb
@param {Object}		cb.err
@param {Object}		cb.result
@param {Number|Null}cb.result.userID
@param {Array}		cb.result.contactlist
*/
SocketRequest.prototype.loginHandler = function(request, cb){
	if( !this.dataTypeHelper.propertiesExist( request, {username:'string', password:'string'}) ) return cb(new Error('Invalid Body'));

	var self = this;

	var result = {};
	result.userID = null;
	result.contactlist = [];

	this._checkAuth(request.username,  request.password, function(err, userID){
		if( err ) return cb(err, null);

		if( !userID ) cb(null, result);
		else{

			result.userID = userID;

			self.contactTable.fetchContactsDataByUserID( userID, function(err, contacts){
				if( err ) return cb(err);
				result.contactlist = contacts;

				cb( null, result );
			});
		}
	});
	
};

/**
@param {Object}		Request
@param {Function}	cb
@param {Object}		cb.err
*/
SocketRequest.prototype.messageHandler = function(request, socket, cb){
	var e = new Error('Invalid Body');
	if( !this.dataTypeHelper.propertiesExist( request, {message:'string'}) ) return cb(e);
	
	if( !(socket instanceof net.Socket) )return cb(e);

	var isValid = true;
	
	var b = true;
	if( request.hasOwnProperty('touser')){
		
		if( typeof request.touser == 'number' ){}
		else if( Array.isArray( request.touser ) ){
					
			request.touser.every(function(user){
				 b =  ( typeof user != 'number' ) ? false : true;
				return b;
			});

		}
		else b = false;
	}

	if(!b) return cb( e );
	cb(null);

};

/**
@param {Object}		Request
@param {Function}	cb
@param {Object}		cb.err
@param {Object}		cb.result
*/
SocketRequest.prototype.userNewHandler = function(request, cb){
	var e = new Error('Invalid Body');
	if( !this.dataTypeHelper.propertiesExist(request, {username: 'string', password: 'string'}) ) return cb(e);

	this.userTable.insertData( request.username, request.password, function(err, result){
		if( err ) return cb(err);
		cb(null, result);	
	});
	
};

/**
@param {Object}		request
@param {Function}	cb
@param {Object}		cb.err
*/
SocketRequest.prototype.userEventHandler = function(request, cb){
	var e = new Error('Ivalid Body');
	if( !this.dataTypeHelper.propertiesExist( request, {status: 'string'} ) ) return cb(e);

	var stats_arr = ['writing', 'away', 'online'];
	if( stats_arr.indexOf( request.status ) == -1) return cb(e);

	cb(null);
};

/**
@param {Object}		request
@param {Function}	cb
@param {Object}		cb.err
*/
SocketRequest.prototype.contactSearchHandler = function(request, cb){
	var e = new Error('Ivalid Body');
	if( !this.dataTypeHelper.propertiesExist(request, {username: 'string'}) ) return cb(e);

	cb(null);
};


/**
@param {Object}		request
@param {Function}	cb
@param {Object}		cb.err
*/
SocketRequest.prototype.contactAddHandler = function(request, cb){
	var e = new Error('Invalid Body contactADd');
	if( !this.dataTypeHelper.propertiesExist(request, {id: 'number'}) ) return cb(e);

	cb(null);
};


/**
@param {Object}		request
@param {Function}	cb
@param {Object}		cb.err
*/
SocketRequest.prototype.contactDelHandler = function(request, cb){
	var e = new Error('Invalid Body');
	if( !this.dataTypeHelper.propertiesExist(request, {id: 'number'}) ) return cb(e);

	cb();
};


/**
@param {Function}	cb
@param {Object}		cb.err
@param {Number|Null}cb.userID		
*/
SocketRequest.prototype._checkAuth = function(username, password, cb){
	var e = new Error('Invalid Param');
	if( typeof username != 'string' ) return cb(e);
	if( typeof password != 'string' ) return cb(e);

	this.userTable.hasUserWithUsernameAndPassword(username, password, function(err, row){
		if( err ) return cb(err);
		if( !row ) return cb(null, null);

		cb(null, row.id);
	});

};


module.exports.create = function(){
	return new SocketRequest();
};