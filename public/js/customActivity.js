define([
    'postmonger'
], function (
    Postmonger
) {
    'use strict';

    var connection = new Postmonger.Session();
    var authTokens = {};
    var payload = {};

    $(window).ready(onRender);

    connection.on('initActivity', initialize);
    connection.on('requestedTokens', onGetTokens);
    connection.on('requestedEndpoints', onGetEndpoints);
    connection.on('clickedNext', save);

    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');

    }

    function initialize(data) {
        console.log('--Inside initialize');
        console.log(data);
        if (data) {
            payload = data;
        }

        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};
        $.each(inArguments, function (index, inArgument) {
            $.each(inArgument, function (key, val) {
                $('#'+key).val(val); 
            });
        });
        
        connection.trigger('updateButton', {
            button: 'next',
            text: 'Get Voucher Code',
            visible: true
        });
    }

    function onGetTokens(tokens) {
        // Response: tokens = { token: <legacy token>, fuel2token: <fuel api token> }
        console.log(tokens);
        authTokens = tokens;
    }

    function onGetEndpoints(endpoints) {
        // Response: endpoints = { restHost: <url> } i.e. "rest.s1.qa1.exacttarget.com"
        console.log(endpoints);
    }

    function save() {
        
        var firstName = $('#first_name').val();
        var lastName = $('#last_name').val();
        var voucherCode = firstName + '' + lastName + '12345';

        payload['arguments'].execute.outArguments = [{
            "voucher_code": voucherCode
        }];
        
        payload['metaData'].isConfigured = true;
        console.log(payload);
        connection.trigger('updateActivity', payload);
    }

});

var express = require('express')
var app = express()
const axios = require('axios');
const CircularJSON = require('circular-json');
var token = '';
var voucherData = [];

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
require('dotenv').load();
app.get('/', function (request, response) {
	response.send('Hello World!')
})
/*app.get('/getweather', function (request, responsefromWeb) {
	axios.get('https://api.weather.gov/alerts/active/area/IL')
		.then(function (response) {
			var datafromCall = response.data.features;
			for (var x = 0; x < datafromCall.length; x++) {
				var weatherItem = {
					"keys": {
						"unique_key": datafromCall[x].properties.id,
						"email_id": "test@gmail.com"
					},
					"values": {
						"field1": datafromCall[x].type,
						"field2": datafromCall[x].properties.sender
					}
				}
				weatherData.push(weatherItem);
			}
			responsefromWeb.send(response.data.features);
		})
		.catch(function (error) {
			console.log(error);
			responsefromWeb.send(error);
		});
})*/

app.get('/connecttoMC', function (request, responsefromWeb) {
	console.log(process.env.CLIENT_ID);
	var conData = {
		'grant_type': 'client_credentials',
		'client_id': process.env.CLIENT_ID,
		'client_secret': process.env.CLIENT_SECRET
	}
	axios({
		method: 'post',
		url: 'https://mctg9llgcpl0dff718-t9898wqh1.auth.marketingcloudapis.com/v2/token',
		data: conData,
		headers: {
			'Content-Type': 'application/json',
		}
	})
		.then(function (response) {
			token = response.data.access_token;
			console.log(token);
			responsefromWeb.send('Authorization Sent');

		}).catch(function (error) {
			console.log(error);
			responsefromWeb.send(error);
		});
})

app.get('/connecttoMCData', function (request, responsefromWeb) {

	var voucherItem = {
		"keys": {
			"unique_key":  "12345",
			"email_id":    "sunny.bansal@ibm.com"
		},
		"values": {
			"first_name":  "Sunny",
			"last_name":   "Bansal",
			"age":         "28",
			"birth_date":  "10/06/1992",
			"phone_number":"9999614829",
			"voucher_code":  "SunnyBansal123"
		}
	}
	voucherData.push(voucherItem);

	axios({
		method: 'post',
		url: 'https://mctg9llgcpl0dff718-t9898wqh1.rest.marketingcloudapis.com/hub/v1/dataevents/key:testdataextension/rowset',
		data: voucherData,
		headers: {
			'Authorization': 'Bearer ' + token,
			'Content-Type': 'application/json',
		}
	})
		.then(function (response) {
			var json = CircularJSON.stringify(response);
			console.log(json);
			responsefromWeb.send(json);
		})
		.catch(function (error) {
			console.log(error);
		});
})


app.listen(app.get('port'), function () {
	console.log("Node app is running at localhost:" + app.get('port'))
})
