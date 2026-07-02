create table if not exists assinaturas (
  email      text primary key,
  plano      text not null default 'premium',
  compra_id  text,
  created_at timestamptz default now()
);

alter table assinaturas enable row level security;

create policy "usuario le propria assinatura"
  on assinaturas for select
  using (auth.email() = email);
