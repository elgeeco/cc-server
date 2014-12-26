'use strict'

var fs = require('fs');
var path = require('path');
var colors = require('colors');
var config = require('config');
var mkdirp = require('mkdirp');

var instance = null;

function Logger(){
    
    this.console = {};
    this.console.enabled = config.app.log.console.enabled;

    this.file = {};
    this.file.enabled = config.app.log.file.enabled;
    this.file.filename = config.app.log.file.filename;
    this.file.maxKb = config.app.log.file.maxKb;
}

Logger.prototype.log = function(message, color){
	if( typeof message != 'string' ) return;

	color = color || 'white';
	
	if( this.console.enabled ){
		console.log( message[color] );
	}

	if( this.file.enabled ){
		this._writeLogFile( message );
	}
};

Logger.prototype._writeLogFile = function(message){
	var self = this;

	var readFile = function(cb){
		fs.exists( self.file.filename, function(exists){
			if( exists ){

				fs.stat( self.file.filename, function(err, stats){
					if( err ) return console.log(err);

					if( stats.size > (self.file.maxKb * 1024) ){
						cb(null);
					}
					else{
						fs.readFile( self.file.filename, {encoding: 'utf8'}, function(err, content){
							if( err ) return console.log(err);
							cb(content);
						});
					}
				});
			}
			else{
				var dirpath = path.dirname( self.file.filename ); 
				if( dirpath != '.' ){
					mkdirp(dirpath, function (err) {
    					if (err) return console.error(err)
    					cb(null);
					});
				}
				else{
					cb(null);
				}
			}
		});
	}


	var writeFile = function(content){
		fs.open( self.file.filename, 'w+', function(err, fd){
			if( err ) return console.log(err);

			var log_str = self._datetime();
			log_str += ' : ' + message;
			if( content ) log_str += '\n' + content;

			var buffer = new Buffer( log_str );

			fs.write( fd, buffer, 0, buffer.length, null, function(err){
				if( err ) return console.log(err);

				fs.close(fd);

			});

		});
	}

	readFile( function(content){
		writeFile(content);
	});

};

Logger.prototype._datetime = function(){
	var addZero = function(num) {
	    return (num >= 0 && num < 10) ? "0" + num : num + "";
	}

	var now = new Date();
	var strDateTime = [[addZero(now.getDate()), addZero(now.getMonth() + 1),  now.getFullYear()].join("/"), 
						[addZero(now.getHours()), addZero(now.getMinutes()), addZero(now.getSeconds())].join(":")
						].join(" ");

	return strDateTime;
};


/**
@param {String}	message
@param {String} color
*/
module.exports = function(message, color){
	if( !instance ) instance = new Logger();
	instance.log(message, color);
};