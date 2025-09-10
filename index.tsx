/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {GoogleGenAI} from '@google/genai';
import {useState} from 'react';
import ReactDOM from 'react-dom/client';

// Helper function to convert file to base64 for the Gemini API
// FIX: Add type `File` to the `file` parameter and specify the Promise resolves to a `string`.
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    // FIX: Cast `reader.result` to string before calling `split`.
    // `reader.result`'s type is `string | ArrayBuffer | null`, but `readAsDataURL` guarantees a string result.
    // This cast fixes the error on line 13. By ensuring the promise resolves with a `string`, it also
    // fixes the type mismatch for the Gemini API call on line 56.
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedAspectRatios, setSelectedAspectRatios] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' },
  ];

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage('Analyzing image...');
    setError(null);
    setUploadedImage(URL.createObjectURL(file));
    setUserPrompt('');
    setGeneratedImages([]);
    setSelectedAspectRatios([]);

    try {
      const imagePart = await fileToGenerativePart(file);
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, { text: "Describe this image for a text-to-image AI. Be detailed and focus on the visual elements, style, and composition." }] }
      });
      setUserPrompt(response.text);
    } catch (e) {
      console.error(e);
      setError('Failed to generate image description. Please try another image.');
      setUploadedImage(null);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const handleAspectRatioChange = (aspectRatio) => {
      setSelectedAspectRatios(prev => 
          prev.includes(aspectRatio) 
              ? prev.filter(r => r !== aspectRatio) 
              : [...prev, aspectRatio]
      );
  };

  const handleGenerateClick = async () => {
    if (!userPrompt || selectedAspectRatios.length === 0) {
        setError('Please provide a prompt and select at least one aspect ratio.');
        return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Generating images...');
    setError(null);
    setGeneratedImages([]);

    try {
      const promises = selectedAspectRatios.map(aspectRatio => 
        ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: userPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
          },
        })
      );

      const results = await Promise.all(promises);
      
      const images = results.map((response, index) => ({
          src: `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`,
          aspectRatio: selectedAspectRatios[index]
      }));

      setGeneratedImages(images);

    } catch (e) {
      console.error(e);
      setError('Failed to generate images. Please check your prompt or try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="container">
        {fullscreenImage && (
          <div className="fullscreen-modal" onClick={() => setFullscreenImage(null)}>
              <button className="close-fullscreen-btn" onClick={() => setFullscreenImage(null)} aria-label="Close fullscreen view">&times;</button>
              <img src={fullscreenImage} alt="Fullscreen generated image" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        <header>
            <h1>Multi-Resolution Image Generator</h1>
            <p>Upload an image to get a descriptive prompt, then generate new versions in various aspect ratios.</p>
        </header>

        <main>
            <div className="upload-section">
                <h2>1. Upload Image</h2>
                <input type="file" id="image-upload" accept="image/*" onChange={handleImageUpload} disabled={isLoading} aria-label="Upload an image"/>
                <label htmlFor="image-upload" className="upload-label">
                    {uploadedImage ? <img src={uploadedImage} alt="Uploaded preview" /> : 'Click or drag to upload'}
                </label>
            </div>

            {isLoading && !generatedImages.length && (
              <div style={{textAlign: 'center'}}>
                <div className="loader"></div>
                <p>{loadingMessage}</p>
              </div>
            )}

            {uploadedImage && !isLoading && (
                <div className="config-section">
                    <h2>2. Refine Prompt & Select Ratios</h2>
                    <textarea 
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="Image description will appear here..."
                        aria-label="Image description prompt"
                        rows={5}
                        disabled={isLoading}
                    />
                    
                    <div className="aspect-ratio-selector">
                        {aspectRatios.map(({ value, label }) => (
                            <button 
                                key={value}
                                className={`aspect-ratio-btn ${selectedAspectRatios.includes(value) ? 'selected' : ''}`}
                                onClick={() => handleAspectRatioChange(value)}
                                disabled={isLoading}
                                aria-pressed={selectedAspectRatios.includes(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <button className="generate-btn" onClick={handleGenerateClick} disabled={isLoading || !userPrompt || selectedAspectRatios.length === 0}>
                        Generate Images
                    </button>
                </div>
            )}

            {error && <p className="error">{error}</p>}

            {generatedImages.length > 0 && (
                <div className="results-section">
                    <h2>Results</h2>
                    <div className="gallery">
                        {generatedImages.map((image, index) => (
                            <div key={index} className="gallery-item">
                                <img 
                                  src={image.src} 
                                  alt={`Generated image with aspect ratio ${image.aspectRatio}`} 
                                  style={{aspectRatio: Number(image.aspectRatio.split(':')[0]) / Number(image.aspectRatio.split(':')[1])}}
                                  onClick={() => setFullscreenImage(image.src)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => { if (e.key === 'Enter') setFullscreenImage(image.src); }}
                                  aria-label={`View image ${image.aspectRatio} in fullscreen`}
                                />
                                <div className="gallery-item-footer">
                                  <p>{image.aspectRatio}</p>
                                  <a 
                                      href={image.src} 
                                      download={`generated-${image.aspectRatio.replace(':', 'x')}.jpeg`}
                                      className="download-link"
                                  >
                                      Download
                                  </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>

        <footer>
            <p>Powered by Gemini API</p>
        </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);