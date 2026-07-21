import sendMail from "./utils/mailer";
import { createConsumer, createKafkaClient } from "@repo/kafka";

import http from "http";

http
  .createServer((req, res) => {
    res.writeHead(200);
    res.end("email-service is running");
  })
  .listen(process.env.PORT || 8004, () => {
    console.log("Dummy HTTP server running for Render health check");
  });


const kafka = createKafkaClient("email-service");
const consumer = createConsumer(kafka, "email-service");

const start = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe([
      {
        topicName: "user.created",
        topicHandler: async (message) => {
          const { email, username } = message.value;

          if (email) {
            await sendMail({
              email,
              subject: "Welcome to E-commerce App",
              text: `Welcome ${username}. You account has been created!`,
            });
          }
        },
      },
      {
        topicName: "order.created",
        topicHandler: async (message) => {
          const { email, amount, status } = message.value;

          if (email) {
            await sendMail({
              email,
              subject: "Order has been created",
              text: `Hello! Your order: Amount: ${amount/100}, Status: ${status}`,
            });
          }
        },
      },
    ]);
  } catch (error) {
    console.log(error);
  }
};

start();
