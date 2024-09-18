const axios = require('axios');
const cheerio = require('cheerio');
const { google } = require('googleapis');
const path = require('path');
const crypto = require('crypto');
const Repository = require('../repository/Repository');


class getNewsData {

    constructor(){

         const keyFilePath = path.resolve(__dirname, '../../whatsjud-654b40b987eb.json');
        // Substitua pelos seus dados de autenticação
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            //scopes: ['https://www.googleapis.com/auth/spreadsheets']
            scopes: [
              'https://www.googleapis.com/auth/spreadsheets',
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/drive.file',
              'https://www.googleapis.com/auth/drive.readonly'
          ]
        });
        
        this.sheets = google.sheets({ version: 'v4', auth });
        this.drive = google.drive({ version: 'v3', auth });

    }

    /**
     * Função para extrair o texto do site
     * @param {String} url que será lida onde tem a noticia
     */
    async  extrairTexto(url) {
        try {
        const resposta = await axios.get(url);
        const $ = cheerio.load(resposta.data);
        return $('body').text();
        } catch (erro) {
        console.error('Erro ao extrair o texto do site:', erro);
        return null;
        }
    }

    /**
     * Função para enviar o texto para a API do ChatGPT
     */
    async enviarTextoParaAPI(texto) {
        /**
         * Token da API do chat GPT
         */
        const chaveApi = process.env.TOKEN_GPT; // Substitua pela sua chave API
    
        try {
        const resposta = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',//'gpt-3.5-turbo',//'gpt-4',
            messages: [
                { role: 'system', content: 'Você é um assistente útil.' }, // Contexto opcional
                { role: 'user', content: `Aqui está o texto extraído do site: ${texto}` },
                { role: 'user', content: 'pode verificar o nome da pessoa e a data do acidente. me retorna no formato nome:xxxx, data:dd/mm/aaaa' }
              ],
            max_tokens: 15000,
            temperature: 0.5,
        }, {
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${chaveApi}`,
            },
        });
    
        return resposta.data;
        } catch (erro) {
            if (erro.response) {
                // A resposta de erro da API
                return {statusCode:500, data:{status:erro.response.status,message:erro.response.data}}
              } 
            
            return {statusCode:500, data:{status:500,message:erro.message}}
            
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async enviarTextoParaAPIEmBlocos(texto) {
        const chaveApi = process.env.TOKEN_GPT; // Sua chave da API
        const tamanhoMaximoBloco = 5000;  // Limitar o tamanho do bloco de texto
    
        // Dividir o texto em blocos menores
        const blocosDeTexto = this.dividirTexto(texto, tamanhoMaximoBloco);
    
        let respostas = [];
    
        let totalTokensUsados = 0;

        for (const bloco of blocosDeTexto) {
            try {
                const resposta = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: 'gpt-4',//'gpt-3.5-turbo', // ou 'gpt-4' se estiver usando
                    messages: [
                        { role: 'system', content: 'Você é um assistente útil.' },
                        { role: 'user', content: `Aqui está o texto extraído do site: ${bloco}` },
                        { role: 'user', content: 'Considerando que este é um artigo de notícias sobre um acidente, identifique o nome da pessoa envolvida e a data do acidente. me retorna no formato nome:xxxx, data:dd/mm/aaaa. Exemplo: Retorne a resposta no seguinte formato: nome: João Silva, data: 23/05/2023.'}
                    ],
                    max_tokens: 2000,  // Limite para a resposta
                    temperature: 0.5,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${chaveApi}`,
                    },
                });

                const tokensUsados = resposta.data.usage.total_tokens;
                totalTokensUsados += tokensUsados;

                if (totalTokensUsados >= 10000) {
                    const tempoDeEspera = 60000; // 1 minuto
                    console.log(`Limite de tokens por minuto atingido, aguardando ${tempoDeEspera / 1000} segundos...`);
                    await this.delay(tempoDeEspera);
                    totalTokensUsados = 0;  // Reinicia o contador de tokens após o intervalo
                }
    
                respostas.push(resposta.data);
            } catch (erro) {
                if (erro.response && erro.response.status === 429) {
                    const tempoDeEspera = 10608; // 10.608 segundos
                    console.log(`Limite de taxa atingido, aguardando ${tempoDeEspera / 1000} segundos...`);
                    await this.delay(tempoDeEspera);
                }
                if (erro.response) {
                  console.log('entrei nesse erro')
                    return {statusCode:500, data:{status:erro.response.status,message:erro.response.data}}
                }
                if (!erro.response) {
                  console.log('ntrei neste outro')
                    // Você pode decidir como lidar com erros: parar ou continuar com o próximo bloco
                    return {statusCode:500, data:{status:500,message:erro.message}}
                }
            }
        }
    
        // Combina todas as respostas em uma string final (ou você pode processá-las de outra forma)
        //return respostas;
        return {statusCode:200, data:respostas}
    }
    

    /**
     * Gerar o texto em bloco com o tamanho limitado, para enviar em partes ao GPT
     * @param {*} texto 
     * @param {*} tamanhoMaximo 
     * @returns 
     */
    dividirTexto(texto, tamanhoMaximo) {
        const blocos = [];
    
        let indiceAtual = 0;
        while (indiceAtual < texto.length) {
            // Extrai um bloco de tamanho definido
            let bloco = texto.slice(indiceAtual, indiceAtual + tamanhoMaximo);
    
            // Garante que o bloco termina no final de uma frase (buscando o ponto final mais próximo)
            const ultimoPonto = bloco.lastIndexOf('.');
    
            if (ultimoPonto > 0 && ultimoPonto < tamanhoMaximo) {
                bloco = bloco.slice(0, ultimoPonto + 1);
            }
    
            blocos.push(bloco);
            indiceAtual += bloco.length;
        }
    
        return blocos;
    }
    

    /**
     * Responsável por gerar o arquivo XLS do Google Planilhas
     */
    async generateXLSFile(data){

        const spreadsheet = await this.sheets.spreadsheets.create({
          resource: {
            properties: {
              title: 'Minha Nova Planilha'
            }
          }
        });

        /**
         * Definir o intervalo (a partir de A1)
         */
        const range = 'Sheet1!A1:E' + (data.length + 1); // Ajusta o número de linhas

        /**
         * Definir os cabeçalhos e os valores das células
         */
      const values = [
        ['ID','Link', 'Título', 'Descrição', 'Nome'],  // Cabeçalhos
        ...data.map(item => [
          item.id || 'N/A',
          item.link || 'N/A',               // Se não houver link, usa 'N/A'
          item.title || 'N/A',              // Se não houver título, usa 'N/A'
          item.description || 'N/A',        // Se não houver descrição, usa 'N/A'
          item.response || 'N/A'               // Se não houver data, usa 'N/A'
        ])
      ];

        const result = await this.sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheet.data.spreadsheetId,
          range,
          valueInputOption: 'RAW',
          resource: { values }
        });

        /**
         * altera a parmissão de leitura e escrita da planilha
         */
       const changePermission = await this.makeSpreadsheetPublic(spreadsheet.data.spreadsheetId);

       await Repository.saveNewSpreadsheetId(spreadsheet.data.spreadsheetId);

       return {link:changePermission,message:`${result.data.updatedCells} células foram atualizadas.`};
    }

    /**
     * Adiciona novas linhas na planilha já existente
     * @param {String} spreadsheetId ID da Planilha
     * @param {Object} data array com os dados que serão inseridos
     * @returns 
     */
    async appendToSpreadsheet(spreadsheetId, data) {
      try {
        // Definir os valores a serem adicionados
        const values = data.map(item => [
          item.id || 'N/A',
          item.link || 'N/A',
          item.title || 'N/A',
          item.description || 'N/A',
          item.response || 'N/A',
         // item.date || 'N/A'
        ]);
    
        const range = 'Sheet1'; // Defina o nome da aba (Sheet1, por exemplo)
        
        const result = await this.sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range: range, // A faixa de células na qual os valores serão adicionados
          valueInputOption: 'RAW', // RAW para adicionar os valores conforme estão
          insertDataOption: 'INSERT_ROWS', // Inserir dados na próxima linha disponível
          resource: {
            values: values
          }
        });
    
        return {
          link:`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          message:`${result.data.updates.updatedCells} células foram atualizadas.`
        };

      } catch (err) {
        console.error('Erro ao adicionar dados à planilha:', err);
        return {message:'Erro ao adicionar dados à planilha',erro:err}
      }
    }
    

    /**
     * Define a planilha como publica
     * @param {String} spreadsheetId ID da planilha
     */
    makeSpreadsheetPublic = async (spreadsheetId) => { // Arrow function

      //const spreadsheetId = '1uoWsYZU6ureajh-MgYGJ478Vl479y2kJZjEKgG7UP_E'
        try {


          await this.drive.permissions.create({
            fileId: spreadsheetId,
            requestBody:{
              role: 'writer',
              type: 'anyone'  // Correto: permission enviado diretamente
          }
          });
          console.log('Planilha configurada como pública com sucesso!');
          return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

        } catch (err) {
          console.error('Erro ao configurar as permissões:', err);
          console.log('##3')
          console.log(err.response)
          return err.response
        }
    }

    /**
     * Gera um ID unico com base no timestamp
     * @returns String
     */
    gerarIDUnico = async () => {
      // Obtém o timestamp atual em milissegundos
      const timestamp = Date.now();
    
      // Gera um número aleatório de 5 dígitos
      const randomNum = Math.floor(Math.random() * 100000);
    
      // Cria um hash SHA-256 combinando timestamp, número aleatório e um salt
      const hash = crypto.createHash('sha256');
      hash.update(`${timestamp}${randomNum}seu_salt_secreto`);
      const id = hash.digest('hex');
    
      return id;
    }
}

module.exports = new getNewsData();