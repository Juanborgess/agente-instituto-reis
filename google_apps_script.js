/**
 * ==============================================================================
 * SISTEMA DE SINCRONIZAÇÃO EM TEMPO REAL - INSTITUTO REIS
 * Planilha Google Sheets <---> Supabase & Painel Operacional Web
 * ==============================================================================
 *
 * COMO INSTALAR EM 2 MINUTOS:
 * 1. Abra a sua planilha do Google Sheets: "SISTEMA_COBRANCA_INSTITUTO_REIS".
 * 2. No menu superior, clique em: Extensões > Apps Script.
 * 3. Apague o código que estiver lá (se houver) e COLE TODO ESTE ARQUIVO.
 * 4. Clique no ícone de DISQUETE (Salvar).
 * 
 * COMO ATIVAR A CONEXÃO COM O PAINEL WEB:
 * 1. No canto superior direito do Apps Script, clique no botão azul "Implantar" (Deploy) > "Nova implantação".
 * 2. Clique no ícone de engrenagem ⚙️ ao lado de "Selecione o tipo" e escolha "App da Web" (Web app).
 * 3. Preencha:
 *    - Descrição: "Webhook Instituto Reis"
 *    - Executar como: "Eu (seu e-mail)"
 *    - Quem tem acesso: "Qualquer pessoa" (Anyone)
 * 4. Clique em "Implantar" e autorize as permissões da sua conta Google.
 * 5. Copie o link gerado ("URL do app da Web", termina com /exec).
 * 6. Pronto! As edições feitas na planilha vão para o painel instantaneamente,
 *    e cadastros/edições feitos no painel vão para a linha exata da planilha!
 * ==============================================================================
 */

// --- CONFIGURAÇÕES DO SUPABASE ---
var SUPABASE_URL = "https://szoypbzmqgidzadjxbvs.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b3lwYnptcWdpZHphZGp4YnZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjAwODI0NSwiZXhwIjoyMTA3NTg0MjQ1fQ.ImWBmPW1ASOsq9jc9ruFZZxNfzYHtlBnmAyJA2qQAII";
var ABA_COBRANCA = "Cobranca_Alunos";

/**
 * Menu Superior Automático ao abrir a planilha
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("⚡ Painel Instituto Reis")
    .addItem("🔄 Sincronizar Tudo com Supabase", "sincronizarTudoParaSupabase")
    .addItem("🧪 Testar Conexão com Supabase", "testarConexaoSupabase")
    .addToUi();
}

/**
 * GATILHO EM TEMPO REAL (Planilha -> Painel/Supabase)
 * Executado automaticamente toda vez que alguém digita ou altera uma célula na planilha.
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    if (sheet.getName() !== ABA_COBRANCA) return;

    var linha = e.range.getRow();
    if (linha <= 1) return; // Ignora cabeçalho

    sincronizarLinhaParaSupabase(sheet, linha);
  } catch (err) {
    Logger.log("Erro no onEdit: " + err);
  }
}

/**
 * Lê a linha da planilha e sincroniza no Supabase (Insert ou Update)
 */
function sincronizarLinhaParaSupabase(sheet, linha) {
  var range = sheet.getRange(linha, 1, 1, 7);
  var dados = range.getValues()[0];

  var nome = String(dados[0] || "").trim();
  var telBruto = String(dados[1] || "").trim();
  var curso = String(dados[2] || "Barbeiro").trim();
  var vencBruto = dados[3];
  var status = String(dados[4] || "PENDENTE").trim().toUpperCase();
  var valorBruto = dados[5];
  var parcela = String(dados[6] || "").trim();

  var telLimpo = limparTelefone(telBruto);
  if (!nome && !telLimpo) return; // Linha vazia

  var vencIso = formatarDataISO(vencBruto);
  var valorFloat = parseValorMoeda(valorBruto);

  var payload = {
    nome_aluno: nome,
    telefone_whatsapp: telLimpo,
    curso: curso || "Barbeiro",
    vencimento_atual: vencIso,
    status_pagamento: status || "PENDENTE",
    valor_parcela: valorFloat,
    parcela_atual: parcela,
    updated_at: new Date().toISOString()
  };

  // Busca se já existe no Supabase por (telefone_whatsapp, curso)
  var urlBusca = SUPABASE_URL + "/rest/v1/alunos_cobranca?telefone_whatsapp=eq." + telLimpo + "&curso=eq." + encodeURIComponent(payload.curso) + "&select=id";
  var resBusca = UrlFetchApp.fetch(urlBusca, {
    method: "GET",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY
    },
    muteHttpExceptions: true
  });

  var listaExistentes = JSON.parse(resBusca.getContentText());

  if (listaExistentes && listaExistentes.length > 0) {
    var id = listaExistentes[0].id;
    UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/alunos_cobranca?id=eq." + id, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log("Aluno atualizado no Supabase: " + nome + " (ID: " + id + ")");
  } else {
    payload.created_at = new Date().toISOString();
    UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/alunos_cobranca", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log("Novo aluno inserido no Supabase: " + nome);
  }
}

/**
 * GATILHO EM TEMPO REAL (Painel Web -> Planilha Google Sheets)
 * Recebe chamadas POST do Painel Operacional e grava na linha exata da planilha.
 */
function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "";
    var body = {};
    if (rawData) {
      try {
        body = JSON.parse(rawData);
      } catch (ex) {
        body = {};
      }
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(ABA_COBRANCA);
    if (!sheet) {
      return criarRespostaJSON({ success: false, error: "Aba " + ABA_COBRANCA + " não encontrada" }, 404);
    }

    var acao = body.action || "salvar_aluno";

    // Ação 1: Marcar como Pago (1 clique)
    if (acao === "marcar_pago") {
      var telAlvo = limparTelefone(body.telefone);
      var cursoAlvo = String(body.curso || "").trim().toLowerCase();
      var dadosB = sheet.getRange("B:B").getValues();
      var dadosC = sheet.getRange("C:C").getValues();

      var linhaEncontrada = -1;
      for (var i = 1; i < dadosB.length; i++) {
        var t = limparTelefone(dadosB[i][0]);
        var c = String(dadosC[i][0] || "").trim().toLowerCase();
        if (t === telAlvo && (!cursoAlvo || c.indexOf(cursoAlvo) !== -1 || cursoAlvo.indexOf(c) !== -1)) {
          linhaEncontrada = i + 1;
          break;
        }
      }

      if (linhaEncontrada !== -1) {
        // Coluna E é a 5 (STATUS_PAGAMENTO)
        sheet.getRange(linhaEncontrada, 5).setValue("PAGO");
        return criarRespostaJSON({ success: true, action: "marcar_pago", linha: linhaEncontrada });
      } else {
        return criarRespostaJSON({ success: false, error: "Aluno não localizado na planilha" }, 404);
      }
    }

    // Ação 2: Salvar ou Editar Aluno
    if (acao === "salvar_aluno" || acao === "editar_aluno" || acao === "novo_aluno") {
      var nome = String(body.nome_aluno || body.nome || "").trim();
      var tel = limparTelefone(body.telefone_whatsapp || body.telefone);
      var curso = String(body.curso || "Barbeiro").trim();
      var vencFormatado = formatarDataBR(body.vencimento_atual || body.vencimento);
      var status = String(body.status_pagamento || body.status || "PENDENTE").trim().toUpperCase();
      var valor = body.valor_parcela !== undefined && body.valor_parcela !== null && body.valor_parcela !== "" ? body.valor_parcela : "";
      var parcela = String(body.parcela_atual || body.parcela || "").trim();

      var telBusca = limparTelefone(body.antigo_telefone || tel);
      var cursoBusca = String(body.antigo_curso || curso || "").trim().toLowerCase();

      var dadosB = sheet.getRange("B:B").getValues();
      var dadosC = sheet.getRange("C:C").getValues();
      var linhaEncontrada = -1;

      if (acao !== "novo_aluno") {
        for (var i = 1; i < dadosB.length; i++) {
          var t = limparTelefone(dadosB[i][0]);
          var c = String(dadosC[i][0] || "").trim().toLowerCase();
          if (t === telBusca && (!cursoBusca || c.indexOf(cursoBusca) !== -1 || cursoBusca.indexOf(c) !== -1)) {
            linhaEncontrada = i + 1;
            break;
          }
        }
      }

      var linhaDestino;
      var operacao;

      if (linhaEncontrada !== -1) {
        linhaDestino = linhaEncontrada;
        operacao = "atualizado";
      } else {
        // Encontra a linha exata que está vazia
        linhaDestino = obterPrimeiraLinhaVazia(sheet);
        operacao = "inserido";
      }

      // Grava exatamente os 7 campos com formatação correta
      var valoresLinha = [[nome, tel, curso, vencFormatado, status, valor, parcela]];
      sheet.getRange(linhaDestino, 1, 1, 7).setValues(valoresLinha);

      return criarRespostaJSON({
        success: true,
        operacao: operacao,
        linha: linhaDestino,
        dados: {
          nome: nome,
          telefone: tel,
          curso: curso,
          vencimento: vencFormatado,
          status: status
        }
      });
    }

    return criarRespostaJSON({ success: false, error: "Ação não reconhecida" }, 400);
  } catch (err) {
    return criarRespostaJSON({ success: false, error: err.toString() }, 500);
  }
}

/**
 * Health-check via GET
 */
function doGet(e) {
  return criarRespostaJSON({
    status: "online",
    sistema: "Instituto Reis - Webhook de Sincronizacao Google Sheets",
    timestamp: new Date().toISOString()
  });
}

/**
 * Encontra a primeira linha exata vazia na Coluna A
 */
function obterPrimeiraLinhaVazia(sheet) {
  var valoresColA = sheet.getRange("A:A").getValues();
  for (var i = 1; i < valoresColA.length; i++) {
    var val = valoresColA[i][0];
    if (val === null || val === undefined || String(val).trim() === "") {
      return i + 1; // 1-indexado
    }
  }
  return valoresColA.length + 1;
}

/**
 * Normaliza número de telefone (remove símbolos e garante DDI 55)
 */
function limparTelefone(tel) {
  if (!tel) return "";
  var apenasNum = String(tel).replace(/\D/g, "");
  if (!apenasNum) return "";
  if ((apenasNum.length === 10 || apenasNum.length === 11) && apenasNum.indexOf("55") !== 0) {
    apenasNum = "55" + apenasNum;
  }
  return apenasNum;
}

/**
 * Converte data para DD/MM/AAAA para a planilha
 */
function formatarDataBR(dataVal) {
  if (!dataVal) return "";
  if (dataVal instanceof Date) {
    return Utilities.formatDate(dataVal, "America/Sao_Paulo", "dd/MM/yyyy");
  }
  var texto = String(dataVal).trim();
  if (texto.indexOf("-") !== -1) {
    var partes = texto.split("T")[0].split("-");
    if (partes.length === 3) {
      return partes[2] + "/" + partes[1] + "/" + partes[0];
    }
  }
  return texto;
}

/**
 * Converte data para YYYY-MM-DD para o Supabase
 */
function formatarDataISO(dataVal) {
  if (!dataVal) return null;
  if (dataVal instanceof Date) {
    return Utilities.formatDate(dataVal, "America/Sao_Paulo", "yyyy-MM-dd");
  }
  var texto = String(dataVal).trim();
  if (!texto) return null;

  if (texto.indexOf("/") !== -1) {
    var partes = texto.split("/");
    if (partes.length === 3) {
      var dia = partes[0].length === 1 ? "0" + partes[0] : partes[0];
      var mes = partes[1].length === 1 ? "0" + partes[1] : partes[1];
      var ano = partes[2].length === 2 ? "20" + partes[2] : partes[2];
      return ano + "-" + mes + "-" + dia;
    }
  }

  if (texto.indexOf("-") !== -1) {
    return texto.split("T")[0];
  }
  return null;
}

/**
 * Converte valores em formato float
 */
function parseValorMoeda(val) {
  if (val === null || val === undefined) return 0.0;
  if (typeof val === "number") return val;
  var texto = String(val).trim();
  if (!texto || texto === ".") return 0.0;
  var limpo = texto.replace(/[^\d,\.]/g, "");
  if (limpo.indexOf(",") !== -1 && limpo.indexOf(".") !== -1) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (limpo.indexOf(",") !== -1) {
    limpo = limpo.replace(",", ".");
  }
  var n = parseFloat(limpo);
  return isNaN(n) ? 0.0 : n;
}

/**
 * Helper de resposta JSON com suporte a CORS
 */
function criarRespostaJSON(dados, codigoStatus) {
  return ContentService.createTextOutput(JSON.stringify(dados))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Testa a conexão com o Supabase
 */
function testarConexaoSupabase() {
  try {
    var res = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/alunos_cobranca?select=count", {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      }
    });
    SpreadsheetApp.getUi().alert("✅ Conexão bem-sucedida! Supabase respondeu com código: " + res.getResponseCode());
  } catch (err) {
    SpreadsheetApp.getUi().alert("❌ Erro ao conectar ao Supabase: " + err.toString());
  }
}

/**
 * Força a sincronização de todas as linhas da planilha para o Supabase
 */
function sincronizarTudoParaSupabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ABA_COBRANCA);
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Aba " + ABA_COBRANCA + " não encontrada!");
    return;
  }

  var ultimaLinha = sheet.getLastRow();
  var totalSincronizados = 0;

  for (var r = 2; r <= ultimaLinha; r++) {
    var nome = sheet.getRange(r, 1).getValue();
    var tel = sheet.getRange(r, 2).getValue();
    if (nome || tel) {
      sincronizarLinhaParaSupabase(sheet, r);
      totalSincronizados++;
    }
  }

  SpreadsheetApp.getUi().alert("✅ Sincronização concluída! Total de linhas verificadas: " + totalSincronizados);
}
