import {getInput, setFailed} from "@actions/core";
import axios, {AxiosResponse} from 'axios';
import path from "path";
import fsPromises from 'fs/promises';

const MODELER_API_TOKEN = getInput('token');
const TAG = getInput('tag');
const DESTINATION = getInput('destination');
let FILENAMES: string[] = [];


const getFileIdsByMilestoneTag = async () => {
    const urlMilestone = 'https://modeler.cloud.camunda.io/api/beta/milestones/search';
    const body = {
        "filter": {
            "id": null, "name": TAG, "created": null, "createdBy": {
                "id": null, "name": null
            }, "updated": null, "updatedBy": {
                "id": null, "name": null
            }
        }, "sort": [{
            "field": "string", "direction": "ASC"
        }], "page": 0, "size": 50
    };

    try {
        const response = await axios.post(urlMilestone, body, {
            headers: {
                'Content-Type': 'application/json', 'Authorization': `Bearer ${MODELER_API_TOKEN}`
            }
        });

        const bpmnModelIds = response.data.items.map((item: any) => item.fileId);

        return bpmnModelIds;
    } catch (error) {
        setFailed(error instanceof Error ? error.message : 'An error occurred');
    }
}


const getFileContent = async (fileIds: string[]) => {
    const baseUrl = 'https://modeler.cloud.camunda.io/api/beta/files/';

    try {
        const responses = await Promise.all(fileIds.map(async (id) => {
            const url = `${baseUrl}${id}`;
            try {
                const response = await axios.get(url, {
                    headers: {
                        'Content-Type': 'application/json', 'Authorization': `Bearer ${MODELER_API_TOKEN}`,
                    },
                }) as AxiosResponse<any>;

                return response.data;
            } catch (error) {

                setFailed(error instanceof Error ? error.message : `Error fetching file with id ${id}: error.message`);
                return null;
            }
        }));

        const validFileContent = responses.filter((data) => data !== null);

        FILENAMES = validFileContent.map((data) => data.metadata.name);

        return validFileContent;
    } catch (error) {

        setFailed(error instanceof Error ? error.message : `Error fetching files`);

    }
};


interface FileContent {
    metadata: {
        name: string;
    };
    content: string;
}


const downloadFiles = async (data: string, destinationFolderPath: string, fileName: string): Promise<void> => {
    try {

        const destinationFilePath = path.join(destinationFolderPath, `${fileName}.bpmn`);
        await fsPromises.mkdir(destinationFolderPath, {recursive: true});
        await fsPromises.writeFile(destinationFilePath, data);

        console.log(`File content saved to: ${destinationFilePath}`);
    } catch (error) {
        setFailed(error instanceof Error ? error.message : 'An error occurred');
    }
};

const runWorkflow = async () => {

    try {

        console.log(`Fetching files with tag ${TAG}`);

        const fileIds = await getFileIdsByMilestoneTag();
        const fileContent = await getFileContent(fileIds) as FileContent[];

        for (const content of fileContent) {
            const destinationFolderPath = path.join(process.env.GITHUB_WORKSPACE || '', DESTINATION);
            await downloadFiles(content.content, destinationFolderPath, content.metadata.name);
        }


    } catch (error) {
        setFailed(error instanceof Error ? error.message : 'An error occurred');
    }

}

runWorkflow()
    .then(() => {
        console.log("Workflow completed successfully.");
    })
    .catch((error) => {
        console.error("Workflow failed:", error);
    });