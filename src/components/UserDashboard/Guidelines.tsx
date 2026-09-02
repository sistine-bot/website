import React from 'react';
import { BookOpen, ShieldCheck, Database, Lock, Server, Cookie, Users, Bell, Mail } from 'lucide-react';

export default function Guidelines({}: any) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      
      {/* CABEÇALHO */}
      <div className="bg-zinc-900/40 p-6 md:p-8 rounded-2xl border border-zinc-900">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="text-rose-400" size={28} />
          Política de Privacidade e Diretrizes
        </h2>
        <p className="text-sm text-zinc-400 mt-3 leading-relaxed max-w-4xl">
          A privacidade dos nossos usuários é de extrema importância para nós. Esta política de privacidade descreve como a <strong>Sistine</strong> coleta, usa, armazena e protege as informações dos usuários. Ao utilizar o bot, você concorda com a coleta e uso das informações de acordo com esta política.
        </p>
      </div>

      {/* GRID DE CARDS COM AS POLÍTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Informações Coletadas */}
        <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl space-y-4 hover:border-zinc-800 transition-colors">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="text-purple-400" size={20} />
            Informações Coletadas
          </h3>
          <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
            <p>
              <strong className="text-zinc-300 font-semibold">Informações de Usuário:</strong> O bot pode coletar e armazenar informações limitadas fornecidas pelos usuários, como IDs de usuário, nomes de usuário e informações de perfil do Discord, necessárias para fornecer seus serviços.
            </p>
            <p>
              <strong className="text-zinc-300 font-semibold">Dados de Interação:</strong> Podemos coletar informações sobre como os usuários interagem com o bot, incluindo comandos usados, informações de jogos (se aplicável), registros de bate-papo e outras interações dentro do Discord.
            </p>
          </div>
        </div>

        {/* Uso das Informações */}
        <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl space-y-4 hover:border-zinc-800 transition-colors">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="text-emerald-400" size={20} />
            Uso das Informações
          </h3>
          <ul className="list-disc list-inside space-y-3 text-sm text-zinc-400 leading-relaxed">
            <li>As informações coletadas são usadas para operar, manter e melhorar a funcionalidade do bot, incluindo a personalização da experiência do usuário e o fornecimento de suporte ao cliente.</li>
            <li>Não compartilhamos suas informações pessoais com terceiros, a menos que exigido por lei ou com o seu consentimento explícito.</li>
          </ul>
        </div>

        {/* Armazenamento de Informações */}
        <div className="bg-zinc-900/30 border border-zinc-900 p-6 rounded-2xl space-y-4 hover:border-zinc-800 transition-colors">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="text-blue-400" size={20} />
            Armazenamento de Informações
          </h3>
          <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
            <p>As informações coletadas são armazenadas em servidores seguros e protegidas contra acesso não autorizado, uso indevido ou divulgação.</p>
            <p>Reservamo-nos o direito de reter informações por tempo indeterminado para fins de backup, arquivamento e segurança, a menos que você solicite expressamente a exclusão de suas informações.</p>
          </div>
        </div>

        {/* Cookies, Menores de Idade e Alterações */}
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-2 hover:border-zinc-800 transition-colors">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cookie className="text-amber-400" size={18} />
              Cookies e Tecnologias Semelhantes
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              O bot não utiliza cookies ou tecnologias semelhantes para rastrear ou coletar informações dos usuários.
            </p>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-2 hover:border-zinc-800 transition-colors">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="text-rose-400" size={18} />
              Menores de Idade
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              O bot não é destinado a menores de 13 anos, e não coleta intencionalmente informações pessoais de crianças menores de 13 anos. Se tomarmos conhecimento de que coletamos informações de uma criança menor de 13 anos, tomaremos medidas para excluir essas informações o mais rápido possível.
            </p>
          </div>
        </div>

      </div>

      {/* RODAPÉ E CONTATO */}
      <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 mt-4">
        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="text-zinc-400" size={16} />
            Alterações na Política
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Podemos atualizar esta política de privacidade periodicamente, e qualquer alteração significativa será comunicada aos usuários por meio de avisos no Discord ou através de outros meios apropriados.
          </p>
        </div>

        <div className="w-px h-12 bg-zinc-800 hidden md:block"></div>

        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail className="text-zinc-400" size={16} />
            Contato e Dúvidas
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Se você tiver dúvidas, preocupações ou solicitações relacionadas à privacidade ou a esta política de privacidade, entre em contato conosco através do nosso servidor de suporte.
          </p>
        </div>
      </div>

      {/* TERMO DE ACEITE FINAL */}
      <div className="text-center pt-6 pb-4">
        <p className="text-xs text-zinc-500 max-w-3xl mx-auto leading-relaxed">
          Ao utilizar o bot Sistine, você reconhece que leu e compreendeu esta política de privacidade e concorda com a coleta e uso de suas informações conforme descrito aqui.
        </p>
        <p className="text-[10px] font-mono text-zinc-600 mt-2 uppercase tracking-widest">
          Última atualização: 13/08/2026
        </p>
      </div>

    </div>
  );
}