# Use uma imagem base do Node.js com a versão desejada
FROM node:18.19.0

# Instala as dependências necessárias, incluindo as dependências do Google Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libxrandr2 \
    xdg-utils \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libgtk-3-0 \
    libgtk-4-1 \
    libnspr4 \
    libnss3 \
    libu2f-udev \
    libvulkan1 \
    libxdamage1 \
    libxkbcommon0 \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*
# Copie o arquivo do Google Chrome para dentro do contêiner
# COPY google-chrome-stable_122.0.6261.128-1_amd64.deb /tmp/google-chrome.deb

# Baixe o arquivo do Google Chrome diretamente do link fornecido
RUN wget https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_122.0.6261.128-1_amd64.deb -O /tmp/google-chrome.deb


#alterar permissão
RUN chmod +r /tmp/google-chrome.deb

# Instale o Google Chrome a partir do arquivo copiado usando dpkg
RUN dpkg -i /tmp/google-chrome.deb

# Instale as dependências quebradas
RUN apt-get install -f -y

# Limpe o cache do apt
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Configuração do Chrome Headless
ENV CHROME_BIN=/usr/bin/google-chrome
ENV CHROME_PATH=/usr/lib/chromium/

# Exibe a versão do Chrome durante o build
RUN google-chrome --version

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copie o package.json e o package-lock.json (ou apenas o package.json, se aplicável)
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o código da sua aplicação para o diretório de trabalho do contêiner
COPY . .

# Criação do arquivo .env
COPY .env .env

# Exponha a porta em que sua aplicação será executada (se necessário)
EXPOSE 3030
EXPOSE 3306

# Comando para montar a partição tmpfs
#RUN mount -t tmpfs -o rw,nosuid,nodev,noexec,relatime,size=512M tmpfs /dev/shm


# Comando para iniciar sua aplicação quando o contêiner for iniciado
CMD ["node", "index.js"]
