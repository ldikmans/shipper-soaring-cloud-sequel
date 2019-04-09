
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./app/logger');
const producer = require('./app/consumer');

const port = process.env.PORT || 7070;
const VERSION = '1.0.0';

const app = express();
var upTime;

producer.initKafkaAvro();


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
router.get('/health', function (req, res) {
    res.json({
        "version": VERSION,
        "status": "OK",
        "uptime": upTime
    });
});


// all of our routes will be prefixed with /shipment
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



