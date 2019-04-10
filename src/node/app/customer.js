const request = require('request');
const shippermarketUrl = 'https://129.213.126.223:9022/shippermarketplace';
const logger = require('./logger');

exports.receiveDelivery = function(message){
     let orderId = message.orderId;
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
            return body;
        }
    });
};


