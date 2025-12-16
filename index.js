const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();   // 👉 Inicializa Express ANTES de usar app.get()
app.use(express.json());

// Archivos JSON
const usuariosFile = path.join(__dirname, "usuarios.json");
const cajaFile = path.join(__dirname, "caja.json");

let usuarios = JSON.parse(fs.readFileSync(usuariosFile));
let caja = JSON.parse(fs.readFileSync(cajaFile));

// 👉 Ruta raíz: sirve el HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 👉 Consultar deuda
app.get("/deuda/:nombre", (req, res) => {
  const usuario = usuarios.find(
    u => u.nombre.toLowerCase() === req.params.nombre.toLowerCase()
  );
  if (!usuario) return res.status(404).send("Usuario no encontrado");

  const pendientes = usuario.pagos.filter(p => p.estado === "Pendiente").length;
  const deuda = pendientes * usuario.aporte_diario;

  res.json({ nombre: usuario.nombre, pendientes, deuda });
});

// 👉 Registrar pago
app.post("/pago", (req, res) => {
  const { nombre, monto } = req.body;
  const usuario = usuarios.find(
    u => u.nombre.toLowerCase() === nombre.toLowerCase()
  );
  if (!usuario) return res.status(404).send("Usuario no encontrado");

  let restante = monto;
  for (let pago of usuario.pagos) {
    if (pago.estado === "Pendiente" && restante >= usuario.aporte_diario) {
      pago.estado = "Pagado";
      restante -= usuario.aporte_diario;
    }
  }

  fs.writeFileSync(usuariosFile, JSON.stringify(usuarios, null, 2));
  res.json({ usuario, cambio: restante });
});

// 👉 Consultar caja
app.get("/caja", (req, res) => {
  res.json(caja);
});

// 👉 Actualizar caja
app.put("/caja", (req, res) => {
  const { denominacion, cantidad } = req.body;
  if (!caja.monedas[denominacion]) caja.monedas[denominacion] = 0;
  caja.monedas[denominacion] += cantidad;

  fs.writeFileSync(cajaFile, JSON.stringify(caja, null, 2));
  res.json(caja);
});

// 👉 Puerto para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
