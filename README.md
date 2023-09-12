### Description

Automate the process of downloading BPMN models from the Camunda Web Modeler API using this GitHub Action. This action is part of a suite of actions designed to streamline the CI/CD pipeline for managing BPMN process models.

### Usage

To use this action in your workflow, follow these steps:

1. **Set Up Camunda API Access:**

   Ensure you have an access token for the [Camunda Modeler API](https://docs.camunda.io/docs/next/apis-tools/web-modeler-api/)


2. Set up a `CAMUNDA_API_TOKEN` secret in your GitHub repository.

You can simply refer to this GitHub action in any GitHub workflow.:

   ```yaml
         - name: Download BPMN Models
           uses: your-username/download-bpmn-models-action@v1
           with:
             tag: 'your-tag-name'
             destination: 'path/to/destination'
             token: ${{ secrets.CAMUNDA_API_TOKEN }}
