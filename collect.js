/**
 * libs:
 * ini files: https://www.npmjs.com/package/node-ini
 * serial: http://codebrane.com/blog/2014/04/27/designing-a-simple-serial-api-for-the-arduino-and-node-dot-js/
 * moment: npm install moment --save
 * http request - https://www.npmjs.com/package/request
 */

/**
 * get cofig file from command arguments
 */
var configFile = 'config.ini';

var myArgs = process.argv.slice(2);
if (myArgs[0]) {
    configFile = myArgs[0];
}

var debug = false;
if (myArgs[1] && myArgs[1] == 'debug') {
    debug = true;
}
console.log('Config file: ', configFile);

/**
 * load libs
 */
var moment = require('moment');
var request = require('request');
var ini = require('node-ini');

var minuteCount = new Array();
var sensorBit = new Array();
var sensorLine = '';
/**
 * process config
 * @type Array
 */
var config = [];
ini.parse(configFile, function (err, config) {
    if (err)
        console.log(err)
    else {

        console.log('config file:' + configFile);
        console.log('com=' + config.arduino['com']);
        console.log('baudrate=' + config.arduino['baudrate']);
        console.log('url=' + config.www['url']);
        console.log('=======================');

        sensorBit = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0};
        for (var sensor in sensorBit) {
            if (config['sensor_' + sensor])
            {
                var n = parseInt(config['sensor_' + sensor].bit);
                sensorBit[sensor] = n;
                sensorLine = sensorLine + sensor;
            }

        }
        console.log('Sensors:BIT');
        console.log(sensorBit);
        console.log('========================')


        var SerialPort = require("serialport").SerialPort
        var serialPort = new SerialPort(config.arduino['com'], {
            baudrate: config.arduino['baudrate']
        });

        serialPort.on("open", function () {
            console.log('open');
            if (debug) {
                console.log('Rec.Data | Sensor');
                console.log('-----------------');
                console.log('         | ' + sensorLine);
                console.log('=================');
            }
            var prevData = 1;
            serialPort.on('data', function (data) {

                var statusLine = decbin(data, 8) + ' | ';
                for (var sensor in sensorBit) {
                    var bit = sensorBit[sensor];
                    if (bit == 0)
                        continue;

                    /**
                     * registre sensor on OFF
                     */
                    if (
                            (Math.pow(2, (bit - 1)) & prevData) == 1
                            && (Math.pow(2, (bit - 1)) & data) == 0
                            ) {
                        var dateMinute = actualMinute();

                        if (!minuteCount[sensor + '/' + dateMinute]) {
                            minuteCount[sensor + '/' + dateMinute] = 0;
                        }
                        minuteCount[sensor + '/' + dateMinute]++;
                        statusLine = statusLine + '1';
                    } else {
                        statusLine = statusLine + '0';
                    }
                    statusLine = statusLine + '(' + sensor + ')';
                }
                prevData = data;
                if (debug)
                    console.log(statusLine);


            });

        });

        setInterval(function () {
            var dateMinute = actualMinute();
            for (var sensor in sensorBit) {

                if (sensorBit[sensor] == 0)
                    continue;
                if (!minuteCount[sensor + '/' + dateMinute]) {
                    minuteCount[sensor + '/' + dateMinute] = 0;
                }
            }
        }, 10 * 1000);
        
        /**
         * each minute try sent data to server
         */
        setInterval(function () {

            var dateMinute = actualMinute();
            console.log('Actual minute: ' + dateMinute);
            var readyMinuteCount = {};

            /**
             * get compleet minutes
             */
            for (var sensorMinute in minuteCount) {
                console.log('Sensor/Minute: ' + sensorMinute + ' Count: ' + minuteCount[sensorMinute]);
                var aSensorMinute = sensorMinute.split('/');
                if (aSensorMinute[1] != dateMinute)
                {
                    readyMinuteCount[sensorMinute] = minuteCount[sensorMinute];
                }

            }
            if (Object.keys(readyMinuteCount).length == 0) {

                //console.log('www: no data for post');
                return;
            }

            /**
             * post ready minutes
             */
            var options = {
                uri: config.www['url'] + '&arduino_name=' + config.arduino['name'],
                method: 'POST',
                json: readyMinuteCount
            };
            //console.log(' ===== Ready minutes =========== ');
            //console.log(readyMinuteCount);

            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //var info = JSON.parse(body)
                    //console.log('body');
                    //console.dir(body);
                    //console.log('dzesh nosutitos')
                    for (var sensorMinute in minuteCount) {

                        var aSensorMinute = sensorMinute.split('/');
                        if (aSensorMinute[1] != dateMinute)
                        {
                            //console.log('Delete: ' + sensorMinute)
                            //console.log('Delete skaits: ' + minuteCount[sensorMinute])
                            delete minuteCount[sensorMinute];
                        }

                    }
                    //console.log('Pec tirishanas')
                    //console.log(minuteCount)
                } else {
                    console.log('www error:' + error);
                    console.log('body');
                    console.dir(body);
                    console.log('www response:');
                    console.log(response);
                }
                console.log('Finish wwww');
            });

        }, 60 * 1000);
    }
});


function actualMinute() {
    return moment().format('YYYY-MM-DD hh:mm');
}

function decbin(dec, length) {
    var out = "";
    while (length--)
        out += (dec >> length) & 1;
    return out;
}