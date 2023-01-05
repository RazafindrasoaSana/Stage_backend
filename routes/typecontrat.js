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

  // GET qui retourne la liste des type de contrat
router.route('/typecontrats/').get(function (request, response) {
    console.log("GET TYPE CONTRAT");
    oracledb.getConnection(conn, function (err, connection) {
      if (err) {
        console.error(err.message);
        response.status(500).send("Erreur pour connecter à la bdd");
        return;
      }
      console.log("apres connection");
     connection.execute("SELECT * FROM TYPECONTRAT",{},
      { outFormat: oracledb.OBJECT },
      function (err, result) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Erreur d'acceder à la bdd");
          doRelease(connection);
          return;

      }
      console.log("RESULTSET:" + JSON.stringify(result));

      var typecontrats = [];
      result.rows.forEach(function (element) {
        typecontrats.push({ id: element.IDTYPECONTRAT, NOM: element.NOM, TYPE: element.TYPE });
      }, this);
      response.json(typecontrats);
      doRelease(connection);

      });
    });
});

//GET avec rechrerchetype er rechecheValue
//retourner la list du type de contrat par type de recherche

router.route('/typecontrats/:searchType/:searchValues').get(function (request, response) {
    console.log("GET TYPE DE CONTRAT PAR CRITERE DE RECHERCHE");
    oracledb.getConnection(conn, function(err, connection) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Erreur pour connecter à la bdd");
          return;
        }
            console.log("Après conneciton");
            var searchType = request.params.searchType;
            var searchValue = request.params.searchValue;
          
           connection.execute("SELECT*FROM TYPECONTRAT WHERE "+searchType+" = :searchValue",[searchValue],
           { outFormat: oracledb.OBJECT },
           function (err, result) {
                  if(err) {
                    console.error(err.message);
                    response.status(500).send("Erreur pour avoir les donnée dans la bdd");
  
                    doRelease(connection);
                    return;
                  }  
                  console.log("RESULTSET:" + JSON.stringify(result));
  
                  var typecontrats = [];
                  result.rows.forEach(function (element) {
                    typecontrats.push({ id: element.IDTYPECONTRAT, NOM: element.NOM, TYPE: element.TYPE
                                     });
                  }, this);
                  response.json(typecontrats);
                  doRelease(connection);
           });
    });
  });

//POST
//ajouter un nouveau Type de contrat
router.route('/typecontrats/').post(function (request, response)
{
    console.log("POST TYPE CONTRAT:");
    oracledb.getConnection(conn, function (err, connection) {
           if(err) {
                console.error(err.message);
                response.status(500).send("Erreur pour connecter à la base de bdd");
                return;
           }
           var body = request.body;

           connection.execute("INSERT INTO TYPECONTRAT (NOM,TYPE) VALUES (:NOM,:TYPE)",
            [body.NOM, body.TYPE],
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
//Update un Typecontrat
router.route('/typecontrats/:id').put(function(request, response){
    console.log("PUT TYPE CONTRAT:");
    oracledb.getConnection(conn, function (err, connection){
        if (err) {
             console.error(err.message);
             response.status(500).send("Erreur pour connecter à la bdd");
             return;
        }
 
        var body = request.body;
        var id= request.params.id;
 
       connection.execute("UPDATE TYPECONTRAT SET NOM=:NOM, TYPE=:TYPE where IDTYPECONTRAT=:id",
              [body.NOM,body.TYPE, body.IDTYPECONTRAT],
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
// supprimer un type de contrat

router.route ('/typecontrats/:id').delete(function (request, response){
    console.log("DELETE TYPE CONTRAT IDTYPECONTRAT:"+request.params.id);
    oracledb.getConnection(conn, function(err, connection){
          if(err) {
              console.error(err.message);
              response.status(500).send("Erreur pour connecter à la bdd");
              return;
          }
    var body = request.body;
    var id = request.params.id;
    connection.execute("DELETE TYPECONTRAT WHERE IDTYPECONTRAT =:id",
          [body.IDTYPECONTRAT ],
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

  

