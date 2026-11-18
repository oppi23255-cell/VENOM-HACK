import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}

app.post('/api/verify-screenshots', async (req, res) => {
  try {
    const { userId, depositImage, promoImage } = req.body as {
      userId?: string;
      depositImage?: string;
      promoImage?: string;
    };

    if (!userId || !userId.trim()) {
      return res.status(400).json({
        valid: false,
        reasonCode: 'MISSING_ID',
        message: 'يرجى إدخال رقم الـ ID أولاً.',
      });
    }

    if (!depositImage || !promoImage) {
      return res.status(400).json({
        valid: false,
        reasonCode: 'MISSING_IMAGES',
        message: 'يرجى إرفاق صورة الإيداع وصورة البروموكود معاً.',
      });
    }

    const depositPart = parseDataUrl(depositImage);
    const promoPart = parseDataUrl(promoImage);

    if (!depositPart || !promoPart) {
      return res.status(400).json({
        valid: false,
        reasonCode: 'INVALID_IMAGE_FORMAT',
        message: 'صيغة الصور المرفقة غير صالحة.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        valid: false,
        reasonCode: 'SERVER_CONFIG_ERROR',
        message: 'لم يتم تكوين مفتاح التحقق على الخادم.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: {
        parts: [
          {
            text:
              'You are a strict screenshot verification auditor for the Ultrapari app.\n' +
              'Evaluate IMAGE 1 independently as the Deposit/Balance screenshot, and IMAGE 2 independently as the Registration/Promo Code screenshot.\n' +
              '- IMAGE 1 is ONLY valid if IMAGE 1 itself shows a deposit confirmation or Ultrapari account balance in EGP (e.g. "200 ج.م").\n' +
              '- IMAGE 2 is ONLY valid if IMAGE 2 itself shows a registration form with the promo code field containing exact case-sensitive "S333" (distinguish uppercase "S333" from lowercase "s333").',
          },
          { text: '--- IMAGE 1 (DEPOSIT / BALANCE SCREENSHOT) ---' },
          {
            inlineData: {
              mimeType: depositPart.mimeType,
              data: depositPart.data,
            },
          },
          { text: '--- IMAGE 2 (REGISTRATION / PROMO CODE SCREENSHOT) ---' },
          {
            inlineData: {
              mimeType: promoPart.mimeType,
              data: promoPart.data,
            },
          },
        ],
      },
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isDepositOrBalanceScreen: { type: Type.BOOLEAN },
            detectedAmountEgp: { type: Type.NUMBER },
            currencyText: { type: Type.STRING },
            isPromoScreen: { type: Type.BOOLEAN },
            exactPromoCodeText: { type: Type.STRING },
          },
          required: [
            'isDepositOrBalanceScreen',
            'detectedAmountEgp',
            'currencyText',
            'isPromoScreen',
            'exactPromoCodeText',
          ],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText) as {
      isDepositOrBalanceScreen: boolean;
      detectedAmountEgp: number;
      currencyText: string;
      isPromoScreen: boolean;
      exactPromoCodeText: string;
    };

    const promoExact = (parsed.exactPromoCodeText || '').trim();
    const isPromoValid = parsed.isPromoScreen && promoExact === 'S333';
    const isDepositValid =
      parsed.isDepositOrBalanceScreen && Number(parsed.detectedAmountEgp) >= 180;

    if (!isPromoValid) {
      const isLowercaseS = promoExact.toLowerCase() === 's333' && promoExact !== 'S333';
      return res.status(200).json({
        valid: false,
        reasonCode: isLowercaseS ? 'PROMO_LOWERCASE' : 'PROMO_INVALID',
        detectedPromo: promoExact,
        detectedAmount: parsed.detectedAmountEgp,
      });
    }

    if (!isDepositValid) {
      return res.status(200).json({
        valid: false,
        reasonCode:
          parsed.isDepositOrBalanceScreen && parsed.detectedAmountEgp > 0
            ? 'DEPOSIT_TOO_LOW'
            : 'DEPOSIT_INVALID',
        detectedPromo: promoExact,
        detectedAmount: parsed.detectedAmountEgp,
      });
    }

    const code = 'CRASH' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiry = Date.now() + 3600000;

    return res.status(200).json({
      valid: true,
      code,
      expiry,
      detectedPromo: promoExact,
      detectedAmount: parsed.detectedAmountEgp,
    });
  } catch (err: unknown) {
    console.error('Screenshot verification error:', err);
    const errMsg = err instanceof Error ? err.message : 'Verification failed';
    return res.status(500).json({
      valid: false,
      reasonCode: 'VERIFICATION_ERROR',
      message: errMsg,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
