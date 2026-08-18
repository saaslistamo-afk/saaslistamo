-- Sincroniza campos de perfil que antes só existiam no localStorage (nunca
-- acompanhavam o usuário entre dispositivos). fotoPerfil fica de fora
-- propositalmente — merece Supabase Storage, não uma coluna na tabela.
alter table dados_usuario
  add column if not exists nome text,
  add column if not exists dark_mode boolean default false,
  add column if not exists trial_banner_visivel boolean default true,
  add column if not exists boas_vindas_premium boolean default false;
