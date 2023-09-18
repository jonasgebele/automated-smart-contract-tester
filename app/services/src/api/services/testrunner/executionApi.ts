import Logger from '@logging/Logger';

import { IProjectConfig } from '@models/schemas/ProjectConfigSchema';

import { TestRunnerApiEndpointConfig } from '@api/config/ApiEndpointConfig';
import type ContainerExecutionResponse from '@api/services/testrunner/types/ContainerExecutionResponse';
import ContainerExecutionStatus from '@api/services/testrunner/enums/ContainerExecutionStatus';

import type { RequestFile } from '@utils/routerUtils';
import apiFormDataUtils from '@api/services/testrunner/utils/apiFormDataUtils';
import apiErrorUtils from '@api/services/testrunner/utils/apiErrorUtils';

/**
 * Transfers source files to the Test Runner service for test execution in the specified project.
 *
 * @param {string} projectName - The name of the project in which the source files will be tested.
 * @param {RequestFile} requestFile - The file containing project data.
 * @param {IProjectConfig} [config] - An optional project configuration (omitting "tests" is acceptable as it will be overridden).
 * @returns {Promise<ContainerExecutionResponse>} A Promise that resolves to the container execution data from the Test Runner service.
 * @throws {AppError} If an error occurs during the upload, or if the execution status is not successful.
 */
const executeSubmission = async (
  projectName: string, requestFile: RequestFile, config?: IProjectConfig
): Promise<ContainerExecutionResponse> => {
  Logger.info(`Initiating submission upload for the ${projectName} project to the Test Runner service for Docker image execution.`);

  const requestConfig = TestRunnerApiEndpointConfig.CONFIG_TEST_EXECUTION(projectName);
  requestConfig.url = `${requestConfig.url}?containerTimeout=${config?.containerTimeout || ''}`;

  const submissionExecutionResponse = await apiFormDataUtils.sendFormData<ContainerExecutionResponse>(
    requestConfig,
    requestFile,
    {
      successMessage: `The submission for the ${projectName} project has been successfully uploaded to the Test Runner service, and the Docker image has been executed.`,
      errorMessage: `An error occurred while uploading the submission for the ${projectName} project to the Test Runner service.`
    },
    config?.testExecutionArguments && { execArgs: config?.testExecutionArguments }
  );

  // Handle error if the status is not success
  if (submissionExecutionResponse.status !== ContainerExecutionStatus.SUCCESS) {
    throw apiErrorUtils.handleContainerError(submissionExecutionResponse);
  }

  return submissionExecutionResponse;
};

export default { executeSubmission };
