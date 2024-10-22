import L from "leaflet";
import { createControlComponent } from "@react-leaflet/core";
import { useMap } from "react-leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.js";

const CreateRoutineMachineLayer = () => {
    const map = useMap();
    if (!map) {
        console.error('Map not available');
        return null;
    }

    // Crear el geocoder y añadirlo al mapa
    

    // Crear la instancia del Routing Machine
    const instance = L.Routing.control({
        
        routeWhileDragging: true,  
    });

    // Verificar si la instancia fue creada correctamente
    if (!instance) {
        console.error('Failed to create L.Routing.control instance');
        return null;
    }

    instance.addTo(map);  // Añadir al mapa solo si la instancia es válida

    return instance;
};

const RoutingMachine = createControlComponent(CreateRoutineMachineLayer);

export default RoutingMachine;
 