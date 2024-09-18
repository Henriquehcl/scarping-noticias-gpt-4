const { DataTypes, Model } = require('sequelize');
const db = require('../server/db');

/**
 * Model responsável por armazenar as noticias encontradas
 */
class News extends Model {}

    News.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        IdNews: {
            type: DataTypes.STRING,
            allowNull: true,
            comment:'ID da noticia, mesmo do google planilha'
        },
        link: {
          type: DataTypes.STRING,
          allowNull: true,
          comment:'link da notícia'
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
            comment:'titulo do notícia'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            comment:'descrição da noticia'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            comment:'nome da pessoa relacionada a notícia'
        },
        date: {
            type: DataTypes.STRING,
            allowNull: true,
            comment:'Data do ocorrido'
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment:'identifica se registro foi excluído ou não'
        }
      },
      {
        sequelize: db,
        modelName: 'News',
        tableName: 'news',
      }

    );

  

module.exports = News;