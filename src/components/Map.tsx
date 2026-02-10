'use client';

import { MapContainer, TileLayer, Marker, Popup, Polygon, LayersControl, Tooltip, ScaleControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { FullscreenControl } from 'react-leaflet-fullscreen';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LocateFixed, Search, Flame, Ruler, Check, X as CloseIcon } from 'lucide-react';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

const { BaseLayer, Overlay } = LayersControl;

// Outil de mesure de distance
function RulerTool() {
  const map = useMap();
  const [active, setActive] = useState(false);
  const [distance, setDistance] = useState(0);
  const [points, setPoints] = useState<L.LatLng[]>([]);

  useEffect(() => {
    if (!active) {
      setPoints([]);
      setDistance(0);
      return;
    }

    const onClick = (e: L.LeafletMouseEvent) => {
      setPoints(prev => {
        const newPoints = [...prev, e.latlng];
        if (newPoints.length > 1) {
          let d = 0;
          for (let i = 0; i < newPoints.length - 1; i++) {
            d += newPoints[i].distanceTo(newPoints[i+1]);
          }
          setDistance(d);
        }
        return newPoints;
      });
    };

    map.on('click', onClick);
    return () => { map.off('click', onClick); };
  }, [active, map]);

  return (
    <div className="absolute top-32 left-3 z-[1000] flex flex-col gap-2">
      <button 
        onClick={() => setActive(!active)}
        className={`p-3 rounded-xl shadow-xl border transition-all ${active ? 'bg-green-600 text-white border-green-500' : 'bg-white text-stone-600 border-stone-200'}`}
        title="Mesurer une distance"
      >
        <Ruler className="h-5 w-5" />
      </button>
      {active && distance > 0 && (
        <div className="bg-white px-3 py-1 rounded-lg shadow-lg border border-stone-100 text-[10px] font-bold text-green-600">
          {(distance / 1000).toFixed(2)} km
        </div>
      )}
    </div>
  );
}

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
    return () => { map.removeControl(searchControl); };
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
    <button onClick={handleClick} className="absolute bottom-24 right-6 z-[1000] bg-white p-3 rounded-full shadow-2xl border border-stone-200 hover:bg-stone-50 transition-all group">
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

const AlertIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1672/1672451.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

interface ProtectedArea { id: string; name: string; color: string; boundary: { type: string; coordinates: any[][][]; }; }
interface Observation { id: string; description: string; image_url: string; species_name: string; type: 'observation' | 'alert'; alert_level: string; coordinates: { type: string; coordinates: [number, number]; }; }

interface MapProps { center?: [number, number]; zoom?: number; filter?: 'all' | 'parks' | 'species'; }

export default function Map({ center = [8.6195, 1.1915], zoom = 7, filter = 'all' }: MapProps) {
  const [areas, setAreas] = useState<ProtectedArea[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = async () => {
    if (filter === 'all' || filter === 'parks') {
      const { data } = await supabase.rpc('get_protected_areas_geojson');
      if (data) setAreas(data);
    } else setAreas([]);

    if (filter === 'all' || filter === 'species') {
      const { data } = await supabase.rpc('get_verified_observations_geojson');
      if (data) setObservations(data);
    } else setObservations([]);
  };

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setUserRole(data?.role || 'user');
      }
    };
    checkRole();
    fetchData();

    const channel = supabase.channel('schema-db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'observations' }, () => { fetchData(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter, supabase]);

  const handleModerate = async (id: string, action: 'verify' | 'delete') => {
    if (action === 'verify') await supabase.from('observations').update({ is_verified: true }).eq('id', id);
    else if (confirm("Supprimer ce signalement ?")) await supabase.from('observations').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-stone-200 relative">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
        <LayersControl position="topright">
          <BaseLayer checked name="Google Hybrid"><TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" /></BaseLayer>
          <BaseLayer name="Terrain"><TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" /></BaseLayer>
          <BaseLayer name="Standard"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></BaseLayer>
        </LayersControl>

        <Overlay name="NASA FIRMS (Feux)"><TileLayer url="https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/global/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=fires_24&STYLES=&FORMAT=image/png&TRANSPARENT=true&HEIGHT=256&WIDTH=256&SRS=EPSG:3857&BBOX={bbox-epsg-3857}" /></Overlay>
        
        <SearchField />
        <RulerTool />
        
        {areas.map((area) => (
          <Polygon key={area.id} pathOptions={{ color: area.color, fillColor: area.color, fillOpacity: 0.4, weight: 3, dashArray: '5, 10' }} positions={area.boundary.coordinates[0].map((c: any) => [c[1], c[0]])}>
            <Tooltip permanent direction="center" className="bg-transparent border-none shadow-none font-bold text-white text-[10px] uppercase">{area.name}</Tooltip>
          </Polygon>
        ))}

        {observations.map((obs) => (
          <Marker key={obs.id} position={[obs.coordinates.coordinates[1], obs.coordinates.coordinates[0]]} icon={obs.type === 'alert' ? AlertIcon : DefaultIcon}>
            <Popup>
              <div className="w-48">
                {obs.image_url && <img src={obs.image_url} className="w-full h-32 object-cover rounded-lg mb-2" />}
                <div className="font-bold text-green-700">{obs.species_name || "Observation"}</div>
                <p className="text-xs text-stone-600 line-clamp-2">{obs.description}</p>
                
                {(userRole === 'admin' || userRole === 'expert') && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
                    <button onClick={() => handleModerate(obs.id, 'verify')} className="flex-1 bg-green-600 text-white p-2 rounded-lg flex justify-center"><Check className="h-4 w-4" /></button>
                    <button onClick={() => handleModerate(obs.id, 'delete')} className="flex-1 bg-red-100 text-red-600 p-2 rounded-lg flex justify-center"><CloseIcon className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        <FullscreenControl position="topleft" />
        <ScaleControl position="bottomleft" imperial={false} />
        <LocationButton />
      </MapContainer>
    </div>
  );
}
