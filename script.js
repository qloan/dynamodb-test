#!/usr/local/bin/node

var AWS = require('aws-sdk'),
    DOC = require('dynamodb-doc'),
    seedData = require('./lib/seed-data'),
    awsClient,
    docClient,
    cmd,
    tableName;

//SET API CONFIG VALUES
AWS.config.update({
    credentials: new AWS.SharedIniFileCredentials({profile: 'default'}),
    region:      'us-west-2',
    sslEnabled:  false,
    apiVersions: {
        dynamodb: '2012-08-10',
        ec2:      '2013-02-01',
        redshift: 'latest'
    }
});

//CREATE DYNAMODB INSTANCE
awsClient = new AWS.DynamoDB();
docClient = new DOC.DynamoDB(awsClient);

//GENERIC CALLBACK HANDLER
function handler(err, data) { 
    if (err) {
        console.log(err, err.stack);
    } else {
        console.dir(data);
    }
}

cmd = process.argv[2];
tableName = process.argv[3];

if(cmd == 'listTables') {

    docClient.listTables({}, handler);

}else if(cmd == 'descTable') {

    docClient.describeTable({
        TableName: tableName
    }, handler);

}else if(cmd == 'seedTable') {

    (function() {
        var recordCount,
            n;

        if(!seedData.exists(tableName)) {
            console.log('Invalid table name');
            return 9;
        }
        
        recordCount = seedData.tableLen(tableName);

        for(n=0; n<recordCount; n++) {

            //insert item
            docClient.putItem({
                TableName: tableName,
                Item: seedData.get(tableName, n),
                ConditionExpression: seedData.getInsertConditionExpression(tableName)  //ensure doesn't already exist. without this, item would be overwritten.
            }, handler);
        }
    })();

}else if(cmd == 'initTable') {

    //scan for all items in specified table. For each 
    //item, generate the key object and delete the item
    docClient.scan({
        TableName: tableName
    }, function(err, data) {
        if(err) {
            console.log(err, err.stack);
        }else {
            data.Items.forEach(function(item) {
                docClient.deleteItem({
                    TableName: tableName,
                    Key: seedData.getDeleteKeys(tableName, item)
                }, handler);
            });
        }
    });

}else if(cmd == 'getItem') {

    (function() {
        var key = eval('(' + process.argv[4] + ')');

        docClient.getItem({
            TableName: tableName,
            Key: key
        }, handler);
    })();

}else if(cmd == 'query') {

    //console.dir(docClient.Condition('email', 'EQ', 'joeuser@quickenloans.com'));

    docClient.query({
        TableName: tableName,
        //IndexName: 'my-index',
        KeyConditions: [
            docClient.Condition('email', 'EQ', 'asdf@test.com')
        ],
        FilterExpression: '#duration >= :duration and #creditReport.score > :score',
        ExpressionAttributeNames: {
            '#duration'     : 'duration',
            '#creditReport' : 'creditReport'
        },
        ExpressionAttributeValues: {
            ':duration' : 30,
            ':score'    : 700
        }
    }, handler);

}else if(cmd == 'getAllItems') {
    
    //scan for all items in the specified table
    docClient.scan({
        TableName: tableName
    }, handler);

}else {

    console.log('Invalid command.\n');
    console.log([
        '\nUsage: script.js [command] [command arguments]\n',
        'Valid Commands:',
        'listTables',
        'descTable [table name]',
        'seedTable [table name]',
        'initTable [table name]',
        'getAllItems [table name]',
        'getItem [table name] [key]'
    ].join('\n'));
    return 9;

}
