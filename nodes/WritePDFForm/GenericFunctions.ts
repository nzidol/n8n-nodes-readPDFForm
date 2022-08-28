import { PDFDocument } from 'pdf-lib';

type FieldArrayJson = Array<{name: string, type: string, value: string}>;

export async function fillForm(formUrl: "", jsonData: FieldArrayJson) {

	const formPdfBytes = await fetch(formUrl).then(res => res.arrayBuffer());
	const pdfDoc = await PDFDocument.load(formPdfBytes);
	const form = pdfDoc.getForm();

	for (const field of jsonData) {
		if (field.type === "text") {
				const thisTextField = form.getTextField(field.name);
				thisTextField.setText(field.value);
		} else if(field.type === "dropdown") {
			const thisDropDownField = form.getDropdown(field.name);
				thisDropDownField.select(field.value);
		} else if(field.type === "radiogroup") {
			const thisRadioGroupField = form.getRadioGroup(field.name);
				thisRadioGroupField.select(field.value);
		} else if(field.type === "checkbox") {
			const thisCheckBoxField = form.getCheckBox(field.name);
				if (field.value === "Yes") {
					thisCheckBoxField.check();
				} else {
					thisCheckBoxField.uncheck();
				}
		}
	}

	const pdfBytes = await pdfDoc.save();
	return pdfBytes;
}
