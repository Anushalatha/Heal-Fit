import React, { useState } from 'react';
import { FileText, Upload, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { jsPDF } from 'jspdf';

const genAI = new GoogleGenerativeAI("AIzaSyBTuhevuFKGRA4ZFZiHTJJz0kunCnC72Es");

interface AnalysisResult {
  textFindings: string;
  imageFindings: {
    [key: string]: {
      description: string;
      abnormalities: string[];
      measurements: string[];
      confidence: number;
      recommendations: string;
    }
  };
  diagnosis: string;
  recommendations: string;
}

const ReportAnalyzer: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [patientName, setPatientName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageAnalysisProgress, setImageAnalysisProgress] = useState<{ [key: string]: number }>({});

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);

    // Create preview URLs for images
    const urls = selectedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    }).filter(Boolean);
    setPreviewUrls(urls);
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // In a real implementation, we would use pdf.js to extract text
    // For demo purposes, we'll return a mock extraction
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Mock extracted text from ${file.name}`);
      }, 500);
    });
  };

  // Helper function to convert image file to base64
  const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    
    return {
      inlineData: {
        data: (await base64EncodedDataPromise).split(',')[1],
        mimeType: file.type,
      },
    };
  };

  const analyzeContent = async () => {
    if (!files.length || !patientName) {
      setError('Please upload files and enter patient name');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const parts: Part[] = [];

      // Add text prompt part
      parts.push({
        text: `Analyze the following medical documents and generate a comprehensive report for patient "${patientName}". 
        The analysis should include:
        1. Summary of findings from documents
        2. Detailed analysis of any medical images provided, including:
           - Description of visible structures and features
           - Any abnormalities or concerning findings
           - Measurements and dimensions if applicable
           - Confidence level in the analysis
           - Specific recommendations for each image
        3. Overall diagnosis based on all information
        4. Comprehensive recommendations for further actions or treatment`
      });

      // Extract text from PDFs and add to parts
      const pdfFiles = files.filter(file => file.type === 'application/pdf');
      if (pdfFiles.length > 0) {
        const extractedTexts = await Promise.all(
          pdfFiles.map(file => extractTextFromPDF(file))
        );
        
        parts.push({
          text: `Text extracted from PDF documents:\n${extractedTexts.join('\n\n')}`
        });
      }

      // Convert image files to parts and analyze each image
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      const imageAnalysis: AnalysisResult['imageFindings'] = {};

      if (imageFiles.length > 0) {
        for (const [index, file] of imageFiles.entries()) {
          setImageAnalysisProgress(prev => ({
            ...prev,
            [file.name]: 0
          }));

          const imagePart = await fileToGenerativePart(file);
        
          // Add a text part to indicate what the image is
        parts.push({
            text: `Analyzing medical image ${index + 1} of ${imageFiles.length}: ${file.name}`
          });
          
          // Add the image part
          parts.push(imagePart);

          // Analyze the image
          const imageResult = await model.generateContent({
            contents: [{ role: "user", parts: [
              {
                text: `Analyze this medical image in detail. Provide:
                1. A detailed description of visible structures and features
                2. Any abnormalities or concerning findings
                3. Measurements and dimensions if applicable
                4. Your confidence level in the analysis (0-100)
                5. Specific recommendations for this image
                
                Format the response as JSON with the following structure:
                {
                  "description": "detailed description",
                  "abnormalities": ["finding1", "finding2", ...],
                  "measurements": ["measurement1", "measurement2", ...],
                  "confidence": number,
                  "recommendations": "specific recommendations"
                }`
              },
              imagePart
            ]}],
          });

          const response = await imageResult.response;
          const responseText = response.text();
          
          try {
            // Try to parse the response as JSON
            const analysis = JSON.parse(responseText);
            imageAnalysis[file.name] = analysis;
          } catch (e) {
            // If JSON parsing fails, create a structured object from the text
            imageAnalysis[file.name] = {
              description: responseText,
              abnormalities: [],
              measurements: [],
              confidence: 0,
              recommendations: "Unable to parse detailed analysis"
            };
          }

          setImageAnalysisProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
      }
      }

      // Get overall analysis
      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
      });
      
      const response = await result.response;
      const responseText = response.text();
      
      // Parse the AI response into structured sections
      let textFindings = "No document findings available";
      let diagnosis = "No diagnosis available";
      let recommendations = "No recommendations available";
      
      if (responseText.toLowerCase().includes("document findings") || 
          responseText.toLowerCase().includes("text findings")) {
        textFindings = extractSection(responseText, ["document findings", "text findings"]);
      }
      
      if (responseText.toLowerCase().includes("diagnosis")) {
        diagnosis = extractSection(responseText, ["diagnosis", "assessment"]);
      }
      
      if (responseText.toLowerCase().includes("recommendation") || 
          responseText.toLowerCase().includes("treatment")) {
        recommendations = extractSection(responseText, ["recommendation", "treatment", "plan"]);
      }

      const analysisResult: AnalysisResult = {
        textFindings,
        imageFindings: imageAnalysis,
        diagnosis,
        recommendations
      };

      setResult(analysisResult);
    } catch (err) {
      setError('Error analyzing documents. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to extract sections from AI response
  const extractSection = (text: string, sectionNames: string[]): string => {
    const lines = text.split('\n');
    let extractedText = '';
    let capturing = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Check if this line starts a section we're looking for
      const isTargetSection = sectionNames.some(name => 
        line.includes(name.toLowerCase()) && 
        (line.includes(':') || line.endsWith(name.toLowerCase()))
      );
      
      if (isTargetSection) {
        capturing = true;
        extractedText = lines[i]; // Start with the heading line
        continue;
      }
      
      // Check if we've reached the next section (which would end our current section)
      if (capturing) {
        // Look for lines that might be headings of other sections
        const isPotentialHeading = line.length < 50 && 
                                 (line.includes(':') || line.endsWith(':')) &&
                                 !line.includes('  '); // Avoid indented content
        
        if (isPotentialHeading && i > 0 && lines[i-1].trim() === '') {
          break; // End of section
        }
        
        extractedText += '\n' + lines[i];
      }
    }
    
    return extractedText.trim() || "No information available";
  };

  const generatePDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('AI Health Report', 20, 25);

    // Reset text color for content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    // Metadata
    let yPos = 50;
    doc.text(`Patient Name: ${patientName}`, 20, yPos);
    doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, 20, yPos + 10);

    // Content sections
    yPos += 30;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Findings from Documents', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    
    // Handle multi-line text
    const textLines = doc.splitTextToSize(result.textFindings, pageWidth - 40);
    doc.text(textLines, 20, yPos + 10);
    yPos += 10 + (textLines.length * 7);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Image Analysis', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    
    const imageLines = doc.splitTextToSize(result.imageFindings, pageWidth - 40);
    doc.text(imageLines, 20, yPos + 10);
    yPos += 10 + (imageLines.length * 7);

    // Add a new page if needed
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Diagnosis', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    
    const diagnosisLines = doc.splitTextToSize(result.diagnosis, pageWidth - 40);
    doc.text(diagnosisLines, 20, yPos + 10);
    yPos += 10 + (diagnosisLines.length * 7);

    // Add a new page if needed
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Recommendations', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    
    const recommendationLines = doc.splitTextToSize(result.recommendations, pageWidth - 40);
    doc.text(recommendationLines, 20, yPos + 10);

    doc.save(`${patientName}_AI_Health_Report.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Medical Report Analyzer</h1>
        <p className="text-gray-600">
          Upload medical documents and scans for AI analysis and get a comprehensive health report
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-6 h-6 text-indigo-600 mr-2" />
            Upload Medical Files
          </h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  PDF, Word, or Image files
                </span>
              </label>
            </div>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter patient name..."
              />
            </div>

            <button
              onClick={analyzeContent}
              disabled={isAnalyzing || !files.length || !patientName}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Analyze Documents
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center bg-red-50 text-red-700 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                Analysis Results
              </h2>
              <button
                onClick={generatePDF}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Document Findings</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{result.textFindings}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Image Analysis</h3>
                {Object.entries(result.imageFindings).map(([fileName, analysis]) => (
                  <div key={fileName} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{fileName}</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
                        <p className="text-gray-600">{analysis.description}</p>
                      </div>

                      {analysis.abnormalities.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Abnormalities</h5>
                          <ul className="list-disc list-inside text-gray-600">
                            {analysis.abnormalities.map((abnormality, index) => (
                              <li key={index}>{abnormality}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.measurements.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Measurements</h5>
                          <ul className="list-disc list-inside text-gray-600">
                            {analysis.measurements.map((measurement, index) => (
                              <li key={index}>{measurement}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-medium text-gray-700">Confidence Level:</h5>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-600 rounded-full"
                            style={{ width: `${analysis.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{analysis.confidence}%</span>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Recommendations</h5>
                        <p className="text-gray-600">{analysis.recommendations}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Overall Diagnosis</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{result.diagnosis}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{result.recommendations}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportAnalyzer;