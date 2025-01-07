# Escolha da imagem base
FROM node:18.12.1-alpine

# Configuração do diretório de trabalho no contêiner
WORKDIR /app

# Copiar apenas arquivos necessários inicialmente
COPY package.json package-lock.json ./

# Instalar nodemon e dependências
RUN npm install -g nodemon && npm install

# Copiar o restante dos arquivos para o diretório de trabalho
COPY . .

# Configurar comando para iniciar o servidor
CMD ["npm", "run", "dev"]

