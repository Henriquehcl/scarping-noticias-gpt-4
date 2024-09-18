const News = require('../model/News');
const SearchedNews = require('../model/SearchedNews');
const Sheets = require('../model/Sheets');
/**
 * classe responsável por fazer o relacionamento com o banco de dados
 */
class Repository {

    async checkIfSpreadsheetIdExist(){
        try {

            const findSpreadsheetId = await Sheets.findOne();

            return findSpreadsheetId;
            
        } catch (error) {
            console.log(error)
            return false
            
        }
    }

    /**
     * Armazena o ID do google planilha
     * @param {String} spreadsheetId Id da planilha do google
     * @returns 
     */
    async saveNewSpreadsheetId(spreadsheetId){
        try {

            const newSpreadsheetId = await Sheets.create({
                spreadsheetId:spreadsheetId,
                deleted:false
            });

            return newSpreadsheetId
            
        } catch (error) {
            console.log(error)
            return false
        }
    }

    /**
     * Armazena a noticia no banco de dados
     * @param {JSON} data Objeto JSON com os parâmetros que serão salvos no banco de dados
     * @returns 
     */
    async storeNews(data){
        try {
            const storeNews = await News.create(data);

            return storeNews;
        } catch (error) {
            console.log(error)
            return false
        }
    }

    /**
     * armazena o parametro buscado
     * @param {JSON} data parametro buscado
     */
    async saveParam(data){
        try {
            const saveParam = SearchedNews.create(data);
            return saveParam
        } catch (error) {
            console.log(error)
            return false
        }
    }

}

module.exports = new Repository();