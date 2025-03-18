const cluster = require('cluster');
const numsCPU = require("os").cpus().length;
const express = require('express');
const webApp = express();
const webServer = require("http").createServer(webApp);
const bodyParser = require('body-parser');
const logger = require("../util/logger.js");
const {count, insertPerson, findById, findByTerm} = require("../util/db.js");
const {validateBody} = require('./middleware.js');
const {v4:uuidv4} = require('uuid');

const port = process.env.PORT || 8080;
const router = express.Router();

webApp.use(bodyParser.json());
webApp.use('/pessoas', router);


if(cluster.isMaster){

  for(let i=0; i< numsCPU; i++){
    cluster.fork()
  }
  

}else{
  router.post('/',validateBody, async (req,res) => {
   const id = uuidv4();
   return await insertPerson(id,req.body).then(() => {

    res.status(201).location(`/pessoas/${id}`).end();
     
   });
  
  })

  router.get('/:id', async(req,res) => {
    const result = await findById(req.params.id);
    res.json(result.rows[0])
  })

  router.get('/', async(req,res) => {
 
  if(!req.query['t']){
   res.status(400).json('requisicao invalida');
  }else{ 
   logger.info(`${req.query['t']}`)
   const result = await findByTerm(req.query.t);
   res.json(result.rows)
  }
  })

 webApp.get('/contagem-pessoas', async (_,res) => {
  
  const result = await  count();
  res.json(result.rows[0]);
  })

  webServer.listen(port, () => {

  logger.info(`${process.pid} is running on ${port}`)
  })
}
