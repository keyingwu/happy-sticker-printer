import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
export const STYLES = [ 
  "classic bold vector sticker",              // 经典粗犷矢量贴纸
  "satirical caricature illustration",        // 讽刺漫画插画
  "funny cartoon style",                      // 搞笑卡通
  "bold line art with flat colors",           // 粗线条 + 纯色色块

  // 新增风格：
  "minimalist flat icon",                     // 极简扁平图标
  "cute pastel chibi character",              // 粉彩Q版角色
  "kawaii doodle sketch",                     // 可爱手绘涂鸦
  "90s retro comic halftone",                 // 90年代复古网点漫画风
  "neon cyberpunk glow sticker",              // 霓虹赛博朋克发光贴纸
  "hand-drawn pencil sketch with color accents", // 铅笔手绘+少量点色
  "watercolor splash illustration",           // 水彩泼墨插画
  "graffiti street art sticker",              // 涂鸦街头艺术贴纸
  "3D plastic toy render",                    // 3D塑料玩具感渲染
  "pixel art sprite",                         // 像素小人/像素画风格
  "bold typographic slogan sticker",          // 粗体字标语贴纸
  "vintage hand-lettered badge",              // 复古手写字徽章
  "chrome gradient Y2K style",                // 镀铬渐变Y2K风
  "holographic foil sticker style",           // 全息亮膜贴纸风
  "childlike crayon drawing",                 // 儿童蜡笔画风
];

/**
 * Removes the black background from the generated image using a flood-fill algorithm.
 * This creates a true "die-cut" sticker with a white border.
 */
const processImageWithTransparency = (imageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Flood Fill Algorithm to remove black background
      // Seed from the entire outer border to catch stickers touching any edge
      const stack: [number, number][] = [];
      
      // Top & Bottom rows
      for (let x = 0; x < w; x++) {
          stack.push([x, 0]);
          stack.push([x, h - 1]);
      }
      // Left & Right cols
      for (let y = 0; y < h; y++) {
          stack.push([0, y]);
          stack.push([w - 1, y]);
      }

      const visited = new Int8Array(w * h); // 0 = unvisited, 1 = visited

      // Helper to check if a pixel is "Black-ish" (Background)
      // Increased Threshold to 60 to catch compression artifacts/dark grays
      const isBackground = (idx: number) => {
        return data[idx] < 60 && data[idx + 1] < 60 && data[idx + 2] < 60;
      };

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const pixelIndex = y * w + x;

        if (visited[pixelIndex]) continue;
        visited[pixelIndex] = 1;

        const dataIndex = pixelIndex * 4;

        if (isBackground(dataIndex)) {
          // Turn pixel transparent
          data[dataIndex + 3] = 0; 

          // Check neighbors
          if (x > 0) stack.push([x - 1, y]);
          if (x < w - 1) stack.push([x + 1, y]);
          if (y > 0) stack.push([x, y - 1]);
          if (y < h - 1) stack.push([x, y + 1]);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = () => reject(new Error("Failed to load image for processing"));
    img.src = imageSrc;
  });
};

/**
 * STEP 1: GENERATE CONCEPT (Text Model)
 * Generates a specific subject description, checking history to avoid repetition.
 */
const generateConcept = async (userPrompt: string, history: string[]): Promise<string> => {
    const prompt = `
        Role: Creative Director for a funny sticker app.
        Task: Brainstorm ONE specific visual subject for a sticker.
        
        User Request: ${userPrompt}
        
        AVOID these concepts (already generated):
        ${history.map(h => `- ${h}`).join('\n')}
        
        Rules:
        1. Return ONLY the short visual description (max 10 words).
        2. Be specific (e.g., instead of "Pizza", say "A slice of pepperoni pizza dripping cheese").
        3. Make it funny or cute based on the request.
        4. Do NOT repeat anything from the avoidance list.
    `;

    try {
        console.log("--- Concept Generation Prompt ---");
        console.log(prompt);
        console.log("---------------------------------");

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text.trim();
    } catch (e) {
        console.error("Concept generation failed, falling back to raw prompt", e);
        return userPrompt;
    }
}

/**
 * ORCHESTRATOR: Two-Step Generation
 */
export const IMAGE_MODELS = {
  FLASH: 'gemini-2.5-flash-image',
  PRO_PREVIEW: 'gemini-3-pro-image-preview'
};

/**
 * ORCHESTRATOR: Two-Step Generation
 */
export const generateSticker = async (userPrompt: string, style: string, generationCount: number = 0, history: string[] = [], customImageModel: string = IMAGE_MODELS.FLASH, isBatch: boolean = false): Promise<{imageUrl: string, concept: string}> => {
  try {
    const imageModel = customImageModel;
    
    const seed = Date.now();
    
    // STEP 1: Generate a unique concept string (Skip for Batch Mode to save time/tokens)
    let conceptDescription = userPrompt;
    if (!isBatch) {
        conceptDescription = await generateConcept(userPrompt, history);
        console.log(`Generated Concept for "${userPrompt}":`, conceptDescription);
    }

    const chosenStyle = style || STYLES[Math.floor(Math.random() * STYLES.length)];

    // STEP 2: Generate the image based on that concept
    // We ask for a SOLID BLACK background so we can computationally remove it later.
    // We ask for a THICK WHITE BORDER to create the die-cut physical object look.
    
    let imagePrompt = '';

    if (isBatch) {
        imagePrompt = `
          Design a full sticker sheet.
          
          SUBJECT: ${userPrompt}
          
          CONTENT:
          - Exactly 9 distinct die-cut stickers with white border arranged in a neat 3x3 grid.
          - Show various poses, outfits, and expressions.
          - Maintain consistent character design and style.
          
          STYLE:
          - ${chosenStyle}
                    
          LAYOUT:
          - Canvas aspect ratio 10:16 (vertical).
          - Clean spacing between stickers.
          - designed background

          Seed: ${seed}
        `;
    } else {
        imagePrompt = `
          Design a funny sticker.
          
          SUBJECT: ${conceptDescription}
          CONTEXT: The user asked for: ${userPrompt}.
          
          STYLE:
          - ${chosenStyle}
          
          DIE-CUT LAYOUT (CRITICAL):
          1. THICK WHITE OUTLINE around the entire subject (Sticker Border).
          2. SOLID BLACK (#000000) background.
          3. High contrast.
          4. Center the subject. No cropping.
          
          Seed: ${seed}
        `;
    }

    console.log("--- Image Generation Prompt ---");
    console.log(imagePrompt);
    console.log("-------------------------------");

    const config = (isBatch && imageModel === IMAGE_MODELS.PRO_PREVIEW) ? {
        imageConfig: {
            aspectRatio: '9:16',
            imageSize: '2K'
        }
    } : undefined;

    const response = await ai.models.generateContent({
      model: imageModel,
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config
    });

    let rawImageUrl = '';

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          rawImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!rawImageUrl) {
      console.error("Gemini API Response missing image data. Model response:", JSON.stringify(response, null, 2));
      throw new Error("No image data found in response - Check console for full API response");
    }

    // Process the image to make it transparent
    const processedUrl = await processImageWithTransparency(rawImageUrl);
    
    return {
        imageUrl: processedUrl,
        concept: conceptDescription
    };

  } catch (error) {
    console.error("Error generating sticker:", error);
    throw error;
  }
};