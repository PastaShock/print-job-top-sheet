// Update and morph of an existing applet that creates a label to make a 11"x8" header to add to print jobs
// printing will not be needed in this script, powershell can take care of that.

const pug = require('pug');
const minimist = require('minimist');
const htmlpdf = require('html-pdf-node');
const hb = require('handlebars');
// will delete the line below
// line below should be re-defined to include a guid for the filename
// const filepath = 'C:\\ps\\label_temp - Copy\\temp.pdf'
const workingDir = 'C:\\ps\\job-top-sheet\\'
const fs = require('fs');
// will keep QR code in the code to potentially add a qr code to the job header
// const QRCode = require('qrcode');
// keep
// const qrcodePath = "C:\\ps\\label_temp\\qrcode.txt";

var args = minimist(process.argv.slice(1), {
	string: ''
})

const JobId = args.jobId;
const DatePlaced = args.datePlaced;
const DateCurrent = args.dateCurrent;
const User = args.user;
const Printer = args.printer;
const OrderType = args.orderType;
const priority = args.priority;

const ordersJSON = fs.readFileSync(workingDir + 'temp.json');

// define the HTML template to use for the header:
footerHTML = `
	<style>
		p {
			font-family: 'labil grotesk';
			font-size: 6pt;
		}
	</style>
	<footer style="display: flex; flex-direction: row; justify-content: space-around; width: 100%;">
		<p>JobId: ${JobId}</p><div style="display: flex;"><p id="pageNumber" class="pageNumber">{{page}}</p><p> of </p><p id="totalPages" class="totalPages">{{pages}}</p></div><p>Template and script created By George Pastushok 2/9/24</p>
	</footer>`

//PDF and file settings:
let options = {
	format: 'letter',
	landscape: true,
	printBackground: true,
	displayHeaderFooter: true,
	footerTemplate: footerHTML,
	margin: {
		top: .25,
		right: .25,
		bottom: .25,
		left: .25
	}
}
const filePath = workingDir + JobId + "-top-sheet.pdf";
const file = { url: workingDir + "temp.html" };

//create function containing the HTML render and the PDF conversion with an async call to print once the fles are complete.

// const fileContents = new Buffer(QRCode.toDataURL('https://www.google.com', url => {return url}),'base64')

// create the qrcode with the QRCode module
// const qrcode = fs.writeFile(qrcodePath,
// 	fileContents,
// 	err => {
// 		if (err) {
// 			resolve();
// 		} else {
// 			reject('error: unable to write png');
// 			console.log(err)
// 		}
// 	})

// const qrcode = QRCode.toString('https://www.google.com', url => {
// 		return url
// 	})

//compile the source code
const compiledFunction = pug.compileFile(workingDir + "template.pug");

const promiseA = new Promise((resolve, reject) => {
	fs.writeFile(workingDir + "temp.html",
		compiledFunction({
			orders: JSON.parse(ordersJSON),
			jobId: JobId,
			datePlaced: DatePlaced,
			dateCurrent: DateCurrent,
			user: User,
			printer: Printer,
			orderType: OrderType,
			priority: priority
			// QuickCode: qrcodePath
		}),
		'utf-8',
		function (err) {
			if (!err) {
				resolve();
			} else {
				reject('error: unable to write top sheet PDF')
				console.log(err);
			}
		})
})

//print to pdf
const promiseB = promiseA.then(
	htmlpdf.generatePdf(
		// URL / dir location of file
		file,
		// options defined earlier from ref: https://github.com/mrafiqk/html-pdf-node
		options,
		// callback:
		function (err) {
			// if error, log to console:
			if (err) return console.log(err);
			// file is created at this point but not written to disk
		}).then(
			// this writes to disk
			pdfBuffer => {
				fs.writeFile(filePath, pdfBuffer, 'utf-8',
					function (err) {
						if (err) return console.log(err);
					})
			}
		)
)

Promise.all([promiseA, promiseB]).then(
	// log to the console that the whole task was completed: (optional)
	// console.log('job-top-sheet created!'),
)