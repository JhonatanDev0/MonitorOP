"""
routes/rotinas.py
Rotas para upload de arquivo, execução de rotinas e exclusão automática
"""

from flask import Blueprint, jsonify, request, Response
from werkzeug.utils import secure_filename
import subprocess
import threading
import queue
import json
import os
from datetime import datetime
from pathlib import Path
from app import db
from app.models import ExecucaoRotina, LogExecucao, Usuario

# Criar Blueprint (seguir padrão do projeto: usar 'bp')
bp = Blueprint('rotinas', __name__, url_prefix='/api/auditoria')

# =============================
# CONTROLE DE LOCK E ESTADO
# =============================
execucao_lock = threading.Lock()
execucao_ativa = {
    'rodando': False,
    'execucao_id': None,  # ID da execução no banco
    'projeto_id': None,  # Projeto vinculado
    'logs': [],
    'log_queue': None,
    'arquivo_processado': None  # Nome do arquivo sendo processado
}

# =============================
# CONFIGURAÇÕES
# =============================
SCRIPT_PATH = Path(__file__).parent.parent / "scripts" / "mainAuditoria.py"
PASTA_AUDITORIA = Path(__file__).parent.parent / "auditoria"
PASTA_AUDITORIA.mkdir(exist_ok=True)

# Extensões permitidas
EXTENSOES_PERMITIDAS = {'.xlsm', '.xlsx'}

# =============================
# FUNÇÕES AUXILIARES
# =============================

def arquivo_permitido(filename):
    """Verifica se a extensão do arquivo é permitida"""
    return Path(filename).suffix.lower() in EXTENSOES_PERMITIDAS

def formatar_log(tipo, mensagem):
    """Formata log com timestamp e tipo"""
    return {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'tipo': tipo,
        'mensagem': mensagem
    }

def salvar_log_banco(execucao_id, tipo, mensagem):
    """Salva log no banco de dados"""
    try:
        log = LogExecucao(
            execucao_id=execucao_id,
            tipo=tipo,
            mensagem=mensagem
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Erro ao salvar log no banco: {e}")
        db.session.rollback()

def deletar_arquivo_processado(arquivo_path):
    """Deleta o arquivo Excel após processamento"""
    try:
        if arquivo_path and os.path.exists(arquivo_path):
            os.remove(arquivo_path)
            return True
    except Exception as e:
        print(f"Erro ao deletar arquivo: {e}")
        return False
    return False

def executar_script_auditoria(log_queue, arquivo_nome, projeto_id, codigo_subprograma, execucao_id):
    """Executa o script Python e captura logs linha por linha"""
    arquivo_path = PASTA_AUDITORIA / arquivo_nome
    status_final = 'concluido'
    resultado_final = 'Rotina finalizada com sucesso'

    try:
        # Log inicial
        log_msg = f'🚀 Iniciando processamento de: {arquivo_nome}'
        log_queue.put(formatar_log('info', log_msg))
        salvar_log_banco(execucao_id, 'info', log_msg)

        if projeto_id:
            log_msg = f'🏷️  Projeto ID: {projeto_id} | Código: {codigo_subprograma}'
            log_queue.put(formatar_log('info', log_msg))
            salvar_log_banco(execucao_id, 'info', log_msg)

        # Comando que será executado (com código do subprograma)
        comando = ['python', str(SCRIPT_PATH), str(arquivo_path)]
        if codigo_subprograma:
            comando.append(str(codigo_subprograma))

        # Executar o script Python
        processo = subprocess.Popen(
            comando,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True,
            cwd=str(SCRIPT_PATH.parent)
        )

        # Ler stdout linha por linha
        for linha in processo.stdout:
            linha = linha.strip()
            if linha:
                # Determinar tipo de log
                if '❌' in linha or 'ERRO' in linha or '[ERRO]' in linha:
                    tipo = 'error'
                elif '⚠️' in linha or '[AVISO]' in linha:
                    tipo = 'warning'
                elif '✅' in linha or 'Sucesso' in linha or '[OK]' in linha:
                    tipo = 'success'
                else:
                    tipo = 'info'

                log = formatar_log(tipo, linha)
                log_queue.put(log)
                salvar_log_banco(execucao_id, tipo, linha)

        # Aguardar conclusão
        processo.wait()

        # Verificar se houve erro
        if processo.returncode != 0:
            status_final = 'erro'
            stderr = processo.stderr.read()
            if stderr:
                log_msg = f'❌ Erro na execução: {stderr}'
                log_queue.put(formatar_log('error', log_msg))
                salvar_log_banco(execucao_id, 'error', log_msg)

            resultado_final = '❌ Rotina finalizada com erros'
            log_queue.put(formatar_log('error', resultado_final))
            salvar_log_banco(execucao_id, 'error', resultado_final)
        else:
            # Mesmo com sucesso, ler stderr por segurança
            stderr = processo.stderr.read()
            if stderr:
                log_msg = f'⚠️ Avisos: {stderr}'
                log_queue.put(formatar_log('warning', log_msg))
                salvar_log_banco(execucao_id, 'warning', log_msg)

            resultado_final = '🎉 Rotina finalizada com sucesso!'
            log_queue.put(formatar_log('success', resultado_final))
            salvar_log_banco(execucao_id, 'success', resultado_final)

            # Deletar arquivo após sucesso
            log_msg = f'🗑️ Deletando arquivo: {arquivo_nome}'
            log_queue.put(formatar_log('info', log_msg))
            salvar_log_banco(execucao_id, 'info', log_msg)

            if deletar_arquivo_processado(arquivo_path):
                log_msg = f'✅ Arquivo deletado: {arquivo_nome}'
                log_queue.put(formatar_log('success', log_msg))
                salvar_log_banco(execucao_id, 'success', log_msg)
            else:
                log_msg = f'⚠️ Não foi possível deletar: {arquivo_nome}'
                log_queue.put(formatar_log('warning', log_msg))
                salvar_log_banco(execucao_id, 'warning', log_msg)

        # Sinal de término
        log_queue.put(None)

    except Exception as e:
        status_final = 'erro'
        resultado_final = f'Erro crítico: {str(e)}'
        log_msg = f'❌ {resultado_final}'
        log_queue.put(formatar_log('error', log_msg))
        salvar_log_banco(execucao_id, 'error', log_msg)
        log_queue.put(None)

        # Tentar deletar arquivo mesmo em caso de erro
        deletar_arquivo_processado(arquivo_path)

    finally:
        # Atualizar status da execução no banco
        try:
            execucao = ExecucaoRotina.query.get(execucao_id)
            if execucao:
                execucao.status = status_final
                execucao.fim = datetime.utcnow()
                execucao.resultado = resultado_final
                db.session.commit()
        except Exception as e:
            print(f"Erro ao atualizar status da execução: {e}")
            db.session.rollback()

def finalizar_execucao():
    """Aguarda término e libera lock"""
    with execucao_lock:
        execucao_ativa['rodando'] = False
        execucao_ativa['execucao_id'] = None
        execucao_ativa['projeto_id'] = None
        execucao_ativa['log_queue'] = None
        execucao_ativa['arquivo_processado'] = None

# =============================
# ROTAS
# =============================

@bp.route('/upload', methods=['POST'])
def upload_arquivo():
    """Faz upload de arquivo Excel para processamento"""
    
    # Verificar se arquivo foi enviado
    if 'arquivo' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado'}), 400
    
    arquivo = request.files['arquivo']
    
    # Verificar se arquivo tem nome
    if arquivo.filename == '':
        return jsonify({'erro': 'Arquivo sem nome'}), 400
    
    # Verificar extensão
    if not arquivo_permitido(arquivo.filename):
        return jsonify({
            'erro': 'Extensão não permitida',
            'extensoes_validas': list(EXTENSOES_PERMITIDAS)
        }), 400
    
    try:
        # Gerar nome seguro do arquivo
        filename = secure_filename(arquivo.filename)
        
        # Adicionar timestamp para evitar conflitos
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_base = Path(filename).stem
        extensao = Path(filename).suffix
        filename = f"{nome_base}_{timestamp}{extensao}"
        
        # Salvar arquivo
        filepath = PASTA_AUDITORIA / filename
        arquivo.save(filepath)
        
        return jsonify({
            'mensagem': 'Arquivo enviado com sucesso',
            'arquivo': filename,
            'tamanho': filepath.stat().st_size,
            'caminho': str(filepath)
        })
        
    except Exception as e:
        return jsonify({'erro': f'Erro ao salvar arquivo: {str(e)}'}), 500

@bp.route('/arquivos', methods=['GET'])
def listar_arquivos():
    """Lista arquivos Excel disponíveis na pasta auditoria"""
    try:
        arquivos = []
        for ext in EXTENSOES_PERMITIDAS:
            arquivos.extend(list(PASTA_AUDITORIA.glob(f"*{ext}")))
        
        return jsonify({
            'pasta': str(PASTA_AUDITORIA),
            'arquivos': [
                {
                    'nome': a.name,
                    'tamanho': a.stat().st_size,
                    'modificado': datetime.fromtimestamp(a.stat().st_mtime).isoformat()
                }
                for a in arquivos
            ],
            'total': len(arquivos)
        })
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@bp.route('/arquivo/<filename>', methods=['DELETE'])
def deletar_arquivo_manual(filename):
    """Deleta um arquivo específico (limpeza manual)"""
    try:
        filepath = PASTA_AUDITORIA / secure_filename(filename)
        
        if not filepath.exists():
            return jsonify({'erro': 'Arquivo não encontrado'}), 404
        
        # Verificar se não está sendo processado
        with execucao_lock:
            if execucao_ativa['rodando'] and execucao_ativa['arquivo_processado'] == filename:
                return jsonify({'erro': 'Arquivo está sendo processado'}), 409
        
        os.remove(filepath)
        return jsonify({'mensagem': f'Arquivo {filename} deletado com sucesso'})
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@bp.route('/status', methods=['GET'])
def status_auditoria():
    """Retorna status atual da execução"""
    with execucao_lock:
        data = {
            'rodando': execucao_ativa['rodando'],
            'execucao_id': execucao_ativa['execucao_id'],
            'projeto_id': execucao_ativa['projeto_id'],
            'logs_count': len(execucao_ativa['logs']),
            'arquivo_processado': execucao_ativa['arquivo_processado']
        }

        # Se há uma execução ativa, buscar detalhes do banco
        if execucao_ativa['execucao_id']:
            try:
                execucao = ExecucaoRotina.query.get(execucao_ativa['execucao_id'])
                if execucao:
                    data['execucao'] = execucao.to_dict()
            except:
                pass

        return jsonify(data)

@bp.route('/executar', methods=['POST'])
def executar_auditoria():
    """Inicia execução da rotina de auditoria"""

    # Obter parâmetros
    arquivo_nome = request.json.get('arquivo')
    projeto_id = request.json.get('projeto_id')  # ID do projeto no banco
    squad_id = request.json.get('squad_id')  # ID da squad
    usuario_login = request.json.get('usuario', 'Sistema')  # Login do usuário

    if not arquivo_nome:
        return jsonify({'erro': 'Nome do arquivo não fornecido'}), 400

    if not projeto_id:
        return jsonify({'erro': 'Projeto não fornecido'}), 400

    if not squad_id:
        return jsonify({'erro': 'Squad não fornecida'}), 400

    # Extrair código do subprograma do nome do arquivo
    # Formato esperado: Relatorio_de_Qualidade_-2085_-_AVALIAMT_...
    import re
    match = re.search(r'-(\d+)_', arquivo_nome)
    codigo_subprograma = match.group(1) if match else None

    # Verificar se arquivo existe
    arquivo_path = PASTA_AUDITORIA / secure_filename(arquivo_nome)
    if not arquivo_path.exists():
        return jsonify({'erro': 'Arquivo não encontrado'}), 404

    # Buscar usuário pelo login
    usuario = Usuario.query.filter_by(login=usuario_login).first()
    if not usuario:
        # Se não encontrar, tentar pelo nome
        usuario = Usuario.query.filter_by(nome=usuario_login).first()
        if not usuario:
            return jsonify({'erro': 'Usuário não encontrado'}), 404

    # Verificar se já está rodando para este projeto
    with execucao_lock:
        if execucao_ativa['rodando'] and execucao_ativa['projeto_id'] == projeto_id:
            try:
                execucao = ExecucaoRotina.query.get(execucao_ativa['execucao_id'])
                return jsonify({
                    'erro': 'Rotina já está em execução para este projeto',
                    'execucao': execucao.to_dict() if execucao else None
                }), 409
            except:
                pass

        # Criar registro de execução no banco
        try:
            nova_execucao = ExecucaoRotina(
                usuario_id=usuario.id,
                projeto_id=projeto_id,
                squad_id=squad_id,
                arquivo_nome=arquivo_nome,
                tipo_rotina='auditoria',
                status='em_andamento'
            )
            db.session.add(nova_execucao)
            db.session.commit()
            execucao_id = nova_execucao.id
        except Exception as e:
            db.session.rollback()
            return jsonify({'erro': f'Erro ao criar execução: {str(e)}'}), 500

        # Marcar como em execução
        execucao_ativa['rodando'] = True
        execucao_ativa['execucao_id'] = execucao_id
        execucao_ativa['projeto_id'] = projeto_id
        execucao_ativa['logs'] = []
        execucao_ativa['arquivo_processado'] = arquivo_nome

        # Criar fila de logs
        log_queue = queue.Queue()
        execucao_ativa['log_queue'] = log_queue

    # Iniciar thread para executar script
    thread = threading.Thread(
        target=executar_script_auditoria,
        args=(log_queue, arquivo_nome, projeto_id, codigo_subprograma, execucao_id),
        daemon=True
    )
    thread.start()

    # Thread para liberar lock ao final
    threading.Thread(target=lambda: (thread.join(), finalizar_execucao()), daemon=True).start()

    return jsonify({
        'mensagem': 'Rotina iniciada com sucesso',
        'execucao_id': execucao_id,
        'arquivo': arquivo_nome,
        'projeto_id': projeto_id,
        'codigo_subprograma': codigo_subprograma
    })

@bp.route('/logs', methods=['GET'])
def logs_stream():
    """Stream de logs em tempo real via Server-Sent Events (SSE)"""
    
    def gerar_logs():
        # Enviar logs existentes primeiro
        with execucao_lock:
            for log in execucao_ativa['logs']:
                yield f"data: {json.dumps(log)}\n\n"
            
            log_queue = execucao_ativa['log_queue']
        
        # Se não houver fila ativa, encerrar
        if log_queue is None:
            return
        
        # Aguardar novos logs
        while True:
            try:
                # Aguardar log na fila
                log = log_queue.get(timeout=1)
                
                if log is None:  # Sinal de término
                    break
                
                # Armazenar log
                with execucao_lock:
                    execucao_ativa['logs'].append(log)
                
                # Enviar ao cliente
                yield f"data: {json.dumps(log)}\n\n"
                
            except queue.Empty:
                # Verificar se ainda está rodando
                with execucao_lock:
                    if not execucao_ativa['rodando']:
                        break
                continue
    
    return Response(
        gerar_logs(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )

@bp.route('/limpar', methods=['POST'])
def limpar_pasta():
    """Deleta todos os arquivos da pasta auditoria (limpeza geral)"""
    try:
        # Verificar se há execução em andamento
        with execucao_lock:
            if execucao_ativa['rodando']:
                return jsonify({'erro': 'Não é possível limpar durante execução'}), 409
        
        deletados = []
        for ext in EXTENSOES_PERMITIDAS:
            for arquivo in PASTA_AUDITORIA.glob(f"*{ext}"):
                try:
                    os.remove(arquivo)
                    deletados.append(arquivo.name)
                except Exception as e:
                    print(f"Erro ao deletar {arquivo.name}: {e}")
        
        return jsonify({
            'mensagem': 'Limpeza concluída',
            'arquivos_deletados': deletados,
            'total': len(deletados)
        })
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@bp.route('/reset', methods=['POST'])
def reset_lock():
    """Reset do lock em caso de travamento (usar apenas em desenvolvimento/debug)"""
    with execucao_lock:
        execucao_ativa['rodando'] = False
        execucao_ativa['execucao_id'] = None
        execucao_ativa['projeto_id'] = None
        execucao_ativa['logs'] = []
        execucao_ativa['log_queue'] = None
        execucao_ativa['arquivo_processado'] = None

    return jsonify({'mensagem': 'Lock resetado com sucesso'})

# =============================
# ENDPOINTS DE HISTÓRICO E EXECUÇÕES
# =============================

@bp.route('/execucoes/projeto/<int:projeto_id>', methods=['GET'])
def listar_execucoes_projeto(projeto_id):
    """Lista todas as execuções de um projeto específico"""
    try:
        # Buscar execuções do projeto, ordenadas por data (mais recente primeiro)
        execucoes = ExecucaoRotina.query.filter_by(
            projeto_id=projeto_id
        ).order_by(ExecucaoRotina.inicio.desc()).all()

        return jsonify({
            'projeto_id': projeto_id,
            'total': len(execucoes),
            'execucoes': [exec.to_dict() for exec in execucoes]
        })
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@bp.route('/execucoes/<int:execucao_id>', methods=['GET'])
def detalhes_execucao(execucao_id):
    """Retorna detalhes completos de uma execução, incluindo todos os logs"""
    try:
        execucao = ExecucaoRotina.query.get(execucao_id)
        if not execucao:
            return jsonify({'erro': 'Execução não encontrada'}), 404

        return jsonify(execucao.to_dict_completo())
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@bp.route('/execucoes/<int:execucao_id>/logs', methods=['GET'])
def logs_execucao(execucao_id):
    """Retorna apenas os logs de uma execução"""
    try:
        execucao = ExecucaoRotina.query.get(execucao_id)
        if not execucao:
            return jsonify({'erro': 'Execução não encontrada'}), 404

        return jsonify({
            'execucao_id': execucao_id,
            'total_logs': len(execucao.logs),
            'logs': [log.to_dict() for log in execucao.logs]
        })
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@bp.route('/execucoes/ativa/projeto/<int:projeto_id>', methods=['GET'])
def execucao_ativa_projeto(projeto_id):
    """Verifica se há execução ativa para um projeto e retorna seus dados"""
    try:
        # Verificar se há execução em memória
        with execucao_lock:
            if execucao_ativa['rodando'] and execucao_ativa['projeto_id'] == projeto_id:
                execucao_id = execucao_ativa['execucao_id']
                execucao = ExecucaoRotina.query.get(execucao_id)
                if execucao:
                    return jsonify({
                        'ativa': True,
                        'execucao': execucao.to_dict_completo()
                    })

        # Se não está em memória, buscar no banco por execuções "em_andamento"
        execucao = ExecucaoRotina.query.filter_by(
            projeto_id=projeto_id,
            status='em_andamento'
        ).order_by(ExecucaoRotina.inicio.desc()).first()

        if execucao:
            return jsonify({
                'ativa': True,
                'execucao': execucao.to_dict_completo(),
                'aviso': 'Execução encontrada no banco mas não está na memória. Pode estar travada.'
            })

        return jsonify({'ativa': False})
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@bp.route('/execucoes/ultima/projeto/<int:projeto_id>', methods=['GET'])
def ultima_execucao_projeto(projeto_id):
    """Retorna a última execução de um projeto (concluída ou em andamento)"""
    try:
        execucao = ExecucaoRotina.query.filter_by(
            projeto_id=projeto_id
        ).order_by(ExecucaoRotina.inicio.desc()).first()

        if not execucao:
            return jsonify({'mensagem': 'Nenhuma execução encontrada'}), 404

        return jsonify(execucao.to_dict_completo())
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@bp.route('/historico', methods=['GET'])
def historico_geral():
    """Retorna histórico geral de todas as execuções"""
    try:
        # Parâmetros de filtro opcionais
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        projeto_id = request.args.get('projeto_id', type=int)
        usuario_id = request.args.get('usuario_id', type=int)
        status = request.args.get('status')

        # Construir query
        query = ExecucaoRotina.query

        if projeto_id:
            query = query.filter_by(projeto_id=projeto_id)
        if usuario_id:
            query = query.filter_by(usuario_id=usuario_id)
        if status:
            query = query.filter_by(status=status)

        # Contar total
        total = query.count()

        # Buscar com paginação
        execucoes = query.order_by(
            ExecucaoRotina.inicio.desc()
        ).limit(limit).offset(offset).all()

        return jsonify({
            'total': total,
            'limit': limit,
            'offset': offset,
            'execucoes': [exec.to_dict() for exec in execucoes]
        })
    except Exception as e:
        return jsonify({'erro': str(e)}), 500