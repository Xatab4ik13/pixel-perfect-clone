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

- Keep frontend demo access in DemoProvider so payment, home and account share the same mock state without auth or database calls.
- Keep demo plan definitions and payment arithmetic in demo-access so access and payment use one source of truth.
- Keep the connection instructions in ConnectionGuide so the home action and disclosure share the same content.
