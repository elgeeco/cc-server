'use strict'

var AbstractBaseTable = function(tablename, conn){
	this._connection = conn;
	this._tablename = tablename;	
}

/**
@param {String} 	tablename
@param {Function}	cb
@param {Object|Null}cb.err 
@param {Number}		rowsCount
*/
AbstractBaseTable.prototype.numberOfRows = function( cb ){

	this._connection.query('SELECT COUNT(*) AS anz FROM ' + this._tablename, function(err, rows){
		if( err ) return cb( err, null );
		cb(null, rows[0].anz);				
	});

};

/**
@param {Number|Array}	id
@param {Function}		cb
@param {Object}			cb.err
@param {Array}			cb.result
*/
AbstractBaseTable.prototype.fetchDataByID = function(id, cb){
	var e = new Error('Invalid Param');

	if( typeof id != 'number' ){
		if( !Array.isArray(id) || (Array.isArray(id) && id.length == 0) ){
			return cb(e);
		}
		else{
			id.every(function(num){
				if( typeof num == 'number' )return true;
				cb(e);
				return false;
			});
		}
	}

	var arr = [];
	if( Array.isArray(id) ) arr = id;
	else arr.push(id);

	var list = arr.join(',');

	this._connection.query('SELECT * FROM ' + this._tablename + ' WHERE id IN (' + list + ')', function(err, result){
		if( err ) return cb(err);
		cb(null, result);
	});

};

/**
@param {Function} 	cb
@param {Object}		cb.err
@param {Object}		cb.result
*/
AbstractBaseTable.prototype.lastInsertID = function(cb){
	this._connection.query('SELECT LAST_INSERT_ID()', function(err, result){
		if(err) return cb(err);
		cb(null, result);
	});
};

module.exports = AbstractBaseTable;