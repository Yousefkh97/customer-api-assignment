# Purchase API on Kubernetes

This repository contains a Purchase API service built with Node.js and deployed on Kubernetes. The service interacts with a Kafka broker for messaging and MongoDB for data storage. The setup has been tested on Minikube but can be adapted for cloud environments with minor changes.

## Table of Contents

- [Requirements](#requirements)
- [Setup Instructions](#setup-instructions)
- [Explanation of Code](#explanation-of-code)

## Requirements

- [Docker](https://docs.docker.com/get-docker/)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Node.js](https://nodejs.org/) (if testing locally without Docker)
- [Kafka](https://kafka.apache.org/) and [MongoDB](https://www.mongodb.com/) deployed on Kubernetes


## Setup Instructions

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/Yousefkh97/customer-api-assignment.git
cd customer-api-assignment
```
### 2. Build the Docker Image
Navigate to the customer-management-api directory and build the Docker image for the API server:
```bash
cd customer-management-api
docker build -t my-api-server:v1 .
```
### 3. Run Minikube
Start Minikube
```bash
minikube start
```
Load the Docker image into Minikube:
```bash
minikube image load my-api-server:v1
```
### 4. Apply the Kubernetes deployment files
MongoDB: Deploy MongoDB to the cluster.
```bash
kubectl apply -f mongodb.yaml
```
Zookeeper: Deploy Zookeeper, which is required by Kafka.
```bash
kubectl apply -f zookeeper.yaml
```
Kafka: Deploy Kafka to the cluster.
```bash
kubectl apply -f kafka.yaml
```
API Server: Deploy the Node.js API server.
```bash
kubectl apply -f api-server.yaml
```

### 5. Testing the API Locally
You can test the API by port-forwarding the API server to your local machine:
```bash
kubectl port-forward service/api-server 3000:3000
```
Now you can send requests to the API:

1. Purchase Request:
```bash
curl -X POST http://localhost:3000/buy -H "Content-Type: application/json" -d '{"username": "testuser", "userid": "123", "price": 100, "timestamp": "2024-08-11T10:00:00Z"}'
```
2. Get Purchases:
```bash
curl 'http://localhost:3000/getAllUserBuys?username=testuser'
```

## Explanation of Code
The server.js file located in the customer-management-api directory is a Node.js application that does the following:

* Kafka Setup: Connects to a Kafka broker to send and consume messages.
* MongoDB Setup: Connects to MongoDB to store and retrieve purchase records.
* Express API: Provides two endpoints:
  * /buy: Receives purchase data, sends it to Kafka, and then stores it in MongoDB.
  * /getAllUserBuys: Retrieves all purchases for a given user from MongoDB.
 

### Key Points
* Environment Variables: The server is configured to read Kafka and MongoDB URLs from environment variables, making it flexible for different environments (e.g., local, Kubernetes).
* Kubernetes Deployments: Each service (MongoDB, Zookeeper, Kafka, API Server) is deployed as a Kubernetes deployment and service, ensuring scalability and reliability.
