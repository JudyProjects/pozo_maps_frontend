import React from 'react';
import Mapa from './Mapa';
import manosMapa from '../resources/manosMapa.jpg';
import './Home.css';
const Home = () => {
    return (
        <div className='container mt-5 text-center'>
            <div className='map-container'>
                <Mapa />
            </div>
            <div className='home-cover'>
                <img src={manosMapa} alt="Portada Pozo Maps" className="cover-image" />
                <div className="cover-text">
                    <h1>Bienvenido a Pozo Maps</h1>
                    <p>Es una aplicación web para visualizar el estado de las rutas del Uruguay mediante Leaflet API.</p>
                </div>
            </div>
        </div>
    );
};

export default Home;