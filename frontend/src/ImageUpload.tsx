import React, { useEffect, useState } from "react";
import ConversionStatus from "./ConversionStatus";
import {
  createConversionRequest,
  getConversionRequests,
  startConversion,
} from "./api";
import { ConversationRequestDetails } from "./Interfaces";

const ImageUpload: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file) => file);
      setImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  const [conversionRequests, setConversionRequests] = useState<
    ConversationRequestDetails[]
  >([]);

  const refreshData = async () => {
    const userId = getUserId();
    const data = await getConversionRequests(userId);
    // console.log(data);
    setConversionRequests(data);
  };

  useEffect(() => {
    refreshData();

    // Set up interval to fetch data every second
    const intervalId = setInterval(refreshData, 5000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const getUserId = (): string => {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      const newUserId = "0444910d-400c-4535-8b27-0c839e549cfb";
      localStorage.setItem("userId", newUserId);
      userId = newUserId;
    }

    return userId;
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    images.forEach((file) => {
      formData.append("files", file);
    });
    formData.set("userId", getUserId());

    await createConversionRequest(formData);
  };

  const handleConvert = async (requestId: string, resolutions: string[]) => {
    await startConversion(getUserId(), requestId, resolutions);
  };

  return (
    <div>
      <div className="container">
        <div className="task-group-card">
          <input
            type="file"
            accept="image/png, image/jpeg"
            multiple
            onChange={handleImageChange}
          />
          <button onClick={handleSubmit}>Upload</button>
        </div>
      </div>
      <ConversionStatus
        requests={conversionRequests}
        handleConvert={handleConvert}
      />
    </div>
  );
};

export default ImageUpload;
