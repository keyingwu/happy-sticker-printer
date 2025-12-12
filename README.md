# 🖨️ Happy Sticker Printer

> **Text-to-Sticker Magic powered by Google Gemini.**

Turn your ideas into beautiful, die-cut stickers in seconds! Happy Sticker Printer is a web application that uses advanced AI to generate unique sticker designs based on your text prompts. Whether you want a single custom sticker or a whole sheet of themed designs, this virtual printer delivers.

## ✨ Features

-   **🎨 AI-Powered Generation**: Uses **Google Gemini 2.5 Flash** & **Nano Banana Pro** models to create high-quality, creative sticker art.
-   **🖼️ Diverse Styles**: Choose from over 20+ artistic styles including *Classic Vector*, *Kawaii Chibi*, *Neon Cyberpunk*, *Vintage Badge*, and more.
-   **✂️ Die-Cut Simulation**: Automatically removes backgrounds and adds a white border for that authentic sticker look.
-   **📦 Batch Mode**: Generate a 3x3 sticker sheet (9 stickers) at once for rapid ideation.
-   **🖱️ Interactive Desk**: Drag, drop, rotate, and arrange your printed stickers on a virtual desk.
-   **💾 Easy Export**:
    -   Download individual stickers as transparent PNGs.
    -   Download your entire desk collection as a ZIP file.
    -   Smart filename generation (supports Chinese/Unicode characters).
-   **👀 Zoom & Inspect**: Hover and click tools to zoom in on details before downloading.

## 🚀 Getting Started

### Prerequisites

-   **Node.js** (v18 or higher)
-   **pnpm** (recommended) or npm/yarn
-   **Google Gemini API Key** (Get one [here](https://aistudio.google.com/app/apikey))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/happy-sticker-printer.git
    cd happy-sticker-printer
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Configure Environment:**
    Create a `.env.local` file in the root directory and add your API key:
    ```env
    VITE_GEMINI_API_KEY=your_actual_api_key_here
    ```

4.  **Run Locally:**
    ```bash
    pnpm run dev
    ```
    Open `http://localhost:5173` in your browser.

## 📖 Usage

1.  **Enter a Prompt**: Type what you want (e.g., "A cute astronaut cat eating pizza").
2.  **Select Options**:
    -   **Model**: *Flash* (Fast) or *Pro* (Higher Quality).
    -   **Mode**: *Single* or *Batch Sheet*.
    -   **Style**: Pick a vibe from the dropdown.
3.  **Print**: Hit the **PRINT** button and watch your sticker emerge from the machine!
4.  **Interact**: Drag the new sticker onto the desk.
5.  **Download**: Click the download icon on any sticker to save it.

## 📄 License

MIT License. Feel free to use and modify!

---
*Built with ❤️ and AI.*
