import React, { useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import SignaturePad from 'react-signature-pad-wrapper';
import { Button } from 'antd';

const MySignatureComponent = () => {
  const pdfInputRef = useRef(null);
  const signaturePadRef = useRef(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [modifiedPdfURL, setModifiedPdfURL] = useState(null);
  const [signaturePresent, setSignaturePresent] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const pdfBytes = new Uint8Array(event.target.result);
        setPdfPreview(pdfBytes);

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const page = pdfDoc.getPage(0); // Assuming the signature will be added to the first page

        setPageWidth(page.getWidth());
        setPageHeight(page.getHeight());

        // Set the width and height of the SignaturePad dynamically
        signaturePadRef.current.setWidth(page.getWidth());
        signaturePadRef.current.setHeight(page.getHeight());
      };
      reader.readAsArrayBuffer(file);
    } else {
      setPdfPreview(null);
    }
  };

  const handleSave = async () => {
    if (!pdfPreview) {
      alert('Please upload a PDF file first.');
      return;
    }

    const pdfDoc = await PDFDocument.load(pdfPreview);
    let page = pdfDoc.getPage(0); // Assuming the signature will be added to the first page

    if (signaturePresent) {
      page.deletePage(0); // Remove the existing page with the signature
      page = pdfDoc.addPage(); // Add a new blank page
    }

    const signatureImage = signaturePadRef.current.toDataURL();
    const signatureBytes = Uint8Array.from(atob(signatureImage.split(',')[1]), (c) =>
      c.charCodeAt(0)
    );

    const embeddedSignature = await pdfDoc.embedPng(signatureBytes);
    const { width: signatureWidth, height: signatureHeight } = embeddedSignature.scale(0.5);

    const xPosition = (pageWidth - signatureWidth) / 2;
    const yPosition = (pageHeight - signatureHeight) / 2;

    // Draw the signature onto the PDF
    page.drawImage(embeddedSignature, {
      x: xPosition,
      y: yPosition,
      width: signatureWidth,
      height: signatureHeight,
    });

    const modifiedPdfBytes = await pdfDoc.save();

    // Generate a temporary URL for the modified PDF data
    const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    setModifiedPdfURL(url);
    setSignaturePresent(true); // Set signaturePresent to true
  };

  const handleClearSignature = () => {
    signaturePadRef.current.clear(); // Clear the signature pad
    setSignaturePresent(false); // Reset signaturePresent to false
  };

  const handleCopySignature = async () => {
    await handleSave(); // Call handleSave to save the signature to the PDF
    alert('Signature copied to PDF!');
  };

  return (
    <div style={{ width: '800px', margin: 'auto' }}>
      <input type="file" accept=".pdf" onChange={handleFileChange} ref={pdfInputRef} />
      {pdfPreview && (
        <div>
          <iframe src={`data:application/pdf;base64,${btoa(new Uint8Array(pdfPreview).reduce((data, byte) => data + String.fromCharCode(byte), ''))}`} width="600" height="800" />
        </div>
      )}
      <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '10px' }}>
        <SignaturePad ref={signaturePadRef} width={pageWidth} height={pageHeight} />       
      </div>
      <div style={{margin: '5px'}}>
        <Button onClick={handleClearSignature}>Clear Signature</Button>
        <Button onClick={handleSave}>Save Signature to PDF</Button>
        <Button onClick={handleCopySignature}>Copy Signature to PDF</Button>
      </div>
      {modifiedPdfURL && (
        <div>
          <iframe src={modifiedPdfURL} width="600" height="800" />
        </div>
      )}
    </div>
  );
}

export default MySignatureComponent;
