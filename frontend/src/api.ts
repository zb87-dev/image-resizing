import axios from "axios";
import config from "./configuration";

export const createConversionRequest = async (formData: FormData) => {
  await axios.post(`${config.API_URL}/api/v1/conversion`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getConversionRequests = async (userId: string) => {
  const response = await axios.get(
    `${config.API_URL}/api/v1/conversion?userId=${userId}`
  );

  return response.data;
};

export const startConversion = async (
  userId: string,
  conversionId: string,
  resolutions: string[]
) => {
  await axios.post(
    `${config.API_URL}/api/v1/conversion/${conversionId}/start`,
    {
      userId,
      resolutions,
    }
  );
};

export const getStats = async () => {
  const response = await axios.get(`${config.API_URL}/api/v1/conversion/stats`);
  return response.data;
};
