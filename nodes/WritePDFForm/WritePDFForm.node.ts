import { IExecuteFunctions } from 'n8n-core';

import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {
	FieldArrayJson, fillForm
} from './GenericFunctions';

import { readFile as fsReadFile } from 'fs/promises';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export class WritePDFForm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Write PDF Form data',
		name: 'writePDFForm',
		icon: 'fa:file-pdf',
		group: ['input'],
		version: 1,
		description: 'Writes data into a PDF Form.',
		defaults: {
			name: 'Write PDF Form',
			color: '#003355',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'PDF Filename',
				name: 'pdfFileName',
				type: 'string',
				default: 'form.pdf',
				required: true,
				description: 'Name of the PDF form which to write the data to',
			},
			{
				displayName: 'Output File',
				name: 'filePath',
				type: 'string',
				default: 'report.pdf',
				required: true,
				description: 'Name of the PDF file to write the output to',
			},
			{
				displayName: 'JSON Property Name',
				name: 'jsonPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the JSON property to read the data from',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < length; itemIndex++) {

			try{

				item = items[itemIndex];

				const pdfFileName = this.getNodeParameter('pdfFileName', itemIndex) as string;
				const filePath = this.getNodeParameter('filePath', itemIndex) as string;
				const jsonPropertyName = this.getNodeParameter('jsonPropertyName', itemIndex) as string;

				let pdfFile;
				try {
					pdfFile = (await fsReadFile(pdfFileName));
				} catch (error) {
					if (error.code === 'ENOENT') {
						throw new NodeOperationError(
							this.getNode(),
							`The file "${pdfFileName}" could not be found.`,
						);
					}

					throw error;
				}

				if (item.json === undefined) {
					item.json = {};
				}

				const jsonData = item.json.data as unknown as FieldArrayJson;

				if ( jsonData[0].type === undefined ||
						 jsonData[0].name === undefined || jsonData[0].value === undefined) {
					throw new NodeOperationError(
						this.getNode(),
						`The json data has the wrong structure (name/type/value).`,
					);
				}

				let data;
				try {
					const raw = await PDFWrite(pdfFile, jsonData );
					data = Buffer.from(raw);
				} catch (error) {
					if (error.code === 'ENOENT') {
						throw new NodeOperationError(
							this.getNode(),
							`The report pdf could not be generated.`,
						);
					}
					throw error;
				}

				const newItem: INodeExecutionData = {
					json: item.json,
					binary: {},
					pairedItem: {
						item: itemIndex,
					},
				};
				newItem.binary![filePath] = await this.helpers.prepareBinaryData(data, filePath);
				returnData.push(newItem);

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}
				throw error;
			}
		}
		return this.prepareOutputData(returnData);
	}
}

async function PDFWrite(dataBuffer: ArrayBuffer, json: FieldArrayJson) {
	const isDebugMode = false;

	const ret = fillForm(dataBuffer, json);
 	return ret;
}
