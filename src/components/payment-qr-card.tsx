import { formatSatang as money, formatSessionDate } from '../lib/format';
import { useEffect, useRef, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { MeshGradient } from '@paper-design/shaders-react';
import { meshColors } from '../lib/background-theme';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { paymentPayload, type PaymentRequest } from '../lib/payments';
import type { Session } from '../lib/store';

type Props = {
  payment: PaymentRequest;
  session?: Session;
  amountCents: number;
  count: number;
  onError: (message: string) => void;
};

export function PaymentQRCard({ payment, session, amountCents, count, onError }: Props) {
  const qr = useRef<HTMLDivElement>(null);
  const background = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    downloadUrl: string;
    file: File;
    canShare: boolean;
  } | null>(null);
  const [sharing, setSharing] = useState(false);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.downloadUrl);
    },
    [preview],
  );

  async function shareImage() {
    if (!preview || sharing) return;
    setSharing(true);
    try {
      // A separate tap keeps native sharing inside the browser's user activation window.
      await navigator.share({ files: [preview.file] });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        onError('เปิดเมนูแชร์ไม่ได้ กรุณาแตะรูปค้างไว้แล้วเลือกบันทึกรูปภาพ');
      }
    } finally {
      setSharing(false);
    }
  }

  const date = session ? formatSessionDate(session.date) : '';
  const round = session?.name || 'รอบเล่น';
  const heading = payment.method === 'promptpay' ? 'PromptPay' : 'QR Payment';
  const details = [
    ['รอบเล่น', round],
    ['วันที่', date],
    ['ยอดรวมทั้งหมด', `฿${money(payment.totalCents)}`],
    ['หารทั้งหมด', `${payment.playerCount} คน`],
    ['ยอดชำระต่อคน', `฿${money(amountCents)}`],
    ...(count !== payment.playerCount ? [['QR ยอดนี้สำหรับ', `${count} คน`]] : []),
  ];

  async function download() {
    if (downloading) return;
    setDownloading(true);
    let qrUrl: string | undefined;
    let pngUrl: string | undefined;
    try {
      await document.fonts.ready;
      const svg = qr.current?.querySelector('svg');
      if (!svg) throw new Error('ไม่พบ QR กรุณาลองใหม่');
      qrUrl = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], {
          type: 'image/svg+xml;charset=utf-8',
        }),
      );
      const image = new Image();
      image.src = qrUrl;
      await image.decode();
      const canvas = document.createElement('canvas');
      const height = 918 + details.length * 54;
      canvas.width = 1440;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('อุปกรณ์นี้ไม่รองรับการบันทึกภาพ');
      ctx.scale(2, 2);
      ctx.fillStyle = '#061018';
      ctx.fillRect(0, 0, 720, height);
      const mesh = background.current?.querySelector('canvas');
      if (mesh && mesh.width > 0 && mesh.height > 0) {
        ctx.drawImage(mesh, 0, 0, 720, height);
      } else {
        for (const [x, y, color] of [
          [0, 100, '#0891b2'],
          [680, height * 0.8, '#f97316'],
        ] as const) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 820);
          glow.addColorStop(0, color);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, 720, height);
        }
      }
      ctx.fillStyle = '#030a1299';
      ctx.fillRect(0, 0, 720, height);
      const loadAsset = async (src: string) => {
        const asset = new Image();
        asset.src = src;
        await asset.decode();
        return asset;
      };
      const thaiLogo = await loadAsset('/payments/thai-qr-payment.svg');
      ctx.fillStyle = '#00427a';
      ctx.fillRect(0, 0, 720, 145);
      ctx.drawImage(thaiLogo, 210, 10, 300, 124);
      if (payment.method === 'promptpay') {
        const promptpayLogo = await loadAsset('/payments/promptpay.svg');
        ctx.drawImage(promptpayLogo, 280, 163, 160, 54);
      } else {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = '500 30px Kanit';
        ctx.fillText(heading, 360, 204);
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c4d5df';
      ctx.font = '400 22px Kanit';
      ctx.fillText('สแกนเพื่อชำระค่าเล่นแบดมินตัน', 360, 244);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 144, 270, 432, 432);
      ctx.fillStyle = '#e9ff74';
      ctx.font = '600 48px Kanit';
      ctx.fillText(`฿${money(amountCents)}`, 360, 760);
      ctx.fillStyle = '#b0c2cd';
      ctx.font = '400 20px Kanit';
      ctx.fillText('ยอดชำระต่อคน', 360, 799);
      ctx.strokeStyle = '#ffffff30';
      ctx.beginPath();
      ctx.moveTo(48, 828);
      ctx.lineTo(672, 828);
      ctx.stroke();
      details.forEach(([label, value], i) => {
        const y = 871 + i * 54;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#b0c2cd';
        ctx.font = '400 21px Kanit';
        ctx.fillText(label, 48, y);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#edf8fc';
        ctx.font = '500 22px Kanit';
        ctx.fillText(value, 672, y, 390);
      });
      ctx.textAlign = 'center';
      ctx.fillStyle = '#b0c2cd';
      ctx.font = '400 17px Kanit';
      ctx.fillText('ตรวจสอบชื่อผู้รับและยอดเงินในแอปธนาคารก่อนยืนยันโอน', 360, height - 30);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('บันทึกภาพไม่สำเร็จ'))),
          'image/png',
        ),
      );
      const filename = `iBadz-${session?.date || 'payment'}-${amountCents}-${payment.id.slice(0, 8)}.png`;
      const mobile = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
      if (mobile) {
        const file = new File([blob], filename, { type: 'image/png' });
        // A real PNG image enables the native long-press Save Image action, even on LAN HTTP.
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('เปิดภาพไม่สำเร็จ กรุณาลองใหม่'));
          reader.readAsDataURL(blob);
        });
        let canShare = false;
        try {
          canShare = !!navigator.share && !!navigator.canShare?.({ files: [file] });
        } catch {
          // Sharing may be blocked or unavailable; the image remains saveable by long press.
        }
        setPreview({ url, downloadUrl: URL.createObjectURL(blob), file, canShare });
      } else {
        pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        const savedUrl = pngUrl;
        window.setTimeout(() => URL.revokeObjectURL(savedUrl), 60_000);
        pngUrl = undefined;
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'บันทึกภาพไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      if (qrUrl) URL.revokeObjectURL(qrUrl);
      if (pngUrl) URL.revokeObjectURL(pngUrl);
      setDownloading(false);
    }
  }

  return (
    <div className="payment-qr-card">
      <div className="promptpay-template">
        <div className="promptpay-mesh" ref={background} aria-hidden="true">
          <MeshGradient
            colors={meshColors}
            speed={0}
            frame={90}
            webGlContextAttributes={{ preserveDrawingBuffer: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="promptpay-template-header">
          <img src="/payments/thai-qr-payment.svg" alt="Thai QR Payment" />
        </div>
        <div className="promptpay-template-body">
          {payment.method === 'promptpay' ? (
            <img
              className="promptpay-logo"
              src="/payments/promptpay.svg"
              alt="พร้อมเพย์ PromptPay"
            />
          ) : (
            <strong className="promptpay-bank-heading">{heading}</strong>
          )}
          <p className="promptpay-caption">สแกนเพื่อชำระค่าเล่นแบดมินตัน</p>
          <div className="qr-paper" ref={qr}>
            <QRCodeSVG
              value={paymentPayload(payment, amountCents)}
              size={432}
              level="M"
              fgColor="#e9ff74"
              bgColor="transparent"
              marginSize={4}
              title={`QR ชำระ ${money(amountCents)} บาท`}
            />
          </div>
          <strong className="promptpay-amount">฿{money(amountCents)}</strong>
          <span className="promptpay-caption">ยอดชำระต่อคน</span>
          <dl className="promptpay-details">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="promptpay-template-note">
            ตรวจสอบชื่อผู้รับและยอดเงินในแอปธนาคารก่อนยืนยันโอน
          </p>
        </div>
      </div>
      <Button className="primary qr-download" disabled={downloading} onClick={download}>
        <Download size={16} /> {downloading ? 'กำลังบันทึก…' : 'บันทึก QR เป็นรูปภาพ'}
      </Button>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open && !sharing) setPreview(null);
        }}
      >
        <DialogContent className="modal qr-save-modal" aria-describedby="qr-save-description">
          <DialogTitle>บันทึกรูป QR ชำระเงิน</DialogTitle>
          <p id="qr-save-description">
            แตะรูปค้างไว้ แล้วเลือก “บันทึกลงในรูปภาพ” หรือ “ดาวน์โหลดรูปภาพ”
          </p>
          {preview && (
            <>
              <img
                className="qr-save-image"
                src={preview.url}
                alt={`QR ${round} ยอดต่อคน ${money(amountCents)} บาท พร้อมรายละเอียดค่าใช้จ่าย`}
              />
              <div className="qr-save-actions">
                {preview.canShare && (
                  <Button className="primary" disabled={sharing} onClick={shareImage}>
                    <Share2 size={16} /> {sharing ? 'กำลังเปิดเมนูแชร์…' : 'แชร์ / บันทึกรูปภาพ'}
                  </Button>
                )}
                <Button className="outline" asChild>
                  <a href={preview.downloadUrl} download={preview.file.name}>
                    <Download size={16} />
                    ดาวน์โหลด PNG
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
