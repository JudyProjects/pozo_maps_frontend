import React, { useState, useEffect } from 'react';

const Home = () => {
    const [message, setMessage] = useState('');
    useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_PATH}/`)
            .then(response => response.text())
            .then(data => setMessage(data));
    }, []); 
    return (
        <div className='container mt-5'>
            <h1>Welcome to Pozo Maps</h1>
            <p>This is a simple web application to visualize and analyze geospatial data using Google Maps API.</p>
            {<p>{message}</p>}
        </div>
    );
};

export default Home;