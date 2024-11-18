import L from "leaflet";
import {
	warningIcon,
	dangerIcon,
} from "./../components/Map_Components/constants";

// Función para guardar una nueva ruta
export const saveRoute = async (waypoints) => {
	if (!waypoints || waypoints.length < 2) {
		console.error("Se necesitan al menos dos puntos para crear una ruta");
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

// Función modificada para crear marcadores
export const createMarker = (
	latlng,
	markerId,
	color,
	distancia,
	comentario,
	mapRef,
	markersLayerRef,
	currentRouteId,
	currentRouteRef,
	coloredRoutesRef,
	loaderContainer
) => {
	if (!mapRef || !markersLayerRef) {
		console.warn("El mapa o la capa de marcadores no está inicializada");
		return null;
	}

	try {
		const marker = L.marker(latlng, {
			icon: color === "yellow" ? warningIcon : dangerIcon,
			draggable: true,
			traceDistance: distancia,
			traceColor: color,
			comentario: comentario,
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

							// Eliminar solo este marcador
							markersLayerRef.removeLayer(marker);

							// Recargar todos los marcadores y sus colores
							await loadRouteMarkers(
								currentRouteId,
								markersLayerRef,
								coloredRoutesRef,
								mapRef,
								currentRouteId,
								currentRouteRef
							);
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
			// Asegurarnos de que newLatLng es válido y tiene propiedades lat y lng
			if (
				newLatLng &&
				typeof newLatLng.lat === "number" &&
				typeof newLatLng.lng === "number"
			) {
				if (
					currentRouteRef &&
					isNearRoute(newLatLng, currentRouteRef)
				) {
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
										// Mantener los valores existentes del marcador
										traceDistance:
											marker.options.traceDistance ||
											3000,
										traceColor:
											marker.options.traceColor ||
											"yellow",
										comentario:
											marker.options.comentario || "",
									}),
								}
							);
							if (!response.ok)
								throw new Error(
									"Error al actualizar el marcador"
								);
							loaderContainer.classList.add("loader-active");
							// Recargar todos los marcadores y sus colores
							await loadRouteMarkers(
								currentRouteId,
								markersLayerRef,
								coloredRoutesRef,
								mapRef,
								currentRouteId,
								currentRouteRef
							);
							loaderContainer.classList.remove("loader-active");
						}
					} catch (error) {
						console.error("Error updating marker position:", error);
						loaderContainer.classList.add("loader-active");
						// Recargar todos los marcadores y sus colores
						await loadRouteMarkers(
							currentRouteId,
							markersLayerRef,
							coloredRoutesRef,
							mapRef,
							currentRouteId,
							currentRouteRef
						);
						loaderContainer.classList.remove("loader-active");
					}
				} else {
					loaderContainer.classList.add("loader-active");
					// Recargar todos los marcadores y sus colores
					await loadRouteMarkers(
						currentRouteId,
						markersLayerRef,
						coloredRoutesRef,
						mapRef,
						currentRouteId,
						currentRouteRef
					);
					loaderContainer.classList.remove("loader-active");
				}
			} else {
				console.error("Invalid latlng object:", newLatLng);

				loaderContainer.classList.add("loader-active");
				// Recargar todos los marcadores y sus colores
				await loadRouteMarkers(
					currentRouteId,
					markersLayerRef,
					coloredRoutesRef,
					mapRef,
					currentRouteId,
					currentRouteRef
				);
				loaderContainer.classList.remove("loader-active");
			}
		});
		markersLayerRef.addLayer(marker);

		return marker;
	} catch (error) {
		console.error("Error al crear el marcador:", error);
		return null;
	}
};

// Función para cargar los marcadores de una ruta
export const loadRouteMarkers = async (
	routeId,
	markersLayerRef,
	coloredRoutesRef,
	mapRef,
	currentRouteId,
	currentRouteRef,
	loaderContainer
) => {
	try {
		const response = await fetch(
			`${process.env.REACT_APP_SERVER_PATH}/api/routes/routes/${routeId}/markers`
		);
		if (!response.ok) throw new Error("Error al cargar los marcadores");

		const markers = await response.json();

		// Limpiar solo los marcadores y rutas coloreadas
		if (markersLayerRef) {
			markersLayerRef.clearLayers();
		}

		coloredRoutesRef.forEach((route) => {
			if (mapRef && route) {
				mapRef.removeLayer(route);
			}
		});
		coloredRoutesRef = [];

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
				markerData.comentario,
				mapRef,
				markersLayerRef,
				currentRouteId,
				currentRouteRef,
				coloredRoutesRef,
				loaderContainer
			);

			if (marker) {
				colorRouteSegment(
					latlng,
					markerData.traceDistance || 3000,
					markerData.traceColor || "yellow",
					currentRouteRef,
					mapRef,
					coloredRoutesRef
				);
			}
		});
	} catch (error) {
		console.error("Error loading markers:", error);
	}
};

// Función para guardar un marcador
export const saveMarker = async (
	latlng,
	formData,
	mapRef,
	markersLayerRef,
	currentRouteId,
	currentRouteRef,
	coloredRoutesRef,
	loaderContainer
) => {
	if (!currentRouteId) return;

	try {
		const response = await fetch(
			`${process.env.REACT_APP_SERVER_PATH}/api/routes/markers`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					routeId: currentRouteId,
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
			formData.comentario,
			mapRef,
			markersLayerRef,
			currentRouteId,
			currentRouteRef,
			coloredRoutesRef,
			loaderContainer
		);
		if (marker) {
			colorRouteSegment(
				latlng,
				formData.distancia,
				formData.color,
				currentRouteRef,
				mapRef,
				coloredRoutesRef
			);
		}

		return savedMarker;
	} catch (error) {
		console.error("Error saving marker:", error);
	}
};

// Función para calcular la distancia entre un punto y un segmento de línea
export const distanceToSegment = (point, start, end) => {
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
	return Math.sqrt(Math.pow(lat - nearestX, 2) + Math.pow(lng - nearestY, 2));
};

// Función para calcular el punto más cercano en la ruta
export const findClosestPointOnRoute = (latlng, coordinates) => {
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

export const isNearRoute = (latlng, currentRouteRef) => {
	if (!currentRouteRef) return false;
	const routeCoords = currentRouteRef.coordinates;
	const MAX_DISTANCE = 0.1;

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

// Función para calcular los puntos de la ruta dentro de una distancia
export const getRouteSegment = (startIndex, distance, currentRouteRef) => {
	const coordinates = currentRouteRef.coordinates;
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
export const colorRouteSegment = (
	startLatLng,
	distancia,
	color,
	currentRouteRef,
	mapRef,
	coloredRoutesRef
) => {
	if (!currentRouteRef) return;

	const coordinates = currentRouteRef.coordinates;
	const { index } = findClosestPointOnRoute(startLatLng, coordinates);
	const segmentPoints = getRouteSegment(index, distancia, currentRouteRef);

	// Crear una nueva polyline coloreada
	const coloredRoute = L.polyline(segmentPoints, {
		color: color,
		weight: 5,
		opacity: 1,
		zIndex: 5000,
	}).addTo(mapRef);

	// Guardar referencia para poder eliminarla después si es necesario
	coloredRoutesRef.push(coloredRoute);
};
