import { Kafka } from "kafkajs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const caPath = path.join(__dirname, "../ca.pem");
const ca = fs.readFileSync(caPath, "utf-8");

export const createKafkaClient = (service: string) => {
  return new Kafka({
    clientId: service,
    brokers: [process.env.KAFKA_BROKER as string],
    ssl: {
      ca: [ca],
    },
    sasl: {
      mechanism: "plain",
      username: process.env.KAFKA_USERNAME as string,
      password: process.env.KAFKA_PASSWORD as string,
    },
  });
};
