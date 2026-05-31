import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Property {
  idProperty?: string;
  externalId?: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  imageUrls: string[];
}

interface PropertyMapProps {
  properties: Property[];
  selectedProperty?: Property | null;
  center?: [number, number];
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function PropertyMap({ properties, selectedProperty, center }: PropertyMapProps) {
  const defaultCenter: [number, number] = center || [40.7128, -74.0060]; // NYC default
  
  const validProperties = properties.filter(p => p.latitude && p.longitude);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-border/50">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center && <ChangeView center={center} />}
        
        {validProperties.map((prop) => {
          const isSelected = selectedProperty && (prop.externalId === selectedProperty.externalId || prop.idProperty === selectedProperty.idProperty);
          return (
            <Marker 
              key={prop.externalId || prop.idProperty} 
              position={[prop.latitude, prop.longitude]}
              icon={isSelected ? redIcon : blueIcon}
            >
              <Tooltip direction="top" offset={[0, -40]} opacity={1}>
                <div className="w-40 p-1">
                  <img 
                    src={prop.imageUrls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} 
                    alt={prop.title}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <div className="mt-1 font-bold text-[10px] truncate">{prop.title}</div>
                </div>
              </Tooltip>
              <Popup>
                <div className="w-48 overflow-hidden rounded-lg">
                  <div className="font-bold text-sm truncate">{prop.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{prop.address}</div>
                  <div className="text-sm font-black mt-1 text-eerie">
                    {prop.price?.toLocaleString()} $
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground italic">
                    Source: {prop.externalId ? "API" : "Base locale"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
