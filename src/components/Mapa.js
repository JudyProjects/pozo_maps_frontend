import React, { useEffect, useState, useRef } from "react";
import L, { icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "leaflet-control-geocoder";
import { defaultIcon, warningIcon } from "./Map_Components/constants";

const Mapa = () => {
    const mapRef = useRef(null);
    const routingControlRef = useRef(null);
    const currentRouteRef = useRef(null);
    const markersLayerRef = useRef(null);
    const coloredRoutesRef = useRef([]);

    // Función para calcular la distancia entre un punto y un segmento de línea
    const distanceToSegment = (point, start, end) => {
        const lat = point.lat;
        const lng = point.lng;
        const x = start.lat;
        const y = start.lng;
        const dx = end.lat - x;
        const dy = end.lng - y;

        if (dx === 0 && dy === 0) {
            // El segmento es un punto
            return Math.sqrt(
                Math.pow(lat - x, 2) + Math.pow(lng - y, 2)
            );
        }

        const t = ((lat - x) * dx + (lng - y) * dy) / (dx * dx + dy * dy);

        if (t < 0) {
            // Punto más cercano está en start
            return Math.sqrt(
                Math.pow(lat - x, 2) + Math.pow(lng - y, 2)
            );
        }
        if (t > 1) {
            // Punto más cercano está en end
            return Math.sqrt(
                Math.pow(lat - end.lat, 2) + Math.pow(lng - end.lng, 2)
            );
        }

        // Punto más cercano está en el segmento
        const nearestX = x + t * dx;
        const nearestY = y + t * dy;
        return Math.sqrt(
            Math.pow(lat - nearestX, 2) + Math.pow(lng - nearestY, 2)
        );
    };

    // Función para calcular el punto más cercano en la ruta
    const findClosestPointOnRoute = (latlng, coordinates) => {
        let minDistance = Infinity;
        let closestPointIndex = 0;
        let closestPoint = null;

        for (let i = 0; i < coordinates.length - 1; i++) {
            const distance = distanceToSegment(
                latlng,
                coordinates[i],
                coordinates[i + 1]
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestPointIndex = i;
                closestPoint = coordinates[i];
            }
        }

        return { point: closestPoint, index: closestPointIndex };
    };

    // Función para calcular los puntos de la ruta dentro de una distancia
    const getRouteSegment = (startIndex, distance) => {
        const coordinates = currentRouteRef.current.coordinates;
        let accumulatedDistance = 0;
        let points = [coordinates[startIndex]];

        for (let i = startIndex; i < coordinates.length - 1; i++) {
            const segmentDistance = L.latLng(coordinates[i]).distanceTo(L.latLng(coordinates[i + 1]));
            if (accumulatedDistance + segmentDistance > distance) {
                // Calcular el punto exacto donde se alcanza la distancia
                const remainingDistance = distance - accumulatedDistance;
                const ratio = remainingDistance / segmentDistance;
                const lat = coordinates[i].lat + (coordinates[i + 1].lat - coordinates[i].lat) * ratio;
                const lng = coordinates[i].lng + (coordinates[i + 1].lng - coordinates[i].lng) * ratio;
                points.push({ lat, lng });
                break;
            } else {
                points.push(coordinates[i + 1]);
                accumulatedDistance += segmentDistance;
            }
        }

        return points;
    };

    // Función para colorear un segmento de la ruta
    const colorRouteSegment = (startLatLng, distance, color) => {
        if (!currentRouteRef.current) return;

        const coordinates = currentRouteRef.current.coordinates;
        const { index } = findClosestPointOnRoute(startLatLng, coordinates);
        const segmentPoints = getRouteSegment(index, distance);

        // Crear una nueva polyline coloreada
        const coloredRoute = L.polyline(segmentPoints, {
            color: color,
            weight: 5,
            opacity: 0.7
        }).addTo(mapRef.current);

        // Guardar referencia para poder eliminarla después si es necesario
        coloredRoutesRef.current.push(coloredRoute);
    };
    
    useEffect(() => {
        if (!mapRef.current) {
            // Inicializar el mapa
            mapRef.current = L.map("map", {
                maxBoundsViscosity: 1,
            }).setView([-32.37974, -56.08458], 7);

            var southWest = L.latLng(-35.7824481, -58.4948438),
                northEast = L.latLng(-30.0853962, -53.0755833),
                myBounds = L.latLngBounds(southWest, northEast);

            mapRef.current.setMaxBounds(myBounds);

            L.Marker.prototype.options.icon = defaultIcon;

            // Capa base del mapa
            L.tileLayer(
                "https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png",
                {
                    minZoom: 7,
                    maxZoom: 12,
                    attribution:
                        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                }
            ).addTo(mapRef.current);

            // Capa para los marcadores personalizados
            markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

            // Control de rutas
            routingControlRef.current = L.Routing.control({
                waypoints: [],
                addWaypoints: true,
                draggableWaypoints: false,
                allowDropWaypoints: false,
                showAlternatives: false,
                router: new L.Routing.mapbox(
                    "pk.eyJ1IjoiZnJhbmNvLXNhbmNyaXMyOSIsImEiOiJjbTJhendnc3cwbXFsMmtxNHBzYm80ZGdtIn0.gHW9ZszrPfh0cUs-zVvI3Q"
                ),
                geocoder: L.Control.Geocoder.nominatim({
                    geocodingQueryParams: { countrycodes: "UY" }
                }),
                lineOptions: {
                    styles: [{ color: "green", weight: 3 }],
                    addWaypoints: false
                },
                waypointMode: "snap"
            }).addTo(mapRef.current);

            // Cuando se genera una ruta
            routingControlRef.current.on('routeselected', function(e) {
                currentRouteRef.current = e.route;
                e.route.routeLine.on('click', L.DomEvent.stop);
                e.route.routeLine.off('click');
            });

            // Función para verificar si un punto está cerca de la ruta
            const isNearRoute = (latlng) => {
                if (!currentRouteRef.current) return false;
                
                const routeCoords = currentRouteRef.current.coordinates;
                const MAX_DISTANCE = 0.005; // Aproximadamente 500 metros en grados
                
                let minDistance = Infinity;
                for (let i = 0; i < routeCoords.length - 1; i++) {
                    const distance = distanceToSegment(
                        latlng,
                        routeCoords[i],
                        routeCoords[i + 1]
                    );
                    minDistance = Math.min(minDistance, distance);
                }
                return minDistance <= MAX_DISTANCE;
            };

            // Modificar el evento de clic para incluir el coloreado de ruta
            mapRef.current.on('click', function(e) {
                if (currentRouteRef.current && isNearRoute(e.latlng)) {
                    const marker = L.marker(e.latlng, {
                        icon: warningIcon,
                        draggable: true
                    });

                    // Colorear 5km de la ruta en amarillo
                    colorRouteSegment(e.latlng, 3000, 'yellow');

                    marker.bindPopup(`
                        <div>
                            <p>Latitud: ${e.latlng.lat.toFixed(4)}</p>
                            <p>Longitud: ${e.latlng.lng.toFixed(4)}</p>
                            <button class="marker-delete-btn">Eliminar</button>
                        </div>
                    `);

                    marker.on('popupopen', function() {
                        const deleteBtn = document.querySelector('.marker-delete-btn');
                        if (deleteBtn) {
                            deleteBtn.onclick = () => {
                                markersLayerRef.current.removeLayer(marker);
                                // Limpiar las rutas coloreadas cuando se elimina el marcador
                                coloredRoutesRef.current.forEach(route => {
                                    mapRef.current.removeLayer(route);
                                });
                                coloredRoutesRef.current = [];
                            };
                        }
                    });

                    marker.on('drag', function(event) {
                        if (!isNearRoute(event.latlng)) {
                            marker.setLatLng(event.oldLatLng);
                        } else {
                            // Actualizar el coloreado de la ruta al arrastrar
                            coloredRoutesRef.current.forEach(route => {
                                mapRef.current.removeLayer(route);
                            });
                            coloredRoutesRef.current = [];
                            colorRouteSegment(event.latlng, 3000, 'yellow');
                        }
                    });

                    markersLayerRef.current.addLayer(marker);
                }
            });
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return <div id="map" style={{ height: "600px", width: "auto" }}></div>;
};

export default Mapa;