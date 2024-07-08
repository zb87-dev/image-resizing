import React, { useState } from "react";
import { ConversationRequestDetails, ConversionStatus } from "./Interfaces";

type ConversionStatusProps = {
  requests: ConversationRequestDetails[];
  handleConvert: (requestId: string, resolution: string[]) => void;
};

type RequestResolutionMap = {
  requestId: string;
  resolutions: string[];
};

const ConversionsList: React.FC<ConversionStatusProps> = (
  props: ConversionStatusProps
) => {
  const resolutionsOptions = ["640x480", "1280x720", "1920x1080"];
  const [selectedResolutions, setSelectedResolutions] = useState<
    RequestResolutionMap[]
  >([]);

  const handleResolutionChange = (
    request: ConversationRequestDetails,
    val: any
  ) => {
    let tmpSelectedResolutions = [...selectedResolutions];
    let requestResolution = tmpSelectedResolutions.find(
      (x: any) => x.requestId === request.id
    );
    if (!requestResolution) {
      requestResolution = {
        requestId: request.id,
        resolutions: [] as string[],
      };
      tmpSelectedResolutions.push(requestResolution);
    }

    if (val.target.checked) {
      requestResolution.resolutions.push(val.target.value);
    } else {
      requestResolution.resolutions = requestResolution.resolutions.filter(
        (res: string) => res !== val.target.value
      );

      if (requestResolution.resolutions.length === 0) {
        tmpSelectedResolutions = tmpSelectedResolutions.filter(
          (x: any) => x.requestId !== request.id
        );
      }
    }

    setSelectedResolutions(tmpSelectedResolutions);
  };

  const handleConvert = async (request: ConversationRequestDetails) => {
    const conversionResolutions = selectedResolutions.find(
      (x) => x.requestId === request.id
    );

    if (!conversionResolutions) {
      return;
    }

    await props.handleConvert(request.id, conversionResolutions.resolutions);
  };

  const isDisabled = (request: ConversationRequestDetails) => {
    if (request.status !== ConversionStatus.PENDING) {
      return true;
    }

    return false;
  };

  const isConversionPending = (request: ConversationRequestDetails) => {
    return request.status === ConversionStatus.PENDING;
  };

  return (
    <div>
      {props.requests.length === 0 ? (
        <h4 className="empty-list">
          No conversion requests found. Please upload files to start conversion
        </h4>
      ) : (
        props.requests.map((taskGroup) => (
          <div key={taskGroup.id} className="task-group-card">
            <h2>{taskGroup.fileName}</h2>
            <a href={taskGroup.filePath} target="_blank" rel="noreferrer">
              Original image
            </a>
            <p>
              <strong>Created at:</strong>{" "}
              {new Date(taskGroup.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Status:</strong> {taskGroup.status}
            </p>
            {isConversionPending(taskGroup) && (
              <p>
                {resolutionsOptions.map((resolution) => (
                  <label key={resolution}>
                    <input
                      disabled={isDisabled(taskGroup)}
                      type="checkbox"
                      value={resolution}
                      onChange={(val) => handleResolutionChange(taskGroup, val)}
                    />
                    {resolution}
                  </label>
                ))}
                <button
                  className="convert-button"
                  disabled={
                    isDisabled(taskGroup) ||
                    !selectedResolutions.find(
                      (x) => x.requestId === taskGroup.id
                    )?.resolutions.length
                  }
                  onClick={() => handleConvert(taskGroup)}
                >
                  Convert
                </button>
                <span className="info-message">
                  Please pick resolution(s) before starting conversion
                </span>
              </p>
            )}

            {taskGroup.tasks.length > 0 && (
              <div>
                <h3>Finished conversions</h3>
                <ul className="task-list">
                  {taskGroup.tasks.map((task) => (
                    <li key={task.taskId} className="task-item">
                      <p>
                        <strong>Status:</strong> {task.taskStatus}
                      </p>
                      {task.meta?.errorMessage && (
                        <p>
                          <strong>Error:</strong> {task.meta?.errorMessage}
                        </p>
                      )}
                      <p>
                        <strong>Resolution:</strong> {task.resolution}
                      </p>
                      {task.convertedFilePath && (
                        <p>
                          <strong>Converted File:</strong>{" "}
                          <a
                            href={task.convertedFilePath}
                            download={task.convertedFilePath}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Download
                          </a>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ConversionsList;
