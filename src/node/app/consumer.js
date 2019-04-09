const KafkaAvro = require('kafka-avro');
const logger = require('./logger');
const fmt = require('bunyan-format');
const kafkaLog  = KafkaAvro.getLogger();
const shipper = require('./shipper');

var kafkaAvro;

var kafkaBrokerVar = process.env.KAFKA_BROKER || 'localhost:9092';
var kafkaRegistryVar = process.env.KAFKA_REGISTRY || 'http://130.61.35.61:8081';

//topics as they are defined on Kafka
const ORDER_PICKED_TOPIC = process.env.KAFKA_ORDER_PICKED || 'soaring-soaring-orderpicked';
const SHIPMENT_REQUEST_ISSUED_TOPIC = process.env.KAFKA_SHIPMENT_REQUEST_ISSUED_TOPIC || 'soaring-shipmentrequestissue';

exports.initKafkaAvro = function () {
    kafkaAvro = new KafkaAvro(
            {
                kafkaBroker: kafkaBrokerVar,
                schemaRegistry: kafkaRegistryVar,
                parseOptions: {wrapUnions: true}
            }
    );
    logger.debug("kafkaBroker: " + kafkaBrokerVar);
    logger.debug("kafkaRegistryVar: " + kafkaRegistryVar);
    kafkaAvro.init()
            .then(function () {
                logger.info('Kafka Avro Ready to use');

            });
};

//create Stream
kafkaLog.addStream({
    type: 'stream',
    stream: fmt({
        outputMode: 'short',
        levelInString: true
    }),
    level: 'debug'
});

let orderPickedConsumer = kafkaAvro.addConsumer(ORDER_PICKED_TOPIC);

orderPickedConsumer.on('message', message => {
    logger.debug('we received a message ' + message);
    shipper.pickUp(message);
});

let issueShipmentRequestConsumer = kafkaAvro.addConsumer(SHIPMENT_REQUEST_ISSUED_TOPIC);

issueShipmentRequestConsumer.on('message', message => {
    logger.debug('we received a message ' + message);
    shipper.offerDelivery(message);
});