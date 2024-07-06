import dotenv from "dotenv";
import { ImageProcessorWorker } from "./worker";
import { Factory } from "./factory";

dotenv.config();

const imageProcessor = Factory.createImageProcessor();
const worker = new ImageProcessorWorker(imageProcessor);
worker.start();
