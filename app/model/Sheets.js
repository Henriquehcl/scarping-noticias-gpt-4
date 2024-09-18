const { DataTypes, Model } = require('sequelize');
const db = require('../server/db');

/**
 * Model responsável por armazenar o ID do google planilhas
 */
class Sheets extends Model {}

    Sheets.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        spreadsheetId: {
          type: DataTypes.STRING,
          allowNull: true,
          comment:'ID da planilha no google planilhas'
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment:'identifica se registro foi excluído ou não'
        }
      },
      {
        sequelize: db,
        modelName: 'Sheets',
        tableName: 'sheets',
      }

    );

  

module.exports = Sheets;