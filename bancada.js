// =====================================================================
//  bancada.js — o cliente de teste da Atividade 02, agora com COOKIES
//
//  É a bancada da Prática 02, com uma novidade: um POTE DE COOKIES por
//  pessoa. Comece o comando com @nome, e a bancada se comporta como o
//  navegador dessa pessoa: guarda os cookies que o servidor mandar e os
//  devolve nos pedidos seguintes.
//
//  Uso:
//    node bancada.js GET /api/produtos              sem pote: um visitante novo
//    node bancada.js @ana POST /entrar nome=Ana     o "navegador" da Ana
//    node bancada.js @ana GET /api/carrinho         ...que lembra da sessão dela
//    node bancada.js @bia GET /api/carrinho         outro pote: outra pessoa
//
//  O pote da Ana fica no arquivo .pote-ana.json, nesta pasta. Apague o
//  arquivo para a bancada "fechar o navegador" da Ana.
//
//  Os pares chave=valor viram um objeto JSON. Valor entre aspas DUPLAS
//  quando tiver espaço. Valor que parece número vira número.
//
//  Redirecionamentos NÃO são seguidos: a bancada mostra o 303 e o
//  Location, para você ver o que o servidor respondeu de verdade.
// =====================================================================
const fs = require('fs')

const argumentos = process.argv.slice(2)
const pessoa = argumentos[0] && argumentos[0].startsWith('@')
  ? argumentos.shift().slice(1)
  : null;
const [metodo = 'GET', caminho = '/', ...partes] = argumentos
const arquivoDoPote = pessoa ? `.pote-${pessoa}.json` : null

function montaCorpo() {
  if (partes.length === 0) return undefined
  if (partes[0].trim().startsWith('{')) return partes.join(' ')

  const dados = {}
  for (const parte of partes) {
    const corte = parte.indexOf('=')
    if (corte === -1) continue
    const chave = parte.slice(0, corte)
    const valor = parte.slice(corte + 1)
    dados[chave] = /^-?\d+(\.\d+)?$/.test(valor) ? Number(valor) : valor
  }
  return JSON.stringify(dados)
}

// o pote é um objeto { nomeDoCookie: valor }, guardado em arquivo
function lePote() {
  if (!arquivoDoPote || !fs.existsSync(arquivoDoPote)) return {}
  return JSON.parse(fs.readFileSync(arquivoDoPote, 'utf8'))
}

// devolve o que mudou, para a bancada contar: 'sid guardado', 'sid esquecido'
function guardaNoPote(pote, linhasSetCookie) {
  const mudancas = []
  for (const linha of linhasSetCookie) {
    const [par, ...atributos] = linha.split(';')
    const corte = par.indexOf('=')
    const nome = par.slice(0, corte).trim()
    const valor = par.slice(corte + 1).trim()
    // o servidor manda "esquecer" um cookie com uma validade no passado
    const expirou = atributos.some((a) => {
      const [chave, data] = a.split('=')
      return chave.trim().toLowerCase() === 'expires' && new Date(data) < new Date()
    })
    if (expirou || valor === '') {
      delete pote[nome]
      mudancas.push(`${nome} esquecido`)
    } else {
      pote[nome] = valor;
      mudancas.push(`${nome} guardado`)
    }
  }
  fs.writeFileSync(arquivoDoPote, JSON.stringify(pote, null, 2))
  return mudancas
}

async function main() {
  const corpo = montaCorpo()
  const pote = lePote()
  const cookie = Object.entries(pote).map(([n, v]) => `${n}=${v}`).join('; ')

  console.log(`REQUISIÇÃO   ${metodo} ${caminho}${pessoa ? `   (pote de ${pessoa})` : ''}`)
  if (cookie) console.log(`             cookie: ${cookie}`)
  if (corpo) console.log(`             corpo: ${corpo}`)

  const cabecalhos = {}
  if (corpo) cabecalhos['Content-Type'] = 'application/json'
  if (cookie) cabecalhos.Cookie = cookie

  let resposta
  try {
    resposta = await fetch(`http://localhost:3000${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo,
      redirect: 'manual',
    })
  } catch (erro) {
    if (erro.cause && erro.cause.code === 'ECONNREFUSED') {
      console.log('\nO servidor não respondeu — ele está no ar?')
      console.log('Em OUTRO terminal, dentro da pasta do projeto: node servidor.js')
    } else {
      console.log(`\nA requisição nem chegou a ser enviada: ${erro.message}`)
      console.log('Confira o comando: o método e o caminho são DOIS argumentos,')
      console.log('separados por espaço.  Exemplo:  node bancada.js GET /api/produtos')
    }
    return
  }

  console.log(`\nRESPOSTA     ${resposta.status} ${resposta.statusText}`)
  for (const [nome, valor] of resposta.headers) {
    if (nome === 'set-cookie') continue   // mostrado abaixo, um por linha
    console.log(`             ${nome}: ${valor}`)
  }
  const setCookies = resposta.headers.getSetCookie()
  for (const linha of setCookies) console.log(`             set-cookie: ${linha}`)

  if (setCookies.length && arquivoDoPote) {
    const mudancas = guardaNoPote(pote, setCookies)
    console.log(`\nPOTE         ${mudancas.join(', ')} (${arquivoDoPote})`)
  } else if (setCookies.length) {
    console.log('\nPOTE         sem @nome, o cookie foi jogado fora')
  }

  console.log('\nCORPO')
  console.log(await resposta.text())
}

main()
