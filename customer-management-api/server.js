// Import necessary modules
const express = require('express');
const { Kafka } = require('kafkajs');
const { MongoClient } = require('mongodb');

// Initialize Express application
const app = express();
app.use(express.json());

// Log Kafka and MongoDB connection details from environment variables
console.log("Kafka Broker:", process.env.KAFKA_BROKER);
console.log("Mongo URI:", process.env.MONGO_URI);

// Kafka setup: Configure Kafka client with broker URL from environment variables
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'], // Use environment variable or default to localhost
});

// Create Kafka producer and consumer instances
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'purchase-group' });

// MongoDB setup: Configure MongoDB client with URI from environment variables
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017'; // Use environment variable or default to localhost
const dbName = 'mydatabase'; // Name of the database
const collectionName = 'purchases'; // Name of the collection
const client = new MongoClient(mongoUri); // Create MongoDB client instance

// Kafka topic name
const topic = 'purchase-topic';

// Main function to run Kafka producer and consumer
const run = async () => {
  try {
    // Connect to Kafka producer and consumer
    await producer.connect();
    await consumer.connect();

    // Create Kafka topics if they don't exist
    const admin = kafka.admin();
    await admin.createTopics({
      topics: [{ topic }],
    });

    console.log('Kafka topic created or already exists');

    // Start Kafka consumer and listen for new messages
    await consumer.subscribe({ topic, fromBeginning: true });

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        // Parse the message value from Kafka
        const value = JSON.parse(message.value.toString());

        // Connect to MongoDB
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Insert the message data into MongoDB collection
        await collection.insertOne({
          username: value.username,
          userid: value.userid,
          price: value.price,
          timestamp: new Date(value.timestamp),
        });

        console.log('Message inserted into MongoDB:', value);

        // Close MongoDB connection
        await client.close();
      },
    });

    console.log('Kafka consumer is running');
  } catch (error) {
    console.error('Error:', error);
  }
};

// Start Kafka consumer and MongoDB connection
run().catch(console.error);

// API endpoint to handle purchase requests
app.post('/buy', async (req, res) => {
  const { username, userid, price } = req.body;

  const purchase = {
    username,
    userid,
    price,
    timestamp: new Date().toISOString(), // Record the current timestamp
  };

  try {
    // Send the purchase data to Kafka topic
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(purchase) }],
    });

    console.log('Purchase sent to Kafka:', purchase);
    res.status(200).send('Purchase recorded'); // Respond with success
  } catch (error) {
    console.error('Error sending purchase to Kafka:', error);
    res.status(500).send('Failed to record purchase'); // Respond with error
  }
});

// API endpoint to get all purchases for a specific user
app.get('/getAllUserBuys', async (req, res) => {
  const { username } = req.query; // Get username from query parameters

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Retrieve all purchases for the specified username
    const purchases = await collection.find({ username }).toArray();

    console.log('Retrieved purchases from MongoDB:', purchases);
    res.status(200).json(purchases); // Respond with retrieved purchases
  } catch (error) {
    console.error('Error retrieving purchases from MongoDB:', error);
    res.status(500).send('Failed to retrieve purchases'); // Respond with error
  } finally {
    await client.close();
  }
});

// Start the Express server
const port = process.env.PORT || 3000; // Use environment variable or default to port 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
