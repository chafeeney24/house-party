'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  partyCode: string;
}

export default function QRCodeDisplay({ partyCode }: QRCodeDisplayProps) {
  const [showModal, setShowModal] = useState(false);
  
  const joinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/join?code=${partyCode}`
    : `/join?code=${partyCode}`;

  return (
    <>
      {/* Small QR Code Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex flex-col items-center gap-1 bg-white rounded-lg p-2 hover:bg-gray-100 transition-colors shadow-lg"
        title="Show QR Code"
      >
        <QRCodeSVG 
          value={joinUrl} 
          size={64}
          level="M"
          includeMargin={false}
        />
        <span className="text-xs text-gray-600 font-medium">Scan to Join</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-2">Join the Party! 🎉</h2>
            <p className="text-gray-600 mb-4">Scan this QR code to join instantly</p>
            
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <QRCodeSVG 
                value={joinUrl} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="mb-4">
              <p className="text-gray-500 text-sm mb-1">Or enter code manually:</p>
              <span className="bg-gray-100 text-gray-800 font-mono text-2xl px-4 py-2 rounded-lg tracking-widest inline-block">
                {partyCode}
              </span>
            </div>
            
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
