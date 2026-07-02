create table if not exists dados_usuario (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  listas         jsonb default '[]',
  despensa       jsonb default '[]',
  historico_precos jsonb default '[]',
  orcamento      numeric default 0,
  mercados       jsonb default '[]',
  mercado_atual  jsonb default 'null',
  notificacoes   jsonb default '{"orcamento":false,"validade":false,"resumoDiario":false}',
  faixas_idade   jsonb default '[]',
  restricoes     jsonb default '[]',
  updated_at     timestamptz default now()
);

alter table dados_usuario enable row level security;

create policy "usuario acessa proprios dados"
  on dados_usuario for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
