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
 * Liste des Agences 
 */
  router.route('/agences/').get(function (request, response) {
    console.log("GET AGENCE");
    oracledb.getConnection(conn, function (err, connection) {
      if (err) {
        console.error(err.message);
        response.status(500).send("Erreur pour connecter à la bdd");
        return;
      }
      console.log("apres connection");
     connection.execute("SELECT * FROM AGENCE",{},
      { outFormat: oracledb.OBJECT },
      function (err, result) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Erreur d'avoir les donnée dans le bdd");
          doRelease(connection);
          return;

      }
      console.log("RESULTSET:" + JSON.stringify(result));

      var agences = [];
      result.rows.forEach(function (element) {
        agences.push({ 
                      IDAGENCE:element.IDAGENCE,
                       CODEAGENCE: element.CODEAGENCE,
                       EMAIL: element.EMAIL, 
                       ADRESSE: element.ADRESSE 
                    });
      }, this);
      response.json(agences);
      doRelease(connection);

      });
    });
});
//GET avec rechrerchetype er rechecheValue
//retourner la list des agences par type de recherche

router.route('/agence/:searchType/:searchValues').get(function (request, response) {
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
          
           connection.execute("SELECT*FROM AGENCE WHERE "+searchType+" = :searchValue",[searchValue],
           { outFormat: oracledb.OBJECT },
           function (err, result) {
                  if(err) {
                    console.error(err.message);
                    response.status(500).send("Erreur pour avoir les donnée dans la bdd");
  
                    doRelease(connection);
                    return;
                  }  
                  console.log("RESULTSET:" + JSON.stringify(result));
  
                  var agences = [];
                  result.rows.forEach(function (element) {
                    agences.push({ 
                                   IDAGENCE: element.IDAGENCE,
                                   CODEAGENCE: element.CODEAGENCE,  
                                   EMAIL: element.EMAIL,
                                   ADRESSE: element.ADRESSE 
                                });
                  }, this);
                  response.json(agences);
                  doRelease(connection);
           });
    });
  });


//POST
//ajouter une nouvelle agence
router.route('/agences/').post(function (request, response)
{
    console.log("POST AGENCE:");
    oracledb.getConnection(conn, function (err, connection) {
           if(err) {
                console.error(err.message);
                response.status(500).send("Erreur pour connecter à la base de bdd");
                return;
           }
           var body = request.body;

           connection.execute("INSERT INTO AGENCE (CODEAGENCE,EMAIL,ADRESSE) VALUES (:CODEAGENCE,:EMAIL,:ADRESSE)",
            [body.CODEAGENCE,body.EMAIL, body.ADRESSE],
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
//Update une agence
router.route('/agences/:id').put(function(request, response){
   console.log("PUT AGENCE:");
   oracledb.getConnection(conn, function (err, connection){
       if (err) {
            console.error(err.message);
            response.status(500).send("Erreur pour connecter à la bdd");
            return;
       }

       var body = request.body;
       var id= request.params.id;

      connection.execute("UPDATE AGENCE SET CODEAGENCE=:CODEAGENCE,EMAIL=:EMAIL, ADRESSE=:ADRESSE where IDAGENCE=:id",
             [body.CODEAGENCE,body.EMAIL, body.ADRESSE, body.IDAGENCE],
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
// supprimer une agence

router.route ('/agences/:id').delete(function (request, response){
    console.log("DELETE AGENCE:"+request.params.id);
    oracledb.getConnection(conn, function(err, connection){
          if(err) {
              console.error(err.message);
              response.status(500).send("Erreur pour connecter à la bdd");
              return;
          }
    var body = request.body;
    var id= request.params.id;
    connection.execute("DELETE AGENCE WHERE IDAGENCE =:id",
          [body.IDAGENCE],
          function (err, result) {
            if (err) {
            console.error(err.message);
            response.status(500).send("Erreur lors de la suppression d'une agence dans la bdd");
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