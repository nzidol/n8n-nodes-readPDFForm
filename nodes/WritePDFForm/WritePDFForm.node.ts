import { IExecuteFunctions } from 'n8n-core';

import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {
	fillForm
} from './GenericFunctions';

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
				displayName: 'JSON Property',
				name: 'jsonPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the JSON property from which to write to the PDF file',
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
				const dataPropertyName = this.getNodeParameter('dataPropertyName', itemIndex) as string;
				const filePath = this.getNodeParameter('filePath', itemIndex) as string;
				const jsonPropertyName = this.getNodeParameter('jsonPropertyName', itemIndex) as string;

				if (item.json === undefined) {
					item.json = {};
				}

				const jsonData = this.helpers.returnJsonArray({jsonPropertyName});

				let data;

				try {
					data = await PDFWrite(jsonData) as Buffer;
				} catch (error) {
					if (error.code === 'ENOENT') {
						throw new NodeOperationError(
							this.getNode(),
							`The pdf file could not be found.`,
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

				newItem.binary![dataPropertyName] = await this.helpers.prepareBinaryData(data, filePath);
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

async function PDFWrite(dataBuffer: {}) {
	const isDebugMode = false;

	const json =
		[	{"name": "BusinessInformation.BusinessName", "type": "text", "value":"dave" },
			{"name": "LicenseInformation.LicenseYear", "type": "text", "value":"2023" },
			{"name": "LicenseInformation.AreaCouncilCode", "type": "dropdown", "value":"West Tanna Area Council: NAT011WAR" },
			{"name": "LicenseInformation.CommencementDate", "type": "text", "value":"Jan 2024" },
			{"name": "LicenseInformation.ApplicationTypeNew", "type": "radiogroup", "value":"2" },
			{"name": "BusinessInformation.OptionVATExempted", "type": "checkbox", "value":"Yes" },
			{"name": "LicenseApplication.DateApplicationReceived", "type": "text", "value":"11/12/2022" },
		];

	const ret = fillForm("", json);
 	return ret;
}
