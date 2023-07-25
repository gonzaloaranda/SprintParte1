const express = require("express");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const axios = require("axios");
const hbs = require("hbs");

const app = express();
const PORT = 3000;

// Middleware para el manejo del cuerpo de la solicitud en formato JSON
app.use(express.json());

// Establecer la carpeta de vistas y el motor de plantillas Handlebars
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "views/partials"));

// Helper para formatear la lista de roommates en HTML
hbs.registerHelper("roommates", (roommates) => {
  let html = '<ul class="list-group mt-3">';
  roommates.forEach((roommate) => {
    html += `
      <li class="list-group-item">
        <div class="media">
          <div class="media-body">
            <h5 class="mt-0">${roommate.name}</h5>
            <p>Edad: ${roommate.age}</p>
            <p>Teléfono: ${roommate.phone}</p>
          </div>
        </div>
      </li>
    `;
  });
  html += "</ul>";
  return new hbs.SafeString(html);
});

// Ruta para servir la página de inicio
app.get("/", (req, res) => {
  fs.readFile("roommates.json", "utf8", (err, data) => {
    if (err) {
      const roommates = []; // Si el archivo no existe, inicia con un arreglo vacío
      res.render("index", { roommatesJSON: JSON.stringify(roommates) }); // Renderiza la vista 'index.hbs' con los datos de los roommates
    } else {
      const roommates = JSON.parse(data);
      res.render("index", { roommatesJSON: JSON.stringify(roommates) }); // Renderiza la vista 'index.hbs' con los datos de los roommates
    }
  });
});

// Ruta para almacenar un nuevo roommate usando randomuser API
app.post("/roommate", async (req, res) => {
  try {
    const { data } = await axios.get("https://randomuser.me/api/");
    const newRoommate = {
      id: uuidv4(),
      name: `${data.results[0].name.first} ${data.results[0].name.last}`,
      age: data.results[0].dob.age,
      phone: data.results[0].phone,
    };

    fs.readFile("roommates.json", "utf8", (err, jsonData) => {
      if (err) {
        // Si el archivo no existe, crea un arreglo vacío
        const roommates = [];
        roommates.push(newRoommate);
        fs.writeFile(
          "roommates.json",
          JSON.stringify(roommates),
          "utf8",
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Error interno del servidor");
            }
            res.json(newRoommate);
          }
        );
      } else {
        // Si el archivo existe, agrega el nuevo roommate al arreglo existente
        const roommates = JSON.parse(jsonData);
        roommates.push(newRoommate);
        fs.writeFile(
          "roommates.json",
          JSON.stringify(roommates),
          "utf8",
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Error interno del servidor");
            }
            res.json(newRoommate);
          }
        );
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }
});

// Ruta para devolver todos los roommates almacenados
app.get("/roommate", (req, res) => {
  fs.readFile("roommates.json", "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // Si el archivo no existe, devuelve un arreglo vacío
        return res.json([]);
      }
      console.error(err);
      return res.status(500).send("Error interno del servidor");
    }
    res.json(JSON.parse(data));
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
