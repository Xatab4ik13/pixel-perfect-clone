<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use the imported TanStack application at the project root as the single source for frontend and VPS backend; this avoids maintaining divergent application copies.
- Preserve existing raw HTTP endpoint paths and load their implementations from src/server/http-routes inside handlers; this keeps provider contracts stable and server dependencies out of browser bundles.
- Keep access state in DemoProvider and existing Telegram signature verification on the server; browser state must never establish live identity or access.
- Allow development preview to render the existing local demo interface without Telegram; production keeps the Telegram gate and server authorization unchanged.
- Keep network provisioning behind telemt.server.ts; custom Rust gateway services are intentionally not imported.
- Keep the target preview bootstrap and pinned framework dependencies; VPS builds select the existing Node preset through NITRO_PRESET=node-server.
- Keep archived database migrations under vps/drizzle and target only DATABASE_URL in Drizzle configuration; never apply imported VPS migrations to the managed Cloud database.
- Keep mutating user administration behind AdminConfirm and require the reason again on the server; UI confirmation is not an authorization boundary.
