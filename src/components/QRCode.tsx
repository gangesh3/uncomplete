import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  dark?: string;
  light?: string;
  className?: string;
}

export function QRCodeDisplay({ url, size = 200, dark = '#000000', light = '#ffffff', className = '' }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark, light },
      errorCorrectionLevel: 'M',
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [url, size, dark, light]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className={`bg-slate-100 rounded-lg animate-pulse ${className}`} />;
  }

  return <img src={dataUrl} alt="QR Code" width={size} height={size} className={className} />;
}

export async function generateQRSVG(url: string, opts?: { dark?: string; light?: string }): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: { dark: opts?.dark ?? '#000000', light: opts?.light ?? '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

export async function generateQRPNG(url: string, size = 512, opts?: { dark?: string; light?: string }): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: { dark: opts?.dark ?? '#000000', light: opts?.light ?? '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}
