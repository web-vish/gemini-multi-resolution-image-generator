<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Multi-Resolution AI Image Generator

## Summary

This web application is a powerful tool that leverages the Google Gemini API to create a seamless "image-to-image" generation experience. Users can upload an initial image, and the application will intelligently analyze it to generate a detailed text prompt. This prompt can then be used to generate a series of new, unique images in various popular aspect ratios (e.g., square, landscape, portrait).

The generated images are displayed in an interactive gallery, where they can be viewed in a fullscreen overlay or downloaded directly.

## Key Features

-   **Image Upload**: Simple drag-and-drop or file-picker interface to upload a source image.
-   **AI-Powered Prompt Generation**: Uses the `gemini-2.5-flash` model to analyze the uploaded image and automatically generate a descriptive prompt.
-   **Customizable Prompt**: Users can review and refine the AI-generated prompt before generating new images.
-   **Aspect Ratio Selection**: Choose from a predefined list of common aspect ratios (1:1, 16:9, 9:16, etc.) to generate images for different use cases.
-   **High-Quality Image Generation**: Employs the `imagen-4.0-generate-001` model to create high-quality, contextually relevant images from the text prompt.
-   **Interactive Gallery**: Displays the resulting images in a clean, responsive grid.
-   **Fullscreen Viewer**: Click on any generated image to view it in a distraction-free fullscreen modal.
-   **Direct Downloads**: Easily download any of the generated images with a single click.

## Technical Details

The application follows a two-step AI workflow:

1.  **Image Analysis (Image-to-Text)**: When a user uploads an image, it is converted to a base64 string on the client side. This data is sent to the `gemini-2.5-flash` model with a request to describe the image's visual elements, style, and composition. The model's text response populates the prompt input field.
2.  **Image Generation (Text-to-Image)**: The user refines the prompt and selects their desired aspect ratios. For each selected ratio, an asynchronous API call is made to the `imagen-4.0-generate-001` model. The responses, containing the base64-encoded image data, are then rendered in the results gallery.

The entire application is a single-page app built with React, ensuring a fast and responsive user experience without page reloads.

## Technologies Used

-   **Frontend Framework**: **React** with TypeScript
-   **Styling**: Modern CSS3 with Custom Properties, Flexbox, and Grid for a responsive, dark-themed UI.
-   **AI & APIs**:
    -   **Google Gemini API** (`@google/genai` library)
    -   **Model for Image Analysis**: `gemini-2.5-flash`
    -   **Model for Image Generation**: `imagen-4.0-generate-001`
-   **Build/Module System**: The project uses an `importmap` for modern, browser-native ES module handling.


# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bundled/react-example

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
