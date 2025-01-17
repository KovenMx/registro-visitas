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

// URL del Google Apps Script Web App (Actualizado)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0v_cEWaeiheLFylC5m7JFWej9pOSNU0ZdCiKX15dClXNsjWiNROuzswc5JVUvEwntww/exec';

// Ruta para registrar datos (Entrada)
app.post('/register', upload.single('fileFoto'), async (req, res) => {
  try {
    const { nombre, aQuienVisita, numeroCasa, fecha, horaEntrada } = req.body;
    const imagenBase64 = req.file ? req.file.buffer.toString('base64') : null;

    await axios.post(GOOGLE_SCRIPT_URL, {
      nombre,
      aQuienVisita,
      numeroCasa,
      fecha,
      horaEntrada,
      imagen: imagenBase64,
      tipoRegistro: "Entrada"
    });

    res.status(200).send('Registro exitoso');
  } catch (error) {
    console.error('Error al registrar:', error.response ? error.response.data : error.message);
    res.status(500).send(`Error al registrar: ${error.response ? error.response.data : error.message}`);
  }
});

// Ruta para registrar salida en nueva fila
app.post('/salida', async (req, res) => {
  try {
    const { nombre, numeroCasa, fecha, horaSalida } = req.body;

    await axios.post(GOOGLE_SCRIPT_URL, {
      nombre,
      numeroCasa,
      fecha,
      horaSalida,
      tipoRegistro: "Salida"
    });

    res.status(200).send('Salida registrada correctamente');
  } catch (error) {
    console.error('Error al registrar la salida:', error.response ? error.response.data : error.message);
    res.status(500).send(`Error al registrar la salida: ${error.response ? error.response.data : error.message}`);
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
        body {
          font-family: Arial, sans-serif;
          background-color: #f0f2f5;
          margin: 0;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .container {
          background-color: #fff;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 500px;
          text-align: center;
        }
        input, button {
          width: 100%;
          padding: 12px;
          margin: 10px 0;
          border-radius: 5px;
          border: 1px solid #ccc;
        }
        button {
          background-color: #28a745;
          color: #fff;
          font-weight: bold;
          border: none;
          cursor: pointer;
        }
        button:hover {
          background-color: #218838;
        }
        h2 {
          margin-bottom: 20px;
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Registrar Entrada</h2>
        <form id="registroForm" enctype="multipart/form-data">
          <input type="text" name="nombre" placeholder="Nombre Completo" required>
          <input type="text" name="aQuienVisita" placeholder="A quién Visita" required>
          <input type="text" name="numeroCasa" placeholder="Número de Casa" required>
          <input type="date" name="fecha" required>
          <input type="time" name="horaEntrada" required>
          <input type="file" name="fileFoto" required>
          <button type="submit">Registrar Entrada</button>
        </form>

        <h2>Registrar Salida</h2>
        <form id="salidaForm">
          <input type="text" name="nombreSalida" placeholder="Nombre Completo" required>
          <input type="text" name="numeroCasaSalida" placeholder="Número de Casa" required>
          <input type="date" name="fechaSalida" required>
          <input type="time" name="horaSalida" required>
          <button type="submit">Registrar Salida</button>
        </form>
      </div>

      <script>
        document.getElementById('registroForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          const formData = new FormData(this);
          const response = await fetch('/register', { method: 'POST', body: formData });
          if (response.ok) {
            alert('✔ Registro exitoso');
            window.location.reload();
          } else {
            alert('❌ Error al registrar entrada');
          }
        });

        document.getElementById('salidaForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          const formData = new FormData(this);
          const response = await fetch('/salida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: formData.get('nombreSalida'),
              numeroCasa: formData.get('numeroCasaSalida'),
              fecha: formData.get('fechaSalida'),
              horaSalida: formData.get('horaSalida')
            })
          });
          if (response.ok) {
            alert('✔ Salida registrada');
            window.location.reload();
          } else {
            alert('❌ Error al registrar salida');
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
