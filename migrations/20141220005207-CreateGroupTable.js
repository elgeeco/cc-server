var dbm = require('db-migrate');
var type = dbm.dataType;

var tablename = 'cc_group';

exports.up = function(db, callback) {
	db.createTable( tablename ,{
		columns: {
			id: 		{type: 'int', unsigned: true, notNull: true, primaryKey: true, autoIncrement: true},
			name: 		{type: 'string', notNull: true},
			user_id: 	{type: 'int', notNull:true},
			userlist: 	{type: 'text', notNull:true},
			active: 	{type: 'smallint', notNull:true, defaultValue:'1'},
			hidden: 	{type: 'smallint', notNull:true, defaultValue:'0'}
		},
		ifNotExists: true
	}, callback);
};

exports.down = function(db, callback) {
	db.dropTable( tablename, {ifExists: true}, callback );
};

