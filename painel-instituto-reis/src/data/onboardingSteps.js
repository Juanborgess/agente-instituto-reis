// Roteiro completo de Onboarding, Tour Interativo, Rotina Diária,
// Mensagens Exatas dos Robôs e FAQ do Painel Operacional - Instituto Reis.

export const TRILHAS_TOUR = [
  {
    id: 'completo',
    titulo: 'Tour Completo do Sistema',
    subtitulo: 'Passe por todas as telas e botões do zero ao avançado',
    duracao: '~3 min',
    cor: 'from-brand-600 to-amber-500',
    badge: 'Recomendado',
    tabInicial: 'cobranca'
  },
  {
    id: 'cobranca',
    titulo: '1. Cobrança Preventiva',
    subtitulo: 'Dar baixa, renovar mensalidade (+1 mês), editar e exportar',
    duracao: '~1 min',
    cor: 'from-emerald-600 to-teal-500',
    badge: 'Módulo 1',
    tabInicial: 'cobranca'
  },
  {
    id: 'crm',
    titulo: '2. CRM & Funil de Vendas',
    subtitulo: 'Novo lead, regra de ouro (pausar robô), Ganhou 🏆 e Perdidos',
    duracao: '~1 min',
    cor: 'from-purple-600 to-indigo-500',
    badge: 'Módulo 2',
    tabInicial: 'crm'
  },
  {
    id: 'sorteio',
    titulo: '3. Sorteio & QR Code',
    subtitulo: 'Métricas, Raio-X de vendas, mandar ao CRM e roleta ao vivo',
    duracao: '~1 min',
    cor: 'from-amber-500 to-orange-600',
    badge: 'Módulo 3',
    tabInicial: 'sorteio'
  }
]

export const TOUR_STEPS = [
  // ============================================================================
  // VISÃO GERAL (TRILHA: completo)
  // ============================================================================
  {
    id: 'geral-navegacao',
    trilha: 'geral',
    tab: 'cobranca',
    target: '[data-tour="nav-tabs"]',
    titulo: 'Os 3 Pilares do Painel + Sincronia Real',
    descricao:
      'Aqui ficam os 3 centros de controle da escola: Cobrança Preventiva (mensalidades), CRM de Vendas (interessados) e Sorteio QR Code (panfletos). Tudo conversa sozinho com a Planilha do Google e com os robôs de WhatsApp sem precisar apertar F5!',
    dica: 'No celular, esse menu fica fixo embaixo da tela para você usar com o polegar.',
    placement: 'bottom'
  },
  {
    id: 'geral-instalar-app',
    trilha: 'geral',
    tab: 'cobranca',
    target: '[data-tour="btn-instalar-app"]',
    titulo: 'Instalar como Aplicativo (PWA)',
    descricao:
      'Clique aqui sempre que quiser transformar o painel em um aplicativo oficial no celular (Android/iPhone) ou no computador (Chrome/Edge), sem precisar digitar o link toda vez.',
    dica: 'A janela mostra o passo a passo exato para o aparelho que você estiver usando.',
    placement: 'bottom'
  },

  // ============================================================================
  // MÓDULO 1: COBRANÇA PREVENTIVA
  // ============================================================================
  {
    id: 'cobranca-resumo',
    trilha: 'cobranca',
    tab: 'cobranca',
    target: '[data-tour="cobranca-cards-resumo"]',
    titulo: 'Filtros Rápidos e Robô de Cobrança',
    descricao:
      'O robô olha os vencimentos todo dia sozinho: avisa faltando 5 dias (lembrete amigável), faltando 1 dia (véspera) e no dia do vencimento (envia o PIX oficial). Alunos PAGOS, CONCLUÍDOS ou DESISTIU nunca recebem cobrança.',
    dica: 'Comece a manhã clicando em "VENCE HOJE" para conferir os PIX que estão entrando.',
    placement: 'bottom'
  },
  {
    id: 'cobranca-exportar',
    trilha: 'cobranca',
    tab: 'cobranca',
    target: '[data-tour="cobranca-btn-exportar"]',
    titulo: 'Exportar Listas para o Excel',
    descricao:
      'Baixa em 1 clique uma planilha pronta para o Excel do Brasil (com acentos corretos). Dica de mestre: ele exporta exatamente o filtro que está aberto na tela (ex.: só os de "Hoje" ou só de "Barbeiro").',
    placement: 'bottom'
  },
  {
    id: 'cobranca-novo-aluno',
    trilha: 'cobranca',
    tab: 'cobranca',
    target: '[data-tour="cobranca-btn-novo"]',
    titulo: 'Cadastrar Novo Aluno & Criar Curso Novo',
    descricao:
      'Assim que alguém fechar matrícula, cadastre o aluno aqui com vencimento, valor e parcela. Se a escola lançar um curso novo (ex.: Maquiagem), basta escolher "+ Outro Curso (Digitar Novo)..." no campo Curso, sem precisar de programador.',
    placement: 'bottom'
  },
  {
    id: 'cobranca-card-demo',
    trilha: 'cobranca',
    tab: 'cobranca',
    target: '[data-tour="cobranca-card-demo"]',
    titulo: 'Card do Aluno (Carteira de Treino)',
    descricao:
      'Cada cartão mostra o curso, a etiqueta de status (Vence Hoje, Amanhã, Em 5 Dias, Pendente ou Pago), a data de vencimento, o WhatsApp e a parcela atual (ex.: 1/6 significa parcela 1 de 6 meses).',
    dica: 'Este card marcado como "MODO TREINO" é só um exemplo seguro: você pode testar à vontade sem alterar a planilha real.',
    placement: 'top'
  },
  {
    id: 'cobranca-marcar-pago',
    trilha: 'cobranca',
    tab: 'cobranca',
    target: '[data-tour="cobranca-btn-pagar"]',
    titulo: 'Botão Verde: Marcar Pago (1 Toque)',
    descricao:
      'O aluno pagou via PIX, dinheiro ou cartão na recepção? Dê 1 clique aqui! Na mesma hora o status muda para PAGO, salva na planilha e o robô NÃO manda mais cobrança naquele mês.',
    placement: 'top'
  },
  {
    id: 'cobranca-editar',
    trilha: 'cobranca',
    tab: 'cobranca',
    target: '[data-tour="cobranca-btn-editar"]',
    titulo: 'Botão Lápis ✏️: Editar & Renovar',
    descricao:
      'Use o lápis para corrigir nome, telefone, data, status ou valor (aceita "150", "150,00" ou "R$ 150"). É também aqui dentro que ficam a Renovação de Mensalidade e a Lixeira de exclusão.',
    dica: 'No próximo passo vamos abrir essa janela automaticamente para te mostrar por dentro!',
    placement: 'top'
  },
  {
    id: 'cobranca-modal-renovar',
    trilha: 'cobranca',
    tab: 'cobranca',
    modalDemo: 'cobranca-edit',
    target: '[data-tour="modal-aluno-renovar"]',
    titulo: 'Renovar Mensalidade (+1 Mês)',
    descricao:
      'Quando o aluno pagar o mês atual e você quiser programar o próximo: clique neste botão roxo! Ele avança a data para o mês seguinte, soma a parcela sozinho (ex.: 1/6 vira 2/6) e volta para PENDENTE.',
    dica: 'Depois de clicar no botão roxo, lembre sempre de clicar em "Salvar Alterações".',
    placement: 'top'
  },
  {
    id: 'cobranca-modal-excluir',
    trilha: 'cobranca',
    tab: 'cobranca',
    modalDemo: 'cobranca-edit',
    target: '[data-tour="modal-aluno-excluir"]',
    titulo: 'Excluir Aluno Repetido ou de Teste',
    descricao:
      'Cadastrou alguém duplicado por engano? Este botão remove o aluno do painel e APAGA a linha dele direto na Planilha do Google, sem deixar linhas em branco no meio.',
    placement: 'top'
  },
  {
    id: 'cobranca-whatsapp',
    trilha: 'cobranca',
    tab: 'cobranca',
    target: '[data-tour="cobranca-btn-whatsapp"]',
    titulo: 'Chamar no WhatsApp em 1 Clique',
    descricao:
      'Quer falar direto com o aluno sem salvar o número na agenda do telefone? Clique aqui para abrir a conversa na hora no WhatsApp Web ou no aplicativo do celular.',
    placement: 'top'
  },

  // ============================================================================
  // MÓDULO 2: CRM & FUNIL DE VENDAS
  // ============================================================================
  {
    id: 'crm-novo-lead',
    trilha: 'crm',
    tab: 'crm',
    target: '[data-tour="crm-btn-novo"]',
    titulo: 'Cadastrar Novo Interessado (+ Novo Lead)',
    descricao:
      'Alguém chamou no WhatsApp, veio do Instagram ou entrou no balcão perguntando sobre cursos? Clique aqui, preencha Nome, WhatsApp com DDD e Curso de Interesse. Ele já entra na planilha como "Novo".',
    dica: 'Também permite criar cursos novos escolhendo "+ Outro Curso (Digitar Novo)...".',
    placement: 'bottom'
  },
  {
    id: 'crm-abas-funil',
    trilha: 'crm',
    tab: 'crm',
    target: '[data-tour="crm-abas-funil"]',
    titulo: 'As 5 Etapas do Funil & Cadência do Robô',
    descricao:
      '1) Novos (D1): recém-chegados. 2) Em Cadência: o robô manda mensagens automáticas profissionais em D+1, D+4 e D+7 para quem ainda não respondeu. 3) Atendimento: você assumiu. 4) Matriculados: fechou! 5) Perdidos: não quer agora.',
    dica: 'Você pode conferir os textos exatos das mensagens D+1, D+4 e D+7 na aba "Guia & Manual".',
    placement: 'bottom'
  },
  {
    id: 'crm-assumir',
    trilha: 'crm',
    tab: 'crm',
    target: '[data-tour="crm-btn-assumir"]',
    titulo: 'REGRA DE OURO: Assumir Atendimento!',
    descricao:
      'Assim que o interessado responder no WhatsApp ("Qual o valor?", "Como funciona?"), clique IMEDIATAMENTE neste botão roxo! O status muda para "Atendimento Humano" e o robô é DESLIGADO na hora para esse contato.',
    dica: 'Se esquecer de clicar aqui, o robô pode mandar a mensagem de D+4 ou D+7 no meio da sua conversa!',
    placement: 'top'
  },
  {
    id: 'crm-whatsapp',
    trilha: 'crm',
    tab: 'crm',
    target: '[data-tour="crm-btn-whatsapp"]',
    titulo: 'WhatsApp com Saudação Pronta',
    descricao:
      'Ao clicar aqui, o sistema já abre o WhatsApp com uma mensagem pronta citando o primeiro nome da pessoa e o curso que ela escolheu.',
    placement: 'top'
  },
  {
    id: 'crm-ganhou',
    trilha: 'crm',
    tab: 'crm',
    target: '[data-tour="crm-btn-ganhou"]',
    titulo: 'Cliente Matriculou? Clique no Troféu 🏆',
    descricao:
      'Quando o interessado fechar a matrícula, aperte o Troféu verde ("Marcar como Ganhou") para movê-lo para Matriculados. Passo seguinte: vá em Cobrança Preventiva e cadastre-o em "+ Novo Aluno" para o robô acompanhar as mensalidades!',
    placement: 'top'
  },
  {
    id: 'crm-perdeu-excluir',
    trilha: 'crm',
    tab: 'crm',
    target: '[data-tour="crm-btn-perdeu"]',
    titulo: 'Marcar como Perdido ❌ ou Excluir 🗑️',
    descricao:
      'Se a pessoa avisou que não tem interesse no momento, clique no "X" para encerrar os envios (vai para Perdidos). Se foi cadastro duplicado ou teste, use a Lixeira ao lado.',
    placement: 'top'
  },

  // ============================================================================
  // MÓDULO 3: SORTEIO & PESQUISA QR CODE
  // ============================================================================
  {
    id: 'sorteio-metricas',
    trilha: 'sorteio',
    tab: 'sorteio',
    target: '[data-tour="sorteio-metricas"]',
    titulo: 'Termômetro de Panfletagem e Vendas',
    descricao:
      'Aqui caem automaticamente as pessoas que escanearam o QR Code dos panfletos e cartazes. Os 4 cartões mostram o total de inscritos, curso mais procurado, bairro mais forte e o Maior Impedimento (ex.: "Falta de Dinheiro") para usar como argumento de vendas!',
    placement: 'bottom'
  },
  {
    id: 'sorteio-ver-respostas',
    trilha: 'sorteio',
    tab: 'sorteio',
    target: '[data-tour="sorteio-btn-ver-respostas"]',
    titulo: 'Ver Respostas (Raio-X de Vendas)',
    descricao:
      'Clique aqui para abrir a ficha completa: se já trabalha, idade, bairro, objetivo nos próximos meses, maior impedimento e o que mudaria na vida dela com a profissão.',
    dica: 'No próximo passo vamos abrir o Raio-X automaticamente!',
    placement: 'top'
  },
  {
    id: 'sorteio-modal-crm',
    trilha: 'sorteio',
    tab: 'sorteio',
    modalDemo: 'sorteio-details',
    target: '[data-tour="modal-sorteio-crm"]',
    titulo: 'Transformar em Lead do CRM (1 Toque)',
    descricao:
      'Viu um participante com perfil muito bom para se matricular? Clique neste botão! Em 1 toque os dados dele são copiados direto para o CRM de Vendas para você ofertar uma condição especial.',
    placement: 'top'
  },
  {
    id: 'sorteio-badge-e-lixeira',
    trilha: 'sorteio',
    tab: 'sorteio',
    target: '[data-tour="sorteio-badge-sorteado"]',
    titulo: 'Desmarcar Sorteado & Lixeira 🗑️',
    descricao:
      'Se alguém foi sorteado em um teste, basta clicar na etiqueta "SORTEADO" para que ele volte a concorrer normalmente. Para cadastros repetidos ou de teste, a Lixeira apaga aqui e na aba Sorteio_QR_Code da planilha.',
    placement: 'top'
  },
  {
    id: 'sorteio-realizar',
    trilha: 'sorteio',
    tab: 'sorteio',
    target: '[data-tour="sorteio-btn-sortear"]',
    titulo: '🎲 Roleta Oficial ao Vivo & Zerar Sorteados',
    descricao:
      'Perfeito para projetar na TV da recepção ou gravar para o Instagram! Permite filtrar por curso e gira por 3,5 segundos com suspense até revelar o ganhador + botão de WhatsApp. Na semana seguinte, use "Zerar Sorteados" para limpar tudo de uma vez.',
    dica: 'Parabéns! Você concluiu todo o fluxo operacional do Painel Instituto Reis.',
    placement: 'bottom'
  }
]

// Mensagens exatas do Robô de Vendas (CRM)
export const MENSAGENS_ROBO_CRM = [
  {
    fase: 'D+1',
    titulo: 'Mensagem 1 — Disparada 1 dia após o interesse',
    cor: 'border-blue-500/30 bg-blue-500/5',
    badgeCor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    texto:
      'Olá, [Nome]. Identificamos que o seu pedido de atendimento sobre a turma de [Curso] permanece pendente de confirmação no sistema do Instituto Reis. Confirma o encerramento do seu registo?',
    porque:
      'Gera urgência imediata. Como pergunta se a pessoa confirma o encerramento do cadastro, ela fica com receio de perder a vaga e responde na hora: "Não quero encerrar!", "Como funciona?", "Qual o valor?".'
  },
  {
    fase: 'D+4',
    titulo: 'Mensagem 2 — Disparada 4 dias após a entrada (se não respondeu)',
    cor: 'border-amber-500/30 bg-amber-500/5',
    badgeCor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    texto:
      'Olá, [Nome]. Informamos que a atualização do seu registo referente à turma de [Curso] aguarda validação. O sistema do Instituto Reis manterá este protocolo disponível por tempo limitado. Precisa de auxílio com o seu atendimento?',
    porque:
      'É um lembrete formal e educado de que a vaga continua reservada por pouco tempo. Quem estava na correria da semana aproveita essa mensagem para tirar dúvidas.'
  },
  {
    fase: 'D+7',
    titulo: 'Mensagem 3 — Disparada 7 dias após a entrada (Último Aviso)',
    cor: 'border-rose-500/30 bg-rose-500/5',
    badgeCor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    texto:
      'Olá, [Nome]. Informamos que o protocolo de atendimento relativo ao curso de [Curso] está a ser cancelado no sistema do Instituto Reis por falta de confirmação. Caso pretenda retomar este processo, por favor responda a esta mensagem.',
    porque:
      'É a despedida amigável. Quem procrastinou responde aqui para não perder a oportunidade. Se não responder, o robô encerra os envios para não incomodar.'
  }
]

// Régua do Robô de Cobrança Preventiva
export const REGUA_COBRANCA = [
  {
    momento: 'Faltando 5 dias (D-5)',
    titulo: 'Lembrete Amigável',
    descricao: 'Envia uma mensagem educada avisando com antecedência para o aluno se planejar.',
    cor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10'
  },
  {
    momento: 'Faltando 1 dia (Véspera)',
    titulo: 'Aviso de Amanhã',
    descricao: 'Lembra o aluno que a mensalidade vence no dia seguinte.',
    cor: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
  },
  {
    momento: 'No Dia do Vencimento',
    titulo: 'Cobrança com Chave PIX',
    descricao: 'Envia a mensagem com a chave PIX oficial da escola para pagamento rápido.',
    cor: 'text-red-400 border-red-500/30 bg-red-500/10'
  },
  {
    momento: 'PAGO / CONCLUÍDO / DESISTIU',
    titulo: 'Bloqueio Automático',
    descricao: 'O robô NUNCA envia cobrança para quem já pagou, concluiu ou desistiu!',
    cor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
  }
]

// Checklist Diário do Lucas
export const ROTINA_DIARIA = [
  {
    bloco: '1. Ao Chegar na Escola (09:00)',
    cor: 'text-amber-400',
    itens: [
      { id: 'manha-1', texto: 'Abrir a aba "Cobrança Preventiva" e clicar no filtro "Hoje".' },
      { id: 'manha-2', texto: 'Conferir os alunos que vencem hoje e ficar atento aos comprovantes de PIX.' },
      { id: 'manha-3', texto: 'Conforme os pagamentos forem caindo, clicar no botão verde "Marcar Pago".' }
    ]
  },
  {
    bloco: '2. Durante o Expediente (Manhã e Tarde)',
    cor: 'text-purple-400',
    itens: [
      { id: 'tarde-1', texto: 'Alguém chamou no WhatsApp ou balcão querendo curso? Cadastrar em "+ Novo Lead" no CRM.' },
      { id: 'tarde-2', texto: 'Lead respondeu ao robô? Clicar IMEDIATAMENTE em "Assumir Atendimento (Pausar Robô)"!' },
      { id: 'tarde-3', texto: 'Fechou matrícula? Clicar no Troféu 🏆 ("Ganhou") no CRM e cadastrar o aluno na Cobrança Preventiva.' },
      { id: 'tarde-4', texto: 'Aluno pagou o mês e vai renovar? Abrir o lápis ✏️ e clicar em "📅 Renovar Mensalidade (+1 Mês)".' }
    ]
  },
  {
    bloco: '3. No Final do Dia (17:00 / 18:00)',
    cor: 'text-emerald-400',
    itens: [
      { id: 'noite-1', texto: 'Passar na aba "Sorteio QR Code" e conferir os novos participantes dos panfletos.' },
      { id: 'noite-2', texto: 'Abrir "Ver Respostas" nos perfis interessantes e clicar em "Transformar em Lead do CRM".' }
    ]
  }
]

// Lista de Cursos Padrão
export const CURSOS_PADRAO_MANUAL = [
  'Barbeiro',
  'Barbeiro Avançado',
  'Lashes',
  'Sobrancelha',
  'Trança',
  'trança avançado',
  'Brow Lamination'
]

// Dúvidas Frequentes (FAQ)
export const FAQ_ITENS = [
  {
    pergunta: 'O que acontece se eu esquecer de clicar em "Assumir Atendimento" quando o lead responder?',
    resposta:
      'O robô pode entender que o lead ainda não foi atendido e disparar a próxima mensagem automática da cadência (D+4 ou D+7). Por isso, sempre que iniciar conversa com um lead, clique no botão roxo "Assumir Atendimento (Pausar Robô)"!'
  },
  {
    pergunta: 'O robô de cobrança vai cobrar um aluno que já pagou?',
    resposta:
      'NUNCA! O robô só envia mensagens para quem está com status PENDENTE. Se você clicou em "Marcar Pago" ou alterou o status para CONCLUÍDO / DESISTIU, o robô não envia nada.'
  },
  {
    pergunta: 'Posso alterar as informações direto na Planilha do Google?',
    resposta:
      'Pode sim! Se você mudar o status, data ou apagar uma linha duplicada direto na planilha, o painel reconhece e atualiza automaticamente. Porém, usar o painel é mais rápido, seguro e evita erros de digitação.'
  },
  {
    pergunta: 'O que significa o número da parcela (ex.: 1/6)?',
    resposta:
      'Significa Parcela 1 de 6 meses. Quando o aluno paga a parcela 1 e você clica no botão roxo "📅 Renovar Mensalidade (+1 Mês)" dentro da edição (lápis ✏️), o sistema muda sozinho para 2/6, avança 1 mês no vencimento e volta para PENDENTE.'
  },
  {
    pergunta: 'Consigo acessar o painel de casa ou só na recepção?',
    resposta:
      'Consegue de qualquer lugar! Basta abrir o link oficial (ou o aplicativo instalado no seu celular/computador) e entrar com o login da escola.'
  }
]
