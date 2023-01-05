const express = require("express");
//const cors = require("cors");

const app = express();
//app.use(cors());
app.use(express.json());

const clientRoute = require("./routes/client");
app.use('/client', clientRoute);

const AgenceRoute = require("./routes/agence");
app.use('/agence', AgenceRoute);

const contratRoute = require("./routes/contrat");
app.use('/contrat', contratRoute);

const TypeContratRoute = require("./routes/typecontrat");
app.use('/typecontrat', TypeContratRoute);

const erreurRoute = require("./routes/erreur");
app.use('/erreur', erreurRoute);

const FichierRoute = require("./routes/fichier");
app.use('/fichier', FichierRoute)

app.listen(5000, () => {
    console.log("Port 5000");
})

