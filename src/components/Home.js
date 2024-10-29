import React, { useState, useEffect } from 'react';
import Mapa from './Mapa';
const Home = () => {
    const [message, setMessage] = useState('');
    useEffect(() => {
        /* fetch(`${process.env.REACT_APP_SERVER_PATH}/`)
            .then(response => response.text()) */
    }, []);
    return (
        <div className='container mt-5 text-center'>
            <h1>Bienvenido a Pozo Maps</h1>
            <p>Es una aplicación web para visualizar el estado de las rutas del Uruguay mediante Leaflet API.</p>
            {/* <p>{message}</p> */}
            <Mapa />
        </div>
    );
};

export default Home;