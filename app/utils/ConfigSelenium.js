
/**
 * Importa o módulo Builder da biblioteca selenium-webdriver
 */
const { Builder } = require('selenium-webdriver');

/**
 * Importa o módulo chrome da biblioteca selenium-webdriver
 */
const chrome = require('selenium-webdriver/chrome');

const chromedriver = require('chromedriver');
//const Errors = require('./Errors');
/**
 * Função assíncrona para configurar o Selenium com as opções do Chrome Headless
 */
async function ConfigSelenium() {
    

    try {
        /**
         * Configura o ChromeDriver binário
         */
        //chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
        const serviceBuilder = new chrome.ServiceBuilder(chromedriver.path);
        console.log('Serviço do ChromeDriver criado com sucesso');

        /**
         * Cria um objeto de opções para o Chrome
         */
        let options = new chrome.Options();

        /*options.addArguments(`--user-agent=${headers.get('User-Agent')}`);
        options.addArguments(`--lang=${headers.get('Accept-Language')}`);
        options.addArguments(`--referer=${headers.get('Referer')}`);
        options.addArguments(`--cookie=${headers.get('Cookie')}`);
        options.addArguments(`--cache-control=${headers.get('Cache-Control')}`);
        */
        /**
         * Adiciona argumentos para executar o Chrome no modo headless
         */
        options.addArguments('--headless');
        //options.addArguments('--headless=new');
        options.addArguments('--disable-gpu');
        options.addArguments('--no-sandbox');        
        options.windowSize({ width: 1366, height: 768 });
        options.addArguments('--disable-notifications');
        options.excludeSwitches('enable-automation')
        options.addArguments('--disable-dev-shm-usage')// em caso de usar muita memória 
        //options.addArguments('--disable-extensions');
       // options.addArguments('--disable-javascript');
        //options.addArguments('--disable-session-crashed-bubble');
      //  options.addArguments('--incognito');

        // Define os headers
        let headers = new Headers();
        headers.set('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8');
        headers.set('Accept-Encoding', 'Accept-Encoding: gzip, deflate, br')
        headers.set('Connection', 'keep-alive');

        headers.set('Upgrade-Insecure-Requests','1');
        headers.set('Sec-Fetch-Dest','document');
        headers.set('Sec-Fetch-Mode','navigate');
        headers.set('Sec-Fetch-Site','none');
        headers.set('Sec-Fetch-User','?1');
        headers.set('TE','trailers');

        headers.set('Accept-Language', 'en-US,en;q=0.5');

        // Adiciona os headers ao options
        options.addArguments(`--user-agent=${headers.get('User-Agent')}`);
        options.addArguments(`--accept=${headers.get('Accept')}`);
        options.addArguments(`--accept-encoding=${headers.get('Accept-Encoding')}`);
        options.addArguments(`--connection=${headers.get('Connection')}`);

        options.addArguments(`--upgrade-insecure-requests=${headers.get('Upgrade-Insecure-Requests')}`);
        options.addArguments(`--sec-fetch-dest=${headers.get('Sec-Fetch-Dest')}`);
        options.addArguments(`--sec-fetch-mode=${headers.get('Sec-Fetch-Mode')}`);
        options.addArguments(`--sec-fetch-site=${headers.get('Sec-Fetch-Site')}`);
        options.addArguments(`--sec-fetch-user=${headers.get('Sec-Fetch-User')}`);
        options.addArguments(`--te=${headers.get('TE')}`);

        options.addArguments(`--lang=${headers.get('Accept-Language')}`);

        /**
         * Cria um novo driver usando o Builder, configurado para o navegador Chrome
         */
        let driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .setChromeService(serviceBuilder)
            .build();

        

        /**
         * Retorna o driver configurado
         */
        return driver;
    } catch (error) {
        console.log('erro dentro do selenium config',error);
        /**
         * Captura a mensagem de erro completa, incluindo o stack trace, se disponível
         */
        const errorMessage = error.stack || error.message;

        //await Errors.logError({}, errorMessage);
        return false;
        
    }
}

/**
 * Exporta a função ConfigSelenium para uso em outros arquivos
 */
module.exports = ConfigSelenium;

