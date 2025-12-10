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

# Criar Blueprint (seguir padrão do projeto: usar 'bp')
bp = Blueprint('rotinas', __name__, url_prefix='/api/auditoria')

# =============================
# CONTROLE DE LOCK E ESTADO
# =============================
execucao_lock = threading.Lock()
execucao_ativa = {
    'rodando': False,
    'usuario': None,
    'inicio': None,
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
        'timestamp': datetime.now().strftime('%H:%M:%S'),
        'tipo': tipo,
        'mensagem': mensagem
    }

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

def executar_script_auditoria(log_queue, arquivo_nome, projeto_id=None):
    """Executa o script Python e captura logs linha por linha"""
    arquivo_path = PASTA_AUDITORIA / arquivo_nome
    
    try:
        log_queue.put(formatar_log('info', f'🚀 Iniciando processamento de: {arquivo_nome}'))
        if projeto_id:
            log_queue.put(formatar_log('info', f'🏷️  Projeto: {projeto_id}'))
        
        # Comando que será executado (com projeto_id se fornecido)
        comando = ['python', str(SCRIPT_PATH), str(arquivo_path)]
        if projeto_id:
            comando.append(str(projeto_id))
        
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
                
                log_queue.put(formatar_log(tipo, linha))
        
        # Aguardar conclusão
        processo.wait()
        
        # Verificar se houve erro
        if processo.returncode != 0:
            stderr = processo.stderr.read()
            if stderr:
                log_queue.put(formatar_log('error', f'❌ Erro na execução: {stderr}'))
            log_queue.put(formatar_log('error', '❌ Rotina finalizada com erros'))
        else:
            # Mesmo com sucesso, ler stderr por segurança
            stderr = processo.stderr.read()
            if stderr:
                log_queue.put(formatar_log('warning', f'⚠️ Avisos: {stderr}'))
            
            log_queue.put(formatar_log('success', '🎉 Rotina finalizada com sucesso!'))
            
            # Deletar arquivo após sucesso
            log_queue.put(formatar_log('info', f'🗑️ Deletando arquivo: {arquivo_nome}'))
            if deletar_arquivo_processado(arquivo_path):
                log_queue.put(formatar_log('success', f'✅ Arquivo deletado: {arquivo_nome}'))
            else:
                log_queue.put(formatar_log('warning', f'⚠️ Não foi possível deletar: {arquivo_nome}'))
        
        # Sinal de término
        log_queue.put(None)
        
    except Exception as e:
        log_queue.put(formatar_log('error', f'❌ Erro crítico: {str(e)}'))
        log_queue.put(None)
        
        # Tentar deletar arquivo mesmo em caso de erro
        deletar_arquivo_processado(arquivo_path)

def finalizar_execucao():
    """Aguarda término e libera lock"""
    with execucao_lock:
        execucao_ativa['rodando'] = False
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
        return jsonify({
            'rodando': execucao_ativa['rodando'],
            'usuario': execucao_ativa['usuario'],
            'inicio': execucao_ativa['inicio'],
            'logs_count': len(execucao_ativa['logs']),
            'arquivo_processado': execucao_ativa['arquivo_processado']
        })

@bp.route('/executar', methods=['POST'])
def executar_auditoria():
    """Inicia execução da rotina de auditoria"""
    
    # Obter parâmetros
    arquivo_nome = request.json.get('arquivo')
    projeto_id = request.json.get('projeto_id')  # ID do banco (pode não ser o código)
    
    if not arquivo_nome:
        return jsonify({'erro': 'Nome do arquivo não fornecido'}), 400
    
    # Extrair código do subprograma do nome do arquivo
    # Formato esperado: Relatorio_de_Qualidade_-2085_-_AVALIAMT_...
    import re
    match = re.search(r'-(\d+)_', arquivo_nome)
    codigo_subprograma = match.group(1) if match else None
    
    # Verificar se arquivo existe
    arquivo_path = PASTA_AUDITORIA / secure_filename(arquivo_nome)
    if not arquivo_path.exists():
        return jsonify({'erro': 'Arquivo não encontrado'}), 404
    
    # Verificar se já está rodando
    with execucao_lock:
        if execucao_ativa['rodando']:
            return jsonify({
                'erro': 'Rotina já está em execução',
                'usuario': execucao_ativa['usuario'],
                'inicio': execucao_ativa['inicio'],
                'arquivo': execucao_ativa['arquivo_processado']
            }), 409
        
        # Marcar como em execução
        execucao_ativa['rodando'] = True
        execucao_ativa['usuario'] = request.json.get('usuario', 'Desconhecido')
        execucao_ativa['inicio'] = datetime.now().isoformat()
        execucao_ativa['logs'] = []
        execucao_ativa['arquivo_processado'] = arquivo_nome
        
        # Criar fila de logs
        log_queue = queue.Queue()
        execucao_ativa['log_queue'] = log_queue
    
    # Iniciar thread para executar script (passar código extraído do arquivo)
    thread = threading.Thread(
        target=executar_script_auditoria,
        args=(log_queue, arquivo_nome, codigo_subprograma),  # Usar código extraído
        daemon=True
    )
    thread.start()
    
    # Thread para liberar lock ao final
    threading.Thread(target=lambda: (thread.join(), finalizar_execucao()), daemon=True).start()
    
    return jsonify({
        'mensagem': 'Rotina iniciada com sucesso',
        'inicio': execucao_ativa['inicio'],
        'arquivo': arquivo_nome,
        'projeto': codigo_subprograma  # Retornar código extraído
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
        execucao_ativa['usuario'] = None
        execucao_ativa['inicio'] = None
        execucao_ativa['logs'] = []
        execucao_ativa['log_queue'] = None
        execucao_ativa['arquivo_processado'] = None
    
    return jsonify({'mensagem': 'Lock resetado com sucesso'})