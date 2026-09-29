# Minha Compra — projeto Android

## Rodar no PC
1. Instale Node.js LTS e Android Studio.
2. Extraia o ZIP.
3. Abra um terminal na pasta do projeto.
4. Rode:
   npm install
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android
5. No Android Studio: Build > Build APK(s).

O APK de debug normalmente ficará em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Funções
- Produtos permanentes
- Adicionar/editar/excluir produtos
- Quantidade
- Preço individual
- Marcar item comprado
- Total automático
- Finalizar compra
- Histórico
- Dados persistidos no celular com localStorage


### Atualização
- Arraste um produto para a esquerda para excluí-lo da lista permanente.
- Arraste um produto para a direita para editar o nome.
- No Histórico, é possível excluir uma compra individual.
- Também existe a opção de limpar todo o histórico.
