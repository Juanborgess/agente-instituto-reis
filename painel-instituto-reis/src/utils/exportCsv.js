/**
 * Utilitário para exportação rápida de dados em formato CSV compatível com Excel brasileiro.
 * Utiliza o prefixo BOM (\uFEFF) para garantir que acentos (ç, ã, é) abram perfeitamente no Excel.
 */
export function exportarParaCSV(dados, nomeArquivo) {
  if (!dados || dados.length === 0) {
    alert("Nenhum registro para exportar no momento.")
    return
  }

  // Chaves do objeto para cabeçalho
  const chaves = Object.keys(dados[0])
  const cabecalhos = chaves.join(';')

  // Linhas formatadas
  const linhas = dados.map(item => {
    return chaves.map(chave => {
      let valor = item[chave]
      if (valor === null || valor === undefined) {
        valor = ''
      }
      // Escapa aspas duplas
      const texto = String(valor).replace(/"/g, '""')
      return `"${texto}"`
    }).join(';')
  }).join('\n')

  const conteudoCompleto = "\uFEFF" + cabecalhos + "\n" + linhas
  const blob = new Blob([conteudoCompleto], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  const dataHoje = new Date().toISOString().split('T')[0]
  link.setAttribute('download', `${nomeArquivo}_${dataHoje}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
