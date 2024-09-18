const { DataTypes, Model } = require('sequelize');
const db = require('../server/db');

/**
 * Model responsável por armazenar os termos já buscados
 */
class SearchedNews extends Model {}

    SearchedNews.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        SearchedNews: {
            type: DataTypes.STRING,
            allowNull: true,
            comment:'termo que já foi buscado'
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment:'identifica se registro foi excluído ou não'
        }
      },
      {
        sequelize: db,
        modelName: 'SearchedNews',
        tableName: 'searchedNews',
      }

    );

  

module.exports = SearchedNews;