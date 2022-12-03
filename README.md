# n8n-nodes-WritePDFForm

Writes json data into input fields in a PDF Form. Input data should be structured as:
`[
  {
    name: 'FieldName',
    type: 'text',
    value: 'Info to display'
  },
  {
    name: '...',
    type: 'text',
    value: '...'
  },
	....
]`
Type can be one of [text,dropdown,radiogroup,checkbox].

Use n8n-nodes-ReadPDFForm to find field names and types.
PDF Forms can be easily developed with LibreOffice Writer (or your own preferred tool).

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
