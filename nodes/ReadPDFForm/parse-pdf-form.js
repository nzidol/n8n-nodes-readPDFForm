var PDFJS = null;

const DEFAULT_OPTIONS = {
    pagerender: render_page,
    max: 0,
    //check https://mozilla.github.io/pdf.js/getting_started/
    version: 'v1.10.100'
}

async function PDF(dataBuffer, options) {
    var isDebugMode = false;

    let ret = {
        numpages: 0,
        numrender: 0,
        info: null,
        metadata: null,
        text: "",
        version: null,
        formData: null
    };

    if (typeof options == 'undefined') options = DEFAULT_OPTIONS;
    if (typeof options.pagerender != 'function') options.pagerender = DEFAULT_OPTIONS.pagerender;
    if (typeof options.max != 'number') options.max = DEFAULT_OPTIONS.max;
    if (typeof options.version != 'string') options.version = DEFAULT_OPTIONS.version;
    if (options.version == 'default') options.version = DEFAULT_OPTIONS.version;

    PDFJS = PDFJS ? PDFJS : require(`./pdf.js/${options.version}/build/pdf.js`);

    ret.version = PDFJS.version;

    // Disable workers to avoid yet another cross-origin issue (workers need
    // the URL of the script to be loaded, and dynamically loading a cross-origin
    // script does not work).
    PDFJS.disableWorker = true;
    let doc = await PDFJS.getDocument(dataBuffer);
    ret.numpages = doc.numPages;

    let metaData = await doc.getMetadata().catch(function(err) {
        return null;
    });

    ret.info = metaData ? metaData.info : null;
    ret.metadata = metaData ? metaData.metadata : null;

    if (ret.info.IsAcroFormPresent)
      ret.formData = doc.getFieldObjects()
    ;
    let counter = options.max <= 0 ? doc.numPages : options.max;
    counter = counter > doc.numPages ? doc.numPages : counter;

    ret.text = "";

    for (var i = 1; i <= counter; i++) {
        let pageText = await doc.getPage(i).then(pageData => options.pagerender(pageData)).catch((err)=>{
            // todo log err using debug
            debugger;
            return "";
        });

        ret.text = `${ret.text}\n\n${pageText}`;
    }

    ret.numrender = counter;
    doc.destroy();

    return ret;
}

module.exports = PDF;
