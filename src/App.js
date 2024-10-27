import './App.css';
import Home from './components/Home';
import { BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path='*' element={<Navigate to='/' />} />
      </Routes>
    </Router>
  );
}

export default App;
