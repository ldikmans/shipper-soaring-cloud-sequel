const request = require('request');
//TODO make this a process env
const shippermarketUrl = 'https://129.213.126.223:9022/shippermarketplace';
const logger = require('./logger');
const shipper = 'QuickSilver';
const minPrice = 1; 
const maxPrice = 2.50; 

exports.pickUp = function(message){
     let orderId = message.orderId;
     let requestBody = {
         'shipper': shipper,
         'event': 'PICKUP'
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
            console.log('returning body: ' + body);
            return body;
        }
    });
};

exports.offerDelivery = function(message){
     console.log("offering a delivery for orderId: " + message.orderId);
     let orderId = message.orderId;
     let requestBody = createOffer(orderId);
     return request({
        url: shippermarketUrl + '/offers',
        method: "POST",
        json: true, 
        body: requestBody
    }, function (error, response, body) {
        if (error) {
            logger.error(error);
            return error;
        }
        else{
            console.log('returning body' + body);
            return body;
        }
    });
};

function createOffer(orderId){
     
    let price =Math.floor(Math.random() * (+maxPrice - +minPrice)) + +minPrice; 
    let requestBody = {
	'orderId': orderId,
	'shipper': shipper,
	'price': price,
	'deliveryDate': new Date(), 
	'trackingInfo': price > 1
    };
    logger.debug('offer: ' + JSON.stringify(requestBody));
    return requestBody;
    
}