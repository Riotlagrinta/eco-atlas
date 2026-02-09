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

interface Observation {
  id: string;
  description: string;
  image_url: string;
  species_name: string;
  coordinates: {
    type: string;
    coordinates: [number, number];
  };
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
}

export default function Map({ center = [8.6195, 1.1915], zoom = 7 }: MapProps) {
  const [areas, setAreas] = useState<ProtectedArea[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Chargement des zones protégées
      const { data: areaData } = await supabase.rpc('get_protected_areas_geojson');
      if (areaData) setAreas(areaData);

      // Chargement des observations vérifiées
      const { data: obsData } = await supabase.rpc('get_verified_observations_geojson');
      if (obsData) setObservations(obsData);
    }
    fetchData();
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

        {observations.map((obs) => (
          <Marker 
            key={obs.id} 
            position={[obs.coordinates.coordinates[1], obs.coordinates.coordinates[0]]}
          >
            <Popup className="custom-popup">
              <div className="w-48">
                {obs.image_url && (
                  <img src={obs.image_url} className="w-full h-32 object-cover rounded-lg mb-2" alt="Observation" />
                )}
                <div className="font-bold text-green-700">{obs.species_name || "Observation citoyenne"}</div>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2">{obs.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        <Marker position={[6.1319, 1.2228]}>
          <Popup>Lomé - Capitale du Togo</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
