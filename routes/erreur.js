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
 * Liste des Erreurs 
 */
router.route('/erreurs/').get(function (request, response) {
    console.log("GET Erreur");
    oracledb.getConnection(conn, function (err, connection) {
      if (err) {
        console.error(err.message);
        response.status(500).send("Erreur pour connecter à la bdd");
        return;
      }
      console.log("apres connection");
     connection.execute("SELECT * FROM ERREUR",{},
      { outFormat: oracledb.OBJECT },
      function (err, result) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Erreur d'avoir les erreurs dans le bdd");
          doRelease(connection);
          return;

      }
      console.log("RESULTSET:" + JSON.stringify(result));

      var erreurs = [];
      result.rows.forEach(function (element) {
        erreurs.push({ 
                      IDERREUR:element.IDERREUR,
                       CODEERREUR: element.CODEERREUR,
                       TYPEERREUR: element.TYPEERREUR, 
                       DESCRIPTIONERREUR: element.DESCRIPTIONERREUR 
                    });
      }, this);
      response.json(erreurs);
      doRelease(connection);

      });
    });
});

//GET avec rechrerchetype er rechecheValue
//retourner la list des erreurs par type de recherche

router.route('/agence/:searchType/:searchValues').get(function (request, response) {
    console.log("GET ERREUR PAR CRITERE DE RECHERCHE");
    oracledb.getConnection(conn, function(err, connection) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Erreur pour connecter à la bdd");
          return;
        }
            console.log("Après conneciton");
            var searchType = request.params.searchType;
            var searchValue = request.params.searchValue;
          
           connection.execute("SELECT*FROM ERREUR WHERE "+searchType+" = :searchValue",[searchValue],
           { outFormat: oracledb.OBJECT },
           function (err, result) {
                  if(err) {
                    console.error(err.message);
                    response.status(500).send("Erreur pour avoir les erreurs dans la bdd");
  
                    doRelease(connection);
                    return;
                  }  
                  console.log("RESULTSET:" + JSON.stringify(result));
  
                  var erreurs = [];
                  result.rows.forEach(function (element) {
                    erreurs.push({ 
                                   IDERREUR: element.IDERREUR,
                                   CODEERREUR: element.CODEERREUR,  
                                   TYPEERREUR: element.TYPEERREUR,
                                   DESCRIPTIONERREUR: element.DESCRIPTIONERREUR
                                });
                  }, this);
                  response.json(erreurs);
                  doRelease(connection);
           });
    });
  });

//POST
//ajouter une nouvelle Erreur
router.route('/erreurs/').post(function (request, response)
{
    console.log("POST ERREUR:");
    oracledb.getConnection(conn, function (err, connection) {
           if(err) {
                console.error(err.message);
                response.status(500).send("Erreur pour connecter à la base de bdd");
                return;
           }
           var body = request.body;

           connection.execute("INSERT INTO ERREUR (CODEERREUR,TYPEERREUR,DESCRIPTIONERREUR) VALUES (:CODEERREUR,:TYPEERREUR,:DESCRIPTIONERREUR)",
            [body.CODEERREUR,body.TYPEERREUR, body.DESCRIPTIONERREUR],
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
//Update une erreur
router.route('/erreurs/:id').put(function(request, response){
   console.log("PUT ERREUR:");
   oracledb.getConnection(conn, function (err, connection){
       if (err) {
            console.error(err.message);
            response.status(500).send("Erreur pour connecter à la bdd");
            return;
       }

       var body = request.body;
       var id= request.params.id;

      connection.execute("UPDATE ERREUR SET CODEERREUR=:CODEERREUR, TYPEERREUR=:TYPEERREUR, DESCRIPTIONERREUR=:DESCRIPTIONERREUR where IDERREUR=:id",
             [body.CODEERREUR,body.TYPEERREUR, body.DESCRIPTIONERREUR, body.IDERREUR],
             function (err, result) {
                  if(err) {
                    console.error(err.message);
                    response.status(500).send("erreur pour modifier une agence");
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
// supprimer une erreur

router.route ('/erreurs/:id').delete(function (request, response){
    console.log("DELETE ERREUR:"+request.params.id);
    oracledb.getConnection(conn, function(err, connection){
          if(err) {
              console.error(err.message);
              response.status(500).send("Erreur pour connecter à la bdd");
              return;
          }
    var body = request.body;
    var id = request.params.id;
    console.log(connection.execute("DELETE ERREUR WHERE IDERREUR =:id",
          [body.IDERREUR],
          function (err, result) {
            if (err) {
            console.error(err.message);
            response.status(500).send("Erreur lors de la suppression d'une erreur dans le bdd");
            doRelease(connection);
            return;
          }
          response.end();
          doRelease(connection);
          
      }));
  });
});
app.use(express.static('static'));
app.use('/', router);
app.listen(PORT);



