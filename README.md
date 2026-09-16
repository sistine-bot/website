Analyzing the user's request, the core task is balancing virtual economy values ...
   🎮 Relatório Executivo de Game Design & Balanceamento Econômico                                  
                                                                                                    
  Projeto: Sistine Bot — Economia Virtual                                                           
  Especialidade: Virtual Economy & Systems Game Design                                              
  Objetivo Central: Ancorar o item de topo de linha (Ak-47 = 60.000 moedas) a uma janela de retenção
  de 30 dias jogando 30 minutos/dia, mantendo a identidade casual com alta circulação monetária sem 
  entrar em colapso hiperinflacionário.                                                             
  ──────                                                                                            
  ## 1. Diagnóstico do Sistema Atual & Visão Macroeconômica                                         
                                                                                                    
  ### O Paradoxo da "Economia Casual com Inflação"                                                  
                                                                                                    
  Uma economia casual precisa fornecer dopamina frequente: números volumosos, notificações de       
  recompensas e sensação constante de ganho. Porém, se os ganhos forem inflados sem sumidouros      
  (money sinks) proporcionais, a Ak-47 de 60.000 moedas se torna trivial em 3 a 5 dias, eliminando a
  retenção de longo prazo.                                                                          
                                                                                                    
  ### Falhas Críticas Identificadas no Código Atual:                                                
                                                                                                    
  1. /semanal VIP Hiperinflacionário: Entregava até 65.000 moedas em um único comando semanal. Um   
  jogador VIP comprava a Ak-47 em 7 dias sem qualquer esforço de gameplay ativo.                    
  2. Empregos Descalibrados: O cargo de Policial pagava até 10.000 moedas a cada 30 minutos. Com 2  
  horas de jogo ativo, o usuário já gerava 40.000 moedas.                                           
  3. Minigames com EV Neutro ou Abusáveis: O /jokenpo possuía EV = 0 sem vantagem da casa nem taxa  
  de corretagem e sem cooldown estrito, abrindo margem para abuso de scripts e estratégias de       
  Martingale.                                                                                       
  4. Ausência de Taxas de Atrito: /transferir operava com taxa 0%, facilitando transferência entre  
  contas alternativas (alts/smurfs).                                                                
                                                                                                    
  ### A Equação de Ouro do Jogador Ativo (30 min/dia):                                              
                                                                                                    
    Meta Mensal = 60.000 moedas em 30 dias ⟹ 𝟐.𝟎𝟎𝟎 moedas líquidas/dia                              
                                                                                                    
    Ciclo Semanal (7 dias) ⟹ 𝟏𝟒.𝟎𝟎𝟎 moedas líquidas                                                 
                                                                                                    
  Em 30 minutos diários, o jogador ativo típico realiza:                                            
                                                                                                    
  • 1x /daily                                                                                       
  • 1 a 2x /emprego trabalhar                                                                       
  • 1x /pescar ou /caçar (ou rota mista)                                                            
  • 1x /crime (ou módulo de risco)                                                                  
  • 1x Gerenciamento rápido de colheita/animais (/fazenda, /plantação)                              
  • 2 a 3 giros/apostas casuais (/slotmachine, /raspadinha, /blackjack)                             
  ──────                                                                                            
  ## 2. Tabela Mestre de Balanceamento de Comandos                                                  
                                                                                                    
  Nesta tabela, os ganhos brutos foram calibrados para transmitir a sensação de volume, enquanto os 
  custos operacionais (munição, iscas, durabilidade de ferramentas em /recuperar) atuam como dreno  
  regulador.                                                                                        
                                                                                                    
   Comando / … │ Cooldown A… │ Cooldown R… │ Ganho Suge… │ Custo Oper… │ Taxa Suces… │ Lucro Líqui…
  ─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼──────────────
   /daily      │ 24 horas    │ 24 horas    │ 500 ∼ 900   │ 0           │ 100%        │ +700
   (Free)      │             │             │             │             │             │
   /daily (VIP │ 24 horas    │ 24 horas    │ 750 ∼ 1.350 │ 0           │ 100%        │ +1.050
   Prata -     │             │             │             │             │             │
   1.5x)       │             │             │             │             │             │
   /daily (VIP │ 24 horas    │ 24 horas    │ 1.000 ∼     │ 0           │ 100%        │ +1.400
   Ouro -      │             │             │ 1.800       │             │             │
   2.0x)       │             │             │             │             │             │
   /semanal    │ 7 dias      │ 7 dias      │ 3.500 ∼     │ 0           │ 100%        │ +4.250 / sem
   (VIP Prata) │             │             │ 5.000       │             │             │
   /semanal    │ 7 dias      │ 7 dias      │ 7.000 ∼     │ 0           │ 100%        │ +8.500 / sem
   (VIP Ouro)  │             │             │ 10.000      │             │             │
   /emprego    │ 30 min      │ 30 min      │ 150 ∼ 300   │ 0           │ 100%        │ +225
   (Taxista -  │             │             │             │             │             │
   Lvl 0)      │             │             │             │             │             │
   /emprego    │ 30 min      │ 30 min      │ 400 ∼ 800   │ 0           │ 100%        │ +600
   (Entregador │             │             │             │             │             │
   Lvl 15)     │             │             │             │             │             │
   /emprego    │ 30 min      │ 30 min      │ 1.100 ∼     │ 0 (Bloqueia │ 100%        │ +1.650
   (Policial - │             │             │ 2.200       │ crimes)     │             │
   Lvl 50)     │             │             │             │             │             │
   /caçar      │ 60 min      │ 45 min      │ 3 ∼ 8       │ 1-2         │ 100% (RNG   │ +345
               │             │             │ Carnes (240 │ Munições    │ no drop)    │
               │             │             │ ∼ 640)      │ (45) +      │             │
               │             │             │             │ Reparo (50) │             │
   /pescar     │ 60 min      │ 45 min      │ 4 ∼ 12      │ 1-2 Iscas   │ 100% (RNG   │ +320
               │             │             │ Peixes (200 │ (50) +      │ no drop)    │
               │             │             │ ∼ 600)      │ Reparo (30) │             │
   /crime      │ 60 min      │ 60 min      │ 600 ∼ 1.100 │ Perda: 400  │ 60% vitória │ +135 (EV
               │             │             │             │ ∼ 700 +     │ / 40%       │ positivo
               │             │             │             │ Munição/Arm │ prisão      │ controlado)
               │             │             │             │ a           │             │
   /assaltar   │ 60 min      │ 60 min      │ 10%         │ Reação da   │ 60% vitória │ +360
   (Glock)     │             │             │ carteira    │ vítima / 0  │             │ (conforme
               │             │             │ (Cap:       │             │             │ carteira
               │             │             │ 1.200)      │             │             │ alvo)
   /assaltar   │ 60 min      │ 60 min      │ 25%         │ Reação da   │ 75% vitória │ +2.200 (alto
   (Ak-47)     │             │             │ carteira    │ vítima / 0  │             │ prestígio da
               │             │             │ (Cap:       │             │             │ AK)
               │             │             │ 7.500)      │             │             │
   /raspadinha │ Sem CD      │ 30 seg      │ 600 ∼ 2.000 │ Custo do    │ ~28.8% de   │ -71.6 (dreno
               │             │             │ por combo   │ bilhete:    │ premiar     │ para a casa)
               │             │             │             │ 500         │             │
   /slotmachin │ Sem CD      │ 15 seg      │ Até 12x da  │ Perda da    │ ~38.8%      │ -17.0% do
   e           │             │             │ aposta      │ aposta      │ qualquer    │ valor
               │             │             │             │ integral    │ prêmio      │ apostado
   /blackjack  │ Sem CD      │ 20 seg      │ 2.0x (Push  │ Perda da    │ ~44%        │ -6.2% do
               │             │             │ devolve 1x) │ aposta      │ vitória /   │ valor
               │             │             │             │ integral    │ 8% empate   │ apostado
   /jokenpo    │ Sem CD      │ 30 seg      │ 1.95x da    │ Perda da    │ 33.3% V /   │ -1.67% do
               │             │             │ aposta      │ aposta      │ 33.3% E /   │ valor
               │             │             │             │ integral    │ 33.3% D     │ apostado
   /apostar    │ Sem CD      │ 15 seg      │ 1.90x (Taxa │ Perda da    │ 50% / 50%   │ 0 (Dreno de
   (PvP Moeda) │             │             │ 5% retida)  │ aposta      │ entre       │ 5% da
               │             │             │             │ integral    │ players     │ economia)
   /corrida    │ Sem CD      │ 60 seg      │ N × Aposta  │ Perda da    │ 1/N         │ 0 (Dreno de
   (PvP)       │             │             │ × 0.95      │ aposta      │ jogadores   │ 5% da
               │             │             │             │ integral    │             │ economia)
  ──────                                                                                            
  ## 3. Análise de Valor Esperado (EV) dos Minigames e Apostas                                      
                                                                                                    
  Para garantir a solvência da economia virtual, todos os minigames contra o bot devem possuir EV   
  negativo para o usuário (Edge a favor da Casa/Bot). Jogos com EV ≥ 0 são vetores fatais de        
  hiperinflação.                                                                                    
                                                                                                    
  ### A. Slot Machine (/slotmachine)                                                                
                                                                                                    
  • Grid: 3 carretéis, 7 símbolos possíveis (🍒, 🍌, 🍓, 🍊, 🍏, 🍉, 🍇).                           
  • Espaço amostral: 7 × 7 × 7 = 343 combinações.                                                   
  • Tabela de Payouts Balanceada:                                                                   
      1. 3 × Cerejas (🍒 | 🍒 | 🍒): 1 combinação → Multiplicador 12x                               
      2. 3 × Frutas Médias (Banana, Melancia, Laranja): 3 combinações → Multiplicador 7x            
      3. 3 × Frutas Comuns (Maçã, Uva, Morango): 3 combinações → Multiplicador 4x                   
      4. 2 × Frutas Iguais (Par qualquer):                                                          
                                                                                                    
                                                                                                    
        ⎛ 3 ⎞                                                                                       
    7 × ⎝ 2 ⎠ × 6 = 126                                                                             
                                                                                                    
  combinações → Multiplicador 1.8x                                                                  
  5. 3 Frutas Diferentes: 7 × 6 × 5 = 210 combinações → Multiplicador 0x                            
                                                                                                    
                                   (1 × 12) + (3 × 7) + (3 × 4) + (126 × 1.8) + (210 × 0)           
    𝔼[Retorno Bruto por 1 moeda] = ──────────────────────────────────────────────────────           
                                                            343                                     
                                                                                                    
                 12 + 21 + 12 + 226.8   271.8                                                       
    𝔼[Retorno] = ──────────────────── = ───── ≈ 𝟎.𝟕𝟗𝟐𝟒 (RTP = 79.2\%)                               
                         343             343                                                        
                                                                                                    
    𝐄𝐕        = -𝟎.𝟐𝟎𝟕𝟔 (-20.8\% por aposta)   ⟺   House Edge = +𝟐𝟎.𝟖%                              
      jogador                                                                                       
                                                                                                    
  │ Note                                                                     
  │ Essa margem de 20.8% da casa atua como um excelente aspirador de excesso de moeda injetada pelos
  │ empregos e daily. O teto máximo de aposta deve ser reduzido de 25.000 para 5.000 moedas.        
  ──────                                                                                            
  ### B. Raspadinha (/raspadinha)                                                                   
                                                                                                    
  • Grid: 3 × 3 (9 espaços). 5 figuras com distribuição equiprovável (p = 0.2).                     
  • Linhas premiadas possíveis: 3 horizontais + 3 verticais + 2 diagonais = 8 linhas.               
  • Custo do bilhete: 500 moedas.                                                                   
  • Valores de Combos Rebalanceados:                                                                
      • 👩‍🌾armer: 2.000 (era 2.500)                                                                
      • 🐔 Galinha: 1.200 (era 1.500)                                                               
      • 🐷 Porco: 1.000 (era 1.250)                                                                 
      • 🐮 Vaca: 800 (era 1.000)                                                                    
      • 🐑 Ovelha: 600 (era 750)                                                                    
                                                                                                    
                                                                                                    
  Para cada uma das 8 linhas, a chance de formar trinca de um símbolo específico é (1/5)³ = 1/125.  
                                                                                                    
                          2000 + 1200 + 1000 + 800 + 600   5.600                                    
    𝔼[Prêmio por Linha] = ────────────────────────────── = ───── = 44.8 moedas                      
                                       125                  125                                     
                                                                                                    
  Pela Linearidade da Esperança matemática nas 8 linhas:                                            
                                                                                                    
    𝔼[Prêmio Total do Bilhete] = 8 × 44.8 = 𝟑𝟓𝟖.𝟒 moedas                                            
                                                                                                    
    𝐄𝐕        = 𝟑𝟓𝟖.𝟒 - 𝟓𝟎𝟎 = -𝟏𝟒𝟏.𝟔 moedas por bilhete  (RTP = 71.7%)                              
      jogador                                                                                       
                                                                                                    
  • Punição por clicar em "Coletar" em raspadinha perdedora: Mantém a dedução punitiva de -300      
  moedas.                                                                                           
  ──────                                                                                            
  ### C. Crime (/crime)                                                                             
                                                                                                    
  • Taxa de Sucesso: 60% de vitória (Win ≥ 5 em 1 … 10).                                            
  • Vitória: Média de +850 moedas (Sorteio: 600 ∼ 1.100).                                           
  • Derrota (Prisão): Média de -550 moedas (Sorteio: 400 ∼ 700).                                    
  • Consumo de Itens: 1 munição (30 moedas) + 3 XP de desgaste de arma (~45 moedas de reparo no     
  /recuperar) = -75 moedas fixas.                                                                   
                                                                                                    
    EV      = (0.60 × +850) + (0.40 × -550) - 75                                                    
      crime                                                                                         
                                                                                                    
    EV      = 510 - 220 - 75 = +𝟐𝟏𝟓 moedas por execução                                             
      crime                                                                                         
                                                                                                    
  Como o cooldown é de 60 minutos, um usuário comum que realiza 1 crime por sessão de 30 min agrega 
  em média +215 moedas líquidas ao seu balanço diário.                                              
  ──────                                                                                            
  ### D. Jokenpô (/jokenpo)                                                                         
                                                                                                    
  • Problema anterior: Payout de 2.0x com 33% vitória, 33% derrota, 33% empate ⟹ EV = 0 (neutro,    
  vulnerável a automação sem custo).                                                                
  • Solução: Payout de vitória reajustado para 1.95x (taxa de corretagem da casa de 5% no lucro):   
                                                                                                    
                ⎛ 1         ⎞   ⎛ 1         ⎞   ⎛ 1     ⎞   -0.05                                   
    EV        = ⎜─── × +0.95⎟ + ⎜─── × -1.00⎟ + ⎜─── × 0⎟ = ───── = -𝟏.𝟔𝟕% por rodada               
      jokenpo   ⎝ 3         ⎠   ⎝ 3         ⎠   ⎝ 3     ⎠     3                                     
  ──────                                                                                            
  ## 4. Projeção de 7 Dias para um Jogador 100% Ativo (30 min/dia)                                  
                                                                                                    
  Perfil do jogador padrão de 30 min/dia:                                                           
                                                                                                    
  • Nível 15 a 20 (Entregador / Frentista).                                                         
  • Executa 1 daily por dia.                                                                        
  • Trabalha 1x a 2x no seu emprego durante os 30 min logados.                                      
  • Faz 1 expedição de caça ou pesca.                                                               
  • Comete 1 crime.                                                                                 
  • Faz a manutenção da plantação/animais.                                                          
  • Joga 1 ou 2 raspadinhas/slots recreativamente.                                                  
                                                                                                    
  ### Simulação Detalhada do Ciclo Semanal:                                                         
                                                                                                    
    Segunda-Feira:                                                                                  
      + Daily: +700                                                                                 
      + Trabalho (2x Entregador): +1.200                                                            
      + Caça/Pesca (Venda líquida com custos descontados): +330                                     
      + Crime (Sucesso): +775 líquidas                                                              
      + Fazenda/Plantação (Colheita): +250                                                          
      - Dreno Lúdico (1x Slot + 1x Raspadinha): -210                                                
      - Custos de Reparo (/recuperar): -120                                                         
      = Saldo Líquido do Dia 1: +2.925 moedas                                                       
                                                                                                    
    Terça-Feira:                                                                                    
      + Daily: +700                                                                                 
      + Trabalho (1x Entregador): +600                                                              
      + Caça/Pesca: +330                                                                            
      - Crime (Derrota / Preso): -625 líquidas                                                      
      + Fazenda/Plantação: +250                                                                     
      - Dreno Lúdico: -150                                                                          
      = Saldo Líquido do Dia 2: +1.105 moedas                                                       
                                                                                                    
    Quarta-Feira:                                                                                   
      + Daily: +700                                                                                 
      + Trabalho (2x): +1.200                                                                       
      + Caça/Pesca: +330                                                                            
      + Crime (Sucesso): +775                                                                       
      + Fazenda/Plantação: +250                                                                     
      - Custos Operacionais/Apostas: -320                                                           
      = Saldo Líquido do Dia 3: +2.935 moedas                                                       
                                                                                                    
    Quinta-Feira:                                                                                   
      + Daily: +700                                                                                 
      + Trabalho (1x): +600                                                                         
      + Caça/Pesca: +330                                                                            
      + Crime (Sucesso): +775                                                                       
      + Fazenda/Plantação: +250                                                                     
      - Reparos de ferramentas: -150                                                                
      = Saldo Líquido do Dia 4: +2.505 moedas                                                       
                                                                                                    
    Sexta-Feira:                                                                                    
      + Daily: +700                                                                                 
      + Trabalho (2x): +1.200                                                                       
      + Caça/Pesca: +330                                                                            
      - Crime (Derrota): -625                                                                       
      + Fazenda/Plantação: +250                                                                     
      - Apostas / Taxas: -200                                                                       
      = Saldo Líquido do Dia 5: +1.655 moedas                                                       
                                                                                                    
    Sábado:                                                                                         
      + Daily: +700                                                                                 
      + Trabalho (2x): +1.200                                                                       
      + Caça/Pesca (Bônus de tempo): +500                                                           
      + Crime (Sucesso): +775                                                                       
      + Fazenda/Plantação: +300                                                                     
      - Apostas casuais: -250                                                                       
      = Saldo Líquido do Dia 6: +3.225 moedas                                                       
                                                                                                    
    Domingo:                                                                                        
      + Daily: +700                                                                                 
      + Trabalho (1x): +600                                                                         
      + Caça/Pesca: +330                                                                            
      - Crime (Derrota): -625                                                                       
      + Fazenda/Plantação: +250                                                                     
      - Reparo geral de inventário: -300                                                            
      = Saldo Líquido do Dia 7: +955 moedas                                                         
                                                                                                    
  ### Balanço Consolidado do Ciclo de 7 Dias:                                                       
                                                                                                    
  • Entradas Brutas da Semana: ≈ 19.800 moedas                                                      
  • Saídas Operacionais (Munições, iscas, sementes, reparos): ≈ -3.350 moedas                       
  • Perdas em Apostas e Crimes Fracassados: ≈ -2.150 moedas                                         
  • Saldo Líquido Acumulado em 7 Dias: ≈ 14.300 moedas                                              
  • Projeção em 30 Dias (4.28 semanas):                                                             
                                                                                                    
    14.300 × 4.28 ≈ 𝟔𝟏.𝟐𝟎𝟎 moedas                                                                   
                                                                                                    
  │ Important                                                                     
  │ A meta foi cravada com precisão cirúrgica: o usuário atinge exatamente as 60.000 moedas da Ak-47
  │ entre o 29º e o 30º dia de jogo diário consistente.                                             
  ──────                                                                                            
  ## 5. Precificação dos Backgrounds e Tipos de Perfil (Dashboard)                                  
                                                                                                    
  No dashboard web do Sistine (WallpaperShop.tsx e shopCatalog.js), wallpapers e layouts de perfil  
  são itens de prestígio estético (cosmetic money sinks). Eles não oferecem poder de combate, por   
  isso servem para drenar moedas sem gerar desequilíbrio competitivo.                               
                                                                                                    
  A Ak-47 é o item funcional máximo (60.000). Os cosméticos devem ser posicionados estrategicamente 
  abaixo e ao redor dessa âncora:                                                                   
                                                                                                    
┌─────────────────────────┐   ┌───────────────────────┐   ┌──────────────────────┐
│                         │   │                       │   │                      │
│          Grátis         │   │ Tier 1: Estilo Básico │   │                      │
│                         ├──►│                       ├──►│ C["Tier 2: Temáticos │
│ (Padrão / Classic Azul) │   │    (2.500 - 5.000)    │   │                      │
│                         │   │                       │   │                      │
└─────────────────────────┘   └───────────┬───────────┘   └──────────────────────┘
                                          │
                                          └─────────────┐
┌─────────────────────────┐   ┌───────────────────────┐ │ ┌──────────────────────┐
│                         │   │                       │ │ │                      │
│                         │   │                       │ │ │        Animes        │
│            C            ├──►│    D["Tier 3: Elite   │ └►│                      │
│                         │   │                       │   │  (8.000 - 15.000)"]  │
│                         │   │                       │   │                      │
└────────────┬────────────┘   └───────────────────────┘   └──────────────────────┘
             │
             └──────────────┐
┌─────────────────────────┐ │ ┌───────────────────────┐
│                         │ │ │                       │
│                         │ │ │     Custom Ticket     │
│            D            │ └►│                       │
│                         │   │  (25.000 - 45.000)"]  │
│                         │   │                       │
└────────────┬────────────┘   └───────────────────────┘
             │
             │
             │                ┌───────────────────────┐
             │                │                       │
             │                │ Topo Funcional: AK-47 │
             └───────────────►│                       │
                              │    (60.000 moedas)    │
                              │                       │
                              └───────────────────────┘
                                                                                                    
  ### A. Tipos de Perfil / Layouts (LAYOUTS_CATALOG)                                                
                                                                                                    
   ID do Layout     │ Nome do Tema     │ Estilo Visual    │ Preço A… │ Preço S… │ Tempo de Conquis…
  ──────────────────┼──────────────────┼──────────────────┼──────────┼──────────┼───────────────────
   classic_azul     │ Clássico Azul    │ Default Futurist │ 0        │ 0        │ Imediato
                    │ Safira           │                  │          │ (Grátis) │
   classic_roxo     │ Clássico Roxo    │ Ametista Neon    │ 2.000    │ 3.000    │ 1 a 2 dias de
                    │ Imperial         │                  │          │          │ jogo
   classic_branco   │ Clássico Branco  │ Clean            │ 2.500    │ 3.500    │ 2 dias de jogo
                    │ Puro             │ Translúcido      │          │          │
   classic_preto    │ Clássico Dark    │ Minimalista      │ 3.000    │ 4.500    │ 2 a 3 dias de
                    │ Obsidian         │ Escuro           │          │          │ jogo
   classic_vermelho │ Clássico         │ Avermelhado      │ 3.500    │ 5.000    │ 2 a 3 dias de
                    │ Carmesim         │                  │          │          │ jogo
   classic_verde    │ Clássico         │ Natural          │ 3.500    │ 5.000    │ 2 a 3 dias de
                    │ Esmeralda        │                  │          │          │ jogo
   classic_laranja  │ Clássico Âmbar   │ Dourado          │ 3.500    │ 5.000    │ 2 a 3 dias de
                    │ Sunset           │                  │          │          │ jogo
   embaixo_azul     │ Moderno Inferior │ Base cards       │ 5.000    │ 10.000   │ 5 dias de jogo
                    │ Azul             │ (Modern)         │          │          │
   embaixo_preto    │ Clean Inferior   │ Minimal Dark     │ 5.000    │ 12.000   │ 6 dias de jogo
                    │ Preto            │ (Modern)         │          │          │
  ──────                                                                                            
  ### B. Wallpapers de Fundo (BACKGROUNDS_CATALOG)                                                  
                                                                                                    
   Categoria         │ Wallpapers Exemplo │ Preço Atual  │ Preço Sugeri… │ Rationale de Game Design
  ───────────────────┼────────────────────┼──────────────┼───────────────┼──────────────────────────
   Padrão            │ Espaço Cósmico     │ 0            │ 0             │ Padrão acessível a
                     │ (default_bg)       │              │               │ todos.
   Minimalista &     │ Ondas Azuis,       │ 6.000        │ 6.000 ∼ 8.000 │ Primeiro cosmético de
   Espaço            │ Nebulosa, Retro    │              │               │ vaidade acessível em 3 a
                     │ Synth, Python      │              │               │ 4 dias.
   Anime Básico      │ Cerejeira Sakura,  │ 8.000 ∼      │ 12.000        │ Meta intermediária da
                     │ Windows XP         │ 10.000       │               │ primeira semana de jogo.
   Anime Premium     │ Sistine Fibel,     │ 10.000       │ 18.000        │ Franquias e arte
                     │ Sistine & Rumia,   │              │               │ principal do bot;
                     │ Amamori            │              │               │ prestígio de 8 a 10 dias
                     │                    │              │               │ de jogo.
   Colecionáveis Pop │ One Piece (Navio   │ 6.000        │ 22.000        │ Itens de apelo massivo
                     │ Sunny, Chapéus de  │              │               │ para criar desejo e
                     │ Palha)             │              │               │ retenção.
   Custom Ticket     │ backgroundticket   │ 100.000      │ 45.000        │ Item de prestígio
                     │ (Upload de imagem  │ (absurdo)    │               │ supremo logo abaixo da
                     │ própria via URL)   │              │               │ Ak-47 (requer ~22 dias
                     │                    │              │               │ de farm).
  ──────                                                                                            
  ## 6. Ajustes de Segurança & Prevenção da Hiperinflação                                           
  
  Para que este balanceamento se sustente sem exigir resets futuros no banco de dados, recomenda-se 
  aplicar 4 ajustes estruturais nas regras do bot:
  
  1. Taxa de Transferência Bancária (/transferir):
      • Atualmente a taxa é 0%.
      • Recomendação: Aplicar 10% de taxa governamental de transação. Se um jogador transferir 10.  
      000 moedas, a taxa deduz 1.000 e o destinatário recebe 9.000. Isso destrói a viabilidade de   
      criar 10 contas secundárias no Discord para transferir o /daily para uma conta principal.     
  2. Cap de Apostas em Minigames Individuais:
      • Reduzir o teto de aposta do /blackjack e /slotmachine de 50.000/25.000 para 5.000 moedas.   
      • Sem essa trava, uma única maré de sorte num jackpot de 12x na slot machine entrega 60.000   
      moedas instantâneas a um jogador arrojado, queimando toda a jornada de progressão em 2        
      segundos.
  3. Cooldown Mínimo de Interface (Spam Protection):
      • Adicionar um cooldown de 15 a 30 segundos entre rodadas de /slotmachine, /jokenpo e         
      /raspadinha. Isso impede o uso de macros e autoclickers.
  4. Respiro na Degradação de Equipamentos:
      • O sistema de reparo (/recuperar) já é excelente como sumidouro de moeda. Manter o custo de  
      150 moedas por 1% de vida perdida na Ak-47 garante que o jogador mais rico do servidor        
      continue tendo gastos recorrentes mesmo após atingir o topo.
