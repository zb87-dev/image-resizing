import dotenv from "dotenv";
import { ImageProcessorWorker } from "./worker";
import { Factory } from "./factory";

dotenv.config();

const worker = Factory.createWorker();
worker.start();
