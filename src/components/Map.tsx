'use client';

import { MapContainer, TileLayer, Marker, Popup, Polygon, LayersControl, Tooltip, ScaleControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LocateFixed, Search, Flame } from 'lucide-react';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

const { BaseLayer, Overlay } = LayersControl;

// Composant pour la recherche géographique
function SearchField() {
  const map = useMap();
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: 'bar',
      showMarker: true,
      showPopup: true,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Rechercher un lieu au Togo...',
    });

    map.addControl(searchControl);
    
    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
}

// Composant pour se localiser sur la carte
function LocationButton() {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    map.locate().on('locationfound', (e) => {
      map.flyTo(e.latlng, 16);
      setLoading(false);
      L.marker(e.latlng).addTo(map).bindPopup("Vous êtes ici").openPopup();
    });
  };

  return (
    <button 
      onClick={handleClick}
      className="absolute bottom-24 right-6 z-[1000] bg-white p-3 rounded-full shadow-2xl border border-stone-200 hover:bg-stone-50 transition-all group"
      title="Ma position exacte"
    >
      <LocateFixed className={`h-6 w-6 ${loading ? 'text-blue-500 animate-pulse' : 'text-stone-600 group-hover:text-green-600'}`} />
    </button>
  );
}

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
  type: 'observation' | 'alert';
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  coordinates: {
    type: string;
    coordinates: [number, number];
  };
}

// Icône personnalisée pour les alertes (Feu/Danger)
const AlertIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1672/1672451.png', // Flamme rouge
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

interface MapProps {
  center?: [number, number];
  zoom?: number;
  filter?: 'all' | 'parks' | 'species';
}

export default function Map({ center = [8.6195, 1.1915], zoom = 7, filter = 'all' }: MapProps) {
  const [areas, setAreas] = useState<ProtectedArea[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Chargement des zones protégées
      if (filter === 'all' || filter === 'parks') {
        const { data: areaData } = await supabase.rpc('get_protected_areas_geojson');
        if (areaData) setAreas(areaData);
      } else {
        setAreas([]);
      }

      // Chargement des observations vérifiées
      if (filter === 'all' || filter === 'species') {
        const { data: obsData } = await supabase.rpc('get_verified_observations_geojson');
        if (obsData) setObservations(obsData);
      } else {
        setObservations([]);
      }
    }
    fetchData();
  }, [filter, supabase]);

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
        <LayersControl position="topright">
          <BaseLayer checked name="Haute Précision (Google)">
            <TileLayer
              attribution='&copy; Google'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
          </BaseLayer>

          <BaseLayer name="Forêt (Esri)">
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </BaseLayer>

          <BaseLayer name="Relief & Topographie">
            <TileLayer
              attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>

          <BaseLayer name="Carte Standard">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
        </LayersControl>

        <Overlay name="Alertes Incendies (NASA FIRMS)">
          <TileLayer
            attribution='&copy; NASA FIRMS'
            url="https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/global/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=fires_24&STYLES=&FORMAT=image/png&TRANSPARENT=true&HEIGHT=256&WIDTH=256&SRS=EPSG:3857&BBOX={bbox-epsg-3857}"
          />
        </Overlay>
        
        <SearchField />
        
        {areas.map((area) => (
          <Polygon 
            key={area.id}
            pathOptions={{ 
              color: area.color, 
              fillColor: area.color, 
              fillOpacity: 0.4,
              weight: 3,
              dashArray: '5, 10'
            }}
            positions={formatCoordinates(area.boundary.coordinates)}
          >
            <Tooltip permanent direction="center" className="bg-transparent border-none shadow-none font-bold text-white text-[10px] uppercase pointer-events-none outline-none">
              {area.name}
            </Tooltip>
            <Popup>
              <div className="font-bold">{area.name}</div>
              <div className="text-xs text-stone-500 uppercase">Aire Protégée du Togo</div>
            </Popup>
          </Polygon>
        ))}

        {observations.map((obs) => (
          <Marker 
            key={obs.id} 
            position={[obs.coordinates.coordinates[1], obs.coordinates.coordinates[0]]}
            icon={obs.type === 'alert' ? AlertIcon : DefaultIcon}
          >
            <Popup className={obs.type === 'alert' ? 'alert-popup' : 'custom-popup'}>
              <div className="w-48">
                {obs.image_url && (
                  <img src={obs.image_url} className="w-full h-32 object-cover rounded-lg mb-2" alt="Observation" />
                )}
                {obs.type === 'alert' && (
                  <div className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block uppercase tracking-widest">
                    Alerte : {obs.alert_level}
                  </div>
                )}
                <div className={`font-bold ${obs.type === 'alert' ? 'text-red-600' : 'text-green-700'}`}>
                  {obs.type === 'alert' ? "DANGER SIGNALÉ" : (obs.species_name || "Observation citoyenne")}
                </div>
                <p className="text-xs text-stone-600 mt-1 line-clamp-2">{obs.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <ScaleControl position="bottomleft" imperial={false} />
        <LocationButton />
      </MapContainer>
    </div>
  );
}
