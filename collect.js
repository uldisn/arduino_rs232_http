/**
* libs:
* ini files: https://www.npmjs.com/package/node-ini
* serial: http://codebrane.com/blog/2014/04/27/designing-a-simple-serial-api-for-the-arduino-and-node-dot-js/
* moment: npm install moment --save
* http request - https://www.npmjs.com/package/request
*/

/**
* INIT
*/
var moment = require('moment');
var request = require('request');

var minuteCount = [];

console.log(minuteCount);

var ini = require('node-ini');
var config = [];

ini.parse('config.ini', function(err,config){
  if(err) console.log(err)
  else {
	  
    console.log('ini')
    console.log('com=' +config.arduino['com'])
    console.log('baudrate=' +config.arduino['baudrate'])
    console.log('url=' +config.www['url'])
	
	linijaBit = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0};
	for (var key in linijaBit) {
		if(config['linija' + key])
		{
			var n = parseInt(config['linija' + key].bit);
			linijaBit[key] = n;
			//n = Math.pow(2,(n-1));
		}
		
	}
	console.log('Linija:BIT');
	console.log(linijaBit);
    console.log('========================')
	
	var SerialPort = require("serialport").SerialPort
	var serialPort = new SerialPort(config.arduino['com'], {
	  baudrate: config.arduino['baudrate']
	});


	serialPort.on("open", function () {
	  console.log('open');
	  var prevData = 0;
	  serialPort.on('data', function(data) {
		console.log('data received: ' + data);
		
		for (var key in linijaBit) {
			var bit = linijaBit[key];
			if(bit == 0) continue;

			if(
			(Math.pow(2,(bit-1)) & prevData) == 1
			&& (Math.pow(2,(bit-1)) & data) == 0
			){
				var dateMinute = actualMinute();			
				if(!minuteCount[key+'/'+dateMinute]){
					minuteCount[key+'/'+dateMinute] = 0;
				}	
				minuteCount[key+'/'+dateMinute] ++;				
			}	
		}
		prevData = data;
//		if(data == 0){
//			var dateMinute = actualMinute();			
//			if(!minuteCount[dateMinute]){
//				minuteCount[dateMinute] = 0;
//			}	
//			minuteCount[dateMinute] ++;
//		}
		console.log(minuteCount);
	  });

	});	

	/**
	* each minute try sent data to server
	*/
	setInterval(function(){
        var dateMinute = actualMinute();
  
		var readyMinuteCount = [];
		
		// get compleet minutes
		
		/**
		for (var minute in minuteCount) {
		  if(minute != dateMinute)
		  {
			  readyMinuteCount[minute] = minuteCount[minute];
		  }
		}
		var options = {
		  uri: config.www['url'] + '&linija_id=' + config.arduino['linija'],
		  method: 'POST',
		  json: readyMinuteCount
		};

		request(options, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
			console.log('sen to www');
			//on succes sending data remove sended data
			for (var minute in minuteCount) {
			  if(minute != dateMinute)
			  {
				  minuteCount.splice(minute, 1);;
			  }
			}				
		  }
		});	  
		*/
	}, 10 * 1000);  	
  }
});


function actualMinute(){
	return moment().format('YYYY-MM-DD hh:mm');
}

