import { IExecuteFunctions } from 'n8n-core';

import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import PDFJS from 'pdfjs-dist';

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
}
async function PDF(dataBuffer: any) {
    var isDebugMode = false;

		interface InfoObject {
			[key: string]: any
		}
		let infoObj: InfoObject = {};
    let ret = {
        numpages: 0,
        numrender: 0,
        info: infoObj,
        metadata: {},
        text: "",
        version: "",
		formData: null
    };

    ret.version = PDFJS.version;

    let loadingTask = PDFJS.getDocument(dataBuffer);
  	let doc = await loadingTask.promise;
	  ret.numpages = doc.numPages;

		let metaData = await doc.getMetadata().catch(function(err) {
			return null;
		});

		ret.info = metaData ? metaData.info : {};
		ret.metadata = metaData ? metaData.metadata : {};

		if (ret.info != null && ret.info.IsAcroFormPresent) {
			let formData = await doc.getFieldObjects().catch(function(err: any) {
			return err;
			});
			ret.formData = formData ? formData : null;
		};

		let counter = 0;
		counter = counter > doc.numPages ? doc.numPages : counter;

		ret.text = "";

		for (var i = 1; i <= counter; i++) {
			let pageText = doc.getPage(i).then((pageData: any) => render_page(pageData)).catch((err)=>{
				// todo log err using debug
				debugger;
				return "";
			});

			ret.text = `${ret.text}\n\n${pageText}`;
		}

		ret.numrender = counter;
		doc.destroy();

		return ret;
	};

	async function render_page(pageData: {
			getTextContent: (arg0: {
				//replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
				normalizeWhitespace: boolean;
				//do not attempt to combine same line TextItem's. The default value is `false`.
				disableCombineTextItems: boolean;
			}) => Promise<any>;
		}) {

    let render_options = {
        //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
        normalizeWhitespace: false,
        //do not attempt to combine same line TextItem's. The default value is `false`.
        disableCombineTextItems: false
    }

    const textContent = await pageData.getTextContent(render_options);
		let lastY, text = '';
		for (let item of textContent.items) {
			if (lastY == item.transform[5] || !lastY) {
				text += item.str;
			}
			else {
				text += '\n' + item.str;
			}
			lastY = item.transform[5];
		}
		return text;
}
