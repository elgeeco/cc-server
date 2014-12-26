'use strict'

/*
Client->Server
-----------------
[x]  {cmd:"connect"}																	#check connection to server at client start
[x]  {cmd:"login",username:"<username>",password:"<password>"}
[x]  {cmd:"message",touser:"<user-id|user-ids>",message:"<message>"}					#single user id number or array of user ids
[ ]  {cmd:"file",name:"<filename>",data:<bytes>}										#data is the raw bytearray of file
[x]  {cmd:"user-new",username:"<username>", password:"<password>"}
[ ]  {cmd:"user-edit",username:"<username>", password:"<password>"}
[ ]  {cmd:"user-del"}
[x]  {cmd:"user-event",status:"<status>"}												#status:writing|away|online
[x]  {cmd:"contact-add",id="<userid>"}
[x]  {cmd:"contact-search",username="<username>"}
[x]  {cmd:"contact-del", id="<userid>"}
[ ]  {cmd:"group-new",name:"<groupname>",users:"<userids>"}
[ ]  {cmd:"group-edit",id="<groupid>",users:"<userids>"}
[ ]  {cmd:"group-del",id="<groupid>"}
[x]  {cmd:"logout"}



Server->Client
----------------
[x]  {cmd:"connect",status:"<status>"}													#status:success|error
[ ]  {cmd:"disconnect"}
[x]  {cmd:"login",status:"<status>"}													#status:success|error
[x]  {cmd:"message",fromuser:"<user-id>",message:"<message>"}							#message broadcast
[x]  {cmd:"messages", messagelist:"<messages>"}											#messages broadcast, messagelist: [{fromuser:23, message:"hi", timestamp:123213443, messageid:11},...]
[x]  {cmd:"message-send",status:"<status>"}												#message response to sender with status:success|error					
[x]  {cmd:"users-update",userlist:"<userdata>",grouplist:"<groupdata>"}					#userlist is array with user objects: [{username:"hans", id:"435"}, {username:"egon", id="54"},...]
																						#grouplist is array with group objects: [{groupname:"programmers", id="23", users:[32,435,123,5]},...]
[x]  {cmd:"user-event",id:"<userid>":status:"<status>"}									#status:online|offline|writing
[x]  {cmd:"user-new",id="<userid>",status:"<status>"}									#status:success|error
[ ]  {cmd:"user-edit",id="<userid>",status:"<status>"}									#status:success|error
[ ]  {cmd:"user-del",id="<userid>",status:"<status>"}									#status:success|error
[ ]  {cmd:"group-new",id="<groupid>",status:"<status>"}									#status:success|error
[ ]  {cmd:"group-edit",id="<groupid>",status:"<status>"}								#status:success|error
[ ]  {cmd:"group-del",id="<groupid>",status":"<status>"}								#status:success|error					
[x]  {cmd:"contact-search",contactlist:"<collection>"}									#collection:[{username:"hans", id:10},...]
[x]  {cmd:"contact-add",status:"<status>"}												#status:success|error
[x]  {cmd:"contact-add-info",userid:"<id>"}												#info when user was added to contact list
[x]  {cmd:"contact-del",status:"<status>"}												#status:success|error
[x]  {cmd:"contact-del-info",userid:"<id>"}												#info when user was deleted from contact list
[x]  {cmd:"logout",status:"<status>"}													#status:success|error
*/

var net = require('net');
var log = require('./util/Logger');
var UserTable = require('./db/UserTable');
var MessageTable = require('./db/MessageTable');
var GroupTable = require('./db/GroupTable');
var ContactTable = require('./db/ContactTable');

var path = require('path');

var sockets_arr = [];

function SocketController(){

	this.userTable = UserTable.create();
	this.messageTable = MessageTable.create();
	this.groupTable = GroupTable.create();
	this.contactTable = ContactTable.create();

	this.socketRequest = require('./SocketRequest').create();
	this.socketResponse = require('./SocketResponse').create();
};

SocketController.prototype.process = function( socket ){
	var self = this;

	socket._id = socket.remoteAddress + ':' + socket.remotePort;
	socket._userID = null;

	//sockets_arr.push( socket );

	var tmp_str = '';

	var json_obj = {};

	socket.on('data', function(data){
		tmp_str  += data.toString();

		//var lastChar = tmp_str.charAt(tmp_str.length-1);

		//URL: http://stackoverflow.com/a/3884711
		var lastChar = tmp_str.slice(-1);

		if( lastChar == '\0' ){
			//Removing NULL Byte & converting to JSON
			var json_obj = JSON.parse( tmp_str.slice(0, -1) );
			console.log('REQUEST DATA');
			console.log(JSON.stringify(json_obj));

			if( json_obj.hasOwnProperty('cmd') ){
				self._parseRequestData( json_obj, socket );
			}
			tmp_str = '';
		}
		
	});


	socket.on('end', function(){
		console.log('SOCKET END');
		//log(socket._clientname + ' disconnecting from server', 'cyan' );
		//self._broadcast( 'status:off;user:' + socket._clientname );
		//self.sockets_arr.splice( self.sockets_arr.indexOf(socket), 1 );
		if( socket.hasOwnProperty('_userID') ) delete socket._userID;
		if( socket.hasOwnProperty('_id') ) delete socket._id;  

		var openIDs = [];

		//for( var i=sockets_arr.length - 1; i>=0; i-- ){
		sockets_arr.forEach(function(socket_item, key){	
			//var socket_item = sockets_arr[i];
			if( socket_item == socket ){
				sockets_arr[ key.toString() ] = null;
				delete sockets_arr[ key.toString() ];
				//sockets_arr.splice( i, 1 );
				//return;
			}else{
				openIDs.push( socket_item._userID );
			}
		});
		console.log("OPEN SOCKET IDs: " + openIDs);
	});

	socket.on('close', function(){
		console.log("SOCKET CLOSED");
		//log('Socket now closed for ' + socket._id, 'red');
	});

	socket.on('error', function(){
		console.log("SOCKET ERROR");
		//log("Socket error", 'red');
	});

};


SocketController.prototype._parseRequestData = function(request, socket){

	switch( request.cmd ){
		case 'connect':
			this._doConnect( request, socket );
			break;

		case 'login':
			this._doLogin( request, socket);
			break;

		case 'message':
			this._doMessage( request, socket);
			break;

		case 'logout':
			this._doLogout( request, socket);
			break;

		case 'user-new':
			this._doUserNew( request, socket );
			break;

		case 'user-event':
			this._doUserEvent( request, socket );
			break;

		case 'contact-search':
			this._doContactSearch( request, socket );
			break;

		case 'contact-add':
			this._doContactAdd( request, socket );
			break;

		case 'contact-del':
			this._doContactDel( request, socket );
			break;

	}
};

SocketController.prototype._doConnect = function(request, socket){
	var self = this;

	this.socketResponse.connect(function(model){
		self._sendTo(model, socket, function( err, result ){
			if( err ) return console.log(err);
			//if( !success ) return console.log('error send');
		});
	});
};

SocketController.prototype._doLogin = function(request, socket){
	var self = this;

	this.socketRequest.loginHandler(request,  function(err, result){
		if( err ) return console.log(err);
		
		var success = true;

		if( !result.userID || isNaN(result.userID)) success = false;
		else{
			var userID = result.userID;

			sockets_arr[ result.userID.toString() ] = socket;
			socket._userID = result.userID;
			socket._contactlist = result.contactlist;
		}

		if( !success ) return;

		self.socketResponse.login(success, function(model){

			//Send Login status
			self._sendTo( model, socket);
			if( !success ) return;

			//Update Sender with userdata
			self.socketResponse.usersUpdate( userID, function(err, model){
				if( err ) return console.log(err);

				self._sendTo( model, userID, function(err, result){
					if( err ) return console.log(err);
				});
			});

			//Update Receivers with sender online status
			self.socketResponse.userEvent(userID, 'online', function(err, model){
				if( err ) return console.log(err);

				//self._broadcast( model, socket );
				self._sendTo( model, socket._contactlist);
			});

			//Send old Messages 
			self.socketResponse.messages(userID, function(err, model){
				if( err ) return console.log(err);
				if( model.messagelist.length ){
					self._sendTo( model, userID, function(err, result){
						if( err ) console.log(err);

						var messageIds = [];
						model.messagelist.forEach( function(item){
							messageIds.push( item.messageid );
						});

						self.messageTable.updateDataBySend( true, messageIds, function(err, results){
							if( err ) return console.log(err);
						});
					});
				}
			});
			

		});

	});
};

SocketController.prototype._doMessage = function(request, socket){
	var self = this;

	this.isAuthorized( socket, function( success ){
		if( !success ) return console.log('Not Authorized');

		self.socketRequest.messageHandler(request, socket, function(err){
			if( err ){
				self.socketResponse.messageSendStatus(false, function(model){
					self._sendTo( model, socket._userID, function( err, result ){
				  		if( err ) return console.log(err);
					}) 
				});
				return console.log(err);
			}

			var sendToUsers_arr = [];
			//Check if user is in contactlist
			if( Array.isArray( request.touser ) ){ 
				sendToUsers_arr = request.touser.filter( function(touserID){ return ( socket._contactlist.indexOf(touserID) >= 0 ) });
			}
			else{
				sendToUsers_arr.push(request.touser);
			}

			//Save Message
			self.messageTable.insertData( request.message, socket._userID, sendToUsers_arr, function(err, results){
				if( err ) return console.log(err);
				
				//Last inserted row ids
				var lastIDs_arr = [];
				if(Array.isArray(results)){
					results.forEach( function(result){
						lastIDs_arr.push( result.insertId );
					});
				}
				if( lastIDs_arr.length == 0 ) return;

				var opts = { fromuser: socket._userID, message: request.message };
				self.socketResponse.message(opts, function(model){

					//Send message to receivers
					//self._broadcast( model, socket, function(){
					self._sendTo( model, sendToUsers_arr, function( err, result ){
						if( err ) return console.log(err);

						//Mark messages that are send to online users
						if( result && result.receiver_ids.length ){

							self.messageTable.fetchDataByID( lastIDs_arr, function(err, rows){
								if( err )return console.log(err);
								//console.log(result);

								var updateIDs_arr = [];

								if( rows && rows.length ){
									rows.forEach(  function(row){
										if(result.receiver_ids.indexOf(row.receiver_id) >= 0 ){
											updateIDs_arr.push( row.id );
										}
									});	
								}

								if( updateIDs_arr.length ){
									self.messageTable.updateDataBySend(true, updateIDs_arr, function(err, result){
										if( err ) return console.log(err);
									});
								}
							});

							//Array difference function
							//URL: http://stackoverflow.com/a/4026828
							//var diffIDs_arr = lastIDs_arr.filter( function(id){ return (result.receiver_ids.indexOf(id) < 0) } );

						}
					});					
					
					self.socketResponse.messageSendStatus( true, function(model){
						self._sendTo( model, socket._userID, function(err, result ){
							if(err) return console.log(err);	
						});
					});
				});

			});

		});

	});
};

SocketController.prototype._doLogout = function(request, socket){
	var self = this;

	this.isAuthorized( socket, function(success){
		if( !success ) return console.log('Not Authorized');

		var userID = socket._userID;

		self.socketResponse.userEvent(userID, 'offline', function(err, model){
			if( err ){
				socket.end();
				return console.log(err);
			}

			//self._broadcast( model, socket, function(){
			self._sendTo(model, socket._contactlist, function(){
				socket.end();
			});

		});
		
	});
};

SocketController.prototype._doUserNew = function( request, socket ){
	var self = this;

	self.socketRequest.userNewHandler(request, function(err, result){
		if( err) return console.log(err);

		var userID = null;
		if( result && result.hasOwnProperty('insertId') && result.insertId ){
			userID = result.insertId;	
		}

		self.socketResponse.userNew( userID , function(err, model ){
			self._sendTo( model, socket);
		});

	});
};

SocketController.prototype._doUserEvent = function(request, socket){
	var self = this;

	this.isAuthorized( socket, function(success){
		if( !success ) return console.log('Not Authorized');

		self.socketRequest.userEventHandler(request, function(err){
			if( err ) return console.log(err);

			self.socketResponse.userEvent( socket._userID, request.status, function( err, model ){
				if( err ) return console.log(err);

				//self._broadcast( model, socket);
				self._sendTo(model, socket._contactlist);
			});

		});
	});
};

SocketController.prototype._doContactSearch = function( request, socket){
	var self = this;

	this.isAuthorized( socket, function(success){
		if( !success ) return console.log('Not Authorized');

		self.socketRequest.contactSearchHandler(request, function(err){
			if( err ) return console.log(err);

			self.socketResponse.contactSearch(request.username, function(err, model){
				if( err ) return console.log(err);

				self._sendTo( model, socket);
			});				

		});

	});
};


SocketController.prototype._doContactAdd = function( request, socket ){
	var self = this;

	this.isAuthorized(socket, function(success){
		if( !success ) return console.log('Not Authorized');

		self.socketRequest.contactAddHandler(request, function(err){
			if( err ) return console.log(err);

			self.socketResponse.contactAdd(socket._userID, request.id, function(err, model){
				if( err ) return console.log(err);

				if( model.status == 'error' ) return;

				self._sendTo( model, socket, function(err){
					if( err ) return console.log(err);

					self.socketResponse.usersUpdate( socket._userID, function(err, model){
						if( err ) return console.log(err);

						self._sendTo( model, socket);								
					});

					self.socketResponse.contactAddInfo(socket._userID, function(err, model){
						if( err ) return console.log(err);

						self._sendTo(model, request.id);
					});

					self._updateContactlist(socket);

				});
			});

		});			
	});
};

SocketController.prototype._doContactDel = function( request, socket ){
	var self = this;

	this.isAuthorized(socket, function(success){
		if( !success ) return console.log('Not Authorized');

		self.socketRequest.contactDelHandler(request, function(err){
			if( err ) return console.log(err);

			//Delete Contact
			self.socketResponse.contactDel(socket._userID, request.id, function(err, model){
				if( err ) return console.log(err);

				//Send delete confirmation to sender
				self._sendTo( model, socket, function(err){
					if( err ) return console.log(err);
					
					if( model.status == 'error' ) return;

					//Update sender contacts
					self.socketResponse.usersUpdate( socket._userID, function(err, model){
						if( err ) return console.log(err);

						self._sendTo( model, socket);								
					});

					//Send delete confirmation to removed user
					self.socketResponse.contactDelInfo( socket._userID, function(err, model){
						if( err ) return console.log(err);
						
						self._sendTo( model, request.id);		
					});

					self._updateContactlist(socket);

				});

			});

		});
	});
};

/**
@param {Object} 				json_data
@param {Number|Array|Socket}	userID
@param {Function}				[cb]
@param {Object}					cb.err
@param {Object}					cb.result
@param {Array}					cb.result.receiver_ids
*/
SocketController.prototype._sendTo = function(json_data, userID, cb){
	if( typeof json_data != 'object' ) return cb(new Error('Invalid Data'));

	if( userID instanceof net.Socket ){
		userID.write( JSON.stringify( json_data ) );
		if(typeof cb == 'function') cb(null, true);
		return;
	}  
	
	if( typeof userID != 'number' && Array.isArray(userID) == false ) return cb(new Error('Invalid Data'));

	var b = true;
	var c = 0;

	var result_obj = {};
	result_obj.receiver_ids = [];

	sockets_arr.every(function(socket){

		if( Array.isArray(userID) ){
			if( userID.indexOf( socket._userID ) >= 0 ){
				c++;

				socket.write( JSON.stringify( json_data ) );
				result_obj.receiver_ids.push( socket._userID );

				if( c == userID.length ){
					//cb(null, result_obj);
					b = false;
				}
			}
		}
		else if( socket._userID == userID ){
			socket.write( JSON.stringify( json_data ) );
			result_obj.receiver_ids.push( socket._userID );
			//cb(null, result_obj);
			b = false;
		}

		return b;
	});

	if(typeof cb == 'function') cb(null, result_obj);	
};

/**
@param {Object}				json_data
@param {net.Socket|Null}	exclude_socket
@param {Function}			[cb]
*/
SocketController.prototype._broadcast = function(json_data, exclude_socket, cb){

	var c = 0;
	sockets_arr.forEach(function( socket_item ){
		if( exclude_socket ){
			if( exclude_socket !== socket_item ){
				socket_item.write( JSON.stringify(json_data) );
			}
		}
		else if( exclude_socket == null ){
			socket_item.write( JSON.stringify(json_data) );
		}

		c++;
		if( c == sockets_arr.length && typeof cb == 'function')  cb();
	});

};


/**
@param {Object}		socket
@param {Function}	cb
@param {Boolean}	cb.success
*/
SocketController.prototype.isAuthorized = function(socket, cb){

	if( !(socket instanceof net.Socket) ) return cb(false);
	if( !socket.hasOwnProperty('_userID') || socket._userID == null || !socket._userID) return cb(false);

	if( !isNaN( socket._userID ) ) cb(true);
	else cb(false); 
};


SocketController.prototype._updateContactlist = function(socket){
	this.contactTable.fetchContactsDataByUserID(socket._userID, function(err, contactIDs){
		if( err ) return console.log(err);

		socket._contactlist = contactIDs;
	});	
};

module.exports = SocketController;







