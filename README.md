# n8n-nodes-readpdfform

Extends the base ReadPDf node with the ability to extract PDF Form data. 
To do this I removed the pdf-parse library and work directly with more recent version of pdfjs-dist.

## Create PDF Form
PDF Forms can be easily created with LibreOffice writer see [documentfoundation](https://wiki.documentfoundation.org/Videos/Create_a_fillable_form_in_Writer).
There are still some small UI issues that can be frustrating but for most applications it does work.

## Extract Data
I uses n8n to store the data into MongoDB and develop admin UI's with Appsmith so a bit of structure to the data is usefull. 
Although LibreOffice supports sub-forms to structure the data, export to PDF seems to loose that information. But using dot notation for fieldnames (for instance subdocument.arrayname.arrayindex.fieldname) does work and allows easy creation of a strucutered json document in n8n. The PDF form data will contain entries for the parent names and "KidIds", if you iterate through the fields and there is no "value" field for the key you need to create an empty object for the subdocument or an empty array if there is an array index. If there is a value add the element to the subdocument or array, the parents and kids are in the correct order for this to work.

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
