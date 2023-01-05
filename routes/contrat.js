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

  /**
   * GET /
   * Liste des contrats 
   */
  router.route('/contrats/').get(function (request, response) {
    console.log("GET CONTRAT");
    oracledb.getConnection(conn, function (err, connection) {
      if (err) {
        console.error(err.message);
        response.status(500).send("Erreur pour connecter à la bdd");
        return;
      }
     console.log("apres connection");
     connection.execute("SELECT * FROM CONTRAT",{},
      { outFormat: oracledb.OBJECT },
      function (err, result) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Erreur d'avoir les donnée dans le bdd");
          doRelease(connection);
          return;

      }
      console.log("RESULTSET:" + JSON.stringify(result));

      var contrats = [];
      result.rows.forEach(function (element) {
        contrats.push({
                       IDCONTRAT: element.IDCONTRAT,
                       CODECONTRAT: element.CODECONTRAT, 
                       TYPECONTRAT: element.TYPECONTRAT,
                       DATEECHEANCIER: element.DATEECHEANCIER, 
                       DATECONTRAT: element.DATECONTRAT 
                    });
      }, this);
      response.json(contrats);
      doRelease(connection);

      });
    });
});

//GET avec rechrerchetype er rechecheValue
//retourner la list des contrats par type de recherche

router.route('/contrats/:searchType/:searchValues').get(function (request, response) {
    console.log("GET AGENCE PAR CRITERE DE RECHERCHE");
    oracledb.getConnection(conn, function(err, connection) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Erreur pour connecter à la bdd");
          return;
        }
            console.log("Après conneciton");
            var searchType = request.params.searchType;
            var searchValue = request.params.searchValue;
          
           connection.execute("SELECT*FROM CONTRAT WHERE "+searchType+" = :searchValue",[searchValue],
           { outFormat: oracledb.OBJECT },
           function (err, result) {
                  if(err) {
                    console.error(err.message);
                    response.status(500).send("Erreur pour avoir les contrat dans la bdd");
  
                    doRelease(connection);
                    return;
                  }  
                  console.log("RESULTSET:" + JSON.stringify(result));
  
                  var contrats = [];
                  result.rows.forEach(function (element) {
                    contrats.push({ 
                                   IDCONTRAT: element.IDCONTRAT,
                                   CODECONTRAT: element.CODECONTRAT,
                                   TYPECONTRAT: element.TYPECONTRAT,  
                                   DATEECHEANCIER: element.DATEECHEANCIER,
                                   DATECONTRAT: element.DATECONTRAT
                                });
                  }, this);
                  response.json(contrats);
                  doRelease(connection);
           });
    });
  });

  
//POST
//ajouter une nouvelle contrat
router.route('/contrats/').post(function (request, response)
{
    console.log("POST CONTRAT:");
    oracledb.getConnection(conn, function (err, connection) {
           if(err) {
                console.error(err.message);
                response.status(500).send("Erreur pour connecter à la base de bdd");
                return;
           }
           var body = request.body;
           function TO_DATE(){
           TO_DATE(body.DATEECHEANCIER)
           TO_DATE(body.DATECONTRAT)
           }
           connection.execute("INSERT INTO CONTRAT (CODECONTRAT,TYPECONTRAT,DATEECHEANCIER, DATECONTRAT) VALUES (:CODECONTRAT,:TYPECONTRAT,:DATEECHEANCIER,:DATECONTRAT)",
           [body.CODECONTRAT,body.TYPECONTRAT, body.DATEECHEANCIER,body.DATECONTRAT],
            function (err, result) {
              if(err) {
                console.error(err.message);
                response.status(500).send("Erreur de connecter à la bdd2");
              
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
//Update un contrat
router.route('/contrats/:id').put(function(request, response){
   console.log("PUT CONTRAT:");
   oracledb.getConnection(conn, function (err, connection){
       if (err) {
            console.error(err.message);
            response.status(500).send("Erreur pour connecter à la bdd");
            return;
       }

       var body = request.body;
       var id= request.params.id;
       

      connection.execute("UPDATE CONTRAT SET CODECONTRAT=:CODECONTRAT,TYPECONTRAT=:TYPECONTRAT, DATEECHEANCIER=:DATEECHEANCIER, DATECONTRAT=:DATECONTRAT where IDCONTRAT=:id",
             [body.CODECONTRAT,body.TYPECONTRAT, body.DATEECHEANCIER, body.DATECONTRAT,body.IDCONTRAT],
             function (err, result) {
                  if(err) {
                    console.error(err.message);
                    response.status(500).send("erreur pour modifier un contrat");
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
// supprimer une agence

router.route ('/contrats/:id').delete(function (request, response){
    console.log("DELETE CONTRAT :"+request.params.id);
    oracledb.getConnection(conn, function(err, connection){
          if(err) {
              console.error(err.message);
              response.status(500).send("Erreur pour connecter à la bdd");
              return;
          }
    var body = request.body;
    var id = request.params.id;
    connection.execute("DELETE CONTRAT WHERE IDCONTRAT =:id",
          [body.IDCONTRAT ],
          function (err, result) {
            if (err) {
            console.error(err.message);
            response.status(500).send("Erreur lors de la suppression d'un dans le bdd");
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