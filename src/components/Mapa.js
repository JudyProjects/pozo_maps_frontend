import React, { useEffect, useRef } from "react";
import L, { icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "leaflet-control-geocoder";
import { defaultIcon, warningIcon } from "./Map_Components/constants";

const Mapa = () => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current) {
            // Aquí se puede utilizar mapRef.current para manipular el mapa
            mapRef.current = L.map("map", {
                maxBoundsViscosity: 1,
            }).setView([-32.37974, -56.08458], 7);

            var southWest = L.latLng(-35.7824481, -58.4948438),
                northEast = L.latLng(-30.0853962, -53.0755833),
                myBounds = L.latLngBounds(southWest, northEast);

            mapRef.current.setMaxBounds(myBounds); // Establece los límites
            L.tileLayer(
                "https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png",
                {
                    minZoom: 7,
                    maxZoom: 12,
                    attribution:
                        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                }
            ).addTo(mapRef.current);

            // Configurar el icono predeterminado para los marcadores
            L.Marker.prototype.options.icon = defaultIcon;

            /* L.marker([-32.333821537697816, -57.890433274446686], {
                icon: warningIcon,
            }).addTo(mapRef.current); */

            // Añadir el geocoder al mapa
            L.Routing.control({
                showAlternatives: false,
                router: new L.Routing.mapbox(
                    "pk.eyJ1IjoiZnJhbmNvLXNhbmNyaXMyOSIsImEiOiJjbTJhendnc3cwbXFsMmtxNHBzYm80ZGdtIn0.gHW9ZszrPfh0cUs-zVvI3Q"
                ),
                geocoder: L.Control.Geocoder.nominatim({
                    geocodingQueryParams: { countrycodes: "UY" }, // Solo Uruguay (UY)
                }),
                lineOptions: {
                    styles: [{ color: "green", weight: 3 }], // Define el estilo de la línea
                },
            }).addTo(mapRef.current);
        }

        // Establece los límites para evitar el desplazamiento fuera de Uruguay
        mapRef.current.on("drag", function () {
            mapRef.current.panInsideBounds(myBounds, { animate: false });
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    });
    return <div id="map" style={{ height: "600px", width: "auto" }}></div>;
};

export default Mapa;
