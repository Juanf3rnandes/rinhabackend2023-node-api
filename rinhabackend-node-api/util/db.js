const pg = require('pg');
const logger = require('./logger.js');

const URL = process.env.DB_URL || 'postgres://postgres:juan102030@localhost:5432/pessoas';

const pool = new pg.Pool({
  max:(Number(process.env.POOL || 200)),
  connectionString:URL,
  idleTimeoutsMillis:0,
})

 pool.once('connect', () =>  {
    return pool.query(`
        CREATE EXTENSION IF NOT EXISTS pg_trgm;

        CREATE OR REPLACE FUNCTION generate_searchable(_nome VARCHAR, _apelido VARCHAR, _stack JSON)
            RETURNS TEXT AS $$
            BEGIN
            RETURN _nome || _apelido || _stack;
            END;
        $$ LANGUAGE plpgsql IMMUTABLE;

        CREATE TABLE IF NOT EXISTS pessoas (
            id uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
            apelido TEXT UNIQUE NOT NULL,
            nome TEXT NOT NULL,
            nascimento DATE NOT NULL,
            stack JSON,
            searchable text GENERATED ALWAYS AS (generate_searchable(nome, apelido, stack)) STORED
        );

        CREATE INDEX IF NOT EXISTS idx_pessoas_searchable ON public.pessoas USING gist (searchable public.gist_trgm_ops (siglen='64'));

        CREATE UNIQUE INDEX IF NOT EXISTS pessoas_apelido_index ON public.pessoas USING btree (apelido);
        `); 
})

async function connect(){ 
  try{
    logger.info(`${process.pid} connecting in database`);
    await pool.connect();
    logger.info(`${process.pid} database connected`);
  }catch(error){

  logger.error(error);
  }
}

connect();

module.exports = pool;

module.exports.insertPerson = async function(id, {apelido,nome,nascimento,stack}){

  const query = `INSERT INTO pessoas (id,apelido,nome,nascimento,stack) VALUES ($1, $2 ,$3, $4, $5::json) RETURNING *`
  
 return await pool.query(query, [id, apelido,nome,nascimento,JSON.stringify(stack)]);

}

module.exports.findById = async function (id) {  
    const query = `SELECT id,apelido,nome, to_char(nascimento,'YYYY-MM-DD') as nascimento,stack FROM pessoas WHERE "id" = $1`
    return await pool.query(query,[id]);
}

module.exports.findByTerm = async function (term) {
  const query = `
  SELECT id, apelido, nome, to_char(nascimento,'YYYY-MM-DD') as nascimento, stack
  FROM pessoas
  WHERE searchable ILIKE $1
  
`;
 return await pool.query(query,[`%${term}%`])
}

module.exports.count = async function (id){ 
  return pool.query(`SELECT COUNT(1) FROM pessoas`);
}
