'use strict'

var AbstractBaseTable = require('./AbstractBaseTable');
var util = require('util');

var instance = null;
var tablename = 'cc_message';
var maxcount = 100;

var Table = function(conn){
	AbstractBaseTable.apply(this, [tablename, conn]);
	this.connection = conn;
}

util.inherits(Table, AbstractBaseTable);

/**
@param {Number|Null}count
@param {Function} 	cb
@param {Object} 	cb.err
@param {Array}		cb.rows
*/
Table.prototype.fetchDataByLatest = function(count, cb){
	var anz = 0;
	if( typeof count != 'number' || ( count == null || count == 0 || count > maxcount )) anz = maxcount;
	else anz = count;

	this.connection.query('SELECT * FROM ' + tablename + ' ORDER BY id DESC LIMIT ' + count , function(err, rows){
		if( err ) return cb(err, null);
		cb(null, rows);
	});

}

/**
@param {Number} startTimestamp
@param {Number|Null} endTimestamp
@param {Function} cb(err, rows)
*/
Table.prototype.fetchDataByDate = function(startTimestamp, endTimestamp, cb){
	if( typeof startTimestamp != 'number' ) return cb(new Error('Invalid startTime'), null);
	if( endTimestamp == null || endTimestamp == 0 ) endTimestamp = (new Date().getTime() / 1000);
	if (startTimestamp > endTimestamp ) return cb(new Error('Invalid Time'), null);

	this.connection.query('SELECT * FROM ' + tablename + ' WHERE timestamp >= ' + startTimestamp + ' AND timestamp <= ' + endTimestamp, function(err, rows){
		if( err ) return cb(err, null);
		cb(null, rows);
	});

}

/**
@param {Function}	cb
@param {Object}		cb.err
@param {Array}		cb.result
*/
Table.prototype.fetchDataOfLastRow = function(cb){
	this.connection.query('SELECT id FROM ' + tablename + ' ORDER BY id DESC LIMIT 1', function(err, row){
		cb(err, row);
	});
}


/**
@param {Number} 	id
@param {Number|Null}count
@param {Function} 	cb
@param {Object|Null}cb.err
@param {Array}		cb.rows
*/
Table.prototype.fetchDataByUserID = function(id, count, cb){
	var sql = 'SELECT * FROM ' + tablename + ' WHERE user_id=' + id;
	if( count && !isNaN(count) ) sql += ' ORDER BY id DESC LIMIT ' + count;

	this.connection.query( sql, function(err, rows){
		if( err ) return cb(err);
		cb(null, rows);
	});	
}

/**
@param {Number} 	receiverID
@param {Function}	cb
@param {Object|Null}cb.err
@param {Array}		cb.result
*/
Table.prototype.fetchDataOfNotReceivedMessagesByReceiverID = function(id, cb){
	if( typeof id != 'number' ) cb(new Error('Invalid Param'));

	this.connection.query('SELECT * FROM ' + tablename + ' WHERE receiver_id=? AND send=?', [id, 0], function(err, result){
		if( err ) return cb(err);
		cb(null, result);
	}); 
}

/**
@param {String} 		message
@param {Number} 		userID
@param {Number|Array}	receiverID
@param {Function} 		cb
@param {Object|Null}	cb.err
@param {Array} 			cb.results
*/
Table.prototype.insertData = function(message, userID, receiverID, cb){
	var self = this;
	var ts = new Date().getTime() / 1000;

	var arr = [];
	if( Array.isArray( receiverID )  ) arr = receiverID;
	else arr.push( receiverID );

	var results_arr = [];

	var iterate = function( idx ){
		var data = {message: message, user_id: userID, receiver_id: arr[ idx ], timestamp: ts};
		
		//Result Insert Object
		//{ fieldCount: 0, affectedRows: 1, insertId: 14, serverStatus: 2, warningCount: 0, message: '', protocol41: true, changedRows: 0 }

		self.connection.query('INSERT INTO ' + tablename + ' SET ?', data, function(err, result){
			if(err) return cb(err);
			
			results_arr.push( result );

			idx = idx + 1;
			if( idx == arr.length ) cb(null, results_arr);
			else iterate(idx);
		}); 
	};

	iterate(0);
}

/**
@param {Boolean} 		send
@param {Number|Array}	id
@param {Function}		cb
@param {Object|Null}	cb.err
@param {Array}		 	cb.results
*/
Table.prototype.updateDataBySend = function(send, id, cb){
	if( typeof send != 'boolean' ) return cb(new Error('Invalid'));
	//if( typeof userID != 'number' ) return cb(new Error('Invalid'));

	var self = this;

	var arr = [];
	if(  Array.isArray( id ) ) arr = id;
	else arr.push( id );

	var results_arr = [];

	var iterate = function(idx){
		var data = {send: (send) ? 1 : 0 };

		self.connection.query('UPDATE ' + tablename + ' SET ? WHERE id=?', [data, arr[idx] ], function(err, result){
			if( err ) return cb(err);

			//Result Update Object
			//{ fieldCount: 0, affectedRows: 1, insertId: 0, serverStatus: 2, warningCount: 0, message: '(Rows matched: 1  Changed: 1  Warnings: 0', protocol41: true, changedRows: 1 }					

			idx = idx + 1;
			if( idx == arr.length ) cb(null, results_arr);
			else iterate(idx);
		});

	}

	iterate(0);

};

module.exports.create = function( conn  ){
	if( instance ) return instance;
	instance = new Table( conn );
	return instance;
} 

