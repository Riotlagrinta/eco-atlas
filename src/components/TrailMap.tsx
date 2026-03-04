'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface TrailMapProps {
  geoJsonData: any;
  center?: [number, number];
  zoom?: number;
}

// Composant pour recentrer la carte sur le tracé
function ChangeView({ geoJsonData }: { geoJsonData: any }) {
  const map = useMap();
  useEffect(() => {
    if (geoJsonData) {
      const layer = L.geoJSON(geoJsonData);
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    }
  }, [geoJsonData, map]);
  return null;
}

export default function TrailMap({ geoJsonData, center = [8.13, 1.16], zoom = 8 }: TrailMapProps) {
  return (
    <div className="h-full w-full rounded-3xl overflow-hidden border border-stone-200 shadow-inner bg-stone-100">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geoJsonData && (
          <>
            <GeoJSON 
              data={geoJsonData} 
              style={{
                color: '#16a34a',
                weight: 5,
                opacity: 0.8,
                dashArray: '10, 10'
              }} 
            />
            <ChangeView geoJsonData={geoJsonData} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
