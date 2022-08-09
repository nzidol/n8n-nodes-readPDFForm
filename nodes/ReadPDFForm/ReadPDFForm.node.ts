import { IExecuteFunctions } from 'n8n-core';

import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import PDFJS from 'pdfjs-dist';
import { TextContent, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

export class ReadPDFForm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Read PDF Form data',
		name: 'readPDFForm',
		icon: 'fa:file-pdf',
		group: ['input'],
		version: 1,
		description: 'Reads a PDF Form and extracts its content',
		defaults: {
			name: 'Read PDF Form',
			color: '#003355',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property from which to read the PDF file',
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
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;

				if (item.binary === undefined) {
					item.binary = {};
				}

				const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
				returnData.push({
					binary: item.binary,
					json: await PDF(binaryData),
				});

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

const DEFAULT_OPTIONS = {
		max: 0,
};

async function PDF(dataBuffer: {}) {
	const isDebugMode = false;

	const ret = {
		numpages: 0,
		numrender: 0,
		info: {},
		metadata: {},
		text: "",
		version: "",
		formData: {},
	};

	ret.version = PDFJS.version;

	const loadingTask = PDFJS.getDocument(dataBuffer);
	const doc = await loadingTask.promise;
	ret.numpages = doc.numPages;

	const metaData = await doc.getMetadata().catch((err) => {
		return err;
	});

	ret.info = metaData ? metaData.info : {};
	ret.metadata = metaData ? metaData.metadata : {};

	if (ret.info != null && metaData.info.IsAcroFormPresent) {
		const formData = await doc.getFieldObjects().catch((err) => {
			return err;
		});
		ret.formData = formData ? formData : {};
	}

	let counter = 0;
	counter = counter > doc.numPages ? doc.numPages : counter;

	ret.text = "";

	for (let i = 1; i <= counter; i++) {
		const pageText = doc.getPage(i).then((pageData) =>
		render_page(pageData)).catch((err)=>{
			return err;
		});
		ret.text = `${ret.text}\n\n${pageText}`;
	}
	ret.numrender = counter;
	doc.destroy();
	return ret;
}

async function render_page(pageData: {
		getTextContent: () => Promise<TextContent>;
	}) {

	const textContent = await pageData.getTextContent();
	let lastY, text = '';
	for ( const item of textContent.items) {
		if (lastY === (item as TextItem).transform[5] || !lastY) {
			text += (item as TextItem).str;
		}
		else {
			text += '\n' + (item as TextItem).str;
		}
		lastY = (item as TextItem).transform[5];
	}
	return text;
}
