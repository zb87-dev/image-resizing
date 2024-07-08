import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ConversionStatus from "./ConversionStatus";
import {
  createConversionRequest,
  getConversionRequests,
  startConversion,
} from "./api";
import { ConversationRequestDetails } from "./Interfaces";

const ImageUpload: React.FC = () => {
  const refreshInteval = 1000;
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [images, setImages] = useState<File[]>([]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file) => file);
      setImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  const inputRef = useRef(null);
  const clearImagesAfterUpload = () => {
    setImages([]);
    if (inputRef.current) {
      (inputRef.current as any).value = "";
    }
  };

  const [conversionRequests, setConversionRequests] = useState<
    ConversationRequestDetails[]
  >([]);

  const refreshData = async () => {
    const userId = getUserId();
    const data = await getConversionRequests(userId);
    setConversionRequests(data);
  };

  useEffect(() => {
    refreshData();

    // Set up interval to fetch data every second
    const intervalId = setInterval(refreshData, refreshInteval);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const getUserId = (): string => {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      const newUserId = uuidv4();
      localStorage.setItem("userId", newUserId);
      userId = newUserId;
    }

    return userId;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const formData = new FormData();
    images.forEach((file) => {
      formData.append("files", file);
    });
    formData.set("userId", getUserId());

    await createConversionRequest(formData);

    clearImagesAfterUpload();
    setSubmitting(false);
  };

  const handleConvert = async (requestId: string, resolutions: string[]) => {
    await startConversion(getUserId(), requestId, resolutions);
  };

  const isUploadDisabled = images.length === 0 || submitting;

  return (
    <div>
      <div className="container">
        <div className="task-group-card">
          <input
            ref={inputRef}
            className="download-button"
            type="file"
            accept="image/png, image/jpeg"
            multiple
            onChange={handleImageChange}
          />
          <button disabled={isUploadDisabled} onClick={handleSubmit}>
            Upload
          </button>
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
