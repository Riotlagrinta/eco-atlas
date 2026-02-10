'use client';

import { MapContainer, TileLayer, FeatureGroup, LayersControl } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

const { BaseLayer } = LayersControl;

export default function MapEditor() {
  const supabase = createClient();
  const [status, setStatus] = useState<string>('');

  const _onCreate = async (e: any) => {
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      const name = prompt("Nom de la zone protégée :");
      if (!name) return;

      const coords = layer.getLatLngs()[0].map((latlng: any) => `${latlng.lng} ${latlng.lat}`).join(', ');
      // Fermer le polygone
      const firstCoord = layer.getLatLngs()[0][0];
      const closedCoords = `${coords}, ${firstCoord.lng} ${firstCoord.lat}`;
      
      const wkt = `POLYGON((${closedCoords}))`;

      const { error } = await supabase
        .from('protected_areas')
        .insert([{
          name,
          boundary: wkt,
          color: '#10b981'
        }]);

      if (error) {
        alert("Erreur lors de l'enregistrement : " + error.message);
      } else {
        alert("Zone '" + name + "' enregistrée avec succès !");
      }
    }
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[8.6195, 1.1915]}
        zoom={7}
        className="h-full w-full"
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Satellite (Google)">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
          </BaseLayer>
        </LayersControl>

        <FeatureGroup>
          <EditControl
            position="topleft"
            onCreated={_onCreate}
            draw={{
              rectangle: false,
              circle: false,
              polyline: false,
              circlemarker: false,
              marker: false,
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
