import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapPicker({
  lat,
  lng,
  onSelectLocation,
  technicians = [],
  interactive = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  const defaultCenter = [
    typeof lat === 'number' ? lat : 12.8452,
    typeof lng === 'number' ? lng : 77.6602
  ];

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView(defaultCenter, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersGroupRef.current = markersGroup;

    if (interactive && onSelectLocation) {
      map.on('click', (e) => {
        onSelectLocation(
          Number(e.latlng.lat.toFixed(6)),
          Number(e.latlng.lng.toFixed(6))
        );
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (typeof lat === 'number' && typeof lng === 'number') {
      const customerMarker = L.circleMarker([lat, lng], {
        radius: 9,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.9
      }).bindPopup(`<strong>Selected Location</strong><br/>Lat: ${lat}, Lng: ${lng}`);
      markersGroup.addLayer(customerMarker);
      map.setView([lat, lng], map.getZoom());
    }

    technicians.forEach((tech) => {
      if (tech.coordinates && typeof tech.coordinates.lat === 'number') {
        const techMarker = L.circleMarker([tech.coordinates.lat, tech.coordinates.lng], {
          radius: 8,
          color: '#1d4ed8',
          fillColor: '#3b82f6',
          fillOpacity: 0.85
        }).bindPopup(
          `<strong>Technician: ${tech.name}</strong><br/>Distance: ${
            tech.distanceKm !== null ? `${tech.distanceKm} km (straight-line)` : 'N/A'
          }`
        );
        markersGroup.addLayer(techMarker);
      }
    });
  }, [lat, lng, technicians]);

  return (
    <div>
      <div ref={mapContainerRef} className="map-box" />
      <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.4rem' }}>
        🔴 Red marker: Complaint/Customer location | 🔵 Blue marker: Available Technician.{' '}
        <em>
          Note: Calculated distances are straight-line (Haversine) distances; road travel distance and ETA may differ.
        </em>
      </p>
    </div>
  );
}
