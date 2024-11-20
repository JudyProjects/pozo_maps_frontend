import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "leaflet-control-geocoder";
import axios from "axios";
import { defaultIcon } from "./Map_Components/constants";
import ModalComentario from "./Map_Components/ModalComentario";
import {
	saveRoute,
	isNearRoute,
	colorRouteSegment,
	createMarker,
	loadRouteMarkers,
	saveMarker,
} from "../resources/funcionesAux";

const Mapa = () => {
	const mapRef = useRef(null);
	const routingControlRef = useRef(null);
	const currentRouteRef = useRef(null);
	const markersLayerRef = useRef(null);
	const coloredRoutesRef = useRef([]);
	const [user, setUser] = useState(null);
	const currentRouteId = useRef(null);
	const isRestoringRoute = useRef(false);
	const mapInitialized = useRef(false);

	const [modalVisible, setModalVisible] = useState(false);
	const [modalPromiseResolve, setModalPromiseResolve] = useState(null);
	const [formData, setFormData] = useState({
		comentario: "",
		distancia: "",
		color: "",
	});

	const openModal = () => {
		return new Promise((resolve) => {
			setModalPromiseResolve(() => resolve);
			setModalVisible(true);
		});
	};

	const handleModalClose = (result) => {
		setModalVisible(false);
		if (modalPromiseResolve) {
			if (result.confirmed) {
				setFormData(result.data);
			}
			modalPromiseResolve(result);
			setModalPromiseResolve(null);
		}
	};

	const fetchUser = async () => {
		try {
			const response = await axios.get(
				`${process.env.REACT_APP_SERVER_PATH}/api/auth/me`,
				{
					withCredentials: true,
				}
			);
			setUser(response.data.name);
		} catch (error) {
			if (error.response.status === 401) {
				console.log("Sin tóken");
			} else {
				console.error("Error al obtener el usuario:", error);
			}
		}
	};

	useEffect(() => {
		fetchUser();
	}, []);

	useEffect(() => {
		if (!mapRef.current && !mapInitialized.current) {
            const loaderContainer = document.querySelector("div.loader-container");
			mapInitialized.current = true;
			// Inicializar el mapa
			mapRef.current = L.map("map", {
				maxBoundsViscosity: 1,
			}).setView([-32.37974, -56.08458], 7);

			var southWest = L.latLng(-36.5, -59.5), // Más al sur y oeste
				northEast = L.latLng(-29.5, -52.0), // Más al norte y este
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

			// Añadir evento de zoom
			mapRef.current.on("zoomend", () => {
				if (mapRef.current) {
					// Reordenar las capas
					coloredRoutesRef.current.forEach((route) => {
						route.bringToFront();
					});
				}
			});

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
					geocodingQueryParams: { countrycodes: "UY" },
				}),
				lineOptions: {
					styles: [{ color: "green", weight: 3, zIndex: 1 }],
					addWaypoints: false,
				},
				waypointMode: "snap",
			}).addTo(mapRef.current);

			// Manejar cambios en los waypoints
			routingControlRef.current.on(
				"waypointschanged",
				async function (e) {
					const waypoints = e.waypoints;
					// Si hay menos de 2 waypoints o se eliminó un waypoint
					if (
						waypoints[0].name === "" ||
						undefined ||
						waypoints[1].name === "" ||
						undefined
					) {
						// Limpiar los marcadores
						if (markersLayerRef.current) {
							markersLayerRef.current.clearLayers();
						}

						// Limpiar las rutas coloreadas
						coloredRoutesRef.current.forEach((route) => {
							if (mapRef.current && route) {
								mapRef.current.removeLayer(route);
							}
						});
						coloredRoutesRef.current = [];

						// Resetear las referencias de la ruta actual
						currentRouteRef.current = null;
						currentRouteId.current = null;
					}
				}
			);

			// Cuando se genera una ruta
			routingControlRef.current.on("routeselected", async function (e) {
				if (isRestoringRoute.current) {
					isRestoringRoute.current = false;
					return;
				}

				loaderContainer.classList.add("loader-active");
				currentRouteRef.current = {
					coordinates: Array.isArray(e.route.coordinates)
						? e.route.coordinates
						: e.route.geometry.coordinates.map((coord) => ({
								lng: coord[1],
								lat: coord[0],
						  })),
				};

				try {
					const waypoints = routingControlRef.current
						.getWaypoints()
						.filter((wp) => wp.latLng)
						.map((wp) => ({
							lat: wp.latLng.lat,
							lng: wp.latLng.lng,
						}));
					if (waypoints.length >= 2) {
						const route = await saveRoute(waypoints);
						if (route) {
							currentRouteId.current = route._id;
							await loadRouteMarkers(
								route._id,
								markersLayerRef.current,
								coloredRoutesRef.current,
								mapRef.current,
								currentRouteId.current,
								currentRouteRef.current,
								loaderContainer,
                                user
							);
						}
					}
				} catch (error) {
					console.error("Error al procesar la ruta:", error);
				}
				loaderContainer.classList.remove("loader-active");
			});

			if (user) {
				mapRef.current.on("click", async function (e) {
					if (
						currentRouteRef.current &&
						isNearRoute(e.latlng, currentRouteRef.current)
					) {
						loaderContainer.classList.add("loader-active");

						// Esperar la respuesta del modal
						const result = await openModal();

						// Solo continuar si el usuario confirmó
						if (result.confirmed) {
							try {
								const savedMarker = await saveMarker(
									e.latlng,
									result.data,
									mapRef.current,
									markersLayerRef.current,
									currentRouteId.current,
									currentRouteRef.current,
									coloredRoutesRef.current,
									loaderContainer,
                                    user
								);
								if (savedMarker) {
									createMarker(
										e.latlng,
										savedMarker._id,
										result.data.color,
										result.data.distancia,
										result.data.comentario,
										mapRef.current,
										markersLayerRef.current,
										currentRouteId.current,
										currentRouteRef.current,
										coloredRoutesRef.current,
										loaderContainer
									);
									colorRouteSegment(
										e.latlng,
										result.data.distancia,
										result.data.color,
										currentRouteRef.current,
										mapRef.current,
										coloredRoutesRef.current
									);
								}
							} catch (error) {
								console.error(
									"Error al crear el marcador:",
									error
								);
							}
						}

						loaderContainer.classList.remove("loader-active");
					}
				});
			}
		}

		return () => {
			if (mapRef.current) {
				// Limpiar referencias antes de desmontar
				coloredRoutesRef.current.forEach((route) => {
					if (mapRef.current && route) {
						mapRef.current.removeLayer(route);
					}
				});
				coloredRoutesRef.current = [];

				if (markersLayerRef.current) {
					markersLayerRef.current.clearLayers();
				}

				mapRef.current.remove();
				mapRef.current = null;
				routingControlRef.current = null;
				currentRouteRef.current = null;
				markersLayerRef.current = null;
				mapInitialized.current = false;
			}
		};
	}, [user]);

	return (
		<>
			<div className="loader-container">
				<div className="loader"></div>
			</div>
			<ModalComentario
				visible={modalVisible}
				onClose={handleModalClose}
			/>
			<div
				id="map"
				style={{ height: "600px", width: "auto", borderRadius: "10px" }}
			></div>
		</>
	);
};

export default Mapa;
