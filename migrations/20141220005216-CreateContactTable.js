var dbm = require('db-migrate');
var type = dbm.dataType;

var tablename = 'cc_contact';

exports.up = function(db, callback) {
	db.createTable( tablename ,{
		columns: {
			id: 		{type: 'int', unsigned: true, notNull: true, primaryKey: true, autoIncrement: true},
			user_id: 	{type: 'int', unsigned: true, notNull: true},
			contactlist:{type: 'text', notNull:true}
		},
		ifNotExists: true
	}, callback);
};

exports.down = function(db, callback) {
	db.dropTable( tablename, {ifExists: true}, callback );
};
