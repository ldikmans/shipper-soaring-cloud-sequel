const shipper = require('./app/shipper');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./app/logger');
const consumer = require('./app/consumer');

const port = process.env.PORT || 7070;
const VERSION = '1.0.0';

const app = express();
var upTime;

const ORDER_PICKED_TOPIC = process.env.KAFKA_ORDER_PICKED || 'soaring-soaring-orderpicked';
const SHIPMENT_REQUEST_ISSUED_TOPIC = process.env.KAFKA_SHIPMENT_REQUEST_ISSUED_TOPIC || 'soaring-shipmentrequestissued';

//consumer.initKafkaAvro();


consumer.subscribeToEvents(
   (topic, message) => {
       console.log("Avro EventBridge: Received event from event hub on topic " + topic);
       console.log("mesasge: " + message);
       try {
           
            if (topic === ORDER_PICKED_TOPIC) {
                console.log('in subscribe to event');
                shipper.pickup(message);
            }
            if (topic === SHIPMENT_REQUEST_ISSUED_TOPIC) {
                console.log('in subscribe to event');
                shipper.handleOrderEventHubEvent(message);
            }
           
            } catch (error) {
            console.log("failed to handle message from event hub", error);

        }
    }
);


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var router = express.Router();

app.use(cors());
app.options('*', cors()); // include before other routes

/**
 * test route to make sure everything is working (accessed at GET http://{host}:{port}/shippermarketplace)
 * @argument {type} req
 * @argument {type} res welcome message to show it is working  
 */
router.get('/', function (req, res) {
    res.json({message: 'hooray! welcome to our api!'});
});

/**
 * get the health of the server
 * @argument {type} req empty object
 * @argument {type} res the version, status and uptime
 */
router.get('/shipper/health', function (req, res) {
    res.json({
        "version": VERSION,
        "status": "OK",
        "uptime": upTime
    });
});

/**
 * this is a workaround because we have issues consuming the topic
 */
router.post('/shipper/orderPicked', function (req, res, next) {

    logger.debug('orderPicked');
    try {
        shipper.pickUp(req.body, res, next);
    } catch (error) {
        next(error);
    }

});

/**
 * this is a workaround because we have issues consuming the topic
 */
router.post('/shipper/offerDelivery', function (req, res, next) {
    logger.debug('offer delivery');
    try {
        shipper.offerDeliver(req.body, res, next);

    } catch (error) {
        next(error);
    }
});

// all of our routes will be prefixed with /shipper
app.use('/shipper', router);

app.use(function (err, req, res, next) {
    logger.debug('request: ' + req.baseUrl);
    logger.error(err); // 
    if (!err.statusCode)
        err.statusCode = 500;
    res.status(err.statusCode).send(err.message);
});
// START THE SERVER
// =============================================================================
app.listen(port);
logger.info('Magic happens on port ' + port);
upTime = new Date();



