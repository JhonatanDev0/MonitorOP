from flask import request, jsonify


def paginate_query(query, default_per_page=10):
    """
    Aplica paginação a uma query SQLAlchemy
    
    Args:
        query: Query SQLAlchemy
        default_per_page: Número padrão de itens por página
    
    Returns:
        dict: Dicionário com dados paginados e metadados
    """
    # Obter parâmetros da requisição
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', default_per_page, type=int)
    
    # Limitar per_page para evitar sobrecarga
    per_page = min(per_page, 100)
    
    # Executar paginação
    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    
    return {
        'items': pagination.items,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
            'next_page': pagination.next_num if pagination.has_next else None,
            'prev_page': pagination.prev_num if pagination.has_prev else None
        }
    }


def create_pagination_response(items, to_dict_func=None):
    """
    Cria resposta JSON com paginação
    
    Args:
        items: Lista de itens paginados
        to_dict_func: Função para converter items em dicts (opcional)
    
    Returns:
        Response JSON
    """
    if to_dict_func:
        items_data = [to_dict_func(item) for item in items]
    else:
        items_data = [item.to_dict() for item in items]
    
    return items_data