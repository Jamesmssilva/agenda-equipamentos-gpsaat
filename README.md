# Agenda de Equipamentos GPSAAT/UFCAT

Protótipo estático para agendamento de equipamentos, pronto para hospedagem gratuita na Vercel.

## Como testar

Abra `index.html` no navegador ou rode:

```bash
python -m http.server 4173
```

Depois acesse `http://127.0.0.1:4173`.

## Como publicar na Vercel

1. Crie um repositório no GitHub com estes arquivos.
2. Entre em <https://vercel.com> e clique em **Add New Project**.
3. Importe o repositório.
4. Em framework, escolha **Other** ou deixe a Vercel detectar como site estático.
5. Publique.

## Banco de dados e administração

O site está preparado para usar Supabase como banco de dados e autenticação de administradores.

1. Crie um projeto em <https://supabase.com>.
2. No Supabase, abra **SQL Editor** e rode o conteúdo de `supabase-schema.sql`.
3. Em **Authentication > Users**, crie o usuário administrador com e-mail e senha.
4. Copie o UUID desse usuário e rode no SQL Editor:

```sql
insert into public.admin_users (user_id, email)
values ('UUID_DO_USUARIO_ADMIN', 'email-do-admin@ufcat.edu.br');
```

5. Em **Project Settings > API**, copie a Project URL e a public anon key.
6. Preencha `supabase-config.js`:

```js
window.GPSAAT_SUPABASE = {
  url: "https://SEU-PROJETO.supabase.co",
  anonKey: "SUA_CHAVE_PUBLICA_ANON"
};
```

Com isso, alunos conseguem enviar solicitações, mas somente administradores cadastrados em `admin_users` conseguem aprovar, reprovar e editar.

## Administração do protótipo

A senha local abaixo só funciona enquanto `supabase-config.js` estiver vazio:

```text
ntj2ax4U86@@##
```

Depois que o Supabase estiver configurado, o login administrativo usa o e-mail e a senha criados no Supabase Auth.
