'use strict'


function DatatypeHelper(){

}


/**
@param {Object}		targetObj
@param {Object}		propertiesObj
@returns {boolean}	exist
*/
DatatypeHelper.prototype.propertiesExist = function(targetObj, propertiesObj){
	if( typeof targetObj != 'object') return false;
	if( typeof propertiesObj != 'object') return false;

	var datatypes_arr = ['string', 'number', 'array', 'null'];

	var b = true;

	Object.keys(propertiesObj).every(function(prop){
		if( !targetObj.hasOwnProperty( prop ) ){
			b = false;
		}
		else{
			var idx = datatypes_arr.indexOf( propertiesObj[prop] );
			if( idx >= 0  ){
				var datatype = datatypes_arr[idx];	
				if( datatype == 'string' || datatype == 'number' || datatype == 'null' ){
					if( typeof targetObj[prop] != datatype ) b = false;
				}
				else if( datatype == 'array' ){
					if( !Array.isArray( targetObj[prop] ) ) b = false;
				}
			}
			else b = false;
		}

		return b;
	});

	return b;
};

module.exports = DatatypeHelper;