const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const app = express();

// Configuración de Middlewares básicos
app.use(express.text()); // Fundamental para procesar las líneas de texto plano del VBA
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de EJS embebido
app.set('view engine', 'ejs');

const uri = "mongodb://localhost:27017"; 
let db;

async function conectarDB() {
    try {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db('simulacion_embalses');
        
        // Inicializar los 5 entornos base si la colección está vacía
        const count = await db.collection('entornos').countDocuments();
        if (count === 0) {
            const entornosIniciales = ['A', 'B', 'C', 'D', 'E'].map(letra => ({
                _id: `Entorno ${letra}`,
                estado: "Disponible",
                usuario: { nombre: null, email: null },
                ultimaActividad: new Date()
            }));
            await db.collection('entornos').insertMany(entornosIniciales);
        }
        console.log("Conectado con éxito a MongoDB");
    } catch (error) {
        console.error("Error al conectar a MongoDB:", error);
    }
}
conectarDB();

// -------------------------------------------------------------------------
// PLANTILLA HTML/CSS (EJS) EN LÍNEA CON CENTRADO ABSOLUTO (52vh)
// -------------------------------------------------------------------------
const vistaIndexEJS = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIMULACION OPERACION DE EMBALSES</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        
        body, html {
            width: 100%; height: 100vh; overflow: hidden; background-color: #1a202c;
            display: flex; align-items: center; justify-content: center;
        }

        .pantalla-base {
            width: 70vw; height: 52vh;
            background: linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.5)), url('/fondo.jpg') no-repeat center center;
            background-size: cover; display: flex; flex-direction: column; align-items: center; justify-content: space-between;
            padding: 15px 20px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }

        header { text-align: center; color: #0f172a; text-shadow: 1px 1px 4px rgba(255,255,255,0.6); }
        header h1 { font-size: 2.25rem; font-weight: 400; letter-spacing: 2px; margin-bottom: 5px; font-family: inherit; }
        header h2 { font-size: 1.5rem; font-weight: 400; color: #334155; letter-spacing: 1px; font-family: inherit; }

        .contenedor-entornos {
            width: 100%; max-width: 800px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
            border-radius: 12px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
        }

        .fila-entorno {
            display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; margin-bottom: 8px;
            background: rgba(15, 23, 42, 0.6); border-radius: 10px; border-left: 5px solid #64748b; transition: all 0.3s ease;
        }
        .fila-entorno.disponible { border-left-color: #10b981; }
        .fila-entorno.en-uso { border-left-color: #ef4444; opacity: 0.85; }

        .nombre-entorno { color: #f8fafc; font-size: 1.25rem; font-weight: 600; }
        .estado-leyenda { font-size: 1rem; font-weight: 500; padding: 6px 14px; border-radius: 20px; }
        .disponible .estado-leyenda { color: #34d399; background: rgba(16, 185, 129, 0.15); }
        .en-uso .estado-leyenda { color: #f87171; background: rgba(239, 68, 68, 0.15); }

        .btn-seleccionar {
            background: #2563eb; color: white; border: none; padding: 8px 16px; font-size: 1rem;
            font-weight: 600; border-radius: 8px; cursor: pointer; transition: background 0.2s;
        }
        .btn-seleccionar:hover { background: #1d4ed8; }
        .btn-seleccionar:disabled { background: #475569; cursor: not-allowed; }

        .modal {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); justify-content: center; align-items: center; z-index: 1000;
        }
        .modal-contenido {
            background: #1e293b; padding: 30px; border-radius: 12px; width: 100%; max-width: 400px;
            color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        .modal-contenido h3 { margin-bottom: 20px; font-size: 1.4rem; color: #f1f5f9; }
        .modal-contenido label { display: block; margin-bottom: 8px; color: #94a3b8; }
        .modal-contenido input {
            width: 100%; padding: 10px; margin-bottom: 20px; border-radius: 6px;
            border: 1px solid #475569; background: #0f172a; color: white; font-size: 1rem;
        }
        .btn-confirmar { width: 100%; background: #10b981; color: white; padding: 12px; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        .btn-confirmar:hover { background: #059669; }
        .btn-cancelar { width: 100%; background: transparent; color: #94a3b8; padding: 8px; border: none; margin-top: 10px; cursor: pointer; }
    </style>
</head>
<body>

    <div class="pantalla-base">
        <header>
            <h1>SIMULACION OPERACIÓN DE EMBALSES</h1>
            <h2>SISTEMA COMAHUE – PIEDRA DEL AGUILA – PICHI PICUN LEUFU</h2>
        </header>
        <main class="contenedor-entornos">
            <% entornos.forEach(function(entorno) { %>
                <div class="fila-entorno <%= entorno.estado === 'Disponible' ? 'disponible' : 'en-uso' %>">
                    <div class="nombre-entorno"><%= entorno._id.replace("Entorno", "APLICACIÓN") %></div>
                    <div class="estado-leyenda">
                        <%= entorno.estado === 'Disponible' ? 'Disponible' : 'En uso por: ' + entorno.usuario.nombre %>
                    </div>
                    <div>
                        <button class="btn-seleccionar" onclick="abrirRegistro('<%= entorno._id %>')" <%= entorno.estado !== 'Disponible' ? 'disabled' : '' %>>
                            Seleccionar
                        </button>
                    </div>
                </div>
            <% }); %>
        </main>
        <footer></footer>
    </div>
    <div id="modalRegistro" class="modal">
        <div class="modal-contenido">
            <h3 id="modalTitulo">Registro de Acceso</h3>
            <form action="/reservar-y-descargar" method="POST" onsubmit="cerrarModal()">
                <input type="hidden" id="entornoId" name="entornoId">
                <label for="nombre">Nombre de Usuario</label>
                <input type="text" id="nombre" name="nombre" required autocomplete="off">
                <label for="email">Correo Electrónico</label>
                <input type="email" id="email" name="email" required autocomplete="off">
                <button type="submit" class="btn-confirmar">Confirmar y Conectar</button>
                <button type="button" class="btn-cancelar" onclick="cerrarModal()">Cancelar</button>
            </form>
        </div>
    </div>
    <script>
        function abrirRegistro(id) {
            document.getElementById('entornoId').value = id;
            document.getElementById('modalTitulo').innerText = 'Acceso a ' + id.replace("Entorno", "APLICACIÓN");
            document.getElementById('modalRegistro').style.display = 'flex';
        }
        function cerrarModal() {
            document.getElementById('modalRegistro').style.display = 'none';
            setTimeout(() => { window.location.reload(); }, 2000);
        }
    </script>
</body>
</html>
`;

// Estructura en memoria para sostener el intercambio rápido (Ping-Pong) de las macros VBA
let memoriaVBA = {
    "A": { casilleros: {} }, "B": { casilleros: {} }, "C": { casilleros: {} }, "D": { casilleros: {} }, "E": { casilleros: {} }
};

app.get('/', async (req, res) => {
    const entornos = await db.collection('entornos').find().toArray();
    const ejs = require('ejs');
    res.send(ejs.render(vistaIndexEJS, { entornos }));
});

app.post('/reservar-y-descargar', async (req, res) => {
    const { entornoId, nombre, email } = req.body;
    const letra = entornoId.replace("Entorno ", "").toUpperCase(); // Extrae "A", "B", etc.

    const resultado = await db.collection('entornos').findOneAndUpdate(
        { _id: entornoId, estado: "Disponible" },
        { $set: { estado: "En uso", usuario: { nombre, email }, ultimaActividad: new Date() } },
        { returnDocument: 'after' }
    );

    if (!resultado) {
        return res.send("<script>alert('El entorno acaba de ser ocupado.'); window.location.href='/';</script>");
    }

    await db.collection('simulaciones').insertOne({
        entorno: entornoId, usuario: { nombre, email }, fechaInicio: new Date(), fechaFin: null
    });

    // Inicializamos el casillero del usuario en la estructura de intercambio rápido de su aplicación
    // Nota: El VBA de tu satélite lee un ID de usuario fijo tipo USER-01. Mapeamos un casillero por defecto.
    for(let i=1; i<=5; i++) {
        memoriaVBA[letra].casilleros[`USER-0${i}`] = { input: "", output: "" };
    }

    res.send(`<script>alert('Conexión establecida con la APLICACIÓN ${letra}. Podés abrir tu planilla Satélite. Tu ID asignado es USER-01.'); window.location.href='/';</script>`);
});

// =========================================================================
// 4. ENDPOINTS EXCLUSIVOS PARA LAS PLANILLAS EXCEL (VBA INTERCAMBIO RÁPIDO)
// =========================================================================

// Satélite envía datos al Núcleo de su aplicación
app.post('/enviar-a-nucleo/:idUsuario', (req, res) => {
    const { idUsuario } = req.params;
    // Como tu satélite actual no envía la letra en la URL, asumimos el canal activo A
    // (En pruebas reales se puede mapear o pasar el canal en la celda Z1 junto al ID)
    const e = "A"; 
    
    if (!memoriaVBA[e].casilleros[idUsuario]) {
        memoriaVBA[e].casilleros[idUsuario] = { input: "", output: "" };
    }
    
    memoriaVBA[e].casilleros[idUsuario].input = req.body;
    res.status(200).send("OK");
});

// Núcleo lee todos los casilleros de su aplicación específica (A, B, C, D o E)
app.get('/leer-para-nucleo/:entorno', (req, res) => {
    const e = req.params.entorno.toUpperCase();
    if (!memoriaVBA[e]) return res.status(404).send("Aplicación inválida");
    
    res.status(200).json(memoriaVBA[e].casilleros);
});

// Núcleo responde los cálculos a un Satélite específico de su aplicación
app.post('/enviar-a-satelite/:entorno/:idUsuario', (req, res) => {
    const { entorno, idUsuario } = req.params;
    const e = entorno.toUpperCase();
    
    if (memoriaVBA[e] && memoriaVBA[e].casilleros[idUsuario]) {
        memoriaVBA[e].casilleros[idUsuario].output = req.body;
        memoriaVBA[e].casilleros[idUsuario].input = ""; // Limpia la entrada procesada
        return res.status(200).send("OK");
    }
    res.status(404).send("No encontrado");
});

// Satélite lee si el Núcleo le dejó respuestas
app.get('/leer-para-satelite/:idUsuario', (req, res) => {
    const { idUsuario } = req.params;
    const e = "A"; 
    
    if (memoriaVBA[e] && memoriaVBA[e].casilleros[idUsuario]) {
        const respuesta = memoriaVBA[e].casilleros[idUsuario].output;
        memoriaVBA[e].casilleros[idUsuario].output = ""; // Consumo único de datos
        return res.status(200).send(respuesta || "No hay datos");
    }
    res.status(200).send("No hay datos");
});

// Escucha en el Puerto 3000 (o el provisto por Render en producción)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de Simulación corriendo en el puerto ${PORT}`));

