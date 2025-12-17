------------------------------------------------------------
-- SCRIPT: [BUSCA QT PACOTE PREVISTO X QT PACOTE SIA]
------------------------------------------------------------
-- AUTOR: JHONATAN OLIVEIRA
-- DATA: 10/11/2025
-- DESCRIÇÃO: REALIZA COMPARAÇÃO DOS PACOTES BP X SIA
------------------------------------------------------------

USE DB_MONITORAMENTO_OP;
GO

/* =============================
   PACOTES PLANEJADOS
   ============================= */

DECLARE @CD_PROJETO VARCHAR(255) = '2070';
DECLARE @BD_NAME VARCHAR(255);
DECLARE @SQL NVARCHAR(MAX);

-- Busca o nome do banco de dados associado ao projeto
SELECT @BD_NAME = BD_NAME
FROM SDV..TB_PROJETO
WHERE CD_PROJETO = @CD_PROJETO;

-- Remove tabela temporária se já existir
IF OBJECT_ID('tempdb..##TMP_PACOTE_PLANEJADO') IS NOT NULL
    DROP TABLE ##TMP_PACOTE_PLANEJADO;

-- Monta e executa SQL dinâmico (usa tabela global)
SET @SQL = N'
SELECT DISTINCT NU_PACOTE, NM_TABELA_PLANEJADA, CD_PROJETO
INTO ##TMP_PACOTE_PLANEJADO
FROM [' + @BD_NAME + '].dbo.[SDV_BASE_DIVULGACAO]
WHERE ISNULL(NU_PACOTE, '''') <> ''''
AND NM_DISCIPLINA != ''QUESTIONÁRIO'';
';
EXEC sp_executesql @SQL;

-- Contagem de pacotes planejados
DECLARE @QT_PACOTE_PLANEJADO INT;
SELECT @QT_PACOTE_PLANEJADO = COUNT(DISTINCT NU_PACOTE)
FROM ##TMP_PACOTE_PLANEJADO;


/* =============================
   PACOTES SIA
   ============================= */

DECLARE @TB_RELATORIO VARCHAR(255) = CONCAT('relatorioHistoricoUnidades', @CD_PROJETO);

IF OBJECT_ID('tempdb..##TMP_PACOTE_SIA') IS NOT NULL
    DROP TABLE ##TMP_PACOTE_SIA;

SET @SQL = N'
SELECT DISTINCT codigo_da_unidade, [data], [data_1]
INTO ##TMP_PACOTE_SIA
FROM [DB_MONITORAMENTO_OP].dbo.[' + @TB_RELATORIO + '] A
INNER JOIN ##TMP_PACOTE_PLANEJADO B
    ON A.codigo_da_unidade = B.NU_PACOTE
WHERE ISNULL(codigo_da_unidade, '''') <> '''';
';
EXEC sp_executesql @SQL;

-- Contagem de pacotes SIA
DECLARE @QT_PACOTE_SIA INT;
SELECT @QT_PACOTE_SIA = COUNT(DISTINCT codigo_da_unidade)
FROM ##TMP_PACOTE_SIA;


/* =============================
   PACOTES AUSENTES
   ============================= */

DECLARE @QT_PACOTE_AUSENTE INT;

SELECT @QT_PACOTE_AUSENTE = COUNT(DISTINCT A.NU_PACOTE)
FROM ##TMP_PACOTE_PLANEJADO A
LEFT JOIN ##TMP_PACOTE_SIA B
    ON A.NU_PACOTE = B.codigo_da_unidade
WHERE B.[data] IS NULL
  AND B.[data_1] IS NULL;


/* =============================
   PERCENTUAL DE PACOTES AUSENTES
   ============================= */

DECLARE @PCT_AUSENTE DECIMAL(10,2);
SET @PCT_AUSENTE =
    CASE
        WHEN @QT_PACOTE_PLANEJADO = 0 THEN 0
        ELSE (CAST(@QT_PACOTE_AUSENTE AS DECIMAL(10,2)) / @QT_PACOTE_PLANEJADO) * 100
    END;

DECLARE @PCT_AUSENTE_TXT VARCHAR(10);
SET @PCT_AUSENTE_TXT = CONCAT(FORMAT(@PCT_AUSENTE, 'N2'), '%');


/* =============================
   GRAVA RESULTADO EM TABELA FÍSICA DE CONTROLE
   ============================= */

IF OBJECT_ID('DB_MONITORAMENTO_OP.DBO.TMP_FROP_PACOTE') IS NULL
BEGIN
    CREATE TABLE DB_MONITORAMENTO_OP.DBO.TMP_FROP_PACOTE (
        CD_PROJETO VARCHAR(255),
        DT_EXPORTACAO VARCHAR(255),
        QT_PACOTE_PLANEJADO INT,
        QT_PACOTE_SIA INT,
        QT_PACOTE_AUSENTE INT,
        PCT_PACOTE_AUSENTE VARCHAR(10)
    );
END;

-- Remove registro anterior do mesmo projeto
DELETE FROM DB_MONITORAMENTO_OP.DBO.TMP_FROP_PACOTE
WHERE CD_PROJETO = @CD_PROJETO;

-- Insere o novo resultado
INSERT INTO DB_MONITORAMENTO_OP.DBO.TMP_FROP_PACOTE
(
    CD_PROJETO,
    DT_EXPORTACAO,
    QT_PACOTE_PLANEJADO,
    QT_PACOTE_SIA,
    QT_PACOTE_AUSENTE,
    PCT_PACOTE_AUSENTE
)
VALUES
(
    @CD_PROJETO,
    CONVERT(VARCHAR(10), GETDATE(), 103) + ' às ' + CONVERT(VARCHAR(5), GETDATE(), 108),
    @QT_PACOTE_PLANEJADO,
    @QT_PACOTE_SIA,
    @QT_PACOTE_AUSENTE,
    @PCT_AUSENTE_TXT
);


/* =============================
   RESULTADO FINAL
   ============================= */
SELECT
    @CD_PROJETO AS CD_PROJETO,
    CONVERT(VARCHAR(10), GETDATE(), 103) + ' às ' + CONVERT(VARCHAR(5), GETDATE(), 108) AS DT_EXPORTACAO,
    @QT_PACOTE_PLANEJADO AS QT_PACOTE_PLANEJADO,
    @QT_PACOTE_SIA AS QT_PACOTE_SIA,
    @QT_PACOTE_AUSENTE AS QT_PACOTE_AUSENTE,
    @PCT_AUSENTE_TXT AS PCT_PACOTE_AUSENTE;


/* =============================
   LIMPEZA DAS TABELAS TEMPORÁRIAS GLOBAIS
   ============================= */
IF OBJECT_ID('tempdb..##TMP_PACOTE_PLANEJADO') IS NOT NULL
    DROP TABLE ##TMP_PACOTE_PLANEJADO;

IF OBJECT_ID('tempdb..##TMP_PACOTE_SIA') IS NOT NULL
    DROP TABLE ##TMP_PACOTE_SIA;


------------------------------------------------------------
-- FIM DO SCRIPT
------------------------------------------------------------
