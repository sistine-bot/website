import type { SystemAuditReport } from './types';

export const systemsAuditList: SystemAuditReport[] = [
  {
    name: 'Sistemas de Economia',
    status: 'active',
    description: 'Sistema financeiro com transações, saldo em carteira/banco, e ações como caçar, pescar, trabalhar e crime.',
    commandsCount: 8,
    dependency: 'Firebase Realtime DB (Tabela: economia)'
  },
  {
    name: 'Módulo de Apostas & Cassino',
    status: 'active',
    description: 'Mecanismo completo de apostas contendo caça-níqueis (slotmachine), jokenpô, apostas bilaterais e blackjack.',
    commandsCount: 4,
    dependency: 'Firebase Realtime DB & In-Memory RNG'
  },
  {
    name: 'Módulo de Níveis & XP',
    status: 'active',
    description: 'Cálculo dinâmico de XP baseado em interações e mensagens com ganho configurável.',
    commandsCount: 1,
    dependency: 'economia/{userId}/nível'
  },
  {
    name: 'Módulo de Fazenda & Plantação',
    status: 'active',
    description: 'Sistema rural onde usuários compram animais (galinha, vaca, porco) e cultivam sementes (trigo, milho, cenoura).',
    commandsCount: 2,
    dependency: 'economia/{userId}/Fazenda e Plantação'
  },
  {
    name: 'Módulo de Casamento / Namoro',
    status: 'active',
    description: 'Permite que usuários namorem, casem, comprem anéis de compromisso e paguem tributos diários de fidelidade.',
    commandsCount: 3,
    dependency: 'economia/{userId}/Casamento e Namorar'
  },
  {
    name: 'Sistema de Lembretes',
    status: 'active',
    description: 'Agendador de notificações em segundo plano que avisa o usuário no chat ou DM.',
    commandsCount: 1,
    dependency: 'servidores/{userId}/Lembretes'
  },
  {
    name: 'Perfis Customizáveis',
    status: 'active',
    description: 'Edição de biografias, layouts, compra de planos de fundo e medalhas VIP.',
    commandsCount: 1,
    dependency: 'economia/{userId}/Perfil/Layouts'
  },
  {
    name: 'Sistema Premium (VIP)',
    status: 'active',
    description: 'Concessão de status VIP por tempo determinado que multiplica ganhos e reduz cooldowns de comandos.',
    commandsCount: 1,
    dependency: 'economia/{userId}/vip'
  }
];

export const shopItemsList = [
  { key: 'armacaça', name: 'Arma de Caça', valor: 15000, desc: 'Equipamento necessário para o comando de caça.', category: 'Equipamentos', img: 'https://i.postimg.cc/BQDPwzxR/5-i-QSSSF5.png' },
  { key: 'vara', name: 'Vara de Pescar', valor: 3000, desc: 'Equipamento básico necessário para pescar peixes.', category: 'Equipamentos', img: 'https://i.postimg.cc/8s8D6tc6/9-Rtm-NAp-F.png' },
  { key: 'porte', name: 'Porte de Armas', valor: 12000, desc: 'Autorização legal para carregar armas e evitar prisão em abordagens.', category: 'Equipamentos', img: 'https://i.postimg.cc/vm81THpd/2-h-Uwk-XZd.png' },
  { key: 'anelcasamento', name: 'Anel de Casamento', valor: 1000, desc: 'Item romântico para propor casamento a outro usuário.', category: 'Equipamentos', img: 'https://i.postimg.cc/J7skj0tr/8-Gp-Mfe7-F.png' },
  { key: 'chave', name: 'Chave Dourada', valor: 5000, desc: 'Consumível para abrir baús especiais de recompensas.', category: 'Consumíveis', img: 'https://i.postimg.cc/zBnFk9FS/image.png' },
  { key: 'munição', name: 'Munição de Caça', valor: 200, desc: 'Cartucho consumível utilizado a cada disparo na caçada.', category: 'Consumíveis', img: 'https://i.postimg.cc/RZL6vnpR/1-Cn-V6ukr.png' },
  { key: 'ração_animal', name: 'Ração Animal', valor: 3000, desc: 'Alimenta animais na sua fazenda para que produzam ovos ou leite.', category: 'Consumíveis', img: 'https://i.postimg.cc/g2VcvFvk/13-Tku-W2bb.png' },
  { key: 'isca', name: 'Iscas de Pesca', valor: 500, desc: 'Atrai peixes maiores ao usar o comando de pescar.', category: 'Consumíveis', img: 'https://i.postimg.cc/qRRkVNWz/10-Ie-Q0-ZFG.png' }
];
