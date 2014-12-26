'use strict'

var net = require('net');
var rl = require('readline').createInterface(process.stdin, process.stdout);

var MessageQueue = require('../lib/util/MessageQueue');

var messageQueue = new MessageQueue();

var client = new net.Socket();	

messageQueue.on('message', function(message){
	if( client ){
		client.write(message + '\0');
	}
});


client.connect(3001, '127.0.0.1', function(){

	rl.setPrompt('Press 1,2 or 3\n1: create and do something with angie\n2: create and do something with wolfgang\n3: create and do something with helmut\n');
	rl.prompt();

	rl.on('line', function(line){
		var line = line.trim();

		switch( parseInt(line) ){
			case 1:
				var username = 'angie';

				var json = {cmd:"user-new", username: username, password:"1234"}
				messageQueue.add( JSON.stringify(json) );

				var json = {cmd:"login",username: username ,password:"1234"};
				messageQueue.add( JSON.stringify(json) );

				break;
			case 2:
				var username = 'wolfgang';
				
				var json = {cmd:"user-new", username: username, password:"1234"}
				messageQueue.add( JSON.stringify(json) );

				var json = {cmd:"login",username: username ,password:"1234"};
				messageQueue.add( JSON.stringify(json) );


				break;
			case 3:
				var username = 'helmut';
				
				var json = {cmd:"user-new", username: username, password:"1234"}
				messageQueue.add( JSON.stringify(json) );

				var json = {cmd:"login",username: username ,password:"1234"};
				messageQueue.add( JSON.stringify(json) );

				var json = {cmd:"contact-search", username:"angi"};
				messageQueue.add( JSON.stringify(json) );

				var json = {cmd:"contact-add", id:1};
				messageQueue.add( JSON.stringify(json) );

				var json = {cmd:"contact-search", username:"gang"};
				messageQueue.add( JSON.stringify(json) );

				var json = {cmd:"contact-add", id:2};
				messageQueue.add( JSON.stringify(json) );

				var json = {cmd:"message",touser:[1,2],message:"Hi"};
				messageQueue.add( JSON.stringify(json) );

				//var json = {cmd:"contact-del", id:2};
				//messageQueue.add( JSON.stringify(json) );	

				var json = {cmd:"logout"};
				messageQueue.add( JSON.stringify(json) );

				break;
		}

	});
	
});

client.on('data', function(data){
	console.log('Response from Server:' + data.toString('utf8'));
});

client.on('error', function(err){
	console.log('Error' + err);
});

client.on('close', function(had_error){
	console.log('Closing Socket, Socket has error: ' + had_error);
});

