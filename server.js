const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de Multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// URL del Google Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby--UYu7RgOBRovIxPZ9IjIkEK2nClE4KivNUtc9Nod8Sgd_5yCcq7OJuo8tAkM_JU8Ig/exec';

// Ruta para registrar datos
app.post('/register', upload.single('fileFoto'), async (req, res) => {
  try {
    const { nombre, aQuienVisita, numeroCasa, fecha, horaEntrada } = req.body;

    // Convertir la imagen a base64
    const imagenBase64 = req.file ? req.file.buffer.toString('base64') : '';

    // Enviar datos al Google Apps Script
    await axios.post(GOOGLE_SCRIPT_URL, {
      nombre,
      aQuienVisita,
      numeroCasa,
      fecha,
      horaEntrada,
      imagen: imagenBase64
    });

    res.status(200).send('Registro exitoso');
  } catch (error) {
    console.error('Error al registrar:', error.response ? error.response.data : error.message);
    res.status(500).send(`Error al registrar: ${error.response ? error.response.data : error.message}`);
  }
});

// Ruta para registrar hora de salida
app.post('/salida', async (req, res) => {
  try {
    const { nombre } = req.body;
    const horaSalida = new Date().toLocaleTimeString();

    await axios.post(GOOGLE_SCRIPT_URL, {
      nombre,
      horaSalida
    });

    res.status(200).send('Hora de salida actualizada');
  } catch (error) {
    console.error('Error al actualizar la hora de salida:', error.response ? error.response.data : error.message);
    res.status(500).send(`Error al actualizar la hora de salida: ${error.response ? error.response.data : error.message}`);
  }
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
