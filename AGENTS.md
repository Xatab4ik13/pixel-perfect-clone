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

- Keep shared session state in SessionProvider; referral actions use authenticated database RPCs to prevent client-created rewards.
- Store each accepted referral once with a future availability date; derive reward totals from the ledger without recurring jobs.
- Keep the connection instructions in ConnectionGuide so the home action and disclosure share the same content.
