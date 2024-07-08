import React, { useState } from "react";
import { ConversationRequestDetails } from "./Interfaces";

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
    // request.status = "in-progress";
    const conversionResolutions = selectedResolutions.find(
      (x) => x.requestId === request.id
    );

    if (!conversionResolutions) {
      return;
    }

    await props.handleConvert(request.id, conversionResolutions.resolutions);
  };

  const isDisabled = (request: ConversationRequestDetails) => {
    if (request.status !== "pending") {
      return true;
    }

    return false;
  };

  const isConversionPending = (request: ConversationRequestDetails) => {
    return request.status === "pending";
  };

  return (
    <div className="container">
      {props.requests.map((taskGroup) => (
        <div key={taskGroup.id} className="task-group-card">
          <h2>{taskGroup.fileName}</h2>
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
                disabled={isDisabled(taskGroup)}
                onClick={() => handleConvert(taskGroup)}
              >
                Convert
              </button>
            </p>
          )}

          {taskGroup.tasks.length > 0 && (
            <div>
              <h3>Finished conversions</h3>
              <ul className="task-list">
                {taskGroup.tasks.map((task) => (
                  <li key={task.taskId} className="task-item">
                    <p>
                      <strong>Resolution:</strong> {task.resolution}
                    </p>
                    <p>
                      <strong>Converted File:</strong>{" "}
                      <a
                        href={task.convertedFilePath}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversionsList;
