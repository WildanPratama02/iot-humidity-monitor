# API-IOT-SERVER.md

## Project Title

API Server for Multi-Device IoT (Node.js + Express + PostgreSQL +
ESP8266 Integration)

## Objective

Membangun REST API untuk menerima data sensor temperature & humidity
dari banyak ESP8266 dan menyimpannya ke PostgreSQL.

## Tech Stack

-   Node.js
-   Express Framework
-   PostgreSQL
-   pg (PostgreSQL client)
-   CORS
-   dotenv
-   ESP8266 HTTP Client

## Database Schema

### Database Name: db_iot

### Table: tb_device

  Column      Type   Description
  ----------- ------ ------------------
  id_device   char(6)   Unique device ID
  location    varchar(255)   Device location

### Table: tb_data

  Column      Type     Description
  ----------- -------- -------------
  id          serial   Primary key
  id_device   char(6)  Device foreign key
  temp        float     Temperature
  hum         float     Humidity
  datetime    timestamp     Timestamp

## Folder Architecture

    api-iot/
    |-- src/
    |     |-- config/
    |     |      └── db.js
    |     |-- controllers/
    |     |      ├── deviceController.js
    |     |      └── dataController.js
    |     |-- routes/
    |     |      ├── deviceRoutes.js
    |     |      └── dataRoutes.js
    |     |-- app.js
    |     └── server.js
    |-- package.json
    |-- .env

## Environment Variables

    PORT=3000
    DB_USER=postgres
    DB_PASS=root
    DB_NAME=db_iot
    DB_HOST=localhost
    DB_PORT=5432

## API Code Specifications

### src/config/db.js

``` javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

module.exports = pool;
```

### src/controllers/deviceController.js

``` javascript
const pool = require('../config/db');

exports.getDevices = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tb_device ORDER BY id_device');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### src/controllers/dataController.js

``` javascript
const pool = require('../config/db');

exports.getAllData = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tb_data ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDataByDevice = async (req, res) => {
  try {
    const { id_device } = req.params;
    const result = await pool.query(
      'SELECT * FROM tb_data WHERE id_device=$1 ORDER BY id DESC',
      [id_device]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertData = async (req, res) => {
  try {
    const { id_device, temp, hum, datetime } = req.body;

    const query = `
      INSERT INTO tb_data (id_device, temp, hum, datetime)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;

    const result = await pool.query(query, [
      id_device, temp, hum, datetime
    ]);

    res.json({ message: 'Data inserted', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### src/routes/deviceRoutes.js

``` javascript
const express = require('express');
const router = express.Router();
const { getDevices } = require('../controllers/deviceController');

router.get('/', getDevices);

module.exports = router;
```

### src/routes/dataRoutes.js

``` javascript
const express = require('express');
const router = express.Router();
const { getAllData, getDataByDevice, insertData } = require('../controllers/dataController');

router.get('/', getAllData);
router.get('/:id_device', getDataByDevice);
router.post('/', insertData);

module.exports = router;
```

### src/app.js

``` javascript
const express = require('express');
const cors = require('cors');

const deviceRoutes = require('./routes/deviceRoutes');
const dataRoutes = require('./routes/dataRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/devices', deviceRoutes);
app.use('/data', dataRoutes);

module.exports = app;
```

### src/server.js

``` javascript
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
```

## API Endpoints

-   **GET /devices** → list device
-   **GET /data** → list all sensor data
-   **GET /data/{id_device}** → data berdasarkan device
-   **POST /data** → menerima data sensor

## ESP8266 Sample Code (HTTP POST)

``` cpp
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_WIFI_PASSWORD";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin("http://YOUR_SERVER_IP:3000/data");
    http.addHeader("Content-Type", "application/json");

    String json = 
      "{"id_device":"B1MT01","
      ""temp":"23.52","
      ""hum":"56.12","
      ""datetime":"2025-12-30 09:21:12"}";

    http.POST(json);
    http.end();
  }

  delay(10000); 
}
```
=======================================

Public Key:
BBIsENwo68u8sPtJRDK91CYkqfBCKpoxJQKn3Tm_pM-xQ08KaH_t8eX968NhVdsE-IB30drKV_v6rax75i-HSR4

Private Key:
wkdVGO2xuecqTpj2kdwSDw3aQTxxa-UMIekx9SDxU10

=======================================