/**
 * Serviço de Sincronização em Tempo Real com o Google Sheets
 * Comunica com o Google Apps Script Webhook ou executa sincronização híbrida.
 */

const APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxaSOTHqTD3rir1pqatq1Ad8ouXgCvWigzDD8vFZxgkwzTP-a7dbOsY-Gg9uw1Rz3oc/exec'

/**
 * Envia comando de sincronização para a planilha Google Sheets.
 * @param {Object} dados - Payload com ação ('salvar_aluno', 'marcar_pago', etc)
 */
export async function sincronizarComPlanilha(dados) {
  if (!APPS_SCRIPT_URL) {
    console.info('[Sync Google Sheets] URL do Apps Script não configurada em VITE_GOOGLE_APPS_SCRIPT_URL. Operação registrada localmente no Supabase.')
    return { success: false, skipped: true, reason: 'URL_NAO_CONFIGURADA' }
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(dados)
    })

    const resultado = await response.json()
    console.log('[Sync Google Sheets] Resposta do webhook:', resultado)
    return resultado
  } catch (err) {
    console.warn('[Sync Google Sheets] Aviso ao comunicar com webhook:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Marca aluno como pago diretamente na planilha.
 */
export async function marcarPagoNaPlanilha(telefone, curso) {
  return sincronizarComPlanilha({
    action: 'marcar_pago',
    telefone,
    curso
  })
}

/**
 * Exclui o aluno diretamente da planilha.
 */
export async function excluirAlunoNaPlanilha(telefone, curso, nome) {
  return sincronizarComPlanilha({
    action: 'excluir_aluno',
    telefone_whatsapp: telefone,
    curso: curso,
    nome_aluno: nome
  })
}

