const KafkaAvro = require('kafka-avro');
const fmt = require('bunyan-format');
const kafkaLog = KafkaAvro.getLogger();
const shipper = require('./shipper');
const customer = require('./customer');

const kafkaConsumerGroup = "shipper-consumer1";

const wait_to_receive = 120000 //ms - 2 minutes

var kafkaAvro;

var kafkaBrokerVar = process.env.KAFKA_BROKER || '130.61.35.61:9092';
var kafkaRegistryVar = process.env.KAFKA_REGISTRY || 'http://130.61.35.61:8081';

//topics as they are defined on Kafka
const ORDER_PICKED_TOPIC = process.env.KAFKA_ORDER_PICKED || 'soaring-orderpicked';
const SHIPMENT_REQUEST_ISSUED_TOPIC = process.env.KAFKA_SHIPMENT_REQUEST_ISSUED_TOPIC || 'soaring-shipmentrequestissued';

let topics = [ORDER_PICKED_TOPIC, SHIPMENT_REQUEST_ISSUED_TOPIC];
console.log("kafkaBroker: " + kafkaBrokerVar);
console.log("kafkaRegistryVar: " + kafkaRegistryVar);



kafkaAvro = new KafkaAvro(
        {
            kafkaBroker: kafkaBrokerVar,
            schemaRegistry: kafkaRegistryVar,
            parseOptions: {wrapUnions: true}
        }
);

kafkaAvro.init()
        .then(function () {
            console.info('Kafka Avro Ready to use');
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
}).then(function (consumer) {

    console.log('adding consumer' + JSON.stringify(consumer));
    //Read messages
    var stream = consumer.getReadStream(topics, {
        waitInterval: 0
    });

    console.log('listing to topics: ' + topics);

    stream.on('error', function (err) {
        console.log('error in stream');
        console.error(err);
        process.exit(1);
    });

    consumer.on('error', function (err) {
        console.log('error in consumer');
        console.error(err);
        process.exit(1);
    });

    //start streaming data
    stream.on('data', function (message) {
        console.log('Received message:', JSON.stringify(message));
        if (message.topic === ORDER_PICKED_TOPIC) {
            console.log('in stream on data, order picked topic');
            shipper.pickUp(message.parsed);
            //todo put in timout
            //customer.receiveDelivery(message.parsed);
        } else if (message.topic === SHIPMENT_REQUEST_ISSUED_TOPIC) {
            console.log('in stream on data, shipment request issued');
            shipper.offerDelivery(message.parsed);
        }
    });
});

var subscribers = [];

var avroEventHubListener = module.exports;

avroEventHubListener.subscribeToEvents = function (callback) {
    console.log("event subscription received");
    subscribers.push(callback);
};