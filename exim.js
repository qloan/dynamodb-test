#!/usr/local/bin/node

var async = require('async');
var AWS = require('aws-sdk');
var DOC = require('dynamodb-doc');
var fs = require('fs');
var cmd = process.argv[2];
var dir = (process.argv[3]) ? process.argv[3] : 'dynamodb_backup';
var scanLimit = 5;

//CREATE VOGELS INSTANCE
AWS.config.update({
    credentials: new AWS.SharedIniFileCredentials({profile: 'default'}),
    region:      'us-west-2',
    sslEnabled:  false,
    apiVersions: {
        dynamodb: '2012-08-10'
    }
});

var awsClient = new AWS.DynamoDB();
var docClient = new DOC.DynamoDB(awsClient);

var sTime = new Date().getTime();

if(cmd == 'export') {
	
	async.waterfall([
		function(cb) {
			//CREATE BACKUP DIR IF IT DOESN'T EXIST
			fs.stat(dir, function(err) {
				if(err) {
					fs.mkdir(dir, cb);
				}else {
					cb();
				}
			});
		}, function(cb) {
			//GET LIST OF ALL TABLES
			docClient.listTables({}, cb);
		}, function(data, mainCb) {
			//ITERATE OVER EACH TABLE
			async.eachSeries(data.TableNames, function(table, eachCb) {

				var tableData = [];

				console.log('Backing up ' + table + '...');

				async.waterfall([
					function(wfCb) {
						//GET ALL ITEMS IN TABLE. BUILD AN OBJECT WITH RESULTS.
						function getItems(lastEvaluatedKey, cb) {
							var params = {
						        TableName: table,
						        Limit: scanLimit
						    };
						    if(lastEvaluatedKey) {
						    	params.ExclusiveStartKey = lastEvaluatedKey;
						    }
							docClient.scan(params, function(err, data) {
						        if(err) {
						            cb(err);
						        }else {
						        	tableData = tableData.concat(data.Items);
						        	if(data.LastEvaluatedKey) {
						        		getItems(data.LastEvaluatedKey, cb);
						        	}else {
						        		cb(null, tableData);
						        	}
						        }
						    });	
						}
					    
					    getItems(null, wfCb);

					},
					function(data, cb) {
						//WRITE TABLE DATA TO FILE
						fs.writeFile([dir, '/', table, '.json'].join(''), JSON.stringify(data), cb);
					}], eachCb);

			}, mainCb);
		}
	], function(err) {
		if(err) {
			console.log('ERROR: ' + err);
			return;
		}
		console.log('Successfully exported in ' + (new Date().getTime() - sTime) + 'ms');
	});
}else if(cmd == 'import') {
	
	async.waterfall([
		function(cb) {
			fs.readdir(dir, cb);
		},
		function(files, wfCb) {
			async.eachSeries(files, function(file, eachCb) {
				var table = file.replace(/\.json$/, '');
				
				console.log('Importing ' + table + '...');

				async.waterfall([
					function(cb) {
						fs.readFile([dir, '/', file].join(''), {encoding: 'utf8'}, cb);
					},
					function(data, cb) {
						data = JSON.parse(data);
						console.dir(data);
					}
				], eachCb);
			}, wfCb);
		}
	], function(err) {
		if(err) {
			console.log('ERROR: ' + err);
			return;
		}
		console.log('Successfully imported in ' + (new Date().getTime() - sTime) + 'ms');
	});

}else {
    console.log('Invalid command.\n');
    console.log([
        '\nUsage: exim.js [command] [dir (default=dynamodb_backup)]\n',
        'Valid Commands:',
        '---------------',
        'export [dir]...................... Export all tables to the specified directory.',
        'import [dir]...................... Import all tables from the specified directory.',
    ].join('\n'));
    return 9;
}