'use strict'

var DbAbstractBaseTable = require('./AbstractBaseTable');
var util = require('util');

var instance = null;
var tablename = 'cc_contact';

var Table = function(conn){
	DbAbstractBaseTable.apply(this, [tablename, conn]);
	this.connection = conn;
	return this;
}

util.inherits( Table, DbAbstractBaseTable );

/**
@param {Function} 	cb
@param {Object}		cb.err
@param {Array} 		cb.result
*/
Table.prototype.fetchAllData = function(cb){
	this.connection.query('SELECT * FROM ' + tablename + ' WHERE active=? AND hidden=?', [1,0], function(err, rows){
		if( err ) return cb(err, null);
		cb( null, rows );
	});
};

/**
@param {Number}		userID
@param {Function}	cb
@param {Object}		cb.err
@param {Array}		cb.result
*/
Table.prototype.fetchDataByUserID = function(userID, cb){
	if( typeof userID != 'number' ) return cb(new Error('Invalid Data'), null);

	this.connection.query('SELECT * FROM ' + tablename + ' WHERE user_id=?', [userID], function(err, row){
		if( err ) return cb(err, null);
		cb( null, row );
	});
};

/**
@param {Number} 	userID
@param {Function}	cb
@param {Object|Null}cb.err
@param {Array}		cb.contactIDs
*/
Table.prototype.fetchContactsDataByUserID = function(userID, cb){
	if(  typeof userID != 'number' ) return cb(new Error('Invalid Data'), null);

	this.fetchDataByUserID( userID, function(err, result){
		if( err ) return cb(err, null);

		var arr = [];
		if( result.length ){
			var row = result[0];
			var contactlist_str = row.contactlist.trim();
			
			if( contactlist_str ){
				arr = contactlist_str.split(',');
				arr = arr.map(function(item){return parseInt(item)});
			}
		}
		cb( null, arr );
	});

};

/**
@param {Number} 	userID
@param {Number} 	contactID
@param {Function} 	cb
@param {Object}   	cb.err
@param {Object|Null}cb.result
*/
Table.prototype.insertData = function(userID, contactID, cb){
	if(  typeof userID != 'number' ) return cb(new Error('Invalid Data'), null);

	var self = this;

	this.fetchDataByUserID( userID, function( err, result ){
		if( err ) return cb(err, null);

		//Update Row...
		if( result.length ){
			var row = result[0];
			var contactlist_str = row.contactlist.trim();
			var arr = [];

			//Some contacts already exists...
			if( contactlist_str ){
				
				arr = contactlist_str.split(',');
				arr = arr.map(function(item){return parseInt(item)});

				//New Contact ID...
				if( arr.indexOf( contactID ) == -1 ){
					arr.push( contactID );
					contactlist_str = arr.join(',');
				}
				//Contact ID already exist...
				else{
					return cb(null, null);
				}
			}
			//No contact exist...
			else{
				arr.push(contactID);
				contactlist_str = arr.join(',');
			}

			var data = {contactlist: contactlist_str};
			self.connection.query('UPDATE ' + tablename + ' SET ? WHERE user_id=?', [data, userID], function(err, result){
				if( err ) return cb(err, null);
				cb( null, result );
			});
		}
		//Insert Row....
		else{
			var arr = [contactID];
			var str = arr.join(','); 
			var data = {user_id: userID, contactlist: str };
			self.connection.query('INSERT INTO ' + tablename + ' SET ?', data, function(err, result){
				if( err ) return cb(err, null);
				cb( null, result );
			});
		}

	});
};

/**
@param {Function} 	cb
@param {Object}   	cb.err
@param {Object|Null}cb.result
*/
Table.prototype.deleteData = function(userID, contactID, cb){
	if( typeof userID != 'number' ) return cb(new Error('Invalid Data'), null);

	var self = this;

	this.fetchDataByUserID(userID, function(err, result){
		if( err ) return cb(err, null);

		if( result.length ){
			var row = result[0];
			var contactlist_str = row.contactlist.trim();

			if( contactlist_str ){
				
				var arr = contactlist_str.split(',');
				arr = arr.map(function(item){return parseInt(item)});

				var idx = arr.indexOf( contactID );
				if( idx > -1 ){	
					arr.splice( idx, 1 );
					contactlist_str =  arr.join(',');
					var data  = {contactlist: contactlist_str};

					self.connection.query('UPDATE ' + tablename + ' SET ? WHERE user_id=?', [data, userID], function(err, result){
						if( err ) return cb(err);
						cb(null, result);
					});
				}
				else{
					return cb(null, null);
				}	
			}
			else{
				return cb(null, null);
			}
		}
		else{
			cb(null, null);
		}
	});
};

module.exports.create = function( conn  ){
	if( instance ) return instance;
	instance = new Table( conn );
	return instance;
} 
