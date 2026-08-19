-- Documentação apenas (comment on) — não altera dados nem comportamento.
-- Registra uma limitação conhecida e aceita, encontrada em auditoria: o
-- controle de acesso Premium existe só no frontend (isPremium em
-- src/context/AppContext.jsx). A RLS abaixo libera qualquer dono da
-- própria linha, sem checar plano — risco aceito conscientemente por ora.
comment on table dados_usuario is
'Limitação conhecida e aceita (auditoria registrada, não é bug): a policy '
'"usuario acessa proprios dados" libera leitura/escrita pra qualquer dono '
'da própria linha, sem checar se o plano é premium ou se o trial ainda '
'está ativo — essa checagem existe só no frontend (ver isPremium em '
'src/context/AppContext.jsx). Um usuário sem assinar poderia, chamando a '
'API diretamente, ler/escrever despensa/historico_precos/listas mesmo sem '
'acesso. Risco aceito conscientemente: reforçar isso na RLS duplicaria a '
'lógica de trial/premium em SQL, com risco de bloquear usuário legítimo '
'por engano. Revisitar só se abuso real for detectado.';

comment on policy "usuario acessa proprios dados" on dados_usuario is
'Só verifica posse da linha (auth.uid() = user_id) — não verifica plano '
'nem trial. Ver comentário completo em "comment on table dados_usuario".';
