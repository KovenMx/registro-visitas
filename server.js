const express = require('express');
const multer = require('multer');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

// Configuración de Multer para la imagen
const storage = multer.memoryStorage();
const upload = multer({ storage });

// URL del Web App de Google Apps Script
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby--UYu7RgOBRovIxPZ9IjIkEK2nClE4KivNUtc9Nod8Sgd_5yCcq7OJuo8tAkM_JU8Ig/exec'; // Reemplaza con tu URL

app.post('/register', upload.single('fileFoto'), async (req, res) => {
  try {
    const { nombre, aQuienVisita, motivo, fecha, horaEntrada } = req.body;
    const imagenBase64 = req.file.buffer.toString('base64');

    // Enviar los datos al script de Google
    await axios.post(WEB_APP_URL, {
      nombre,
      aQuienVisita,
      motivo,
      fecha,
      horaEntrada,
      imagen: imagenBase64
    });

    res.status(200).send('Registro exitoso');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al registrar');
  }
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
