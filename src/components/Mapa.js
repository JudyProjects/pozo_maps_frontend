import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "leaflet-control-geocoder";
import axios from "axios";
import {
	defaultIcon,
	warningIcon,
	dangerIcon,
} from "./Map_Components/constants";
import ModalComentario from "./Map_Components/ModalComentario";

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
			return Math.sqrt(Math.pow(lat - x, 2) + Math.pow(lng - y, 2));
		}

		const t = ((lat - x) * dx + (lng - y) * dy) / (dx * dx + dy * dy);

		if (t < 0) {
			// Punto más cercano está en start
			return Math.sqrt(Math.pow(lat - x, 2) + Math.pow(lng - y, 2));
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

	// Función para guardar una nueva ruta
	const saveRoute = async (waypoints) => {
		if (!waypoints || waypoints.length < 2) {
			console.error(
				"Se necesitan al menos dos puntos para crear una ruta"
			);
			return null;
		}

		try {
			const response = await fetch(
				`${process.env.REACT_APP_SERVER_PATH}/api/routes/routes`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: `Route ${new Date().toISOString()}`,
						waypoints: waypoints,
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`Error HTTP: ${response.status}`);
			}

			const route = await response.json();
			return route;
		} catch (error) {
			console.error("Error saving route:", error);
			// Aquí podrías mostrar una notificación al usuario
			return null;
		}
	};

	// Función para guardar un marcador
	const saveMarker = async (latlng, formData) => {
		if (!currentRouteId.current) return;

		try {
			const response = await fetch(
				`${process.env.REACT_APP_SERVER_PATH}/api/routes/markers`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						routeId: currentRouteId.current,
						position: {
							lat: latlng.lat,
							lng: latlng.lng,
						},
						traceDistance: formData.distancia,
						traceColor: formData.color,
						comentario: formData.comentario,
					}),
				}
			);
			if (!response.ok) throw new Error("Error al guardar el marcador");
			const savedMarker = await response.json();

			// Crear el marcador y colorear la ruta sin recargar todos los marcadores
			const marker = createMarker(
				latlng,
				savedMarker._id,
				formData.color,
				formData.distancia,
				formData.comentario
			);
			if (marker) {
				colorRouteSegment(latlng, formData.distancia, formData.color);
			}

			return savedMarker;
		} catch (error) {
			console.error("Error saving marker:", error);
		}
	};

	// Función para cargar los marcadores de una ruta
	const loadRouteMarkers = async (routeId) => {
		try {
			const response = await fetch(
				`${process.env.REACT_APP_SERVER_PATH}/api/routes/routes/${routeId}/markers`
			);
			if (!response.ok) throw new Error("Error al cargar los marcadores");

			const markers = await response.json();

			// Limpiar solo los marcadores y rutas coloreadas
			if (markersLayerRef.current) {
				markersLayerRef.current.clearLayers();
			}

			coloredRoutesRef.current.forEach((route) => {
				if (mapRef.current && route) {
					mapRef.current.removeLayer(route);
				}
			});
			coloredRoutesRef.current = [];

			// Añadir los marcadores cargados
			markers.forEach((markerData) => {
				const latlng = L.latLng(
					markerData.position.lat,
					markerData.position.lng
				);
				const marker = createMarker(
					latlng,
					markerData._id,
					markerData.traceColor,
					markerData.traceDistance,
					markerData.comentario
				);

				if (marker) {
					colorRouteSegment(
						latlng,
						markerData.traceDistance || 3000,
						markerData.traceColor || "yellow"
					);
				}
			});
		} catch (error) {
			console.error("Error loading markers:", error);
		}
	};

	// Función modificada para crear marcadores
	const createMarker = (latlng, markerId, color, distancia, comentario) => {
		if (!mapRef.current || !markersLayerRef.current) {
			console.warn(
				"El mapa o la capa de marcadores no está inicializada"
			);
			return null;
		}

		try {
			const marker = L.marker(latlng, {
				icon: color === "yellow" ? warningIcon : dangerIcon,
				draggable: true,
			});
			marker.markerId = markerId;
			marker.bindPopup(`
                <div class="d-flex flex-column">
                    <div>
                        <p class="fs-6"><strong>Distancia:</strong> ${
							distancia / 1000
						}km</p>
                        <p class="fs-6"><strong>Comentario:</strong> ${comentario}</p>
                    </div>
                    <button class="btn btn-outline-danger marker-delete-btn align-self-center">Eliminar</button>
                </div>
            `);
			// Manejador del popup
			marker.on("popupopen", () => {
				const deleteBtn = document.querySelector(".marker-delete-btn");
				if (deleteBtn) {
					deleteBtn.onclick = async () => {
						try {
							if (marker.markerId) {
								const response = await fetch(
									`${process.env.REACT_APP_SERVER_PATH}/api/routes/markers/${marker.markerId}`,
									{
										method: "DELETE",
									}
								);
								if (!response.ok)
									throw new Error(
										"Error al eliminar el marcador"
									);
							}
							if (markersLayerRef.current) {
								markersLayerRef.current.removeLayer(marker);
								coloredRoutesRef.current.forEach((route) => {
									if (mapRef.current && route) {
										mapRef.current.removeLayer(route);
									}
								});
								coloredRoutesRef.current = [];
							}
						} catch (error) {
							console.error("Error deleting marker:", error);
						}
					};
				}
			});

			// Manejador de arrastre
			marker.on("dragend", async (event) => {
				const newLatLng = event.target.getLatLng();
				if (isNearRoute(newLatLng)) {
					try {
						if (marker.markerId) {
							const response = await fetch(
								`${process.env.REACT_APP_SERVER_PATH}/api/routes/markers/${marker.markerId}`,
								{
									method: "PUT",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										position: {
											lat: newLatLng.lat,
											lng: newLatLng.lng,
										},
									}),
								}
							);
							if (!response.ok)
								throw new Error(
									"Error al actualizar el marcador"
								);
						}

						if (mapRef.current) {
							coloredRoutesRef.current.forEach((route) => {
								if (route) mapRef.current.removeLayer(route);
							});
							coloredRoutesRef.current = [];
							colorRouteSegment(newLatLng, 3000, "yellow");
						}
					} catch (error) {
						console.error("Error updating marker position:", error);
						marker.setLatLng(event.oldLatLng);
					}
				} else {
					marker.setLatLng(event.oldLatLng);
				}
			});
			markersLayerRef.current.addLayer(marker);

			return marker;
		} catch (error) {
			console.error("Error al crear el marcador:", error);
			return null;
		}
	};

	// Función para calcular el punto más cercano en la ruta
	const findClosestPointOnRoute = (latlng, coordinates) => {
		if (!coordinates || coordinates.length === 0) {
			console.error("No hay coordenadas de ruta disponibles");
			return { point: null, index: -1 };
		}

		let minDistance = Infinity;
		let closestPointIndex = 0;
		let closestPoint = null;

		try {
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
		} catch (error) {
			console.error("Error al buscar el punto más cercano:", error);
			return { point: null, index: -1 };
		}

		return { point: closestPoint, index: closestPointIndex };
	};

	// Función para calcular los puntos de la ruta dentro de una distancia
	const getRouteSegment = (startIndex, distance) => {
		const coordinates = currentRouteRef.current.coordinates;
		let accumulatedDistance = 0;
		let points = [coordinates[startIndex]];

		for (let i = startIndex; i < coordinates.length - 1; i++) {
			const segmentDistance = L.latLng(coordinates[i]).distanceTo(
				L.latLng(coordinates[i + 1])
			);
			if (accumulatedDistance + segmentDistance > distance) {
				// Calcular el punto exacto donde se alcanza la distancia
				const remainingDistance = distance - accumulatedDistance;
				const ratio = remainingDistance / segmentDistance;
				const lat =
					coordinates[i].lat +
					(coordinates[i + 1].lat - coordinates[i].lat) * ratio;
				const lng =
					coordinates[i].lng +
					(coordinates[i + 1].lng - coordinates[i].lng) * ratio;
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
	const colorRouteSegment = (startLatLng, distancia, color) => {
		if (!currentRouteRef.current) return;

		const coordinates = currentRouteRef.current.coordinates;
		const { index } = findClosestPointOnRoute(startLatLng, coordinates);
		const segmentPoints = getRouteSegment(index, distancia);

		// Crear una nueva polyline coloreada
		const coloredRoute = L.polyline(segmentPoints, {
			color: color,
			weight: 5,
			opacity: 1,
			zIndex: 5000,
		}).addTo(mapRef.current);

		// Guardar referencia para poder eliminarla después si es necesario
		coloredRoutesRef.current.push(coloredRoute);
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
			mapInitialized.current = true;
			const loaderContainer = document.querySelector(
				"div.loader-container"
			);
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
					if ((waypoints[0].name === "" || undefined) || (waypoints[1].name === "" || undefined)) {
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
							await loadRouteMarkers(route._id);
						}
					}
				} catch (error) {
					console.error("Error al procesar la ruta:", error);
				}
				loaderContainer.classList.remove("loader-active");
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

			if (user) {
				mapRef.current.on("click", async function (e) {
					if (currentRouteRef.current && isNearRoute(e.latlng)) {
						loaderContainer.classList.add("loader-active");

						// Esperar la respuesta del modal
						const result = await openModal();

						// Solo continuar si el usuario confirmó
						if (result.confirmed) {
							try {
								const savedMarker = await saveMarker(
									e.latlng,
									result.data
								);
								if (savedMarker) {
									createMarker(
										e.latlng,
										savedMarker._id,
										result.data.color,
										result.data.distancia,
										result.data.comentario
									);
									colorRouteSegment(
										e.latlng,
										result.data.distancia,
										result.data.color
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
