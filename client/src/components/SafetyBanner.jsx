import React from 'react';

export default function SafetyBanner() {
  return (
    <div className="safety-banner" role="region" aria-label="Safety and Prototype Notice">
      <strong>Safety & Scope Notice:</strong> Smart EB Connect is an academic coordination prototype and is not connected to an official electricity board dispatch system. For sparking, exposed live wires, or burning smells, stay clear, never attempt repairs yourself, and call your official utility helpline (1912) or emergency services (112) immediately.
    </div>
  );
}
