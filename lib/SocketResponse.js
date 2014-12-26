'use strict'

var UserTable = require('./db/UserTable');
var MessageTable = require('./db/MessageTable');
var GroupTable = require('./db/GroupTable');
var ContactTable = require('./db/ContactTable');
var DateHelper = require('./util/DateHelper');

var SocketResponse = function(){

	this.userTable = UserTable.create();
	this.messageTable = MessageTable.create();
	this.groupTable = GroupTable.create();
	this.contactTable = ContactTable.create();

	this.dateHelper = new DateHelper();
};

/**
@param {Function}	cb
@param {Object}		cb.responseModel
*/
SocketResponse.prototype.connect = function(cb){
	var obj = {};
	obj.cmd = 'connect';
	obj.status = 'success';
	
	cb(obj);
};


/**
@param {Boolean}	userIsLoggedIn 
@param {Function}	cb
@param {Object}		cb.responseModel
*/
SocketResponse.prototype.login = function(userIsLoggedIn, cb){

	var obj = {};
	obj.cmd = 'login';
	obj.status = (userIsLoggedIn) ? 'success' : 'error';

	cb(obj);

};


/**
@param {Object}		options
@param {Number}		options.userID
@param {String}		options.message
@param {Number|Null}[options.timestmap]
@param {Function}	cb
@param {Object} 	cb.err
@param {Object}		cb.responseModel
*/
SocketResponse.prototype.message = function(options, cb){
	if( typeof options != 'object' ) return cb(new Error('Invalid Param'));

	var props_arr = ['fromuser', 'message'];

	var b = true;
	Object.keys(options).every(function(key){
		if( props_arr.indexOf(key) == -1 ){
			b = false;
		}
		return b;
	});

	if( !options.hasOwnProperty('timestamp') || options.timestamp == null ){		
		options.timestamp = this.dateHelper.currentTimestamp();
	}

	if( !b ) return cb(new Error('Invalid'));

	var obj = {};
	obj.cmd = "message";
	obj.fromuser = options.fromuser;
	obj.message = options.message;
	obj.timestamp =  options.timestamp;

	//this._sendTo(request, request.touser);
	
	cb(obj)
};


/**
@param {Number}		receiverID
@param {Function}	cb
@param {Object}		cb.err
@param {Object}		cb.model
*/
SocketResponse.prototype.messages = function(receiverID, cb){
	//if( !Array.isArray( collection ) ) return cb(new Error('Invalid Param'));

	var self = this;

	var model = {};
	model.cmd = 'messages';
	model.messagelist = [];

	self.messageTable.fetchDataOfNotReceivedMessagesByReceiverID( receiverID, function(err, result){
		if( err ) return console.log(err);

		if( result && result.length ){
			var arr = [];

			var iterate = function(idx){
				var row = result[idx];

				var item = {};
				item.fromuser = row.user_id;
				item.message = row.message;
				item.timestamp = row.timestamp;
				item.messageid = row.id;

				model.messagelist.push(item);

				idx = idx + 1;

				if( result.length != idx ) iterate(idx);
				else cb( null,  model );
			};

			iterate(0);
			
		}
		else{
			cb(null, model);
		}
	});

};

/**
@param {Boolean}	success
@param {Function}	cb
@param {Object}		cb.responseModel
*/
SocketResponse.prototype.messageSendStatus = function(success, cb){
		
	var obj = {};
	obj.cmd = "message-send";
	obj.status = (success) ? 'success' : 'error';

	cb(obj);
};

/**
@param {String}		username
@param {Function}	cb
@param {Object}		cb.responseModel
*/
SocketResponse.prototype.contactSearch = function(username, cb){
	var self = this;

	var model = {};
	model.cmd = 'contact-search';
	model.contactlist = [];

	self.userTable.fetchDataByUsername(username, function(err, result){
		if( err ) return console.log(err);
		
		if( result && result.length ){
			result.forEach(function(row){

				var item = {};
				item.username = row.username;
				item.id = row.id;

				model.contactlist.push(item);	
			});
		}

		cb( null, model );
	});

};

/**
@param {String}		username
@param {Function}	cb
@param {Object}		cb.err
@param {Object}		cb.responseModel
*/
SocketResponse.prototype.contactAdd = function(userID, contactID, cb){
	if( typeof userID != 'number' ) return cb(new Error('Invalid Data'));
	if( typeof contactID != 'number' ) return cb(new Error('Invalid Data'));

	var model = {};
	model.cmd = 'contact-add';
	model.status = 'error';

	this.contactTable.insertData( userID, contactID, function(err, result){
		if( err ) return cb(err);
		
		if( result ){
			model.status = 'success';
			cb(null, model);
		}
		else{
			cb(null, model);
		}
	});

};

/**
@param {Number}		userID
@param {Function}	cb
@param {Object}		cb.err
@param {Object}		cb.responseModel
*/
SocketResponse.prototype.contactAddInfo = function(userID, cb){
	if( typeof userID != 'number' ) return cb(new Error('Invalid Data'));

	var model = {};
	model.cmd = 'contact-add-info';
	model.userid = userID;

	cb( null, model );
};


/**
@param {Number}		userID
@param {Number}		contactID
@param {Function}	cb
@param {Object|Null}cb.err
@param {Object}		cb.responseModel
*/
SocketResponse.prototype.contactDel = function(userID, contactID, cb){
	if( typeof userID != 'number' ) return cb(new Error('Invalid Data'));
	if( typeof contactID != 'number' ) return cb(new Error('Invalid Data'));

	var model = {};
	model.cmd = 'contact-del';
	model.status = 'error';

	this.contactTable.deleteData( userID, contactID, function(err, result){
		if( err) return cb(err);

		if( result ){
			if( result.affectedRows == 1 && result.changedRows == 1 ){
				model.status = 'success';
			}
		}
		
		cb(null, model);		
	});

};

/**
@param {Number}		userID
@param {Function}	cb
@param {Object}		cb.err
@param {Object}		cb.responseModel
*/
SocketResponse.prototype.contactDelInfo = function(userID, cb){
	if( typeof userID != 'number' ) return cb(new Error('Invalid Data'));

	var model = {};
	model.cmd = 'contact-del-info';
	model.userid = userID;

	cb(null, model);
};

/**
@param {Number}		userID
@param {String}		status
@param {Function}	cb
@param {Object}		cb.err
@param {Object|Null}cb.responseModel
*/
SocketResponse.prototype.userEvent = function(userID, status, cb){
	if( typeof status != 'string' ) return cb(new Error('Invalid Param'));
	if( typeof status != 'string' ) return cb(new Error('Invalid Param'));

	var valid_stats = ['online', 'offline', 'writing', 'away'];
	if( valid_stats.indexOf(status) == -1 ) return cb(new Error('Invalid'), null);

	var obj = {};
	obj.cmd = 'user-event';
	obj.user = userID;
	obj.status = status;
	
	//this._sendTo(obj, userID);

	cb(null, obj);
};


/**
@param {Number}		userID
@param {Function}	cb
@param {Object|Null}cb.err
@param {Object}		cb.model
*/
SocketResponse.prototype.usersUpdate = function(userID, cb){
	if( typeof userID != 'number' ) return cb(new Error('Invalid Param'));

	var self = this;

	var mod = {};
	mod.cmd = 'users-update';
	mod.userlist = [];
	mod.grouplist = [];

	this._getUsersList(userID, function(err, userlist){
		if( err ) return cb(err);

		mod.userlist = userlist;

		self._getGroupsList(userID, function(err, grouplist){
			if( err ) return cb(err);

			mod.grouplist = grouplist;

			cb(null, mod);
		});

	});
};

/**
@param {Null|Number}id
@param {Function}	cb
@param {Object}		cb.err
@param {Object}		cb.model
*/
SocketResponse.prototype.userNew = function(userID, cb){
	if( typeof userID != 'number' && userID != null ) return cb( new Error('Invalid Param') );

	var mod = {};
	mod.cmd = 'user-new';
	mod.id = (!userID) ? null : userID;
	mod.status = (!userID) ? 'error' : 'success';
	
	cb( null, mod );	
};

/**
@param {Function} 	cb
@param {Object}		cb.err
@param {Array}		cb.userlist
*/
SocketResponse.prototype._getUsersList = function(userID, cb){
	var self = this;

	var userlist_arr = [];

	this.contactTable.fetchContactsDataByUserID( userID, function(err, result){
		if( err ) return cb(err);
		if( result && result.length ){

			var iterate = function(idx){
				var userID = result[idx];

				self.userTable.fetchDataByID( userID, function(err, userRow){
					if( err ) return cb(err, null);

					if( userRow.length == 1 ){
						var row = userRow[0];
						var userModel = {};
						userModel.id = row.id;
						userModel.username = row.username;
						userlist_arr.push( userModel );
					}


					idx = idx + 1;
					if( idx != result.length ) iterate(idx);
					else cb(null, userlist_arr );
				});

			};

			iterate(0);
		}
		else cb(null, userlist_arr );
	});
};

/**
@param {Function}	cb
@param {Object}		cb.err
@param {Array}		cb.grouplist
*/
SocketResponse.prototype._getGroupsList = function(userID, cb){
	var self = this;

	var grouplist_arr = [];

	var processedUserIDs_arr = [];

	this.groupTable.fetchDataByUserID( userID, function(err, result){
		if( err ) return cb( err, null );
		if( !result || result.length == 0) return cb(null, []);

		var iterate = function(idx){

			var row = result[idx];

			var userlist_str = row.userlist;
			userlist_str = userlist_str.trim();
			
			var groupModel = {};
			groupModel.groupname = row.name;
			groupModel.id = row.id;
			groupModel.users = [];

			if( userlist_str ){
				var userlist_arr = userlist_str.split(',');
				userlist_arr = userlist_arr.map(function(item){return parseInt(item)});

				var users_arr = [];

				var iterate_inner = function(idx_inner){

					var userID = userlist_arr[idx_inner];

					var checkForIteration = function(idx_inner){
						idx_inner = idx_inner + 1;
						if( idx_inner != userlist_arr.length ) iterate_inner(idx_inner);
						else{
							grouplist_arr.push( groupModel );
							idx = idx + 1;
							if( idx != result.length )iterate(idx);
							else{
								cb(null, grouplist_arr );
							}
						}
					}

					if( !processedUserIDs_arr[userID.toString()] ){
						self.userTable.fetchDataByID(userID, function(err, resultUsers){
							if( err ){
								cb(err, null);
								return;
							}

							if( resultUsers.length ){
								var row = resultUsers[0];									
								var userModel = {};
								userModel.id = row.id;
								userModel.username = row.username;
								
								processedUserIDs_arr[userID.toString()] =  userModel;
								groupModel.users.push( userModel );
							}

							checkForIteration(idx_inner);
						});
					}
					else{
						var obj =  processedUserIDs_arr[userID.toString()];
						if( obj ){
							var clonedObj = JSON.parse( JSON.stringify(obj) );
							groupModel.users.push( clonedObj );
						}
						checkForIteration(idx_inner);
					}
				};

				iterate_inner(0);
			}
		};

		iterate(0);
	});

};

module.exports.create = function(){
	return new SocketResponse();
};
