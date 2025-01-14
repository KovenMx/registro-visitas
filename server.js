const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de Multer para guardar imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Autenticación con Google
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// Ruta para registrar datos
app.post('/register', upload.single('fileFoto'), async (req, res) => {
  try {
    const { nombre, aQuienVisita, numeroCasa, fecha, horaEntrada } = req.body;
    const fileName = `${fecha}_${nombre}_${horaEntrada}.jpg`;

    // Subir imagen a Google Drive
    const fileMetadata = {
      name: fileName,
      parents: [process.env.FOLDER_ID]
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path)
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    const fileUrl = file.data.webViewLink;

    // Guardar en Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Registro!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[nombre, aQuienVisita, numeroCasa, horaEntrada, '', fecha, fileUrl]]
      }
    });

    res.status(200).send('Registro exitoso');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al registrar');
  }
});

// Ruta para registrar hora de salida
app.post('/salida', async (req, res) => {
  try {
    const { nombre, horaSalida } = req.body;

    // Buscar el registro en Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Registro!A:G'
    });

    const rows = response.data.values;
    const rowIndex = rows.findIndex(row => row[0] === nombre && row[4] === '');

    if (rowIndex !== -1) {
      const updateRange = `Registro!E${rowIndex + 1}`;

      // Actualizar la hora de salida
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[horaSalida]]
        }
      });

      res.status(200).send('Hora de salida actualizada');
    } else {
      res.status(404).send('Registro no encontrado');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar la hora de salida');
  }
});

// Ruta para servir el formulario con indicador de carga y confirmación
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
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
