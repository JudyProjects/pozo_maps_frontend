import './App.css';
import Home from './components/Home';
import { BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import Navbar from './components/partials/Navbar';
import Perfil from './components/Auth/Perfil';

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path='*' element={<Navigate to='/' />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </Router>
  );
}

export default App;
