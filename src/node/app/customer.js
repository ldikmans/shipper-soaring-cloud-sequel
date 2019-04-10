const request = require('request');
const shippermarketUrl = process.env.SHIPPERMARKET_URL || 'http://129.213.126.223:8011/shippermarketplace';
const logger = require('./logger');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

exports.receiveDelivery = function(message){
     let orderId = message.orderId;
     console.log('sending an receive to the shippermarket for orderId:' + orderId);
     let requestBody = {
         'shipper': message.shipper,
         'event': 'RECEIVE'
     };
     return request({
        url: shippermarketUrl + '/shipments' + orderId,
        method: "PUT",
        json: true, 
        body: requestBody
    }, function (error, response, body) {
        if (error) {
            logger.error(error);
            return error;
        }
        else{
            console.log('returning body: ' + JSON.parse(body));
            return body;
        }
    });
};


