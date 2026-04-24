import React, { useEffect, useRef } from "react";
import jsQR from "jsqr";

export default function QrScanner({ onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const onScanRef = useRef(onScan);
  const firedRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let active = true;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        streamRef.current = stream;
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        tick();
      } catch {}
    }

    function tick() {
      if (!active || firedRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
      if (video.readyState < 2) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, {
        inversionAttempts: "dontInvert",
      });
      if (code?.data) {
        firedRef.current = true;
        onScanRef.current(code.data);
      }
    }

    init();
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: "#000",
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} playsInline muted />
      <canvas ref={canvasRef} style={{ width: "100%", display: "block" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 210,
            height: 210,
            borderRadius: 14,
            boxShadow: "0 0 0 9999px rgba(0,0,0,.55)",
            border: "2px solid var(--accent)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "rgba(255,255,255,.6)",
          textTransform: "uppercase",
          letterSpacing: 0.1,
        }}
      >
        Point camera at member's QR code
      </div>
    </div>
  );
}
