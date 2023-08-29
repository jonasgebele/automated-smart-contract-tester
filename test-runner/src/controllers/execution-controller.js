const mongoose = require("mongoose");

const Execution = require("../models/execution");
const StatusEnum = require("../models/enums/status-enum");

const projectController = require("./project-controller");

const constantUtils = require("../utils/constant-utils");
const fsUtils = require("../utils/fs-utils");
const dockerUtils = require("../utils/docker-utils");
const HTTPError = require("../errors/http-error");

const runDockerContainer = async (projectName, zipBuffer) => {
  // Save the current execution and attach it to the project
  const project = await projectController.findProjectByName(projectName, ["_id"]);
  const execution = new Execution({ project: project._id });
  await execution.save();

  // Read the source files from the zip buffer
  const [tempSrcDirPath, executionContents] = await fsUtils.readFromZipBuffer(
    `${projectName}_execution_${execution._id}`, zipBuffer);

  // Run the Docker container to execute the tests
  const [containerName, testOutput] = await dockerUtils.runDockerContainer(projectName, constantUtils.FORGE_COMMANDS.COMPARE_SNAPSHOTS, tempSrcDirPath).finally(async () => {
    await fsUtils.removeDirectory(tempSrcDirPath); // Remove the temp directory after creating the image
  });

  // Update the execution
  return await Execution.findOneAndReplace(
    { _id: execution._id },
    { project: project._id, status: StatusEnum.SUCCESS, dockerContainerName: containerName, contents: executionContents, results: testOutput },
    { new: true }
  )
};

const getExecutionFilesInZipBuffer = async (executionId) => {
  const execution = await Execution.findById(new mongoose.Types.ObjectId(executionId)).select("contents");
  if (!execution) {
    throw new HTTPError(404, `Execution with ID=${executionId} not found!`);
  }

  return fsUtils.writeStringifiedContentsToZipBuffer(`Execution ${executionId}`, execution.contents);
};

module.exports = { runDockerContainer, getExecutionFilesInZipBuffer };
