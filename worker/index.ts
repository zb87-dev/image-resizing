import dotenv from "dotenv";
import { ImageProcessorWorker } from "./worker";
import { Factory } from "./factory";

dotenv.config();

const imageProcessor = Factory.createImageProcessor();
const worker = new ImageProcessorWorker(imageProcessor);
worker.start();

// const processRequestParams = {
//   QueueUrl: processRequestQueueUrl,
//   MaxNumberOfMessages: 10,
//   WaitTimeSeconds: 20,
// };

// async function listenForProcessingRequests() {
//   try {
//     const data = await sqs.receiveMessage(processRequestParams).promise();
//     if (!data.Messages) {
//       return;
//     }

//     for (const message of data.Messages) {
//       console.log("Received message:", message.Body);
//       const imageDetails = JSON.parse(message.Body!);
//       await processImage(imageDetails);

//       //Delete the message after processing
//       await deleteMessage(message.ReceiptHandle!);
//     }
//   } catch (error) {
//     console.error("Error receiving message:", error);
//   }
// }

// async function processImage(imageDetails: any): Promise<boolean> {
//   var resizedImage = "";
//   try {
//     //Process the message
//     resizedImage = await resizeImage(imageDetails.imageUrl);
//   } catch (error) {
//     await setImageProcessingFailure({ imageDetails, error });
//     console.error("Error processing image:", error);
//     return false;
//   }

//   try {
//     //Upload the resized image
//     const uploadResult = await uploadResizedImageToS3(resizedImage);
//     // Check upload result and return true if successful

//     return true;
//   } catch (error) {
//     console.error("Error processing image:", error);
//     await setImageProcessingFailure({ imageDetails, error });
//     return false;
//   }
// }

// async function resizeImage(imageUrl: string): Promise<string> {
//   // TODO: Implement image resizing
//   return "";
// }

// async function uploadResizedImageToS3(imageUrl: string) {
//   // TODO: Implement image upload to S3
// }

// async function deleteMessage(receiptHandle: string) {
//   return sqs
//     .deleteMessage({
//       QueueUrl: processRequestQueueUrl,
//       ReceiptHandle: receiptHandle,
//     })
//     .promise();
// }

// async function setImageProcessingFailure(message: any) {
//   return sqs
//     .sendMessage({
//       QueueUrl: failedRequestsQueueUrl,
//       MessageBody: JSON.stringify(message),
//     })
//     .promise();
// }

// async function startWorker() {
//   while (true) {
//     await listenForProcessingRequests();
//   }
// }

// startWorker();
