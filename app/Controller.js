const { By, until,Key } = require('selenium-webdriver');
const ConfigSelenium = require('./utils/ConfigSelenium');
const getNewsData = require('./utils/getNewsData');
const Repository = require('./repository/Repository');

class Controller {

    /**
     * Executa a busca de noticias de acordo com termo passado
     * @param {*} req 
     * @param {*} res 
     */
    async getNews(req, res){
        /**
         * Configurando o Selenium
         */
        const driver = await ConfigSelenium();

        try {

            /**
             * termo que será usado para buscar as noticias
             * @var {String} searchParam
             */
            const searchParam = req.body.search;

            /**
             * armazena o parâmetro buscado no banco de dados
             */
            await Repository.saveParam({
                SearchedNews:searchParam,
                deleted:false
            })

            /**
             * Verifica se existe espaço na string e substitui por +
             * @var {String} formattedSearchParam
             */
            const formattedSearchParam = searchParam.includes(' ') ? searchParam.replace(/ /g, '+') : searchParam;

            /**
             * contador de paginas
             * @var {Integer} pageNum
             */
            let pageNum = 0;

            /**
             * usado para verificar se existe conteúdo de noticia na página buscada
             * @var {Bollean} nextpage
             */
            let nextpage = true;

            let news = [];

            /**
             * recebe o link da planilha do google
             * @var {String} googleSheets
             */
            let googleSheets;

            /**
             * executa a busca por paginação
             */
            while (nextpage) {

                /**
                 * Navegando para a página desejada
                 */
                await driver.get(`https://www.google.com/search?q=${formattedSearchParam}&sca_esv=0d669a3428d15c3f&tbs=qdr:d&tbm=nws&ei=wALfZqOaMtvS1sQPgayTsA0&start=${pageNum}&sa=N&ved=2ahUKEwij-or-hbaIAxVbqZUCHQHWBNY4ChDy0wN6BAgEEAQ&biw=1920&bih=991&dpr=1`);

                // Espera até que o título da página contenha "Google"
                await driver.wait(until.titleContains('Google'), 5000);

                // Localiza o elemento de input usando o ID
                const newsData = await driver.wait(until.elementLocated(By.id('search')), 5000);

                // Seleciona todas as divs onde aparece as noticias com a classe "SoaBEf"
                const divs = await newsData.findElements(By.css('.SoaBEf'));

                /**
                 * verifica se existe noticia para ser percorrida
                 */
                if (divs.length > 0) {

                    
                    /**
                     * Percorre cada uma das divs e captura os links dentro delas
                     */
                    for (let div of divs) {
                        let dataInfoNews={};
                        dataInfoNews.id = await getNewsData.gerarIDUnico();
                        // Captura o link dentro de cada div
                        const linkElement = await div.findElement(By.css('a.WlydOe'));
                        const link = await linkElement.getAttribute('href');
                        dataInfoNews.link = link;

                        // Captura o título
                        const titleElement = await div.findElement(By.css('.n0jPhd.ynAwRc'));
                        const title = await titleElement.getText();
                        dataInfoNews.title = title;

                        // Captura a descrição
                        const descriptionElement = await div.findElement(By.css('.GI74Re.nDgy9d'));
                        const description = await descriptionElement.getText();
                        dataInfoNews.description = description;

                        const getHTML = await getNewsData.extrairTexto(link);

                        /**
                         * armazena a responsa de nome e data
                         * retornada do chat GPT
                         */
                        let stringResponse = '';

                        if (getHTML){
                            // Controla as tentativas de chamada da API
                            let getInfo;
                            let maxTentativas = 3; // Defina um número máximo de tentativas
                            let tentativa = 0;

                            while (tentativa < maxTentativas) {
                                
                                /**
                                 * Envia o texto para a o GPT para tentar extarir o nome e a data 
                                 */
                                getInfo = await getNewsData.enviarTextoParaAPIEmBlocos(getHTML);

                                if (getInfo.statusCode === 500 && getInfo.data.status == 429 && getInfo.data.message.error.code === 'rate_limit_exceeded') {
                                    const tempoDeEspera = getInfo.data.message.error.message.match(/try again in (\d+.\d+)s/);
                                    if (tempoDeEspera && tempoDeEspera[1]) {
                                        const tempo = parseFloat(tempoDeEspera[1]) * 1000;
                                        console.log(`Rate limit atingido. Aguardando ${tempo / 1000} segundos...`);
                                        await new Promise(resolve => setTimeout(resolve, tempo)); // Aguardar o tempo de espera antes de tentar novamente
                                    }
                                    tentativa++;
                                } else {
                                    break; // Se não houver erro de rate limit, sair do loop
                                }
                            }

                            
                            if(getInfo.statusCode == 200){
                                
                               // return res.status(500).json({ message:'internal error',data:getInfo.data});  
                               for (let responseGPT of getInfo.data) {
 

                                    stringResponse = responseGPT.choices[0].message.content

                                    if(stringResponse.includes('nome:')) {
                                        dataInfoNews.response=stringResponse
                                    } else {
                                        dataInfoNews.response='N/F'
                                    }
                                    
                                }
                            } else {
                                dataInfoNews.response='N/F'
                            }

                            
                        } else{
                            console.log('não foi possível gerar o texto')
                            //return res.status(500).json({ message:'Não foi possível gerar o texto',data:''});  
                        }

                        /**
                         * Objeto JSON com os dados das noticias que serão salvos no Banco de dados
                         * @var {JSON}dataToSave
                         */
                        const dataToSave = {
                            IdNews:dataInfoNews.id,
                            link:dataInfoNews.link,
                            title:dataInfoNews.title,
                            description:dataInfoNews.description,
                            name:stringResponse || 'N/F',
                            date:stringResponse || 'N/F',
                            deleted:false

                        }
                        /**
                         * chama função para armazenar a noticia no banco de dados
                         */
                        await Repository.storeNews(dataToSave)

                        /**
                         * adiciona a notícia no array
                         */
                        news.push(dataInfoNews);
                    }

                    /**
                     * Verifica se existe a planilha através do ID da planilha
                     */
                    const checkIfSheetExist = await Repository.checkIfSpreadsheetIdExist();

                    /**
                     * verifica se foi localizado algum registro ou não
                     */
                    if(!checkIfSheetExist){
                        /**
                         * chama a função para criar uma nova planilha
                         */
                        googleSheets = await getNewsData.generateXLSFile(news);
                    }else {
                        /**
                         * chama a função para adicionar os registros em uma planilha existente
                         */
                        googleSheets = await getNewsData.appendToSpreadsheet(checkIfSheetExist.dataValues.spreadsheetId,news)
                    }
                    
                    
                    /**
                     * adiciona a proxima página
                     */
                    pageNum = pageNum + 10;
                } else {
                    /**
                     * se não houver mais conteudo, define como false para sair do laço
                     */
                    nextpage=false;
                }

            }
            return res.status(200).json({ message:googleSheets.message,planilha:googleSheets.link,erro:googleSheets.erro || 'nenhum erro encontrado.'});  
            
        } catch (error) {
            console.error(error);
            return {statusCode:500, message:'erro na consulta', data:null};
        }finally {
            // Fecha o navegador depois de terminar
            await driver.quit();
        }
    }

}

module.exports = new Controller();