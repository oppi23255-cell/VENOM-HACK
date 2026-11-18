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
        timeout: 45000,
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

    const auditSingleImage = async (part: {
      mimeType: string;
      data: string;
    }): Promise<ImageAudit> => {
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: {
              parts: [
                {
                  text:
                    'Inspect this Ultrapari app screenshot and extract:\n' +
                    '- isPromoScreen: true if this shows a registration, signup, or promo code screen/field ("البرومو كود" / "Promo code").\n' +
                    '- promoCodeText: exact characters inside the promo code field preserving EXACT case ("S333" vs "s333"). Return "" if none.\n' +
                    '- isDepositOrBalanceScreen: true if this shows an Ultrapari wallet/home balance (e.g. "200 ج.م") or deposit receipt.\n' +
                    '- amountEgp: numeric balance or deposit amount in EGP (e.g. 200 for "200 ج.م"). Return 0 if none.',
                },
                {
                  inlineData: {
                    mimeType: part.mimeType,
                    data: part.data,
                  },
                },
              ],
            },
            config: {
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.MINIMAL,
              },
              responseMimeType: 'application/json',
              responseSchema: singleAuditSchema,
            },
          });

          const rawText = (res.text ?? '{}')
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```$/i, '')
            .trim();

          return JSON.parse(rawText) as ImageAudit;
        } catch (err) {
          lastErr = err;
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 350));
          }
        }
      }
      throw lastErr ?? new Error('Verification service unavailable');
    };

    const [audit1, audit2] = await Promise.all([
      auditSingleImage(depositPart),
      auditSingleImage(promoPart),
    ]);

    const parsed = {
      image1: audit1,
      image2: audit2,
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
