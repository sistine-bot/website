import React from 'react';
import { Award, RefreshCw } from 'lucide-react';

import ProfileConfig from './ProfileConfig';
import WallpaperShop from './WallpaperShop';
import VipShop from './VipShop';
import CoinShop from './CoinShop';
import Guidelines from './Guidelines';
import BadgesTab from './BadgesTab';

interface UserSettingsTabsProps {
  user: any;
  activeSection: string;
  userDb: any;
  csrfToken?: string;
  onUpdateUserDb: (key: string, value: any) => Promise<void>;
  onRefreshUserDb?: () => Promise<void>;
  onTriggerSaveStatus: (type: 'success' | 'error', message: string) => void;
  isLoadingUserDb?: boolean;
}

export default function UserSettingsTabs({
  user,
  activeSection,
  userDb,
  csrfToken,
  onUpdateUserDb,
  onRefreshUserDb,
  onTriggerSaveStatus,
  isLoadingUserDb = false
}: UserSettingsTabsProps) {

  if (isLoadingUserDb && !userDb) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
        <RefreshCw className="animate-spin text-purple-500" size={32} />
        <span className="text-sm font-medium animate-pulse font-mono">Sincronizando dados com o Firebase...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      
      {/* 1. SEÇÃO: EDITAR /PERFIL */}
      {activeSection === 'profile_config' && (
        <ProfileConfig
          user={user}
          dbState={userDb}
          csrfToken={csrfToken}
          onUpdateDb={onUpdateUserDb}
          onTriggerSaveStatus={onTriggerSaveStatus}
          onRefreshDb={onRefreshUserDb}
        />
      )}

      {/* 2. SEÇÃO: LOJA DE WALLPAPERS */}
      {activeSection === 'wallpaper_shop' && (
        <WallpaperShop
          dbState={userDb}
          csrfToken={csrfToken}
          onUpdateDb={onUpdateUserDb}
          onTriggerSaveStatus={onTriggerSaveStatus}
          onRefreshDb={onRefreshUserDb}
        />
      )}

      {/* 3. SEÇÃO: MINHAS INSÍGNIAS (BADGES) */}
      {activeSection === 'badges' && (
        <BadgesTab
          user={user}
          dbState={userDb}
          onUpdateDb={onUpdateUserDb}
          onTriggerSaveStatus={onTriggerSaveStatus}
        />
      )}

      {/* 4. SEÇÃO: COMPRAR VIP */}
      {activeSection === 'vip_shop' && (
        <VipShop
          user={user}
          dbState={userDb}
        />
      )}

      {/* 5. SEÇÃO: LOJA DE MOEDAS */}
      {activeSection === 'coin_shop' && (
        <CoinShop
          user={user}
          dbState={userDb}
        />
      )}

      {/* 6. SEÇÃO: DIRETRIZES & POLÍTICA */}
      {activeSection === 'guidelines' && (
        <Guidelines />
      )}

    </div>
  );
}