FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto por defecto (se sobreescribe en compose)
EXPOSE 3000
EXPOSE 5173

# Comando por defecto (se sobreescribe en compose)
CMD ["npm", "start"]
