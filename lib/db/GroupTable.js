'use strict'

var DbAbstractBaseTable = require('./AbstractBaseTable');
var util = require('util');

var instance = null;
var tablename = 'cc_group';

var Table = function(conn){
	this.connection = conn;

	DbAbstractBaseTable.apply(this, [tablename, conn]);
	return this;
}

util.inherits( Table, DbAbstractBaseTable );


/**
@param {Function}	cb
@param {Object|Null}cb.err
@param {Array}		cb.rows
*/
Table.prototype.fetchAllData = function( cb ) {
	this.connection.query('SELECT * FROM ' + tablename + ' WHERE active=? AND hidden=?', [1,0], function(err, rows){
		if( err ) return cb(err, null);
		cb( null, rows );
	});
};

/**
@param {Number}		userID
@param {Function}	cb
@param {Object}		cb.err
@param {Array}		cb.rows
*/
Table.prototype.fetchDataByUserID = function(userID, cb) {
	if( typeof userID != 'number' ) return cb(new Error('Invalid Data'), null);

	this.connection.query('SELECT * FROM `' + tablename + '` WHERE user_id=? AND active=? AND hidden=?', [userID,1,0] , function(err, rows){
		if( err ) return cb(err, null);
		cb( null, rows );
	});
};


module.exports.create = function( conn  ){
	if( instance ) return instance;
	instance = new Table( conn );
	return instance;
} 

