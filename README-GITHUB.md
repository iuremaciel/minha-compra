# Gerar o APK pelo GitHub usando apenas o celular

1. Crie um repositório no GitHub, por exemplo `minha-compra`.
2. Envie todos os arquivos desta pasta para o repositório.
3. Use a branch `main`.
4. Abra a aba **Actions**.
5. Selecione **Gerar APK Android**.
6. Toque em **Run workflow** para iniciar manualmente. O workflow também roda automaticamente quando houver push em `main`.
7. Quando terminar com sucesso, abra a execução e procure **Artifacts**.
8. Baixe `minha-compra-apk`. Dentro do ZIP estará o `app-debug.apk`.

O workflow cria o projeto Android com Capacitor durante a execução, compila com Gradle e publica o APK como artifact do GitHub Actions.
