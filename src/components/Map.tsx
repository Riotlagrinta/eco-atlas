'use client';

import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Fix for leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ProtectedArea {
  id: string;
  name: string;
  color: string;
  boundary: {
    type: string;
    coordinates: any[][][];
  };
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
}

export default function Map({ center = [8.6195, 1.1915], zoom = 7 }: MapProps) {
  const [areas, setAreas] = useState<ProtectedArea[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAreas() {
      const { data, error } = await supabase.rpc('get_protected_areas_geojson');
      
      if (!error && data) {
        setAreas(data);
      } else if (error) {
        console.error("Erreur lors du chargement des zones:", error.message);
      }
    }
    fetchAreas();
  }, []);

  // Fonction pour convertir les coordonnées GeoJSON (Lng, Lat) en Leaflet (Lat, Lng)
  const formatCoordinates = (coords: any[][]) => {
    return coords[0].map((coord: any[]) => [coord[1], coord[0]] as [number, number]);
  };

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-stone-200">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {areas.map((area) => (
          <Polygon 
            key={area.id}
            pathOptions={{ 
              color: area.color, 
              fillColor: area.color, 
              fillOpacity: 0.3,
              weight: 2
            }}
            positions={formatCoordinates(area.boundary.coordinates)}
          >
            <Popup>
              <div className="font-bold">{area.name}</div>
              <div className="text-xs text-stone-500 uppercase">Aire Protégée</div>
            </Popup>
          </Polygon>
        ))}

        <Marker position={[6.1319, 1.2228]}>
          <Popup>Lomé - Capitale du Togo</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
