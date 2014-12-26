var dbm = require('db-migrate');
var type = dbm.dataType;

var tablename = 'cc_message';

exports.up = function(db, callback) {
	db.createTable( tablename ,{
		columns: {
			id: 			{type: 'int', unsigned: true, notNull: true, primaryKey: true, autoIncrement: true},
			message: 		{type: 'text', notNull: true},
			user_id: 		{type: 'int', notNull:true},
			receiver_id: 	{type: 'int', notNull:true},
			send: 			{type: 'smallint', notNull:true, defaultValue:'0'},
			timestamp: 		{type: 'int', notNull:true, defaultValue:'0'},
			hidden: 		{type: 'smallint', notNull:true, defaultValue:'0'}
		},
		ifNotExists: true
	}, callback);
};

exports.down = function(db, callback) {
	db.dropTable( tablename, {ifExists: true}, callback );
};
