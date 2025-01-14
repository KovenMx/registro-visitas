const cors = require('cors');
app.use(cors());
const express = require('express');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de Multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

// URL del Google Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby--UYu7RgOBRovIxPZ9IjIkEK2nClE4KivNUtc9Nod8Sgd_5yCcq7OJuo8tAkM_JU8Ig/exec';

// Ruta para registrar datos
app.post('/register', upload.single('fileFoto'), async (req, res) => {
  try {
    const { nombre, aQuienVisita, numeroCasa, fecha, horaEntrada } = req.body;
    const imagenBase64 = req.file.buffer.toString('base64');

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
    console.error('Error al registrar:', error);
    res.status(500).send('Error al registrar');
  }
});

// Ruta para registrar hora de salida
app.post('/salida', async (req, res) => {
  try {
    const { nombre } = req.body;
    const horaSalida = new Date().toLocaleTimeString();

    // Enviar solicitud para actualizar hora de salida
    await axios.post(GOOGLE_SCRIPT_URL, {
      nombre,
      horaSalida
    });

    res.status(200).send('Hora de salida actualizada');
  } catch (error) {
    console.error('Error al actualizar la hora de salida:', error);
    res.status(500).send('Error al actualizar la hora de salida');
  }
});

// Ruta para servir el formulario con botón de salida
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registro de Visitantes</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; height: 100vh; }
        .container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        #loader { display: none; }
        #success { display: none; color: green; font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Registro de Visitantes</h2>
        <form id="registroForm" enctype="multipart/form-data">
          <input type="text" name="nombre" placeholder="Nombre Completo" required><br>
          <input type="text" name="aQuienVisita" placeholder="A quién Visita" required><br>
          <input type="text" name="numeroCasa" placeholder="Número de Casa" required><br>
          <input type="date" name="fecha" required><br>
          <input type="time" name="horaEntrada" required><br>
          <input type="file" name="fileFoto" required><br>
          <button type="submit">Registrar Entrada</button>
        </form>
        <button id="salidaBtn">Registrar Salida</button>
        <div id="loader">Procesando...</div>
        <div id="success">✔ Registro Exitoso</div>
      </div>

      <script>
        document.getElementById('registroForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          document.getElementById('loader').style.display = 'block';
          const formData = new FormData(this);
          const response = await fetch('/register', { method: 'POST', body: formData });
          document.getElementById('loader').style.display = 'none';
          if (response.ok) {
            document.getElementById('success').style.display = 'block';
          }
        });

        document.getElementById('salidaBtn').addEventListener('click', async function() {
          const nombre = prompt('Ingrese el nombre para registrar la salida:');
          if (nombre) {
            await fetch('/salida', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nombre })
            });
            alert('Hora de salida registrada.');
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
