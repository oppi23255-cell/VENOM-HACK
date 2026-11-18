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

interface ImageAudit {
  isPromoScreen: boolean;
  promoCodeText: string;
  isDepositOrBalanceScreen: boolean;
  amountEgp: number;
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

    const singleAuditSchema = {
      type: Type.OBJECT,
      properties: {
        isPromoScreen: { type: Type.BOOLEAN },
        promoCodeText: { type: Type.STRING },
        isDepositOrBalanceScreen: { type: Type.BOOLEAN },
        amountEgp: { type: Type.NUMBER },
      },
      required: [
        'isPromoScreen',
        'promoCodeText',
        'isDepositOrBalanceScreen',
        'amountEgp',
      ],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: {
        parts: [
          {
            text:
              'Audit IMAGE 1 and IMAGE 2 separately for the Ultrapari app.\n' +
              'For EACH image independently:\n' +
              '- isPromoScreen: true if the image shows a registration, signup, account, or promo-code screen/field (Arabic "البرومو كود" or English "Promo code").\n' +
              '- promoCodeText: transcribe ONLY the promo code string written in the promo code input/field (e.g. "S333" or "s333"), preserving EXACT uppercase/lowercase letters! Do NOT include labels. Return "" if none.\n' +
              '- isDepositOrBalanceScreen: true if the image shows an Ultrapari home/wallet balance (e.g. "200 ج.م") or a deposit transaction/receipt.\n' +
              '- amountEgp: numeric amount of the deposit or balance shown (e.g. 200 for "200 ج.م" or 180 for "180 EGP"). Return 0 if none.',
          },
          { text: '--- IMAGE 1 ---' },
          {
            inlineData: {
              mimeType: depositPart.mimeType,
              data: depositPart.data,
            },
          },
          { text: '--- IMAGE 2 ---' },
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
            image1: singleAuditSchema,
            image2: singleAuditSchema,
          },
          required: ['image1', 'image2'],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText) as {
      image1: ImageAudit;
      image2: ImageAudit;
    };

    const checkPromo = (img: ImageAudit) => {
      const code = (img.promoCodeText || '').trim();
      return {
        isExact: (img.isPromoScreen || code.length > 0) && code === 'S333',
        isLowercase: code.toLowerCase() === 's333' && code !== 'S333',
        code,
      };
    };

    const checkDeposit = (img: ImageAudit) => {
      const amt = Number(img.amountEgp) || 0;
      return {
        isValid: img.isDepositOrBalanceScreen && amt >= 180,
        isTooLow: img.isDepositOrBalanceScreen && amt > 0 && amt < 180,
        amount: amt,
      };
    };

    const p1 = checkPromo(parsed.image1);
    const p2 = checkPromo(parsed.image2);
    const d1 = checkDeposit(parsed.image1);
    const d2 = checkDeposit(parsed.image2);

    // Valid if (image1 = deposit >= 180 AND image2 = promo S333) OR (image2 = deposit >= 180 AND image1 = promo S333)
    const normalOrderValid = d1.isValid && p2.isExact;
    const swappedOrderValid = d2.isValid && p1.isExact;

    if (!normalOrderValid && !swappedOrderValid) {
      const anyPromoLower = p1.isLowercase || p2.isLowercase;
      const anyPromoExact = p1.isExact || p2.isExact;
      const anyDepositValid = d1.isValid || d2.isValid;
      const anyDepositLow = d1.isTooLow || d2.isTooLow;

      if (!anyPromoExact) {
        return res.status(200).json({
          valid: false,
          reasonCode: anyPromoLower ? 'PROMO_LOWERCASE' : 'PROMO_INVALID',
          detectedPromo: p2.code || p1.code,
          detectedAmount: Math.max(d1.amount, d2.amount),
        });
      }

      if (!anyDepositValid) {
        return res.status(200).json({
          valid: false,
          reasonCode: anyDepositLow ? 'DEPOSIT_TOO_LOW' : 'DEPOSIT_INVALID',
          detectedPromo: p2.code || p1.code,
          detectedAmount: Math.max(d1.amount, d2.amount),
        });
      }
    }

    const code = 'CRASH' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiry = Date.now() + 3600000;

    return res.status(200).json({
      valid: true,
      code,
      expiry,
      detectedPromo: 'S333',
      detectedAmount: normalOrderValid ? d1.amount : d2.amount,
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
