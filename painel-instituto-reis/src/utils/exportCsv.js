/**
 * Utilitário para exportação rápida de dados em formato CSV compatível com Excel brasileiro.
 * Utiliza o prefixo BOM (\uFEFF) para garantir que acentos (ç, ã, é) abram perfeitamente no Excel.
 * Formata com terminadores CRLF (\r\n) conforme RFC 4180 e sanitiza quebras internas de texto.
 */
export function exportarParaCSV(dados, nomeArquivo = 'Exportacao') {
  if (!dados || !Array.isArray(dados) || dados.length === 0) {
    alert("Nenhum registro para exportar no momento.")
    return false
  }

  try {
    // 1. Chaves do primeiro registro para montar o cabeçalho
    const chaves = Object.keys(dados[0])
    const cabecalhos = chaves
      .map(chave => `"${String(chave).replace(/"/g, '""').trim()}"`)
      .join(';')

    // 2. Linhas formatadas e sanitizadas
    const linhas = dados.map(item => {
      return chaves.map(chave => {
        let valor = item[chave]
        if (valor === null || valor === undefined) {
          valor = ''
        }
        // Converte para string, remove quebras de linha internas e escapa aspas duplas
        const textoLimpo = String(valor)
          .replace(/\r\n|\r|\n/g, ' ')
          .replace(/"/g, '""')
          .trim()
        return `"${textoLimpo}"`
      }).join(';')
    })

    // 3. Montagem do arquivo com BOM UTF-8 e CRLF Windows/Excel
    const conteudoCompleto = "\uFEFF" + cabecalhos + "\r\n" + linhas.join('\r\n')

    // 4. Normalização do nome do arquivo (evita repetições de data e garante .csv)
    const dataHoje = new Date().toISOString().split('T')[0]
    let nomeLimpo = String(nomeArquivo).replace(/\.csv$/i, '').trim()
    if (!nomeLimpo.includes(dataHoje)) {
      nomeLimpo = `${nomeLimpo}_${dataHoje}`
    }
    const nomeFinal = `${nomeLimpo}.csv`

    // 5. Criação do Blob compatível com Excel
    const blob = new Blob([conteudoCompleto], { type: 'text/csv;charset=utf-8;' })

    // 6. Estratégia de download segura (Compatível com Desktop, Android e iOS Safari)
    if (typeof window.navigator !== 'undefined' && typeof window.navigator.msSaveOrOpenBlob === 'function') {
      window.navigator.msSaveOrOpenBlob(blob, nomeFinal)
      return true
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nomeFinal
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()

    // Remove elemento do DOM
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
    }, 300)

    // CRUCIAL: Delay de 20 segundos antes de revogar a URL do Blob
    // Impede o cancelamento prematuro do download em Chrome, Edge, Safari e Mobile!
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 20000)

    return true
  } catch (erro) {
    console.error("Erro ao gerar arquivo CSV para Excel:", erro)
    // Fallback de emergência caso Blob falhe
    try {
      const chaves = Object.keys(dados[0])
      const cabecalhos = chaves.join(';')
      const linhas = dados.map(item => chaves.map(k => `"${String(item[k] || '').replace(/"/g, '""')}"`).join(';')).join('\r\n')
      const uri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(cabecalhos + '\r\n' + linhas)
      window.open(uri)
      return true
    } catch (eFallback) {
      console.error("Fallback também falhou:", eFallback)
      alert("Não foi possível gerar a exportação no navegador atual.")
      return false
    }
  }
}

/**
 * Converte qualquer valor monetário digitado em número float seguro.
 * Aceita: "150", "150,00", "R$ 150,00", "150.50", "1.500,00"
 */
export function parseMoedaSegura(val) {
  if (val === null || val === undefined) return 0.0
  if (typeof val === 'number') return val
  const texto = String(val).trim()
  if (!texto) return 0.0

  let limpo = texto.replace(/[^\d,\.]/g, '')
  if (limpo.indexOf(',') !== -1 && limpo.indexOf('.') !== -1) {
    limpo = limpo.replace(/\./g, '').replace(',', '.')
  } else if (limpo.indexOf(',') !== -1) {
    limpo = limpo.replace(',', '.')
  }
  const n = parseFloat(limpo)
  return isNaN(n) ? 0.0 : n
}
