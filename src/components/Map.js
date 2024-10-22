import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.js';
import constants from './Map_Components/constants';

const GeocoderControl = () => {
    const map = useMap(); // Obtener el mapa usando el hook de react-leaflet

    useEffect(() => {
        if (!map) return;

        // Configurar el icono predeterminado para los marcadores
        L.Marker.prototype.options.icon = constants;

        // Añadir el geocoder al mapa
        L.Control.geocoder({
            defaultMarkGeocode: false
        })
        .on('markgeocode', function (e) {
            const latlng = e.geocode.center;
            L.marker(latlng).addTo(map).bindPopup(e.geocode.name).openPopup();
            map.fitBounds(e.geocode.bbox); // Ajustar el mapa a los límites del geocódigo
        })
        .addTo(map);
    }, [map]);

    return null; // No necesitamos renderizar nada explícitamente
};

const Map = () => {
    const position = [-32.37974, -56.08458];

    return (
        <MapContainer
            center={position}
            zoom={6}
            style={{ height: '700px' }}
            id='mapId'
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <GeocoderControl /> {/* Añadir el componente de control del geocoder */}
        </MapContainer>
    );
};

export default Map;
