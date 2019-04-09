const KafkaAvro = require('kafka-avro');
const logger = require('./logger');
const fmt = require('bunyan-format');
const kafkaLog = KafkaAvro.getLogger();
const shipper = require('./shipper');

const kafkaConsumerGroup = "shipper-consumer1";

var kafkaAvro;

var kafkaBrokerVar = process.env.KAFKA_BROKER || 'localhost:9092';
var kafkaRegistryVar = process.env.KAFKA_REGISTRY || 'http://130.61.35.61:8081';

//topics as they are defined on Kafka
const ORDER_PICKED_TOPIC = process.env.KAFKA_ORDER_PICKED || 'soaring-soaring-orderpicked';
const SHIPMENT_REQUEST_ISSUED_TOPIC = process.env.KAFKA_SHIPMENT_REQUEST_ISSUED_TOPIC || 'soaring-shipmentrequestissue';

let topics = [ORDER_PICKED_TOPIC, SHIPMENT_REQUEST_ISSUED_TOPIC];

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
            

    kafkaLog.addStream({
        type: 'stream',
        stream: fmt({
            outputMode: 'short',
            levelInString: true
        }),
        level: 'debug'
    });

kafkaAvro.getConsumer({
  'group.id': kafkaConsumerGroup,
  'socket.keepalive.enable': true,
  'enable.auto.commit': true
}).then(function(consumer) {

        //Read messages
        var stream = consumer.getReadStream(topics, {
          waitInterval: 0
        });

        //Exit if error
        stream.on('error', function(err) {
          console.log(err);
          process.exit(1);
        });

        //exist if error
        consumer.on('error', function(err) {
          console.log(err);
          process.exit(1);
        });

        //start streaming data
        stream.on('data', function(message) {
            console.log('Received message:', JSON.stringify(message.parsed));
            if(message.topic === ORDER_PICKED_TOPIC){
                shipper.pickUp(message.parsed);
            } 
            else if(message.topic === SHIPMENT_REQUEST_ISSUED_TOPIC){
                shipper.offerDelivery(message.parsed);
            }
        });
    });
};