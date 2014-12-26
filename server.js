'use strict'

/*'''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
  ,ad8888ba,                                                         ,ad8888ba,  88                            
 d8"'    `"8b                                     ,d                d8"'    `"8b 88                       ,d   
d8'                                               88               d8'           88                       88 
88            8b,dPPYba, 8b       d8 8b,dPPYba, MM88MMM ,adPPYba,  88            88,dPPYba,  ,adPPYYba, MM88MMM 
88            88P'   "Y8 `8b     d8' 88P'    "8a  88   a8"     "8a 88            88P'    "8a ""     `Y8   88  
Y8,           88          `8b   d8'  88       d8  88   8b       d8 Y8,           88       88 ,adPPPPP88   88 
 Y8a.    .a8P 88           `8b,d8'   88b,   ,a8"  88,  "8a,   ,a8"  Y8a.    .a8P 88       88 88,    ,88   88,  
  `"Y8888Y"'  88             Y88'    88`YbbdP"'   "Y888 `"YbbdP"'    `"Y8888Y"'  88       88 `"8bbdP"Y8   "Y888  
                             d8'     88                             
                            d8'      88                             
'''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''*/

var net = require('net');
var config = require('config');

var dbConnection = require('./lib/db/Connect').getInstance();
var UserTable = require('./lib/db/UserTable');
var MessageTable = require('./lib/db/MessageTable');
var ContactTable = require('./lib/db/ContactTable');
var GroupTable = require('./lib/db/GroupTable');

var SocketController = require('./lib/SocketController');
var socketController = null;

var TCP_PORT = 3001;
var TCP_HOST = '0.0.0.0';
var tcp_server = null;

dbConnection.on('error', function(err){
	console.log('db connection error');
});

dbConnection.on('success', function(){
	console.log('db connection success');
	
	UserTable.create(this.getConnection());
	MessageTable.create(this.getConnection()); 
	ContactTable.create(this.getConnection());
	GroupTable.create(this.getConnection());

	socketController = new SocketController();

	tcp_server = net.createServer(function( socket ){
		socketController.process(socket);
	});

	tcp_server.listen(TCP_PORT, TCP_HOST, function(){
		console.log('Server is running and waiting for connections');
	});
	
});

dbConnection.connect({	host: 		config.app.db.host, 
						database: 	config.app.db.database, 
						user: 		config.app.db.username, 
						password: 	config.app.db.password }); 

process.on('uncaughtException', function (err) {
    console.log(err);
});





