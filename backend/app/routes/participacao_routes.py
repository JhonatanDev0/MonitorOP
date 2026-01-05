from flask import Blueprint, jsonify
from app.config.database import get_db_connection
import json

bp = Blueprint('participacao', __name__, url_prefix='/api/participacao')

@bp.route('/dados/<cd_projeto>', methods=['GET'])
def buscar_dados_participacao(cd_projeto):
    """Busca os dados de participação para um projeto específico"""
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT
                CD_PROJETO,
                DT_EXPORTACAO,
                DADO_PARTICIPACAO,
                DT_REGISTRO
            FROM TMP_RELATORIO_PARTICIPACAO
            WHERE CD_PROJETO = ?
            ORDER BY DT_REGISTRO DESC
        """

        cursor.execute(query, (cd_projeto,))
        row = cursor.fetchone()

        if not row:
            return jsonify({
                'success': False,
                'message': 'Nenhum dado encontrado para este projeto'
            }), 404

        # Parsear o JSON do campo DADO_PARTICIPACAO
        dado_participacao_str = row.DADO_PARTICIPACAO
        dado_participacao = json.loads(dado_participacao_str) if dado_participacao_str else []

        resultado = {
            'CD_PROJETO': row.CD_PROJETO,
            'DT_EXPORTACAO': str(row.DT_EXPORTACAO) if row.DT_EXPORTACAO else None,
            'DADO_PARTICIPACAO': dado_participacao,
            'DT_REGISTRO': str(row.DT_REGISTRO) if row.DT_REGISTRO else None
        }

        return jsonify({
            'success': True,
            'data': resultado
        })

    except Exception as e:
        print(f"Erro ao buscar dados de participação: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Erro ao buscar dados: {str(e)}'
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
