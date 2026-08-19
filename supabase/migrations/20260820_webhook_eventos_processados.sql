-- Idempotência do webhook da Cakto: evita processar duas vezes o mesmo
-- evento de pagamento se a Cakto reenviar a mesma notificação (timeout,
-- retry automático, instabilidade de rede do lado deles).
create table if not exists webhook_eventos_processados (
  compra_id text not null,
  evento text not null,
  processado_em timestamptz not null default now(),
  primary key (compra_id, evento)
);

alter table webhook_eventos_processados enable row level security;
-- Sem policy nenhuma pra authenticated/anon, de propósito — só a service
-- role (usada pela edge function do webhook) acessa esta tabela.

comment on table webhook_eventos_processados is
'Registro de idempotência do webhook da Cakto (cakto-webhook) — evita
processar duas vezes o mesmo evento de pagamento se a Cakto reenviar a
mesma notificação. Chave primária (compra_id, evento). Não protege contra
eventos diferentes chegando fora de ordem.';
