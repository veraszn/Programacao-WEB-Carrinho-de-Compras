//Instalação e Implementação do EXPRESS
const express = require('express')
const app = express()
app.use(express.static('publico'))              
app.use(express.urlencoded({ extended: true }))   
app.use(express.json())                            



//Array de Produtos
const produtos = [
  { id: 1, nome: 'Caderno universitário', preco: 2490 },
  { id: 2, nome: 'Caneta azul', preco: 250 },
  { id: 3, nome: 'Mochila', preco: 14900 },
  { id: 4, nome: 'Garrafa térmica', preco: 5990 },
  { id: 5, nome: 'Fone de ouvido', preco: 8900 },
]



//Conversor de Centavos para Reais
function reais(centavos) {
  return 'R$ ' + (centavos / 100).toFixed(2).replace('.', ',')
}



//Função de buscar produto
function buscaProduto(id) {
  return produtos.find((p) => p.id === Number(id))
}



//"Front do sistema"
app.get('/', (req, res) => {
  const vitrine = produtos.map((p) => `
      <li>
        <span>${p.nome}</span>
        <strong>${reais(p.preco)}</strong>
      </li>`).join('')

  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Loja da Turma</title>
  <link rel="stylesheet" href="/estilo.css">
</head>
<body>
  <header>
    <h1>Loja da Turma</h1>
    <p>Programação WEB I — Atividade 02</p>
  </header>
  <main>
    <section>
      <h2>Produtos</h2>
      <ul class="vitrine">${vitrine}
      </ul>
    </section>
    <aside>
      <h2>Carrinho</h2>
      <p class="vazio">O carrinho ainda não existe: é com você.</p>
    </aside>
  </main>
</body>
</html>`)
})



//Primeira rota
app.get('/api/produtos', (req, res) => {
  res.json(produtos)
})



//Segunda rota
app.get('/api/produtos/:id', (req, res) => {
  const produto = buscaProduto(req.params.id)
  if (!produto) {
    return res.status(404).json({ erro: `Não existe produto ${req.params.id}.` })
  }
  res.json(produto)
})



//Escuta para colocar o servidor no localhost
app.listen(3000, () => {
  console.log('Servidor no ar em http://localhost:3000')
})
