import dotenv from "dotenv";
import { Factory } from "./factory";

dotenv.config();

const worker = Factory.createWorker();
worker.start();
