var dbm = require('db-migrate');
var type = dbm.dataType;

var tablename = 'cc_user';

exports.up = function(db, callback) {
	db.createTable( tablename ,{
		columns: {
			id: 		{type: 'int', unsigned: true, notNull: true, primaryKey: true, autoIncrement: true},
			username: 	{type: 'string', notNull: true},
			password: 	{type: 'string', notNull:true},
			timestamp:  {type: 'int', unsigned: true, notNull: true, defaultValue:'0'},
			active: 	{type: 'smallint', notNull:true, defaultValue:'1' },
			hidden: 	{type: 'smallint', notNull:true, defaultValue:'0'}
		},
		ifNotExists: true
	}, callback);
};

exports.down = function(db, callback) {
	db.dropTable( tablename, {ifExists: true}, callback );
};
