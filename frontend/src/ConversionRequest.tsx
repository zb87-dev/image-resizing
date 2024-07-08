import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ConversionsList from "./ConversionsList";
import {
  createConversionRequest,
  getConversionRequests,
  startConversion,
  getStats,
} from "./api";
import { ConversationRequestDetails } from "./Interfaces";

const ConversionRequest: React.FC = () => {
  const refreshInteval = 500;
  const maxFiles = 5;
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length > maxFiles) {
        setError(`You can upload maximum ${maxFiles} files`);
        return;
      } else {
        setError(null);
      }

      const newImages = Array.from(e.target.files).map((file) => file);
      setImages(newImages);
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

  const [stats, setStats] = useState<any>({});
  const handleGetStats = async () => {
    const stats = await getStats();
    setStats(stats);
  };

  const isUploadDisabled = images.length === 0 || submitting;

  return (
    <div>
      <div className="container">
        <h2>Image resizer</h2>
        <p>
          Image Resizer is a web application designed to help users quickly and
          easily upload images and convert them into multiple desired
          resolutions.
        </p>
        <p>
          <button onClick={handleGetStats}>
            {stats.totalImagesUploadSizeInMB !== undefined
              ? `Total uploads: ${stats.totalImagesUploadSizeInMB} MB (Click to refresh)`
              : `Click to get stats`}
          </button>
        </p>
        <div className="wrapper">
          <input
            ref={inputRef}
            type="file"
            accept="image/png, image/jpeg"
            multiple
            onChange={handleImageChange}
          />
          <button disabled={isUploadDisabled} onClick={handleSubmit}>
            Upload
          </button>
          {error && <div className="error">{error}</div>}
          <ConversionsList
            requests={conversionRequests}
            handleConvert={handleConvert}
          />
        </div>
      </div>
    </div>
  );
};

export default ConversionRequest;
