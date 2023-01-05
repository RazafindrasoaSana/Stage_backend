var express = require('express');
var bodyParser = require('body-parser');
var oracledb = require('oracledb');

oracledb.autoCommit = true;
var PORT = process.env.PORT || 3000;
 var app = express();

var conn = {
    user : "GESTION",
    password : "orcl",
    connectString : "localhost:1521/orcl"
} 


//Creation de doRealesase sert a liberer la connexion à la base de donnée
function doRelease(connection){
    connection.release(function (err){
        if (err) {
            console.error(err.message);
        }
    });
}

//configuration de app afin d'utiliser bodyParser
//afin d'obtenir les données d’une requête POST :
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: '*/*' }));

//creation d'un objet router
var router = express.Router();


//ajout des entêtes de réponse
router.use(function (request, response, next) {
    console.log("REQUEST:" + request.method + " " + request.url);
    console.log("BODY:" + JSON.stringify(request.body));
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    response.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });

// GET qui retourne la liste des clients
router.route('/clients/').get(function (request, response) {
    console.log("GET CLIENTS");
    oracledb.getConnection(conn, function (err, connection) {
      if (err) {
        console.error(err.message);
        response.status(500).send("Erreur pour connecter à la bdd");
        return;
      }
      console.log("apres connection");
     connection.execute("SELECT * FROM CLIENT",{},
      { outFormat: oracledb.OBJECT },
      function (err, result) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Erreur d'acceder à la bdd");
          doRelease(connection);
          return;

      }
      console.log("RESULTSET:" + JSON.stringify(result));

      var clients = [];
      result.rows.forEach(function (element) {
        clients.push({ id: element.IDCLIENT, CODECLIENT: element.CODECLIENT, NOM: element.NOM, 
                         PRENOM: element.PRENOM, CIN: element.CIN, 
                         EMAIL: element.EMAIL, ADRESSE: element.ADRESSE 
                    });
      }, this);
      response.json(clients);
      doRelease(connection);

      });
    });
});

//GET avec rechrerchetype er rechecheValue
//retourner la list de client par type de recherche

router.route('/clients/:searchType/:searchValues').get(function (request, response) {
  console.log("GET CLIENTS PAR CRITERE DE RECHERCHE");
  oracledb.getConnection(conn, function(err, connection) {
      if (err) {
        console.error(err.message);
        response.status(500).send("Erreur pour connecter à la bdd");
        return;
      }
          console.log("Après conneciton");
          var searchType = request.params.searchType;
          var searchValue = request.params.searchValue;
        
         connection.execute("SELECT*FROM CLIENT WHERE "+searchType+" = :searchValue",[searchValue],
         { outFormat: oracledb.OBJECT },
         function (err, result) {
                if(err) {
                  console.error(err.message);
                  response.status(500).send("Erreur pour avoir les donnée dans la bdd");

                  doRelease(connection);
                  return;
                }  
                console.log("RESULTSET:" + JSON.stringify(result));

                var clients = [];
                result.rows.forEach(function (element) {
                  clients.push({ id: element.IDCLIENT, CODECLIENT: element.CODECLIENT, NOM: element.NOM, 
                                   PRENOM: element.PRENOM, CIN: element.CIN, 
                                   EMAIL: element.EMAIL, ADRESSE: element.ADRESSE 
                              });
                }, this);
                response.json(clients);
                doRelease(connection);
         });
  });
});

//POST
//ajouter un nouveau client
router.route('/clients/').post(function (request, response)
{
    console.log("POST CLIENT:");
    oracledb.getConnection(conn, function (err, connection) {
           if(err) {
                console.error(err.message);
                response.status(500).send("Erreur pour connecter à la base de bdd");
                return;
           }
           var body = request.body;

           connection.execute("INSERT INTO CLIENT (NOM,PRENOM,CIN,EMAIL,ADRESSE) VALUES (:NOM,:PRENOM,:CIN,:EMAIL,:ADRESSE)",
            [body.NOM, body.PRENOM, body.CIN,body.EMAIL, body.ADRESSE],
            function (err, result) {
              if(err) {
                console.error(err.message);
                response.status(500).send("Erreur de connecter à la bdd");
              
              doRelease(connection);
              return response.send({data:result});
              }
              console.log(request.body)
              response.end();
              doRelease(connection);
              });
              
            });
    });

//PUT
//Update un client
router.route('/clients/:id').put(function(request, response){
   console.log("PUT CLIENT:");
   oracledb.getConnection(conn, function (err, connection){
       if (err) {
            console.error(err.message);
            response.status(500).send("Erreur pour connecter à la bdd");
            return;
       }

       var body = request.body;
       var id= request.params.id;

      connection.execute("UPDATE CLIENT SET :CODECLIENT,NOM=:NOM, PRENOM=:PRENOM, CIN=:CIN, EMAIL=:EMAIL, ADRESSE=:ADRESSE where IDCLIENT=:id",
             [body.CODECLIENT,body.NOM, body.PRENOM, body.CIN, body.EMAIL, body.ADRESSE, body.IDCLIENT],
             function (err, result) {
                  if(err) {
                    console.error(err.message);
                    response.status(500).send("erreur pour modifier un client");
                    console.log(request.body);
                    doRelease(connection);
                    return;
                  }
                  response.end();
                  doRelease(connection);

        });
   });
});

//DELETE
// supprimer un client

router.route ('/clients/:id').delete(function (request, response){
      console.log("DELETE CLIENT IDCLIENT:"+request.params.id);
      oracledb.getConnection(conn, function(err, connection){
            if(err) {
                console.error(err.message);
                response.status(500).send("Erreur pour connecter à la bdd");
                return;
            }
      var body = request.body;
      var id = request.params.id;
      connection.execute("DELETE CLIENT WHERE IDCLIENT =:id",
            [body.IDCLIENT],
            function (err, result) {
              if (err) {
              console.error(err.message);
              response.status(500).send("Erreur lors de la suppression d'un client dans le bdd");
              doRelease(connection);
              return;
            }
            response.end();
            doRelease(connection);
            
        });
    });
});
app.use(express.static('static'));
app.use('/', router);
app.listen(PORT);