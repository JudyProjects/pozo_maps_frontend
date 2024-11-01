import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Perfil.css'

const Profile = () => {
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_SERVER_PATH}/api/auth/perfil`, { withCredentials: true });
                setProfileData(response.data);
            } catch (error) {
                console.error('Error al obtener el perfil:', error);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${process.env.REACT_APP_SERVER_PATH}/api/auth/perfil`, profileData, { withCredentials: true });
            setProfileData(response.data);
            setMessage('Perfil actualizado con éxito');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            setMessage('Error al actualizar el perfil');
        }
    };

    return (
        <div className="profile-container">
            <h2 className='text-center'>Mi Perfil</h2>
            <div className='h-50'>
                <form onSubmit={handleSubmit} className='formularioIzq'>
                    <div className='divCampos'>
                        <div className='form-group m-3'>
                            <label>Nombre:</label>
                            <input type="text" className='form-control' name="name" value={profileData.name} onChange={handleChange} />
                        </div>
                        <div className='form-group m-3'>
                            <label>Correo electrónico:</label>
                            <input type="email" className='form-control' name="email" value={profileData.email} onChange={handleChange} />
                        </div>
                        <div className='d-flex justify-content-center align-items-center'>
                    <button type="submit" className='btn btn-primary m-3 btnPrimario'>Guardar</button>
                </div>
                    </div>
                </form>
                {message && <p>{message}</p>}
            </div>

        </div>
    );
};

export default Profile;
