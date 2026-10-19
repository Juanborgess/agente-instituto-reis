/**
 * ==============================================================================
 * SISTEMA UNIFICADO - INSTITUTO REIS
 * 1. Sorteio QR Code (Aba: Sorteio_QR_Code)
 * 2. Cobrança Preventiva (Aba: Cobranca_Alunos <-> Supabase & Painel)
 * 3. CRM & Funil de Vendas (Aba: CRM_Vendas <-> Supabase & Painel)
 * ==============================================================================
 */

// --- CONFIGURAÇÕES DAS ABAS E SUPABASE ---
const SHEET_NAME_SORTEIO = "Sorteio_QR_Code";
const ABA_COBRANCA = "Cobranca_Alunos";
const ABA_CRM = "CRM_Vendas";

const SUPABASE_URL = "https://szoypbzmqgidzadjxbvs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b3lwYnptcWdpZHphZGp4YnZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjAwODI0NSwiZXhwIjoyMTA3NTg0MjQ1fQ.ImWBmPW1ASOsq9jc9ruFZZxNfzYHtlBnmAyJA2qQAII";

/**
 * Menu Superior Automático ao abrir a planilha
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⚡ Painel Instituto Reis")
    .addItem("🔄 Sincronizar Tudo (Cobrança & CRM)", "sincronizarTudoParaSupabase")
    .addItem("🧪 Testar Conexão com Supabase", "testarConexaoSupabase")
    .addToUi();
}

/**
 * ROTEADOR POST PRINCIPAL
 * Direciona requisições vindas do Painel Web (Cobrança e CRM) e do Sorteio QR Code
 */
function doPost(e) {
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const body = e.postData ? e.postData.contents : "";
    const data = body ? JSON.parse(body) : {};

    // 1. REQUISIÇÕES DE COBRANÇA
    if (data.action === "salvar_aluno" || data.action === "editar_aluno" || data.action === "novo_aluno" || data.action === "marcar_pago" || data.action === "excluir_aluno") {
      return processarCobranca(doc, data);
    }

    // 2. REQUISIÇÕES DE CRM & FUNIL DE VENDAS
    if (data.action === "salvar_lead" || data.action === "novo_lead" || data.action === "editar_lead" || data.action === "alterar_status_lead" || data.action === "excluir_lead") {
      return processarCrm(doc, data);
    }

    // 3. REQUISIÇÕES DO SORTEIO QR CODE (100% preservado)
    return processarSorteioQRCode(doc, data);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Health check GET
 */
function doGet() {
  return ContentService.createTextOutput("A API do Instituto Reis está ativa! (Sorteio QR Code, Cobrança & CRM)");
}

// ==============================================================================
// 1. MÓDULO SORTEIO QR CODE (ORIGINAL PRESERVADO)
// ==============================================================================
function processarSorteioQRCode(doc, data) {
  let sheet = doc.getSheetByName(SHEET_NAME_SORTEIO);
  if (!sheet) { sheet = doc.getSheets()[0]; }

  const numeroParticipante = sheet.getLastRow();

  const timestamp = Utilities.formatDate(
    new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss"
  );

  const rowData = [
    numeroParticipante,               // A - Nº Participante
    data.curso_interesse || "",       // B
    data.contato_anterior || "",      // C
    data.conhecimento || "",          // D
    data.trabalha || "",              // E
    data.area_atual || "",            // F
    data.objetivo_meses || "",        // G
    data.objetivo_profissional || "", // H
    data.o_que_mudaria || "",         // I
    data.impedimento || "",           // J
    data.nome_completo || "",         // K
    data.idade || "",                 // L
    data.whatsapp || "",              // M
    data.bairro || "",                // N
    data.email || "",                 // O
    timestamp                         // P - Data/Hora
  ];

  sheet.appendRow(rowData);

  return ContentService
    .createTextOutput(JSON.stringify({
      status: "success",
      participante: numeroParticipante
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 2. MÓDULO COBRANÇA: PAINEL WEB -> PLANILHA
// ==============================================================================
function processarCobranca(doc, body) {
  const sheet = doc.getSheetByName(ABA_COBRANCA);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Aba " + ABA_COBRANCA + " não encontrada" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const acao = body.action || "salvar_aluno";

  // Ação: Marcar como Pago (1 clique no painel)
  if (acao === "marcar_pago") {
    const telAlvo = limparTelefone(body.telefone);
    const cursoAlvo = String(body.curso || "").trim().toLowerCase();
    const dadosB = sheet.getRange("B:B").getValues();
    const dadosC = sheet.getRange("C:C").getValues();

    let linhaEncontrada = -1;
    for (let i = 1; i < dadosB.length; i++) {
      const t = limparTelefone(dadosB[i][0]);
      const c = String(dadosC[i][0] || "").trim().toLowerCase();
      if (t === telAlvo && (!cursoAlvo || c.indexOf(cursoAlvo) !== -1 || cursoAlvo.indexOf(c) !== -1)) {
        linhaEncontrada = i + 1;
        break;
      }
    }

    if (linhaEncontrada !== -1) {
      sheet.getRange(linhaEncontrada, 5).setValue("PAGO");
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: "marcar_pago", linha: linhaEncontrada }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Aluno não localizado na planilha" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Ação: Excluir Aluno (Remove a linha exata da planilha)
  if (acao === "excluir_aluno") {
    const telAlvo = limparTelefone(body.telefone_whatsapp || body.telefone);
    const cursoAlvo = String(body.curso || "").trim().toLowerCase();
    const nomeAlvo = String(body.nome_aluno || body.nome || "").trim().toLowerCase();

    const dadosA = sheet.getRange("A:A").getValues();
    const dadosB = sheet.getRange("B:B").getValues();
    const dadosC = sheet.getRange("C:C").getValues();

    let linhaEncontrada = -1;
    for (let i = 1; i < dadosB.length; i++) {
      const n = String(dadosA[i][0] || "").trim().toLowerCase();
      const t = limparTelefone(dadosB[i][0]);
      const c = String(dadosC[i][0] || "").trim().toLowerCase();

      if (telAlvo && t === telAlvo) {
        if (!cursoAlvo || c.indexOf(cursoAlvo) !== -1 || cursoAlvo.indexOf(c) !== -1) {
          linhaEncontrada = i + 1;
          break;
        }
      } else if (!telAlvo && nomeAlvo && n === nomeAlvo) {
        linhaEncontrada = i + 1;
        break;
      }
    }

    if (linhaEncontrada !== -1) {
      sheet.deleteRow(linhaEncontrada);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: "excluir_aluno",
        linha: linhaEncontrada,
        message: "Aluno excluído com sucesso da planilha"
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Aluno não localizado na planilha para exclusão"
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Ação: Cadastrar Novo Aluno ou Editar Existente
  const nome = String(body.nome_aluno || body.nome || "").trim();
  const tel = limparTelefone(body.telefone_whatsapp || body.telefone);
  const curso = String(body.curso || "Barbeiro").trim();
  const vencFormatado = formatarDataBR(body.vencimento_atual || body.vencimento);
  const status = String(body.status_pagamento || body.status || "PENDENTE").trim().toUpperCase();
  const valor = body.valor_parcela !== undefined && body.valor_parcela !== null && body.valor_parcela !== "" ? body.valor_parcela : "";
  const parcela = String(body.parcela_atual || body.parcela || "").trim();

  const telBusca = limparTelefone(body.antigo_telefone || tel);
  const cursoBusca = String(body.antigo_curso || curso || "").trim().toLowerCase();

  const dadosB = sheet.getRange("B:B").getValues();
  const dadosC = sheet.getRange("C:C").getValues();
  let linhaEncontrada = -1;

  if (acao !== "novo_aluno") {
    for (let i = 1; i < dadosB.length; i++) {
      const t = limparTelefone(dadosB[i][0]);
      const c = String(dadosC[i][0] || "").trim().toLowerCase();
      if (t === telBusca && (!cursoBusca || c.indexOf(cursoBusca) !== -1 || cursoBusca.indexOf(c) !== -1)) {
        linhaEncontrada = i + 1;
        break;
      }
    }
  }

  let linhaDestino;
  let operacao;

  if (linhaEncontrada !== -1) {
    linhaDestino = linhaEncontrada;
    operacao = "atualizado";
  } else {
    linhaDestino = obterPrimeiraLinhaVazia(sheet);
    operacao = "inserido";
  }

  const valoresLinha = [[nome, tel, curso, vencFormatado, status, valor, parcela]];
  sheet.getRange(linhaDestino, 1, 1, 7).setValues(valoresLinha);

  return ContentService.createTextOutput(JSON.stringify({
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
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 3. MÓDULO CRM: PAINEL WEB -> PLANILHA (Status Funil, Novo Lead, Exclusão)
// ==============================================================================
function processarCrm(doc, body) {
  const sheet = doc.getSheetByName(ABA_CRM);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Aba " + ABA_CRM + " não encontrada" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const acao = body.action;

  // Ação 1: Alterar Status do Funil (Novo, Em Cadência, Atendimento Humano, Ganhou, Perdeu)
  if (acao === "alterar_status_lead") {
    const telAlvo = limparTelefone(body.telefone);
    const cursoAlvo = String(body.curso || "").trim().toLowerCase();
    const novoStatus = String(body.novo_status || "Novo").trim();

    const dadosC = sheet.getRange("C:C").getValues(); // Telefone
    const dadosD = sheet.getRange("D:D").getValues(); // Curso

    let linhaEncontrada = -1;
    for (let i = 1; i < dadosC.length; i++) {
      const t = limparTelefone(dadosC[i][0]);
      const c = String(dadosD[i][0] || "").trim().toLowerCase();
      if (t === telAlvo && (!cursoAlvo || c.indexOf(cursoAlvo) !== -1 || cursoAlvo.indexOf(c) !== -1)) {
        linhaEncontrada = i + 1;
        break;
      }
    }

    if (linhaEncontrada !== -1) {
      // Coluna E é a 5 (Status_Funil)
      sheet.getRange(linhaEncontrada, 5).setValue(novoStatus);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: "alterar_status_lead",
        linha: linhaEncontrada,
        status: novoStatus
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Lead não localizado na aba CRM_Vendas"
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Ação 2: Cadastrar Novo Lead pelo Painel
  if (acao === "salvar_lead" || acao === "novo_lead") {
    const nome = String(body.nome_lead || body.nome || "").trim();
    const tel = limparTelefone(body.telefone);
    const curso = String(body.curso_interesse || body.curso || "Barbeiro").trim();
    const status = String(body.status_funil || "Novo").trim();
    const dataEntradaBR = formatarDataBR(body.data_entrada) || Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy");

    const linhaDestino = obterPrimeiraLinhaVazia(sheet);
    const valoresLinha = [[dataEntradaBR, nome, tel, curso, status, "", "", ""]];
    sheet.getRange(linhaDestino, 1, 1, 8).setValues(valoresLinha);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      action: "salvar_lead",
      linha: linhaDestino
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Ação 3: Editar Lead Existente na Planilha
  if (acao === "editar_lead") {
    const telBusca = limparTelefone(body.antigo_telefone || body.telefone);
    const cursoBusca = String(body.antigo_curso || body.curso_interesse || body.curso || "").trim().toLowerCase();
    const nomeBusca = String(body.nome_lead || body.nome || "").trim().toLowerCase();

    const dadosB = sheet.getRange("B:B").getValues(); // Nome
    const dadosC = sheet.getRange("C:C").getValues(); // Telefone
    const dadosD = sheet.getRange("D:D").getValues(); // Curso

    let linhaEncontrada = -1;
    for (let i = 1; i < dadosC.length; i++) {
      const t = limparTelefone(dadosC[i][0]);
      const c = String(dadosD[i][0] || "").trim().toLowerCase();
      const n = String(dadosB[i][0] || "").trim().toLowerCase();

      if (telBusca && t === telBusca) {
        if (!cursoBusca || c.indexOf(cursoBusca) !== -1 || cursoBusca.indexOf(c) !== -1) {
          linhaEncontrada = i + 1;
          break;
        }
      } else if (!telBusca && nomeBusca && n === nomeBusca) {
        linhaEncontrada = i + 1;
        break;
      }
    }

    const novoNome = String(body.nome_lead || body.nome || "").trim();
    const novoTel = limparTelefone(body.telefone);
    const novoCurso = String(body.curso_interesse || body.curso || "Barbeiro").trim();
    const novoStatus = String(body.status_funil || "Novo").trim();
    const novaDataBR = formatarDataBR(body.data_entrada) || Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy");

    if (linhaEncontrada !== -1) {
      if (novaDataBR) sheet.getRange(linhaEncontrada, 1).setValue(novaDataBR);
      if (novoNome) sheet.getRange(linhaEncontrada, 2).setValue(novoNome);
      if (novoTel) sheet.getRange(linhaEncontrada, 3).setValue(novoTel);
      if (novoCurso) sheet.getRange(linhaEncontrada, 4).setValue(novoCurso);
      if (novoStatus) sheet.getRange(linhaEncontrada, 5).setValue(novoStatus);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: "editar_lead",
        linha: linhaEncontrada
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Se não encontrou linha existente, cria como nova linha
      const linhaDestino = obterPrimeiraLinhaVazia(sheet);
      const valoresLinha = [[novaDataBR, novoNome, novoTel, novoCurso, novoStatus, "", "", ""]];
      sheet.getRange(linhaDestino, 1, 1, 8).setValues(valoresLinha);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: "editar_lead_novo",
        linha: linhaDestino
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Ação 4: Excluir Lead (Remove a linha exata da planilha)
  if (acao === "excluir_lead") {
    const telAlvo = limparTelefone(body.telefone);
    const cursoAlvo = String(body.curso || body.curso_interesse || "").trim().toLowerCase();
    const nomeAlvo = String(body.nome_lead || body.nome || "").trim().toLowerCase();

    const dadosB = sheet.getRange("B:B").getValues(); // Nome
    const dadosC = sheet.getRange("C:C").getValues(); // Telefone
    const dadosD = sheet.getRange("D:D").getValues(); // Curso

    let linhaEncontrada = -1;
    for (let i = 1; i < dadosC.length; i++) {
      const t = limparTelefone(dadosC[i][0]);
      const c = String(dadosD[i][0] || "").trim().toLowerCase();
      const n = String(dadosB[i][0] || "").trim().toLowerCase();

      if (telAlvo && t === telAlvo) {
        if (!cursoAlvo || c.indexOf(cursoAlvo) !== -1 || cursoAlvo.indexOf(c) !== -1) {
          linhaEncontrada = i + 1;
          break;
        }
      } else if (!telAlvo && nomeAlvo && n === nomeAlvo) {
        linhaEncontrada = i + 1;
        break;
      }
    }

    if (linhaEncontrada !== -1) {
      sheet.deleteRow(linhaEncontrada);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: "excluir_lead",
        linha: linhaEncontrada
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Lead não localizado para exclusão"
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Ação de CRM não reconhecida" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================
// 4. GATILHO ONEDIT EM TEMPO REAL: PLANILHA -> SUPABASE & PAINEL WEB
// ==============================================================================
function onEdit(e) {
  aoEditarPlanilha(e);
}

function aoEditarPlanilha(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    const nomeAba = sheet.getName();
    const linha = e.range.getRow();
    if (linha <= 1) return; // Ignora cabeçalho

    if (nomeAba === ABA_COBRANCA) {
      sincronizarLinhaCobrancaParaSupabase(sheet, linha);
    } else if (nomeAba === ABA_CRM) {
      sincronizarLinhaCrmParaSupabase(sheet, linha);
    }
  } catch (err) {
    Logger.log("Erro no aoEditarPlanilha: " + err);
  }
}

/**
 * Sincroniza linha editada da aba Cobranca_Alunos para a tabela alunos_cobranca
 */
function sincronizarLinhaCobrancaParaSupabase(sheet, linha) {
  const range = sheet.getRange(linha, 1, 1, 7);
  const dados = range.getValues()[0];

  const nome = String(dados[0] || "").trim();
  const telBruto = String(dados[1] || "").trim();
  const curso = String(dados[2] || "Barbeiro").trim();
  const vencBruto = dados[3];
  const status = String(dados[4] || "PENDENTE").trim().toUpperCase();
  const valorBruto = dados[5];
  const parcela = String(dados[6] || "").trim();

  const telLimpo = limparTelefone(telBruto);
  if (!nome && !telLimpo) return;

  const vencIso = formatarDataISO(vencBruto);
  const valorFloat = parseValorMoeda(valorBruto);

  const payload = {
    nome_aluno: nome,
    telefone_whatsapp: telLimpo,
    curso: curso || "Barbeiro",
    vencimento_atual: vencIso,
    status_pagamento: status || "PENDENTE",
    valor_parcela: valorFloat,
    parcela_atual: parcela,
    updated_at: new Date().toISOString()
  };

  const urlBusca = SUPABASE_URL + "/rest/v1/alunos_cobranca?telefone_whatsapp=eq." + telLimpo + "&curso=eq." + encodeURIComponent(payload.curso) + "&select=id";
  const resBusca = UrlFetchApp.fetch(urlBusca, {
    method: "GET",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY
    },
    muteHttpExceptions: true
  });

  const listaExistentes = JSON.parse(resBusca.getContentText());

  if (listaExistentes && listaExistentes.length > 0) {
    const id = listaExistentes[0].id;
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
  }
}

/**
 * Sincroniza linha editada da aba CRM_Vendas para a tabela leads_crm
 */
function sincronizarLinhaCrmParaSupabase(sheet, linha) {
  const range = sheet.getRange(linha, 1, 1, 8);
  const dados = range.getValues()[0];

  const dataEntrada = dados[0];
  const nome = String(dados[1] || "").trim();
  const telBruto = String(dados[2] || "").trim();
  const curso = String(dados[3] || "Barbeiro").trim();
  const statusFunil = String(dados[4] || "Novo").trim();
  const faseCadencia = String(dados[5] || "").trim();
  const dataUltimoEnvio = dados[6];
  const idMsgMeta = String(dados[7] || "").trim();

  const telLimpo = limparTelefone(telBruto);
  if (!telLimpo && !nome) return;

  const dataEntradaIso = formatarDataISO(dataEntrada) || Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd");
  const dataUltimoEnvioIso = formatarDataISO(dataUltimoEnvio);

  const payload = {
    data_entrada: dataEntradaIso,
    nome_lead: nome || "Lead Sem Nome",
    telefone: telLimpo,
    curso_interesse: curso || "Barbeiro",
    status_funil: statusFunil,
    fase_cadencia: faseCadencia,
    data_ultimo_envio: dataUltimoEnvioIso,
    id_mensagem_meta: idMsgMeta,
    updated_at: new Date().toISOString()
  };

  const urlBusca = SUPABASE_URL + "/rest/v1/leads_crm?telefone=eq." + telLimpo + "&curso_interesse=eq." + encodeURIComponent(payload.curso_interesse) + "&select=id";
  const resBusca = UrlFetchApp.fetch(urlBusca, {
    method: "GET",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY
    },
    muteHttpExceptions: true
  });

  const listaExistentes = JSON.parse(resBusca.getContentText());

  if (listaExistentes && listaExistentes.length > 0) {
    const id = listaExistentes[0].id;
    UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/leads_crm?id=eq." + id, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log("Lead atualizado no Supabase: " + nome + " -> " + statusFunil);
  } else {
    payload.created_at = new Date().toISOString();
    UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/leads_crm", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log("Novo lead inserido no Supabase: " + nome);
  }
}

// ==============================================================================
// 5. FUNÇÕES UTILITÁRIAS
// ==============================================================================
function obterPrimeiraLinhaVazia(sheet) {
  const valoresColA = sheet.getRange("A:A").getValues();
  const valoresColB = sheet.getRange("B:B").getValues();
  const max = Math.max(valoresColA.length, valoresColB.length);

  for (let i = 1; i < max; i++) {
    const valA = valoresColA[i] ? valoresColA[i][0] : null;
    const valB = valoresColB[i] ? valoresColB[i][0] : null;
    const vazioA = valA === null || valA === undefined || String(valA).trim() === "";
    const vazioB = valB === null || valB === undefined || String(valB).trim() === "";
    if (vazioA && vazioB) {
      return i + 1;
    }
  }
  return max + 1;
}

function limparTelefone(tel) {
  if (!tel) return "";
  const apenasNum = String(tel).replace(/\D/g, "");
  if (!apenasNum) return "";
  if ((apenasNum.length === 10 || apenasNum.length === 11) && apenasNum.indexOf("55") !== 0) {
    return "55" + apenasNum;
  }
  return apenasNum;
}

function formatarDataBR(dataVal) {
  if (!dataVal) return "";
  if (dataVal instanceof Date) {
    return Utilities.formatDate(dataVal, "America/Sao_Paulo", "dd/MM/yyyy");
  }
  const texto = String(dataVal).trim();
  if (texto.indexOf("-") !== -1) {
    const partes = texto.split("T")[0].split("-");
    if (partes.length === 3) {
      return partes[2] + "/" + partes[1] + "/" + partes[0];
    }
  }
  return texto;
}

function formatarDataISO(dataVal) {
  if (!dataVal) return null;
  if (dataVal instanceof Date) {
    return Utilities.formatDate(dataVal, "America/Sao_Paulo", "yyyy-MM-dd");
  }
  const texto = String(dataVal).trim();
  if (!texto) return null;

  if (texto.indexOf("/") !== -1) {
    const partes = texto.split("/");
    if (partes.length === 3) {
      const dia = partes[0].length === 1 ? "0" + partes[0] : partes[0];
      const mes = partes[1].length === 1 ? "0" + partes[1] : partes[1];
      const ano = partes[2].length === 2 ? "20" + partes[2] : partes[2];
      return ano + "-" + mes + "-" + dia;
    }
  }

  if (texto.indexOf("-") !== -1) {
    return texto.split("T")[0];
  }
  return null;
}

function parseValorMoeda(val) {
  if (val === null || val === undefined) return 0.0;
  if (typeof val === "number") return val;
  const texto = String(val).trim();
  if (!texto || texto === ".") return 0.0;
  let limpo = texto.replace(/[^\d,\.]/g, "");
  if (limpo.indexOf(",") !== -1 && limpo.indexOf(".") !== -1) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (limpo.indexOf(",") !== -1) {
    limpo = limpo.replace(",", ".");
  }
  const n = parseFloat(limpo);
  return isNaN(n) ? 0.0 : n;
}

function testarConexaoSupabase() {
  try {
    const res = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/alunos_cobranca?select=count", {
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
 * Sincroniza todas as linhas de Cobrança e de CRM com o Supabase
 */
function sincronizarTudoParaSupabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sincroniza Cobrança
  const sheetCob = ss.getSheetByName(ABA_COBRANCA);
  let totalCob = 0;
  if (sheetCob) {
    const maxCob = sheetCob.getLastRow();
    for (let r = 2; r <= maxCob; r++) {
      const nome = sheetCob.getRange(r, 1).getValue();
      const tel = sheetCob.getRange(r, 2).getValue();
      if (nome || tel) {
        sincronizarLinhaCobrancaParaSupabase(sheetCob, r);
        totalCob++;
      }
    }
  }

  // 2. Sincroniza CRM
  const sheetCrm = ss.getSheetByName(ABA_CRM);
  let totalCrm = 0;
  if (sheetCrm) {
    const maxCrm = sheetCrm.getLastRow();
    for (let r = 2; r <= maxCrm; r++) {
      const nome = sheetCrm.getRange(r, 2).getValue();
      const tel = sheetCrm.getRange(r, 3).getValue();
      if (nome || tel) {
        sincronizarLinhaCrmParaSupabase(sheetCrm, r);
        totalCrm++;
      }
    }
  }

  SpreadsheetApp.getUi().alert(
    "✅ Sincronização concluída com sucesso!\n\n" +
    "• Alunos Cobrança sincronizados: " + totalCob + "\n" +
    "• Leads CRM sincronizados: " + totalCrm
  );
}
