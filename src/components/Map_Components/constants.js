import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import warningIconPng from "../../resources/warningMarker.png";

export const defaultIcon = L.icon({
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [12, -40],
  iconUrl: markerIconPng,
  shadowUrl: "https://unpkg.com/leaflet@1.6/dist/images/marker-shadow.png"
});

export const warningIcon = L.icon({
  iconSize: [40, 41],
  iconAnchor: [10, 41],
  popupAnchor: [12, -40],
  iconUrl: warningIconPng
});