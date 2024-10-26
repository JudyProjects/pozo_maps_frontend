import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.js';
import "leaflet-routing-machine";
import constants from './Map_Components/constants';
import "leaflet/dist/leaflet.css";
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const GeocoderControl = () => {
    const map = useMap(); // Obtener el mapa usando el hook de react-leaflet
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            // Configurar el icono predeterminado para los marcadores
            L.Marker.prototype.options.icon = constants;

            // Añadir el geocoder al mapa
            const routingControl = L.Routing.control({
                routeWhileDragging: true,
                showAlternatives: false,
                router: new L.Routing.mapbox('pk.eyJ1IjoiZnJhbmNvLXNhbmNyaXMyOSIsImEiOiJjbTJhendnc3cwbXFsMmtxNHBzYm80ZGdtIn0.gHW9ZszrPfh0cUs-zVvI3Q'),
                geocoder: L.Control.Geocoder.nominatim(),
                lineOptions: {
                    styles: [{ color: 'green', weight: 3 }] // Define el estilo de la línea
                }
            }).addTo(map);

            
        }
    });

    
    return null; // No necesita renderizar nada explícitamente
};

const Map = () => {
    const position = [-32.37974, -56.08458];

    return (
        <MapContainer
            center={position}
            zoom={2}
            minZoom={7}
            style={{ height: '700px' }}
            id='mapId'
        >
            <TileLayer url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png" attribution='@OpenStreetMap, @StadiaMaps' />
            <GeocoderControl /> {/* Añadir el componente de control del geocoder */}
        </MapContainer>
    );
};

export default Map;
